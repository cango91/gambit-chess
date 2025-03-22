import { v4 as uuidv4 } from 'uuid';
import {
  PieceType,
  PlayerColor,
  PieceDTO,
  Position,
  GamePhase,
  GameState as SharedGameState
} from '@gambit-chess/shared';
import { GameState } from '../engine/GameState';
import { ServerGameState } from '../types';

/**
 * Factory for creating test scenarios and predefined board positions
 * Useful for testing and demos
 */
export class ScenarioFactory {
  /**
   * Create a standard starting position
   * @returns GameState with standard chess starting position
   */
  static createStandardGame(): GameState {
    const gameState = new GameState();
    return gameState;
  }
  
  /**
   * Create an empty board with just kings
   * Useful as a base for custom scenarios
   * @returns GameState with only kings
   */
  static createEmptyBoardWithKings(): GameState {
    const gameState = new GameState();
    
    // Create only kings
    const pieces: PieceDTO[] = [
      {
        id: uuidv4(),
        type: PieceType.KING,
        color: PlayerColor.WHITE,
        position: { x: 4, y: 0 },
        hasMoved: false
      },
      {
        id: uuidv4(),
        type: PieceType.KING,
        color: PlayerColor.BLACK,
        position: { x: 4, y: 7 },
        hasMoved: false
      }
    ];
    
    gameState.setBoardState(pieces);
    return gameState;
  }
  
  /**
   * Create a checkmate scenario (white to move and is in checkmate)
   * @returns GameState with a checkmate position
   */
  static createCheckmateScenario(): GameState {
    const gameState = new GameState();
    
    // Scholar's mate position
    const pieces: PieceDTO[] = [
      // White pieces
      {
        id: uuidv4(),
        type: PieceType.KING,
        color: PlayerColor.WHITE,
        position: { x: 4, y: 0 },
        hasMoved: false
      },
      // White pawns
      ...Array.from({ length: 8 }, (_, i) => ({
        id: uuidv4(),
        type: PieceType.PAWN,
        color: PlayerColor.WHITE,
        position: { x: i, y: 1 },
        hasMoved: false
      })),
      
      // Black pieces
      {
        id: uuidv4(),
        type: PieceType.KING,
        color: PlayerColor.BLACK,
        position: { x: 4, y: 7 },
        hasMoved: false
      },
      {
        id: uuidv4(),
        type: PieceType.QUEEN,
        color: PlayerColor.BLACK,
        position: { x: 5, y: 3 }, // Queen delivers checkmate
        hasMoved: true
      }
    ];
    
    // Setup the state
    gameState.setBoardState(pieces);
    gameState.setGameState(SharedGameState.CHECKMATE);
    
    return gameState;
  }
  
  /**
   * Create a stalemate scenario (white to move and has no legal moves)
   * @returns GameState with a stalemate position
   */
  static createStalemateScenario(): GameState {
    const gameState = new GameState();
    
    // Classic king vs king+queen stalemate position
    const pieces: PieceDTO[] = [
      {
        id: uuidv4(),
        type: PieceType.KING,
        color: PlayerColor.WHITE,
        position: { x: 0, y: 0 }, // White king in corner
        hasMoved: true
      },
      {
        id: uuidv4(),
        type: PieceType.KING,
        color: PlayerColor.BLACK,
        position: { x: 2, y: 1 }, // Black king restricting movement
        hasMoved: true
      },
      {
        id: uuidv4(),
        type: PieceType.QUEEN,
        color: PlayerColor.BLACK,
        position: { x: 1, y: 2 }, // Queen controlling escape squares
        hasMoved: true
      }
    ];
    
    // Setup the state
    gameState.setBoardState(pieces);
    gameState.setGameState(SharedGameState.STALEMATE);
    
    return gameState;
  }
  
  /**
   * Create a tactical duel scenario
   * White knight attempting to capture black bishop
   * @returns GameState with a position ready for a duel
   */
  static createDuelScenario(): GameState {
    const gameState = new GameState();
    
    // Position with white knight about to capture black bishop
    const pieces: PieceDTO[] = [
      // White pieces
      {
        id: uuidv4(),
        type: PieceType.KING,
        color: PlayerColor.WHITE,
        position: { x: 4, y: 0 },
        hasMoved: false
      },
      {
        id: uuidv4(),
        type: PieceType.KNIGHT,
        color: PlayerColor.WHITE,
        position: { x: 2, y: 2 }, // Knight ready to capture bishop
        hasMoved: true
      },
      
      // Black pieces
      {
        id: uuidv4(),
        type: PieceType.KING,
        color: PlayerColor.BLACK,
        position: { x: 4, y: 7 },
        hasMoved: false
      },
      {
        id: uuidv4(),
        type: PieceType.BISHOP,
        color: PlayerColor.BLACK,
        position: { x: 4, y: 4 }, // Bishop to be captured
        hasMoved: true
      }
    ];
    
    // Setup the state
    gameState.setBoardState(pieces);
    
    // Set appropriate BP for both players (use proper methods instead of direct state modification)
    gameState.setPlayerBP(PlayerColor.WHITE, 10);
    gameState.setPlayerBP(PlayerColor.BLACK, 10);
    
    return gameState;
  }
  
  /**
   * Create a scenario from a partial state
   * @param partialState Partial state to use
   * @returns GameState with the specified state
   */
  static createFromPartialState(partialState: Partial<ServerGameState>): GameState {
    const gameState = new GameState();
    gameState.loadGameState(partialState);
    return gameState;
  }
}

/**
 * Module documentation
 */
export const __documentation = {
  name: "ScenarioFactory",
  purpose: "Provides factory methods for creating test scenarios and predefined board positions",
  publicAPI: {
    createStandardGame: "Creates a standard chess starting position",
    createEmptyBoardWithKings: "Creates an empty board with just kings",
    createCheckmateScenario: "Creates a checkmate position",
    createStalemateScenario: "Creates a stalemate position",
    createDuelScenario: "Creates a position ready for a duel",
    createFromPartialState: "Creates a scenario from a partial state object"
  },
  dependencies: [
    "gambit-chess-shared",
    "../engine/GameState",
    "../types"
  ],
  implementationStatus: "Complete"
}; 