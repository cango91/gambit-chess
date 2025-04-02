/**
 * Core types for Gambit Chess
 */

import { IDuelOutcome, IRetreatOption } from "./chess/contracts";
import { ChessPieceColor, ChessPieceType, ChessPosition } from "./chess/types";

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
export type MoveOutcome = 'success' | 'failed' | undefined;
  
  /**
   * Represents a chess move
   */
  export interface Move {
    /** Turn number when this move was made */
    turnNumber: number;
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
    color: ChessPieceColor | undefined;
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
export interface GambitMove {
  /** Base move information */
  move: Move;
  /** Duel information if a capture was attempted */
  duel?: IDuelOutcome | null;
  /** Retreat information if a failed capture resulted in a retreat */
  retreat?: IRetreatOption | null;
  /** Battle Points regenerated after this move */
  bpRegeneration?: number;
}

/**
 * Array of extended moves representing a game's move history
 */
export type MoveHistory = GambitMove[];

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
export enum EventType {
    // Game Flow Events
    GAME_STATE_UPDATE = 'GAME_STATE_UPDATE', // Server to Client
    GAME_OVER = 'GAME_OVER', // Server to Client
    GAME_CREATED = 'GAME_CREATED', // Server to Client
    GAME_STARTED = 'GAME_STARTED', // Server to Client
    GAME_ABANDONED = 'GAME_ABANDONED', // Server to Client
    
    // Move Events
    MOVE_REQUEST = 'MOVE_REQUEST', // Client to Server
    MOVE_RESULT = 'MOVE_RESULT', // Server to Client
    
    // Duel Events
    DUEL_INITIATED = 'DUEL_INITIATED', // Server to Client
    DUEL_ALLOCATE = 'DUEL_ALLOCATE', // Client to Server
    DUEL_OUTCOME = 'DUEL_OUTCOME', // Server to Client
    
    // Retreat Events
    RETREAT_OPTIONS = 'RETREAT_OPTIONS', // Server to Client
    RETREAT_SELECT = 'RETREAT_SELECT', // Client to Server
    
    // Player Events
    PLAYER_JOINED = 'PLAYER_JOINED', // Server to Client
    PLAYER_LEFT = 'PLAYER_LEFT', // Server to Client
    PLAYER_RECONNECTED = 'PLAYER_RECONNECTED', // Server to Client
    PLAYER_DISCONNECTED = 'PLAYER_DISCONNECTED', // Server to Client
    
    // Spectator Events
    SPECTATOR_JOINED = 'SPECTATOR_JOINED', // Server to Client
    SPECTATOR_LEFT = 'SPECTATOR_LEFT', // Server to Client
    
    // Game Control Events
    GAME_RESIGN = 'GAME_RESIGN', // Client to Server, Server broadcasts to all clients
    GAME_OFFER_DRAW = 'GAME_OFFER_DRAW', // Client to Server, Server broadcasts to all clients
    GAME_RESPOND_DRAW = 'GAME_RESPOND_DRAW', // Client to Server, Server broadcasts to all clients
    
    // Connection Events
    CONNECTION_STATUS = 'CONNECTION_STATUS', 
    CONNECTION_RECONNECT = 'CONNECTION_RECONNECT',
    CONNECTION_PING = 'CONNECTION_PING',
    CONNECTION_PONG = 'CONNECTION_PONG',
    
    // Session Events
    SESSION_JOINED = 'SESSION_JOINED', // Server to Client
    STATE_SYNC_REQUEST = 'STATE_SYNC_REQUEST', // Client to Server
    STATE_SYNC_RESPONSE = 'STATE_SYNC_RESPONSE', // Server to Client
    
    // Error Events
    ERROR = 'ERROR',
    
    // Auth Events
    AUTH_CHALLENGE = 'AUTH_CHALLENGE', // Server to Client
    AUTH_RESPONSE = 'AUTH_RESPONSE', // Client to Server
    AUTH_RESULT = 'AUTH_RESULT', // Server to Client
    
    // Chat Events
    CHAT_MESSAGE = 'CHAT_MESSAGE' // Client to Server, Server broadcasts to all clients
}