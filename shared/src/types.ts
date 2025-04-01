/**
 * Core types for Gambit Chess
 */

import { IChessPiece } from "./chess/contracts";
import { ChessPieceColor, ChessPieceColorType, ChessPieceType, ChessPosition, ChessPositionType } from "./chess/types";
import { RetreatCost } from "./tactical";

/**
 * Base interface for value objects
 */
export type ValueObject<T> = {
    equals(vo: ValueObject<T>): boolean;
    value: T;
};

// /**
//  * Represents the outcome of a move
//  */
export type MoveOutcome = 'success' | 'failed';
  
  /**
   * Represents a chess move
   */
  export interface Move {
    /** Starting position */
    from: ChessPosition;
    /** Destination position */
    to: ChessPosition;
    /** Moving piece type */
    piece: ChessPieceType;
    /** Captured piece type (if a capture was attempted) */
    capture?: ChessPieceType;
    /** Promotion piece (if pawn is promoted) */
    promotion?: ChessPieceType;
    /** If the move is a castle */
    castle?: 'kingside' | 'queenside';
    /** If the move results in check */
    check?: boolean;
    /** If the move results in checkmate */
    checkmate?: boolean;
    /** If the move is an en passant capture */
    enPassant?: boolean;
    /** Turn number when this move was made */
    turnNumber?: number;
  }
  
  /**
   * Represents a duel between attacking and defending pieces
   */
  export interface Duel {
    /** Player who initiated the capture attempt */
    attacker: ChessPieceColor;
    /** BP allocated by the attacker */
    attackerAllocation: number;
    /** BP allocated by the defender */
    defenderAllocation: number;
    /** The outcome of the duel */
    outcome: MoveOutcome;
  }

  /**
   * Represents game phase
   */
  export enum GamePhase {
    SETUP = 'SETUP',
    NORMAL = 'NORMAL',
    DUEL = 'DUEL',
    RETREAT = 'RETREAT',
    GAME_OVER = 'GAME_OVER'
  }
  
  /**
   * Represents the result of a completed game
   */
  export enum GameResult {
    WHITE_WIN = 'WHITE_WIN',
    BLACK_WIN = 'BLACK_WIN',
    DRAW = 'DRAW',
    ABANDONED = 'ABANDONED'
  }
  
  /**
   * Represents player information
   */
  export interface Player {
    /** Player unique ID */
    id: string;
    /** Player display name */
    name: string;
    /** Player color */
    color: ChessPieceColor;
  }
  
  /**
   * Represents a spectator
   */
  export interface Spectator {
    /** Spectator unique ID */
    id: string;
    /** Spectator display name */
    name: string;
  }
  
  /**
   * Represents a chat message
   */
  export interface ChatMessage {
    /** Sender name */
    senderName: string;
    /** Message content */
    message: string;
    /** Timestamp of the message */
    timestamp: number;
  }


/**
 * Extended move information including duel and retreat data
 */
export interface ExtendedMove {
  /** Base move information */
  move: Move;
  /** Duel information if a capture was attempted */
  duel: Duel | null;
  /** Retreat information if a failed capture resulted in a retreat */
  retreat: RetreatCost | null;
  /** Battle Points regenerated after this move */
  bpRegeneration: number;
  /** Color of the player who made the move */
  playerColor: ChessPieceColor;
  /** Turn number when this move was made */
  turnNumber: number;
}

/**
 * Array of extended moves representing a game's move history
 */
export type MoveHistory = ExtendedMove[];

/**
 * Array of move strings in algebraic notation
 */
export type PGNMoveList = string[];

/**
 * PGN format header information
 */
export interface PGNHeaders {
  /** Event name */
  Event?: string;
  /** Site where the game was played */
  Site?: string;
  /** Date of the game (YYYY.MM.DD) */
  Date?: string;
  /** Round number */
  Round?: string;
  /** White player name */
  White?: string;
  /** Black player name */
  Black?: string;
  /** Game result (1-0, 0-1, 1/2-1/2, *) */
  Result?: string;
  /** Time control */
  TimeControl?: string;
  /** Any custom headers */
  [key: string]: string | undefined;
}

/**
 * Complete PGN data structure
 */
export interface PGNData {
  /** PGN headers */
  headers: PGNHeaders;
  /** Move list */
  moves: MoveHistory;
} 

/**
 * Game Event Types
 * Defines all possible event types in the game
 */
export enum GameEventType {
    // Game Flow Events
    GAME_STATE_UPDATE = 'GAME_STATE_UPDATE',
    GAME_OVER = 'GAME_OVER',
    GAME_CREATED = 'GAME_CREATED',
    GAME_STARTED = 'GAME_STARTED',
    GAME_ABANDONED = 'GAME_ABANDONED',
    
    // Move Events
    MOVE_REQUESTED = 'MOVE_REQUESTED',
    MOVE_RESULT = 'MOVE_RESULT',
    
    // Duel Events
    DUEL_INITIATED = 'DUEL_INITIATED',
    DUEL_ALLOCATE = 'DUEL_ALLOCATE',
    DUEL_OUTCOME = 'DUEL_OUTCOME',
    
    // Retreat Events
    RETREAT_OPTIONS = 'RETREAT_OPTIONS',
    RETREAT_SELECTED = 'RETREAT_SELECTED',
    
    // Player Events
    PLAYER_JOINED = 'PLAYER_JOINED',
    PLAYER_LEFT = 'PLAYER_LEFT',
    PLAYER_RECONNECTED = 'PLAYER_RECONNECTED',
    PLAYER_DISCONNECTED = 'PLAYER_DISCONNECTED',
    
    // Spectator Events
    SPECTATOR_JOINED = 'SPECTATOR_JOINED',
    SPECTATOR_LEFT = 'SPECTATOR_LEFT',
    
    // Game Control Events
    GAME_RESIGN = 'GAME_RESIGN',
    GAME_OFFER_DRAW = 'GAME_OFFER_DRAW',
    GAME_RESPOND_DRAW = 'GAME_RESPOND_DRAW',
    
    // Connection Events
    CONNECTION_STATUS = 'CONNECTION_STATUS',
    CONNECTION_RECONNECT = 'CONNECTION_RECONNECT',
    CONNECTION_PING = 'CONNECTION_PING',
    CONNECTION_PONG = 'CONNECTION_PONG',
    
    // Session Events
    SESSION_JOINED = 'SESSION_JOINED',
    STATE_SYNC_REQUEST = 'STATE_SYNC_REQUEST',
    STATE_SYNC_RESPONSE = 'STATE_SYNC_RESPONSE',
    
    // Error Events
    ERROR = 'ERROR',
    
    // Auth Events
    AUTH_CHALLENGE = 'AUTH_CHALLENGE',
    AUTH_RESPONSE = 'AUTH_RESPONSE',
    AUTH_RESULT = 'AUTH_RESULT',
    
    // Chat Events
    CHAT_MESSAGE = 'CHAT_MESSAGE'
}

/**
 * BP Regeneration Bonus Types
 * 
 * These are the types of tactical advantages that can be used to regenerate BP
 * The key is the type of tactical advantage and the value is the BP regeneration bonus
 * 
 * BP Regeneration Bonuses Are Hierarchical, meaning that a higher level tactical advantage will include all the benefits of lower level tactical advantages
 */
export enum BPRegenBonusType{
  DISCOVERED_CHECK = 'discovered_check',
  DISCOVERED_ATTACK = 'discovered_attack',
  PIN = 'pin',
  SKEWER = 'skewer',
  FORK = 'fork',
  DIRECT_DEFENSE = 'direct_defense',
  CHECK = 'check',
  DOUBLE_CHECK = 'double_check',
}

/**
 * Data structure for a pin (piece pinned to a more valuable piece)
 */
export interface PinData {
  pinner: IChessPiece;
  pinnedPiece: IChessPiece;
  pinnedTo: IChessPiece;
}

/**
 * Data structure for a fork (piece attacking multiple opponent pieces)
 */
export interface ForkData {
  forker: IChessPiece;
  forkedPieces: IChessPiece[];
}

/**
 * Data structure for a skewer (attacking a piece to reveal another behind it)
 */
export interface SkewerData {
  attacker: IChessPiece;
  frontPiece: IChessPiece;
  backPiece: IChessPiece;
}

/**
 * Data structure for a direct defense
 */
export interface DefenseData {
  defender: IChessPiece;
  defended: IChessPiece;
}

/**
 * Data structure for a discovered attack
 */
export interface DiscoveredAttackData {
  moved: IChessPiece;
  attacker: IChessPiece;
  attacked: IChessPiece;
} 

/**
 * Data structure for double check
 */
export interface DoubleCheckData {
  moved: IChessPiece;
  attacker1: IChessPiece;
  attacker2: IChessPiece;
}

/**
 * Data structure for a check
 */
export interface CheckData {
  attacker: IChessPiece;
}

/**
 * Data structure for a tactical advantage
 */
export type TacticalAdvantageData<T extends BPRegenBonusType> = {
    type: T;
    value: number;
};

/**
 * BP Regeneration Bonuses
 * 
 * A map of BP regeneration bonuses for each tactical advantage type
 * The key is the type of tactical advantage and the value is a function that returns the BP regeneration bonus
 * The function takes a data object that matches the type of the tactical advantage
 */
export type BPRegenBonuses = {
  [K in BPRegenBonusType]: (data: TacticalAdvantageData<K>) => number;
};

export type BPRegenBonusCalculator = {
    [K in BPRegenBonusType]: (data: TacticalAdvantageData<K>) => number;
};