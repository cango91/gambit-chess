import { create } from 'zustand';
import { BaseGameState } from '@gambit-chess/shared';
import { wsService } from '../services/websocket.service';
import { apiService, AnonymousSession } from '../services/api.service';
import { ensureChessInstance, convertGameStateResponse } from '../utils/chess-utils';
import * as shared from '@gambit-chess/shared';
const { GameStatus, getValidTacticalRetreats } = shared;

interface GameStore {
  // Connection state
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  
  // Session state
  session: AnonymousSession | null;
  isSessionLoading: boolean;
  
  // Game state
  currentGame: BaseGameState | null;
  isGameLoading: boolean;
  gameError: string | null;
  
  // UI state
  selectedSquare: string | null;
  highlightedSquares: string[];
  isPlayerTurn: boolean;
  validMoves: string[];
  pendingMove: { from: string; to: string } | null;
  pendingMoveTimeout: NodeJS.Timeout | null;
  
  // Duel state
  isDuelActive: boolean;
  playerDuelRole: 'attacker' | 'defender' | null;
  duelAllocationSubmitted: boolean;
  
  // Tactical retreat state
  isTacticalRetreatActive: boolean;
  isPlayerRetreatDecision: boolean;
  retreatOptions: Array<{ square: string; cost: number; canAfford: boolean }>;
  
  // Actions
  waitForWebSocketConnection: () => Promise<void>;
  initializeSession: () => Promise<void>;
  createGame: (options: {
    gameType: 'ai' | 'human' | 'practice';
    colorPreference: 'white' | 'black' | 'random';
    aiDifficulty?: 'easy' | 'medium' | 'hard';
  }) => Promise<string>;
  joinGame: (gameId: string) => Promise<void>;
  leaveGame: () => void;
  makeMove: (from: string, to: string, promotion?: string) => void;
  selectSquare: (square: string) => void;
  clearSelection: () => void;
  submitDuelAllocation: (allocation: number) => void;
  submitTacticalRetreat: (retreatSquare: string) => void;
  updateGameState: (gameState: BaseGameState) => void;
  setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => void;
  setError: (error: string | null) => void;
  clearPendingMove: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  connectionStatus: 'disconnected',
  session: null,
  isSessionLoading: false,
  currentGame: null,
  isGameLoading: false,
  gameError: null,
  selectedSquare: null,
  highlightedSquares: [],
  isPlayerTurn: false,
  validMoves: [],
  pendingMove: null,
  pendingMoveTimeout: null,
  isDuelActive: false,
  playerDuelRole: null,
  duelAllocationSubmitted: false,
  isTacticalRetreatActive: false,
  isPlayerRetreatDecision: false,
  retreatOptions: [],

  // Initialize anonymous session
  initializeSession: async () => {
    set({ isSessionLoading: true });
    try {
      const session = await apiService.createAnonymousSession();
      wsService.connect(session.sessionToken); // Pass token directly to connect
      set({ session, isSessionLoading: false });
    } catch (error) {
      console.error('Failed to initialize session:', error);
      set({ 
        isSessionLoading: false,
        gameError: error instanceof Error ? error.message : 'Failed to initialize session'
      });
    }
  },

  // Create a new game
  createGame: async (options) => {
    set({ isGameLoading: true, gameError: null });
    try {
      const response = await apiService.createGame(options);
      
      // Convert the server response to client format
      const gameState = convertGameStateResponse(response.gameState);
      
      // Join the game room via WebSocket and stay connected
      console.log('🔗 Joining WebSocket room for new game:', response.gameId);
      wsService.joinGame(response.gameId);
      
      set({ 
        currentGame: gameState,
        isGameLoading: false 
      });
      
      return response.gameId;
    } catch (error) {
      console.error('Failed to create game:', error);
      set({ 
        isGameLoading: false,
        gameError: error instanceof Error ? error.message : 'Failed to create game'
      });
      throw error;
    }
  },

  // Helper function to wait for WebSocket connection
  waitForWebSocketConnection: async () => {
    const { connectionStatus } = get();
    
    // If already connected, return immediately
    if (connectionStatus === 'connected') {
      return;
    }
    
    console.log('⏳ Waiting for WebSocket connection...');
    
    // Wait for connection with timeout
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, 10000); // 10 second timeout
      
      const checkConnection = () => {
        const currentStatus = get().connectionStatus;
        if (currentStatus === 'connected') {
          clearTimeout(timeout);
          console.log('✅ WebSocket connected, proceeding with join');
          resolve();
        } else if (currentStatus === 'error') {
          clearTimeout(timeout);
          reject(new Error('WebSocket connection failed'));
        } else {
          // Check again in 100ms
          setTimeout(checkConnection, 100);
        }
      };
      
      checkConnection();
    });
  },

  // Join an existing game
  joinGame: async (gameId: string) => {
    set({ isGameLoading: true, gameError: null });
    try {
      // First, try to get the game state to see if it's a practice game already in progress
      let gameState;
      try {
        const getResponse = await apiService.getGameState(gameId);
        gameState = convertGameStateResponse(getResponse);
        
        // If it's already IN_PROGRESS (like practice games), we don't need to join via API
        if (gameState.gameStatus === 'IN_PROGRESS') {
          console.log('🔗 Game already in progress, joining WebSocket room directly:', gameId);
          
          // CRITICAL FIX: For practice games, update the player IDs to match current session
          // This handles the case where a player refreshes and gets a new session ID
          if (gameState.gameType === 'practice') {
            const { session } = get();
            if (session) {
              console.log('🔄 Practice game reconnection: updating player IDs to current session');
              gameState.whitePlayer.id = session.sessionId;
              gameState.blackPlayer.id = session.sessionId;
            }
          }
          
          // Wait for WebSocket connection before joining room
          await get().waitForWebSocketConnection();
          wsService.joinGame(gameId);
          
          set({ 
            currentGame: gameState,
            isGameLoading: false 
          });
          return;
        }
      } catch (getError) {
        // Game state not accessible, will try join API below
        console.log('Could not get game state directly, trying join API');
      }
      
      // For games that need joining (WAITING_FOR_PLAYERS), call the join API
      const response = await apiService.joinGame(gameId);
      gameState = convertGameStateResponse(response);
      
      console.log('🔗 Joining WebSocket room for game:', gameId);
      // Wait for WebSocket connection before joining room
      await get().waitForWebSocketConnection();
      wsService.joinGame(gameId);
      
      set({ 
        currentGame: gameState,
        isGameLoading: false 
      });
    } catch (error) {
      console.error('Failed to join game:', error);
      set({ 
        isGameLoading: false,
        gameError: error instanceof Error ? error.message : 'Failed to join game'
      });
      throw error;
    }
  },

  // Leave current game
  leaveGame: () => {
    const { currentGame } = get();
    if (currentGame) {
      console.log('🚪 Leaving WebSocket room for game:', currentGame.id);
      wsService.leaveGame(currentGame.id);
    }
    set({ 
      currentGame: null,
      selectedSquare: null,
      highlightedSquares: [],
      isDuelActive: false,
      playerDuelRole: null,
      duelAllocationSubmitted: false,
      pendingMove: null,
      pendingMoveTimeout: null
    });
  },

  // Make a move
  makeMove: (from: string, to: string, promotion?: string) => {
    const { currentGame, session, pendingMove, pendingMoveTimeout } = get();
    if (!currentGame || !session) return;

    // Prevent duplicate moves - if there's already a pending move, ignore this request
    if (pendingMove) {
      console.log('🚫 Move blocked: Already have pending move', pendingMove);
      return;
    }

    // Clear any existing timeout
    if (pendingMoveTimeout) {
      clearTimeout(pendingMoveTimeout);
    }

    console.log(`🎯 Making move: ${from} -> ${to} (current FEN: ${currentGame.chess.fen()})`);

    // Set timeout to clear pending move after 10 seconds (in case of lost connection)
    const timeout = setTimeout(() => {
      console.log('⏰ Clearing stale pending move after timeout');
      set({ 
        pendingMove: null, 
        pendingMoveTimeout: null 
      });
    }, 10000);

    // Immediately clear selection and set pending move for visual feedback
    set({ 
      selectedSquare: null, 
      highlightedSquares: [], 
      validMoves: [],
      pendingMove: { from, to },
      pendingMoveTimeout: timeout
    });

    // Send move via WebSocket - pending state will be cleared when we get the updated game state
    wsService.makeMove(currentGame.id, { from, to, promotion });
    console.log(`📤 Sent move to server: ${from} -> ${to}`);
  },

  // Select a square on the board
  selectSquare: (square: string) => {
    const { selectedSquare, currentGame, session, isTacticalRetreatActive, isPlayerRetreatDecision, retreatOptions } = get();
    
    if (!currentGame || !session) return;

    // Handle tactical retreat square selection
    if (isTacticalRetreatActive && isPlayerRetreatDecision) {
      const retreatOption = retreatOptions.find(opt => opt.square === square);
      if (retreatOption && retreatOption.canAfford) {
        console.log('🏃 Tactical retreat selected:', square);
        get().submitTacticalRetreat(square);
        return;
      }
      // If invalid retreat square clicked, just return (don't change selection)
      return;
    }

    // Regular move selection logic (when not in tactical retreat mode)
    // If no square selected, try to select this one
    if (!selectedSquare) {
      // Only allow selecting squares with the current player's pieces
      ensureChessInstance(currentGame);
      const piece = currentGame.chess.get(square as any);
      
      if (!piece) {
        // Can't select empty squares
        return;
      }

      // In practice mode, allow selecting any piece
      // In other modes, only allow selecting current player's pieces
      const isPlayerPiece = currentGame.gameType === 'practice' || 
        (piece.color === currentGame.currentTurn && get().isPlayerTurn);
      
      if (!isPlayerPiece) {
        return;
      }

      // Calculate valid moves for this piece
      const moves = currentGame.chess.moves({ square: square as any, verbose: true });
      const validMoveSquares = moves.map((move: any) => move.to);
      
      set({ 
        selectedSquare: square,
        highlightedSquares: [square, ...validMoveSquares],
        validMoves: validMoveSquares
      });
      return;
    }

    // If same square selected, deselect
    if (selectedSquare === square) {
      set({ 
        selectedSquare: null, 
        highlightedSquares: [], 
        validMoves: [] 
      });
      return;
    }

    // Check if this is a valid move
    const { validMoves } = get();
    if (validMoves.includes(square)) {
      // Valid move - execute it
      get().makeMove(selectedSquare, square);
    } else {
      // Invalid move - try to select the clicked square instead
      ensureChessInstance(currentGame);
      const piece = currentGame.chess.get(square as any);
      
      if (piece) {
        const isPlayerPiece = currentGame.gameType === 'practice' || 
          (piece.color === currentGame.currentTurn && get().isPlayerTurn);
        
        if (isPlayerPiece) {
          // Select this piece instead
          const moves = currentGame.chess.moves({ square: square as any, verbose: true });
          const validMoveSquares = moves.map((move: any) => move.to);
          
          set({ 
            selectedSquare: square,
            highlightedSquares: [square, ...validMoveSquares],
            validMoves: validMoveSquares
          });
        } else {
          // Can't select opponent's piece - clear selection
          set({ 
            selectedSquare: null, 
            highlightedSquares: [], 
            validMoves: [] 
          });
        }
      } else {
        // Clicked empty square with no valid move - clear selection
        set({ 
          selectedSquare: null, 
          highlightedSquares: [], 
          validMoves: [] 
        });
      }
    }
  },

  // Clear selection
  clearSelection: () => {
    set({ 
      selectedSquare: null, 
      highlightedSquares: [], 
      validMoves: [] 
    });
  },

  // Submit duel allocation
  submitDuelAllocation: (allocation: number) => {
    const { currentGame } = get();
    if (!currentGame) return;

    wsService.submitDuelAllocation(currentGame.id, allocation);
    set({ duelAllocationSubmitted: true });
  },

  // Submit tactical retreat
  submitTacticalRetreat: (retreatSquare: string) => {
    const { currentGame } = get();
    if (!currentGame) return;

    wsService.submitTacticalRetreat(currentGame.id, retreatSquare);
  },

  // Update game state (called from WebSocket events)
  updateGameState: (gameState: BaseGameState) => {
    const { session, currentGame, pendingMoveTimeout } = get();
    
    // CRITICAL FIX: For practice games, always update player IDs to match current session
    // This handles WebSocket events overwriting our local session ID updates on page refresh
    if (gameState.gameType === 'practice' && session) {
      console.log('🔄 Practice game WebSocket update: updating player IDs to current session');
      gameState.whitePlayer.id = session.sessionId;
      gameState.blackPlayer.id = session.sessionId;
    }
    
    // Handle both serialized data (fen as string) and Chess.js instances (fen as function)
    const getCurrentFen = (chess: any) => {
      if (!chess) return 'No chess object';
      if (typeof chess.fen === 'function') return chess.fen();
      if (typeof chess.fen === 'string') return chess.fen;
      return 'Unknown chess format';
    };
    
    console.log('🔄 Updating game state. New FEN:', getCurrentFen(gameState.chess));
    console.log('🔄 Previous FEN:', getCurrentFen(currentGame?.chess) || 'No previous game');
    console.log('🔄 Pending move before update:', get().pendingMove);
    
    // Ensure chess object is properly reconstructed from serialized data
    ensureChessInstance(gameState);
    
    console.log('🔄 After reconstruction FEN:', gameState.chess.fen());
    console.log('🔄 Chess turn:', gameState.chess.turn());
    
    // Clear any pending move timeout when we receive an update
    if (pendingMoveTimeout) {
      clearTimeout(pendingMoveTimeout);
    }

    // Check if the board position has changed
    const prevFen = getCurrentFen(currentGame?.chess);
    const newFen = gameState.chess.fen();
    
    // Clear selection and pending move when game state updates
    const stateUpdates: any = {
      currentGame: gameState,
      pendingMove: null, // Clear pending move
      pendingMoveTimeout: undefined // Clear timeout
    };
    
    // Clear selection if the board position has changed (successful move)
    if (prevFen && newFen && prevFen !== newFen) {
      console.log('🔄 Board position changed - clearing selection');
      stateUpdates.selectedSquare = null;
      stateUpdates.highlightedSquares = [];
      stateUpdates.validMoves = [];
    } else {
      console.log('🔄 Board position unchanged or no previous game');
    }
    
    // Determine if it's the player's turn
    let isPlayerTurn = false;
    
    if (session) {
      if (gameState.gameStatus === GameStatus.IN_PROGRESS) {
        // Normal gameplay - check current turn
        if (gameState.gameType === 'practice') {
          isPlayerTurn = true;
        } else {
          const currentPlayer = gameState.currentTurn === 'w' ? gameState.whitePlayer : gameState.blackPlayer;
          isPlayerTurn = session.sessionId === currentPlayer.id;
        }
      } else if (gameState.gameStatus === GameStatus.TACTICAL_RETREAT_DECISION) {
        // During tactical retreat - the player making the retreat decision has control
        if (gameState.gameType === 'practice') {
          isPlayerTurn = true; // In practice mode, player controls both sides
        } else {
          // In multiplayer, only the retreating player has control
          const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1];
          if (lastMove && lastMove.duelResult && !lastMove.duelResult.attackerWon) {
            const attackerColor = lastMove.color;
            const playerIsAttacker = (attackerColor === 'w' && gameState.whitePlayer.id === session.sessionId) ||
                                    (attackerColor === 'b' && gameState.blackPlayer.id === session.sessionId);
            isPlayerTurn = playerIsAttacker;
          }
        }
      }
      // For other statuses (WAITING_FOR_PLAYERS, DUEL_IN_PROGRESS, etc.) isPlayerTurn stays false
    }

    // Check for active duel
    const isDuelActive = gameState.gameStatus === GameStatus.DUEL_IN_PROGRESS;
    let playerDuelRole: 'attacker' | 'defender' | null = null;
    
    if (isDuelActive && gameState.pendingDuel && session) {
      console.log('🥊 Duel detected! Pending duel:', gameState.pendingDuel);
      // In practice mode, the player plays both sides
      if (gameState.gameType === 'practice') {
        // Determine role based on the actual duel setup
        const isAttacker = gameState.pendingDuel.attackerColor === gameState.currentTurn;
        playerDuelRole = isAttacker ? 'attacker' : 'defender';
        console.log('🥊 Practice mode duel role:', playerDuelRole);
      } else {
        const isAttacker = (gameState.pendingDuel.attackerColor === 'w' && gameState.whitePlayer.id === session.sessionId) ||
                          (gameState.pendingDuel.attackerColor === 'b' && gameState.blackPlayer.id === session.sessionId);
        const isDefender = (gameState.pendingDuel.defenderColor === 'w' && gameState.whitePlayer.id === session.sessionId) ||
                          (gameState.pendingDuel.defenderColor === 'b' && gameState.blackPlayer.id === session.sessionId);
        
        if (isAttacker) playerDuelRole = 'attacker';
        else if (isDefender) playerDuelRole = 'defender';
        console.log('🥊 Multiplayer duel role:', playerDuelRole);
      }
    }

    // Handle tactical retreat state
    let isTacticalRetreatActive = false;
    let isPlayerRetreatDecision = false;
    let retreatOptions: Array<{ square: string; cost: number; canAfford: boolean }> = [];

    if (gameState.gameStatus === GameStatus.TACTICAL_RETREAT_DECISION) {
      isTacticalRetreatActive = true;
      
      if (session) {
        // Get the last move to determine who needs to make the retreat decision
        const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1];
        if (lastMove && lastMove.duelResult && !lastMove.duelResult.attackerWon) {
          // The attacker who lost the duel needs to make the retreat decision
          const attackerColor = lastMove.color;
          const playerIsAttacker = (attackerColor === 'w' && gameState.whitePlayer.id === session.sessionId) ||
                                  (attackerColor === 'b' && gameState.blackPlayer.id === session.sessionId) ||
                                  (gameState.gameType === 'practice'); // In practice mode, player controls both sides
          
          isPlayerRetreatDecision = playerIsAttacker;
          console.log('🏃 Tactical retreat required for player:', session.sessionId, 'isPlayerDecision:', isPlayerRetreatDecision);
          
          // If it's the player's retreat decision, use server-provided retreat options
          if (isPlayerRetreatDecision) {
            const playerId = session.sessionId;
            
            // Use server-calculated retreat options if available, otherwise fallback to client calculation
            const serverRetreats = gameState.availableRetreatOptions;
            if (serverRetreats && serverRetreats.length > 0) {
              // Get player's current BP to check affordability
              const isWhite = gameState.whitePlayer.id === playerId;
              const player = isWhite ? gameState.whitePlayer : gameState.blackPlayer;
              
              retreatOptions = serverRetreats.map(retreat => ({
                square: retreat.square,
                cost: retreat.cost,
                canAfford: retreat.cost <= player.battlePoints
              }));
              
              console.log('🏃 Using server-calculated retreat options:', retreatOptions);
            } else {
              // Fallback to client-side calculation for backward compatibility
              const validRetreats = getValidTacticalRetreats(gameState, playerId);
              
              // Get player's current BP to check affordability
              const isWhite = gameState.whitePlayer.id === playerId;
              const player = isWhite ? gameState.whitePlayer : gameState.blackPlayer;
              
              retreatOptions = validRetreats.map(retreat => ({
                square: retreat.square,
                cost: retreat.cost,
                canAfford: retreat.cost <= player.battlePoints
              }));
              
              console.log('🏃 Fallback: client-calculated retreat options:', retreatOptions);
            }
          }
        }
      }
    }

    // Determine highlighted squares based on game state
    let newHighlightedSquares: string[] = [];
    if (isTacticalRetreatActive && isPlayerRetreatDecision && retreatOptions.length > 0) {
      // In tactical retreat mode, highlight all valid retreat squares
      newHighlightedSquares = retreatOptions.map(opt => opt.square);
      console.log('🏃 Setting retreat square highlights:', newHighlightedSquares);
      // Clear any existing selection during tactical retreat
      stateUpdates.selectedSquare = null;
      stateUpdates.validMoves = [];
    } else if (!isTacticalRetreatActive) {
      // Only preserve existing highlights if not in tactical retreat mode
      // and if the board position hasn't changed
      if (!(prevFen && newFen && prevFen !== newFen)) {
        // Board position unchanged, preserve existing highlights if any
        const currentHighlights = get().highlightedSquares;
        if (currentHighlights && currentHighlights.length > 0) {
          newHighlightedSquares = currentHighlights;
        }
      }
    }
    
    stateUpdates.highlightedSquares = newHighlightedSquares;

    set({ 
      ...stateUpdates,
      isPlayerTurn,
      isDuelActive,
      playerDuelRole,
      isTacticalRetreatActive,
      isPlayerRetreatDecision,
      retreatOptions,
      // Reset duel allocation submitted state when duel changes
      duelAllocationSubmitted: isDuelActive ? get().duelAllocationSubmitted : false
    });
  },

  // Set connection status
  setConnectionStatus: (status) => {
    const { pendingMoveTimeout } = get();
    
    // If we're reconnecting, clear any stale pending moves
    if (status === 'connected') {
      console.log('🔗 Connection restored, clearing any stale pending moves');
      if (pendingMoveTimeout) {
        clearTimeout(pendingMoveTimeout);
      }
      set({ 
        connectionStatus: status,
        pendingMove: null,
        pendingMoveTimeout: null
      });
    } else {
      set({ connectionStatus: status });
    }
  },

  // Set error
  setError: (error) => {
    set({ gameError: error });
  },

  // Clear stale pending move (utility function)
  clearPendingMove: () => {
    const { pendingMoveTimeout } = get();
    if (pendingMoveTimeout) {
      clearTimeout(pendingMoveTimeout);
    }
    console.log('🧹 Manually clearing pending move');
    set({ 
      pendingMove: null, 
      pendingMoveTimeout: null 
    });
  },
}));

// Set up WebSocket event listeners
wsService.on('connection:status', (data) => {
  useGameStore.getState().setConnectionStatus(data.status);
});

wsService.on('game:state', (gameState) => {
  useGameStore.getState().updateGameState(gameState);
});

wsService.on('game:move', (data) => {
  // Game state will be updated via game:state event
  console.log('Move made:', data);
});

wsService.on('game:duel_initiated', (data) => {
  console.log('Duel initiated:', data);
  // Game state will be updated via game:state event
});

wsService.on('game:duel_resolved', (data) => {
  console.log('Duel resolved:', data);
  // Game state will be updated via game:state event
});

wsService.on('error', (error) => {
  useGameStore.getState().setError(error.message || 'WebSocket error');
}); 