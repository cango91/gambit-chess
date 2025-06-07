import { 
  BaseGameState, 
  GameStatus, 
  GameEvent, 
  GameEventType, 
  GambitMove, 
  PendingDuel,
  DuelResult,
  TacticalRetreat,
  Player,
  GameAction,
  MoveAction,
  DuelAllocationAction,
  TacticalRetreatAction,
  DuelContext,
  chessToGambitMove,
  GameConfig,
  BPCalculationReport
} from '@gambit-chess/shared';
import { validateTacticalRetreat, getValidTacticalRetreats, calculateTacticalRetreats, moveToExtendedNotation } from '@gambit-chess/shared';
import { resolveDuel } from '@gambit-chess/shared';
import { Chess, Color, Move, Square, PieceSymbol } from 'chess.js';
import LiveGameService from './live-game.service';
import GameEventsService from './game-events.service';
import { detectTactics } from '../game/tactics';
import AIService from './ai.service';
import { calculateBPRegenDetailed } from '../game/bp/bp-calculator';
import GameEventTrackerService from './game-event-tracker.service';

/**
 * Comprehensive Game Engine Service
 * Handles complete Gambit Chess move processing, duel resolution, and battle points management
 */
export class GameEngineService {
  
  // Track recent moves to prevent duplicates (gameId -> last move with timestamp)
  private static recentMoves = new Map<string, { move: string; timestamp: number; playerId: string }>();
  private static DUPLICATE_MOVE_WINDOW = 5000; // 5 seconds
  
  /**
   * Process a move action from a player
   */
  static async processMove(gameId: string, playerId: string, moveAction: MoveAction): Promise<{ success: boolean; error?: string; events: GameEvent[] }> {
    const startTime = Date.now();
    
    // Log player action
    GameEventTrackerService.logPlayerAction(gameId, playerId, 'move_attempt', moveAction, 'success');
    
    const gameState = await LiveGameService.getGameState(gameId);
    if (!gameState) {
      GameEventTrackerService.logPlayerAction(gameId, playerId, 'move_attempt', moveAction, 'error', 'Game not found');
      return { success: false, error: 'Game not found', events: [] };
    }

    // Validate it's the player's turn
    const currentPlayer = gameState.currentTurn === 'w' ? gameState.whitePlayer : gameState.blackPlayer;
    if (currentPlayer.id !== playerId) {
      return { success: false, error: 'Not your turn', events: [] };
    }

    // Validate game is in correct state
    if (gameState.gameStatus !== GameStatus.IN_PROGRESS) {
      return { success: false, error: 'Game is not in progress', events: [] };
    }

    try {
      // Check for duplicate moves
      const moveKey = `${moveAction.from}-${moveAction.to}`;
      const recentMove = this.recentMoves.get(gameId);
      const now = Date.now();
      
      if (recentMove && 
          recentMove.move === moveKey && 
          recentMove.playerId === playerId &&
          (now - recentMove.timestamp) < this.DUPLICATE_MOVE_WINDOW) {
        console.log(`🚫 Duplicate move detected for game ${gameId}: ${moveKey}`);
        return { success: false, error: 'Duplicate move detected', events: [] };
      }
      
      // Record this move attempt
      this.recentMoves.set(gameId, { move: moveKey, timestamp: now, playerId });
      
      // Clean up old entries (older than 1 minute)
      for (const [gId, data] of this.recentMoves.entries()) {
        if (now - data.timestamp > 60000) {
          this.recentMoves.delete(gId);
        }
      }

      // Attempt the move on chess.js board
      const chessMove = gameState.chess.move({
        from: moveAction.from,
        to: moveAction.to,
        promotion: moveAction.promotion
      });

      if (!chessMove) {
        return { success: false, error: 'Invalid move', events: [] };
      }

      // Check if this is a capture attempt
      const isCaptureAttempt = !!chessMove.captured;
      const events: GameEvent[] = [];

      if (isCaptureAttempt) {
        // Undo the move since we need to handle the duel first
        gameState.chess.undo();
        
        // Initiate duel process
        const duelResult = await this.initiateDuel(gameState, chessMove, playerId);
        events.push(...duelResult.events);
        
        // Update game state to DUEL_IN_PROGRESS
        gameState.gameStatus = GameStatus.DUEL_IN_PROGRESS;
        gameState.pendingDuel = this.createPendingDuel(chessMove, gameState.currentTurn);
        
      } else {
        // Regular move - execute immediately
        const gambitMove: GambitMove = chessToGambitMove(chessMove);
        gameState.moveHistory.push(gambitMove);
        
        // Check for check/checkmate
        const isCheck = gameState.chess.inCheck();
        const isCheckmate = gameState.chess.isCheckmate();
        const isStalemate = gameState.chess.isStalemate();
        
        // Update game status
        if (isCheckmate) {
          gameState.gameStatus = GameStatus.CHECKMATE;
          events.push(this.createGameEndEvent(gameId, gameState.currentTurn === 'w' ? 'black' : 'white', 'checkmate'));
        } else if (isStalemate) {
          gameState.gameStatus = GameStatus.STALEMATE;
          events.push(this.createGameEndEvent(gameId, 'draw', 'stalemate'));
        } else {
          // Switch turns
          gameState.currentTurn = gameState.currentTurn === 'w' ? 'b' : 'w';
          
          // Check for tactical advantages and regenerate BP
          await this.processBattlePointRegeneration(gameState, gameId, events);
        }
        
        // Create move event
        events.push({
          type: GameEventType.MOVE_MADE,
          gameId,
          timestamp: Date.now(),
          payload: {
            move: gambitMove,
            playerId,
            isCheck,
            isCheckmate,
            isStalemate,
            captureAttempt: false
          }
        });
      }

      // Generate BP calculation report for transparency/debugging
      // This provides detailed breakdown of all BP transactions
      if (gameState.gameType === 'practice' || !gameState.config.informationHiding.hideBattlePoints) {
        const lastMoveForReport = gameState.moveHistory[gameState.moveHistory.length - 1];
        gameState.bpCalculationReport = this.generateComprehensiveBPReport(gameState, lastMoveForReport);
        
        // Log BP calculation for tracking
        GameEventTrackerService.logBPCalculation(gameId, gameState.bpCalculationReport, 'move_processed');
      }
      
      // Log game state snapshot
      GameEventTrackerService.logGameStateSnapshot(gameId, gameState, 'after_move');

      // Save updated game state and emit events
      await LiveGameService.updateGameState(gameId, gameState);
      
      // Check if game is completed to pass final state to all events
      const isGameCompleted = [
        GameStatus.CHECKMATE,
        GameStatus.STALEMATE,
        GameStatus.DRAW,
        GameStatus.ABANDONED
      ].includes(gameState.gameStatus);
      
      for (const event of events) {
        // Pass final game state to all events if game is completed
        await GameEventsService.processGameEvent(event, isGameCompleted ? gameState : undefined);
      }

      // Check if it's AI's turn and trigger AI move
      const currentPlayer = gameState.currentTurn === 'w' ? gameState.whitePlayer : gameState.blackPlayer;
      if (currentPlayer.id === 'ai' && gameState.gameStatus === GameStatus.IN_PROGRESS) {
        // Trigger AI move asynchronously (don't wait for it)
        setImmediate(async () => {
          try {
            // Get AI difficulty from game or default to easy
            const aiDifficulty = 'easy'; // Could be stored in game config
            await this.processAITurn(gameId, aiDifficulty);
          } catch (error) {
            console.error('Error processing AI turn:', error);
          }
        });
      }

      return { success: true, events };

    } catch (error) {
      console.error('Error processing move:', error);
      return { success: false, error: 'Failed to process move', events: [] };
    }
  }

  /**
   * Process duel allocation from a player
   */
  static async processDuelAllocation(gameId: string, playerId: string, allocation: number): Promise<{ success: boolean; error?: string; events: GameEvent[] }> {
    // Log player action
    GameEventTrackerService.logPlayerAction(gameId, playerId, 'duel_allocation', { allocation }, 'success');
    
    const gameState = await LiveGameService.getGameState(gameId);
    if (!gameState || !gameState.pendingDuel) {
      GameEventTrackerService.logPlayerAction(gameId, playerId, 'duel_allocation', { allocation }, 'error', 'No active duel found');
      return { success: false, error: 'No active duel found', events: [] };
    }

    if (gameState.gameStatus !== GameStatus.DUEL_IN_PROGRESS) {
      return { success: false, error: 'Game is not in duel state', events: [] };
    }

    // Determine if this player is attacker or defender
    const isAttacker = (gameState.pendingDuel.attackerColor === 'w' && gameState.whitePlayer.id === playerId) ||
                      (gameState.pendingDuel.attackerColor === 'b' && gameState.blackPlayer.id === playerId);
    
    const isDefender = (gameState.pendingDuel.defenderColor === 'w' && gameState.whitePlayer.id === playerId) ||
                      (gameState.pendingDuel.defenderColor === 'b' && gameState.blackPlayer.id === playerId);

    // Special handling for practice mode where same player submits both allocations
    const isPracticeMode = gameState.gameType === 'practice';
    let actuallyIsAttacker: boolean;
    let actuallyIsDefender: boolean;
    
    if (isPracticeMode && isAttacker && isDefender) {
      // In practice mode, determine role based on what hasn't been allocated yet
      if (gameState.pendingDuel.attackerAllocation === undefined) {
        actuallyIsAttacker = true;
        actuallyIsDefender = false;
        console.log('🥊 Practice mode: Treating as ATTACKER allocation (first submission)');
      } else if (gameState.pendingDuel.defenderAllocation === undefined) {
        actuallyIsAttacker = false;
        actuallyIsDefender = true;
        console.log('🥊 Practice mode: Treating as DEFENDER allocation (second submission)');
      } else {
        return { success: false, error: 'Both allocations already submitted', events: [] };
      }
    } else {
      actuallyIsAttacker = isAttacker;
      actuallyIsDefender = isDefender;
    }

    if (!actuallyIsAttacker && !actuallyIsDefender) {
      return { success: false, error: 'You are not part of this duel', events: [] };
    }

    // Validate allocation amount
    const player = actuallyIsAttacker ? 
      (gameState.pendingDuel.attackerColor === 'w' ? gameState.whitePlayer : gameState.blackPlayer) :
      (gameState.pendingDuel.defenderColor === 'w' ? gameState.whitePlayer : gameState.blackPlayer);

    if (allocation > player.battlePoints || allocation < 0) {
      return { success: false, error: 'Invalid allocation amount', events: [] };
    }

    // Store allocation
    if (actuallyIsAttacker) {
      gameState.pendingDuel.attackerAllocation = allocation;
    } else {
      gameState.pendingDuel.defenderAllocation = allocation;
    }

    const events: GameEvent[] = [];

    // Create allocation event (only visible to the allocating player)
    events.push({
      type: GameEventType.DUEL_ALLOCATION_SUBMITTED,
      gameId,
      timestamp: Date.now(),
      payload: {
        playerId,
        allocation,
        isAttacker: actuallyIsAttacker
      }
    });

    // Check if both players have allocated
    if (gameState.pendingDuel.attackerAllocation !== undefined && 
        gameState.pendingDuel.defenderAllocation !== undefined) {
      
      console.log('🥊 Both allocations received! Resolving duel...');
      console.log('🥊 Attacker allocation:', gameState.pendingDuel.attackerAllocation);
      console.log('🥊 Defender allocation:', gameState.pendingDuel.defenderAllocation);
      console.log('🥊 Game type:', gameState.gameType);
      console.log('🥊 Attacker player ID:', gameState.pendingDuel.attackerColor === 'w' ? gameState.whitePlayer.id : gameState.blackPlayer.id);
      console.log('🥊 Defender player ID:', gameState.pendingDuel.defenderColor === 'w' ? gameState.whitePlayer.id : gameState.blackPlayer.id);
      
      // Resolve the duel using shared utility
      const duelResult = await this.resolveDuelComplete(gameState, gameId);
      console.log('🥊 Duel resolution created', duelResult.events.length, 'events');
      events.push(...duelResult.events);
    } else {
      console.log('🥊 Waiting for more allocations...');
      console.log('🥊 Attacker allocation:', gameState.pendingDuel.attackerAllocation);
      console.log('🥊 Defender allocation:', gameState.pendingDuel.defenderAllocation);
    }

    // Generate BP calculation report for transparency/debugging
    if (gameState.gameType === 'practice' || !gameState.config.informationHiding.hideBattlePoints) {
      const lastMoveForReport = gameState.moveHistory[gameState.moveHistory.length - 1];
      gameState.bpCalculationReport = this.generateComprehensiveBPReport(gameState, lastMoveForReport);
      
      // Log BP calculation for tracking  
      GameEventTrackerService.logBPCalculation(gameId, gameState.bpCalculationReport, 'duel_allocation_processed');
    }
    
    // Log game state snapshot after duel allocation
    GameEventTrackerService.logGameStateSnapshot(gameId, gameState, 'after_duel_allocation');

    // Save updated game state and emit events
    await LiveGameService.updateGameState(gameId, gameState);
    
    // Check if game is completed to pass final state to all events
    const isGameCompleted = [
      GameStatus.CHECKMATE,
      GameStatus.STALEMATE,
      GameStatus.DRAW,
      GameStatus.ABANDONED
    ].includes(gameState.gameStatus);
    
    for (const event of events) {
      // Pass final game state to all events if game is completed
      await GameEventsService.processGameEvent(event, isGameCompleted ? gameState : undefined);
    }

    return { success: true, events };
  }

  /**
   * Process tactical retreat selection using proper shared validators
   */
  static async processTacticalRetreat(gameId: string, playerId: string, retreatSquare: Square): Promise<{ success: boolean; error?: string; events: GameEvent[] }> {
    const gameState = await LiveGameService.getGameState(gameId);
    if (!gameState) {
      return { success: false, error: 'Game not found', events: [] };
    }

    // Create tactical retreat action for validation
    const retreatAction: TacticalRetreatAction = {
      type: 'TACTICAL_RETREAT',
      to: retreatSquare
    };

    // Use shared validation utility
    const validation = validateTacticalRetreat(gameState, playerId, retreatAction);
    
    if (!validation.valid) {
      return { success: false, error: validation.error!, events: [] };
    }

    // Get the failed move from history
    const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1];
    const retreatCost = validation.cost!;

    // Get the attacking player
    const attackingPlayer = playerId === gameState.whitePlayer.id ? gameState.whitePlayer : gameState.blackPlayer;

    // Execute the retreat
    const tacticalRetreat: TacticalRetreat = {
      originalSquare: lastMove.from as Square,
      failedCaptureSquare: lastMove.to as Square,
      retreatSquare: retreatSquare,
      battlePointsCost: retreatCost
    };

    // Update the last move to include retreat info
    lastMove.tacticalRetreat = tacticalRetreat;
    
    // Deduct BP cost
    attackingPlayer.battlePoints -= retreatCost;

    // Clear retreat options since retreat decision is complete
    gameState.availableRetreatOptions = undefined;

    // Move the piece to retreat square using proper chess.js validation
    // Important: In a failed capture, the piece is still at its ORIGINAL square, not the target square
    const pieceAtOriginalSquare = gameState.chess.get(lastMove.from as Square);
    if (pieceAtOriginalSquare) {
      // Only move the piece if the retreat square is different from the original square
      if (lastMove.from !== retreatSquare) {
        // Remove piece from original square (where it actually is after failed capture)
        gameState.chess.remove(lastMove.from as Square);
        // Place piece at retreat square
        gameState.chess.put({ 
          type: pieceAtOriginalSquare.type, 
          color: pieceAtOriginalSquare.color 
        }, retreatSquare);
        
        console.log(`🏃 Moved piece from original square ${lastMove.from} to retreat square ${retreatSquare}`);
      } else {
        console.log(`🏃 Piece stays at original square ${lastMove.from} (0-cost retreat)`);
      }
    } else {
      console.error(`🚨 No piece found at original square ${lastMove.from} during tactical retreat`);
      return { success: false, error: 'Piece not found at original position', events: [] };
    }

    // Resume normal game play
    gameState.gameStatus = GameStatus.IN_PROGRESS;
    
    // After tactical retreat, turn goes to the opponent (the defender who won the duel)
    // The attacking player just completed their retreat, so turn switches to the other player
    gameState.currentTurn = gameState.currentTurn === 'w' ? 'b' : 'w';
    
    // IMPORTANT: Handle tactical retreat state transition properly
    // For 0-cost tactical retreats (piece stays at original square), we need to:
    // 1. Change the turn 2. Clear en passant 3. PRESERVE move history
    
    // Store the move history BEFORE any chess.js manipulation
    const preservedHistory = gameState.chess.history();
    
    // Update the FEN to reflect turn change and en passant clearing
    const currentFen = gameState.chess.fen();
    const fenParts = currentFen.split(' ');
    fenParts[1] = gameState.currentTurn; // Update turn
    fenParts[3] = '-'; // Clear en passant square
    const updatedFen = fenParts.join(' ');
    
    // Load the updated position
    gameState.chess.load(updatedFen);
    
    // CRITICAL: Store the preserved history in the game state for serialization
    // The LiveGameService will use this when serializing to maintain proper move history
    (gameState.chess as any)._preservedHistory = preservedHistory;
    
    // ENHANCED: Store complete GambitMove history with extended notation
    // This preserves all duel results, retreat costs, and BP changes for reconnecting clients
    (gameState.chess as any)._preservedGambitHistory = gameState.moveHistory.map(move => ({
      ...move,
      extendedNotation: moveToExtendedNotation ? moveToExtendedNotation(move) : undefined
    }));
    
    console.log(`🏃 Tactical retreat completed. Turn now goes to: ${gameState.currentTurn}`);
    console.log(`🏃 Updated chess.js FEN: ${gameState.chess.fen()}`);

    const events: GameEvent[] = [
      {
        type: GameEventType.TACTICAL_RETREAT_MADE,
        gameId,
        timestamp: Date.now(),
        payload: {
          playerId,
          retreat: tacticalRetreat,
          newBP: attackingPlayer.battlePoints
        }
      },
      {
        type: GameEventType.BATTLE_POINTS_UPDATED,
        gameId,
        timestamp: Date.now(),
        payload: {
          playerId,
          newAmount: attackingPlayer.battlePoints,
          change: -retreatCost,
          reason: 'tactical_retreat'
        }
      }
    ];

    // Generate BP calculation report for transparency/debugging
    if (gameState.gameType === 'practice' || !gameState.config.informationHiding.hideBattlePoints) {
      const lastMoveForReport = gameState.moveHistory[gameState.moveHistory.length - 1];
      gameState.bpCalculationReport = this.generateComprehensiveBPReport(gameState, lastMoveForReport);
    }

    // Save updated game state and emit events
    await LiveGameService.updateGameState(gameId, gameState);
    
    // Check if game is completed to pass final state to all events
    const isGameCompleted = [
      GameStatus.CHECKMATE,
      GameStatus.STALEMATE,
      GameStatus.DRAW,
      GameStatus.ABANDONED
    ].includes(gameState.gameStatus);
    
    for (const event of events) {
      // Pass final game state to all events if game is completed
      await GameEventsService.processGameEvent(event, isGameCompleted ? gameState : undefined);
    }

    return { success: true, events };
  }

  /**
   * Initiate a duel when a capture is attempted
   */
  private static async initiateDuel(gameState: BaseGameState, move: Move, attackingPlayerId: string): Promise<{ events: GameEvent[] }> {
    const events: GameEvent[] = [];

    // Create duel initiated event
    events.push({
      type: GameEventType.DUEL_INITIATED,
      gameId: gameState.id,
      timestamp: Date.now(),
      payload: {
        attacker: {
          playerId: attackingPlayerId,
          piece: move.piece,
          from: move.from,
          to: move.to
        },
        defender: {
          piece: move.captured,
          square: move.to
        },
        move: move
      }
    });

    return { events };
  }

  /**
   * Create a pending duel object
   */
  private static createPendingDuel(move: Move, attackerColor: Color): PendingDuel {
    return {
      move,
      attackerColor,
      defenderColor: attackerColor === 'w' ? 'b' : 'w',
      attackingPiece: {
        type: move.piece as PieceSymbol,
        square: move.from as Square
      },
      defendingPiece: {
        type: move.captured as PieceSymbol,
        square: move.to as Square
      }
    };
  }

  /**
   * Process battle point regeneration: base turn regeneration + tactical advantages
   */
  private static async processBattlePointRegeneration(gameState: BaseGameState, gameId: string, events: GameEvent[]): Promise<void> {
    // Get the last move from history
    const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1];
    if (!lastMove) {
      return;
    }

    // Determine which player gets the regeneration (the player who just moved)
    const currentPlayer = gameState.currentTurn === 'b' ? gameState.whitePlayer : gameState.blackPlayer; // Current turn was already switched

    // Calculate BP regeneration using the detailed calculation system
    // This includes both base regeneration (applied every turn) and tactic regeneration (when applicable)
    const bpRegenResult = calculateBPRegenDetailed(lastMove, gameState.config);
    
    // Apply regeneration regardless of amount (could be positive, zero, or negative for experimental rulesets)
    if (bpRegenResult.totalBP !== 0) {
      // Add BP to the player
      currentPlayer.battlePoints += bpRegenResult.totalBP;
      
      // Determine the reason based on what contributed to the regeneration
      const tactics = detectTactics(lastMove);
      const reason = tactics.length > 0 ? 'turn_and_tactical_regeneration' : 'turn_regeneration';
      
      // Create BP update event
      events.push({
        type: GameEventType.BATTLE_POINTS_UPDATED,
        gameId,
        timestamp: Date.now(),
        payload: {
          playerId: currentPlayer.id,
          newAmount: currentPlayer.battlePoints,
          change: bpRegenResult.totalBP,
          reason: reason,
          tactics: tactics.map(t => t.type) // Include which tactics were detected
        }
      });

      console.log(`Player ${currentPlayer.id} regenerated ${bpRegenResult.totalBP} BP (base: ${bpRegenResult.baseRegeneration}, tactics: ${bpRegenResult.tacticRegeneration})`);
      if (tactics.length > 0) {
        console.log(`  └─ Tactics detected:`, tactics.map(t => t.type));
      }
    }
  }

  /**
   * Create game end event
   */
  private static createGameEndEvent(gameId: string, winner: 'white' | 'black' | 'draw', reason: string): GameEvent {
    return {
      type: GameEventType.GAME_ENDED,
      gameId,
      timestamp: Date.now(),
      payload: {
        result: winner,
        winner: winner !== 'draw' ? winner : null,
        reason
      }
    };
  }

  /**
   * Process any game action (move, duel allocation, tactical retreat)
   */
  static async processGameAction(gameId: string, playerId: string, action: GameAction): Promise<{ success: boolean; error?: string; events: GameEvent[] }> {
    switch (action.type) {
      case 'MOVE':
        return await this.processMove(gameId, playerId, action);
      case 'DUEL_ALLOCATION':
        return await this.processDuelAllocation(gameId, playerId, action.allocation);
      case 'TACTICAL_RETREAT':
        return await this.processTacticalRetreat(gameId, playerId, action.to);
      default:
        return { success: false, error: 'Unknown action type', events: [] };
    }
  }

  /**
   * Resolve a duel between two pieces using shared utilities
   */
  private static async resolveDuelComplete(gameState: BaseGameState, gameId: string): Promise<{ events: GameEvent[] }> {
    console.log('🥊 Starting duel resolution for game:', gameId);
    const events: GameEvent[] = [];
    const duel = gameState.pendingDuel!;
    
    const attackerPlayer = duel.attackerColor === 'w' ? gameState.whitePlayer : gameState.blackPlayer;
    const defenderPlayer = duel.defenderColor === 'w' ? gameState.whitePlayer : gameState.blackPlayer;

    console.log('🥊 Attacker BP before:', attackerPlayer.battlePoints);
    console.log('🥊 Defender BP before:', defenderPlayer.battlePoints);

    // Create duel context for shared utility with complete player information
    const duelContext: DuelContext = {
      attackingPiece: {
        type: duel.attackingPiece.type,
        square: duel.attackingPiece.square,
        playerId: attackerPlayer.id,
        playerBattlePoints: attackerPlayer.battlePoints
      },
      defendingPiece: {
        type: duel.defendingPiece.type,
        square: duel.defendingPiece.square,
        playerId: defenderPlayer.id,
        playerBattlePoints: defenderPlayer.battlePoints
      }
    };

    // Resolve duel using shared utility with all required parameters
    const outcome = resolveDuel(
      duelContext,
      duel.attackerAllocation!,
      duel.defenderAllocation!,
      gameState.config
    );

    console.log('🥊 Duel outcome:', outcome);

    // Update player battle points
    attackerPlayer.battlePoints = outcome.attackerRemainingBP;
    defenderPlayer.battlePoints = outcome.defenderRemainingBP;

    console.log('🥊 Attacker BP after:', attackerPlayer.battlePoints);
    console.log('🥊 Defender BP after:', defenderPlayer.battlePoints);

    // Create duel result
    const duelResult: DuelResult = {
      attackerAllocation: outcome.attackerAllocation,
      defenderAllocation: outcome.defenderAllocation,
      attackerWon: outcome.attackerWon,
      attackerBattlePointsRemaining: outcome.attackerRemainingBP,
      defenderBattlePointsRemaining: outcome.defenderRemainingBP
    };

    // Execute the chess move based on duel outcome
    if (outcome.attackerWon) {
      // Attacker wins - execute the capture
      const chessMove = gameState.chess.move(duel.move);
      const gambitMove: GambitMove = chessToGambitMove(chessMove!, duelResult);
      gameState.moveHistory.push(gambitMove);
      
      // Check for check/checkmate after successful capture
      const isCheck = gameState.chess.inCheck();
      const isCheckmate = gameState.chess.isCheckmate();
      
      if (isCheckmate) {
        gameState.gameStatus = GameStatus.CHECKMATE;
        events.push(this.createGameEndEvent(gameId, duel.attackerColor === 'w' ? 'white' : 'black', 'checkmate'));
      } else {
        gameState.gameStatus = GameStatus.IN_PROGRESS;
        gameState.currentTurn = duel.defenderColor; // Switch turns
      }
      
    } else {
      // Defender wins - capture fails, create failed capture move
      const failedMove = duel.move;
      const gambitMove: GambitMove = chessToGambitMove(failedMove, duelResult);
      gambitMove.captureAttempt = true;
      
      gameState.moveHistory.push(gambitMove);
      
      // Switch to tactical retreat decision
      gameState.gameStatus = GameStatus.TACTICAL_RETREAT_DECISION;
      // Keep turn with attacker - they need to decide on tactical retreat
      gameState.currentTurn = duel.attackerColor;
      
      // Calculate available retreat options for the attacker (server-authoritative)
      const retreatOptions = calculateTacticalRetreats(
        gameState.chess,
        failedMove.from as Square,
        failedMove.to as Square,
        gameState.config
      );
      gameState.availableRetreatOptions = retreatOptions;
      console.log('🏃 Server calculated retreat options:', retreatOptions);
    }

    // Clear pending duel
    gameState.pendingDuel = null;

    // Create events
    events.push({
      type: GameEventType.DUEL_RESOLVED,
      gameId,
      timestamp: Date.now(),
      payload: {
        outcome: duelResult,
        winner: outcome.attackerWon ? 'attacker' : 'defender',
        attackerAllocation: outcome.attackerAllocation,
        defenderAllocation: outcome.defenderAllocation,
        attackerRemainingBP: outcome.attackerRemainingBP,
        defenderRemainingBP: outcome.defenderRemainingBP
      }
    });

    // Create BP update events for both players
    events.push({
      type: GameEventType.BATTLE_POINTS_UPDATED,
      gameId,
      timestamp: Date.now(),
      payload: {
        playerId: attackerPlayer.id,
        newAmount: attackerPlayer.battlePoints,
        change: -duel.attackerAllocation!,
        reason: 'duel_participation'
      }
    });

    events.push({
      type: GameEventType.BATTLE_POINTS_UPDATED,
      gameId,
      timestamp: Date.now(),
      payload: {
        playerId: defenderPlayer.id,
        newAmount: defenderPlayer.battlePoints,
        change: -duel.defenderAllocation!,
        reason: 'duel_participation'
      }
    });

    console.log('🥊 Created', events.length, 'events for duel resolution');
    console.log('🥊 Game status after duel:', gameState.gameStatus);
    console.log('🥊 Current turn after duel:', gameState.currentTurn);

    return { events };
  }

  /**
   * Process AI move/action automatically
   */
  static async processAITurn(gameId: string, aiDifficulty: 'easy' | 'medium' | 'hard' = 'easy'): Promise<{ success: boolean; error?: string; events: GameEvent[] }> {
    const gameState = await LiveGameService.getGameState(gameId);
    if (!gameState) {
      return { success: false, error: 'Game not found', events: [] };
    }

    // Check if it's AI's turn
    const currentPlayer = gameState.currentTurn === 'w' ? gameState.whitePlayer : gameState.blackPlayer;
    if (currentPlayer.id !== 'ai') {
      return { success: false, error: 'Not AI turn', events: [] };
    }

    // Handle different game states
    if (gameState.gameStatus === GameStatus.IN_PROGRESS) {
      // Generate and process AI move
      const aiAction = AIService.generateAIMove(gameState, aiDifficulty);
      if (!aiAction) {
        return { success: false, error: 'AI could not generate move', events: [] };
      }

      // Add small delay to make AI moves feel more natural
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

      return await this.processGameAction(gameId, 'ai', aiAction);

    } else if (gameState.gameStatus === GameStatus.DUEL_IN_PROGRESS && gameState.pendingDuel) {
      // AI needs to make duel allocation
      const isAttacker = (gameState.pendingDuel.attackerColor === 'w' && gameState.whitePlayer.id === 'ai') ||
                        (gameState.pendingDuel.attackerColor === 'b' && gameState.blackPlayer.id === 'ai');
      
      const isDefender = (gameState.pendingDuel.defenderColor === 'w' && gameState.whitePlayer.id === 'ai') ||
                        (gameState.pendingDuel.defenderColor === 'b' && gameState.blackPlayer.id === 'ai');

      if (isAttacker || isDefender) {
        const aiPlayer = isAttacker ? 
          (gameState.pendingDuel.attackerColor === 'w' ? gameState.whitePlayer : gameState.blackPlayer) :
          (gameState.pendingDuel.defenderColor === 'w' ? gameState.whitePlayer : gameState.blackPlayer);

        const allocation = AIService.generateAIDuelAllocation(
          gameState,
          aiPlayer.battlePoints,
          isAttacker,
          aiDifficulty
        );

        // Add small delay for duel allocation
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500));

        return await this.processDuelAllocation(gameId, 'ai', allocation);
      }
    }

    return { success: false, error: 'AI not applicable for current game state', events: [] };
  }

  /**
   * Enhanced BP calculation report: Track ALL BP transactions for transparency
   * Includes duel costs, retreat costs, and regeneration calculations
   */
  static generateComprehensiveBPReport(gameState: BaseGameState, lastMove?: GambitMove): BPCalculationReport {
    const report: BPCalculationReport = {
      playerBP: {
        white: gameState.whitePlayer.battlePoints,
        black: gameState.blackPlayer.battlePoints
      },
      transactions: [],
      calculations: [],
      hiddenInfo: gameState.config.informationHiding.hideBattlePoints,
      tactics: [],
      duelDetails: undefined,
      regenerationDetails: undefined,
      // Include move information for client display consistency
      moveInfo: lastMove ? {
        moveNumber: gameState.moveHistory.length - 1, // Half-turn index of this move
        notation: lastMove.san || `${lastMove.from}-${lastMove.to}`,
        color: lastMove.color,
        captureAttempt: !!lastMove.captured || !!lastMove.duelResult,
        duelOutcome: lastMove.duelResult ? (lastMove.duelResult.attackerWon ? 'won' : 'lost') : 'none',
        retreatInfo: lastMove.tacticalRetreat ? {
          from: lastMove.tacticalRetreat.originalSquare,
          to: lastMove.tacticalRetreat.retreatSquare,
          cost: lastMove.tacticalRetreat.battlePointsCost
        } : undefined
      } : undefined
    };

    // Add configuration details
    report.calculations.push(`🎮 Game Configuration:`);
    report.calculations.push(`  - Initial BP: ${gameState.config.initialBattlePoints}`);
    report.calculations.push(`  - Max piece BP: ${gameState.config.maxPieceBattlePoints}`);
    report.calculations.push(`  - Base turn regen: ${gameState.config.regenerationRules.baseTurnRegeneration}`);
    report.calculations.push(`  - Information hiding: ${JSON.stringify(gameState.config.informationHiding)}`);

    // Add piece values
    report.calculations.push(`📊 Piece Values: ${JSON.stringify(gameState.config.pieceValues)}`);

    // Analyze last move if provided
    if (lastMove) {
      report.calculations.push(`\n🎯 Last Move Analysis: ${lastMove.san || `${lastMove.from}-${lastMove.to}`}`);
      
      // 1. DUEL COSTS (Both players spend BP)
      if (lastMove.duelResult) {
        const duel = lastMove.duelResult;
        const attackerColor = lastMove.color;
        const defenderColor = attackerColor === 'w' ? 'b' : 'w';
        
        // Record attacker duel cost
        report.transactions.push({
          type: 'duel_cost',
          player: attackerColor === 'w' ? 'white' : 'black',
          amount: -duel.attackerAllocation,
          details: `Duel allocation as attacker: ${duel.attackerAllocation} BP`,
          formula: `Attacker spent ${duel.attackerAllocation} BP in duel`
        });
        
        // Record defender duel cost
        report.transactions.push({
          type: 'duel_cost',
          player: defenderColor === 'w' ? 'white' : 'black',
          amount: -duel.defenderAllocation,
          details: `Duel allocation as defender: ${duel.defenderAllocation} BP`,
          formula: `Defender spent ${duel.defenderAllocation} BP in duel`
        });
        
        report.duelDetails = {
          attackerAllocation: duel.attackerAllocation,
          defenderAllocation: duel.defenderAllocation,
          winner: duel.attackerWon ? 'attacker' : 'defender',
          effectiveAllocations: {
            attacker: `${duel.attackerAllocation} BP`,
            defender: `${duel.defenderAllocation} BP`
          }
        };
        
        report.calculations.push(`  ⚔️ Duel: ${duel.attackerAllocation} vs ${duel.defenderAllocation} → ${duel.attackerWon ? 'CAPTURE' : 'FAILED'}`);
        report.calculations.push(`  📉 BP cost: Attacker -${duel.attackerAllocation}, Defender -${duel.defenderAllocation}`);
      }

      // 2. TACTICAL RETREAT COSTS (Attacker only, if duel failed)
      if (lastMove.tacticalRetreat) {
        const retreat = lastMove.tacticalRetreat;
        const attackerColor = lastMove.color;
        
        report.transactions.push({
          type: 'retreat_cost',
          player: attackerColor === 'w' ? 'white' : 'black',
          amount: -retreat.battlePointsCost,
          details: `Tactical retreat: ${retreat.originalSquare} → ${retreat.retreatSquare}`,
          formula: `Retreat cost calculated by distance and piece type: ${retreat.battlePointsCost} BP`
        });
        
        report.calculations.push(`  🏃 Tactical Retreat: ${retreat.originalSquare} → ${retreat.retreatSquare}`);
        report.calculations.push(`  💰 Retreat cost: ${retreat.battlePointsCost} BP`);
      }

      // 3. BP REGENERATION (Player who just moved gains BP from tactics)
      const tactics = detectTactics(lastMove);
      if (tactics.length > 0) {
        const playerColor = lastMove.color;
        
        // Use the new detailed calculation system
        const regenResult = calculateBPRegenDetailed(lastMove, gameState.config);
        
        report.transactions.push({
          type: 'regeneration',
          player: playerColor === 'w' ? 'white' : 'black',
          amount: regenResult.totalBP,
          details: `Tactical advantage BP regeneration`,
          formula: regenResult.formula
        });
        
        report.tactics = tactics;
        report.regenerationDetails = regenResult;
        
        // Add the detailed calculations from the new system
        report.calculations.push(`  ✨ Tactics detected: ${tactics.map(t => t.type).join(', ')}`);
        report.calculations.push(`  📈 BP regeneration: +${regenResult.totalBP} BP`);
        report.calculations.push(`  🧮 Formula: ${regenResult.formula}`);
        
        // Add all the detailed step-by-step calculations
        regenResult.calculations.forEach(calc => {
          report.calculations.push(`  ${calc}`);
        });
        
        // Add detailed breakdown for each tactic
        regenResult.tacticDetails.forEach(detail => {
          report.calculations.push(`  📋 ${detail.type.toUpperCase()} Breakdown:`);
          detail.breakdown.forEach(line => {
            report.calculations.push(`    ${line}`);
          });
        });
      }
    }

    // Add retreat options if available
    if (gameState.availableRetreatOptions) {
      report.calculations.push(`\n🏃 Available Retreat Options:`);
      gameState.availableRetreatOptions.forEach(option => {
        report.calculations.push(`  - ${option.square}: ${option.cost} BP`);
      });
    }

    return report;
  }


}

export default GameEngineService; 