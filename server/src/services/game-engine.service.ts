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
  chessToGambitMove
} from '@gambit-chess/shared';
import { validateTacticalRetreat, getValidTacticalRetreats } from '@gambit-chess/shared';
import { resolveDuel } from '@gambit-chess/shared';
import { Chess, Color, Move, Square, PieceSymbol } from 'chess.js';
import LiveGameService from './live-game.service';
import GameEventsService from './game-events.service';
import { calculateBPRegen } from '../game/bp';
import { detectTactics } from '../game/tactics';
import AIService from './ai.service';

/**
 * Comprehensive Game Engine Service
 * Handles complete Gambit Chess move processing, duel resolution, and battle points management
 */
export class GameEngineService {
  
  /**
   * Process a move action from a player
   */
  static async processMove(gameId: string, playerId: string, moveAction: MoveAction): Promise<{ success: boolean; error?: string; events: GameEvent[] }> {
    const gameState = await LiveGameService.getGameState(gameId);
    if (!gameState) {
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

      // Save updated game state and emit events
      await LiveGameService.updateGameState(gameId, gameState);
      
      // Process all events through the event service
      for (const event of events) {
        await GameEventsService.processGameEvent(event);
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
    const gameState = await LiveGameService.getGameState(gameId);
    if (!gameState || !gameState.pendingDuel) {
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

    if (!isAttacker && !isDefender) {
      return { success: false, error: 'You are not part of this duel', events: [] };
    }

    // Validate allocation amount
    const player = isAttacker ? 
      (gameState.pendingDuel.attackerColor === 'w' ? gameState.whitePlayer : gameState.blackPlayer) :
      (gameState.pendingDuel.defenderColor === 'w' ? gameState.whitePlayer : gameState.blackPlayer);

    if (allocation > player.battlePoints || allocation < 0) {
      return { success: false, error: 'Invalid allocation amount', events: [] };
    }

    // Store allocation
    if (isAttacker) {
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
        isAttacker
      }
    });

    // Check if both players have allocated
    if (gameState.pendingDuel.attackerAllocation !== undefined && 
        gameState.pendingDuel.defenderAllocation !== undefined) {
      
      // Resolve the duel using shared utility
      const duelResult = await this.resolveDuelComplete(gameState, gameId);
      events.push(...duelResult.events);
    }

    // Save updated game state and emit events
    await LiveGameService.updateGameState(gameId, gameState);
    
    for (const event of events) {
      await GameEventsService.processGameEvent(event);
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

    // Move the piece to retreat square using proper chess.js validation
    const pieceAtOriginal = gameState.chess.get(lastMove.from as Square);
    if (pieceAtOriginal) {
      gameState.chess.remove(lastMove.from as Square);
      gameState.chess.put({ 
        type: pieceAtOriginal.type, 
        color: pieceAtOriginal.color 
      }, retreatSquare);
    }

    // Resume normal game play
    gameState.gameStatus = GameStatus.IN_PROGRESS;

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

    // Save updated game state and emit events
    await LiveGameService.updateGameState(gameId, gameState);
    
    for (const event of events) {
      await GameEventsService.processGameEvent(event);
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
   * Process battle point regeneration based on tactical advantages
   */
  private static async processBattlePointRegeneration(gameState: BaseGameState, gameId: string, events: GameEvent[]): Promise<void> {
    // Get the last move from history
    const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1];
    if (!lastMove) {
      return;
    }

    // Detect tactics created by this move
    const tactics = detectTactics(lastMove);
    
    if (tactics.length > 0) {
      // Calculate BP regeneration using the existing utility
      const bpRegen = calculateBPRegen(lastMove, gameState.config);
      
      if (bpRegen > 0) {
        // Determine which player gets the regeneration (the player who just moved)
        const currentPlayer = gameState.currentTurn === 'b' ? gameState.whitePlayer : gameState.blackPlayer; // Current turn was already switched
        
        // Add BP to the player
        currentPlayer.battlePoints += bpRegen;
        
        // Create BP update event
        events.push({
          type: GameEventType.BATTLE_POINTS_UPDATED,
          gameId,
          timestamp: Date.now(),
          payload: {
            playerId: currentPlayer.id,
            newAmount: currentPlayer.battlePoints,
            change: bpRegen,
            reason: 'tactical_advantage',
            tactics: tactics.map(t => t.type) // Include which tactics were detected
          }
        });

        console.log(`Player ${currentPlayer.id} gained ${bpRegen} BP from tactics:`, tactics.map(t => t.type));
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
    const events: GameEvent[] = [];
    const duel = gameState.pendingDuel!;
    
    const attackerPlayer = duel.attackerColor === 'w' ? gameState.whitePlayer : gameState.blackPlayer;
    const defenderPlayer = duel.defenderColor === 'w' ? gameState.whitePlayer : gameState.blackPlayer;

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

    // Update player battle points
    attackerPlayer.battlePoints = outcome.attackerRemainingBP;
    defenderPlayer.battlePoints = outcome.defenderRemainingBP;

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
      gameState.currentTurn = duel.defenderColor; // Turn goes to defender while attacker decides on retreat
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
}

export default GameEngineService; 