/**
 * Core types for Gambit Chess
 */

import { IChessPiece } from "./chess/contracts";
import { ChessPieceColor, ChessPieceColorType, ChessPieceType, ChessPosition, ChessPositionType } from "./chess/types";
import { RetreatCost } from "./tactical";

/**
 * Represents a value object
 * 
 * A value object is an object that is immutable and has no identity
 * It is defined by its value and is equal to another value object if it has the same value
 */
export type ValueObject<T> = {
  equals(vo: ValueObject<T>): boolean;
  hashCode(): string;
  get value(): T;
  set value(value: T);
  valueOf(): number;
  toString(): string;
}

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
    NORMAL = 'normal',
    DUEL_ALLOCATION = 'duel_allocation',
    TACTICAL_RETREAT = 'tactical_retreat',
    GAME_OVER = 'game_over'
  }
  
  /**
   * Represents the result of a completed game
   */
  export enum GameResult {
    WHITE_WIN = 'white_win',
    BLACK_WIN = 'black_win',
    DRAW = 'draw',
    IN_PROGRESS = 'in_progress'
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
 * Enum for game event types
 * Used for consistent event naming across the system
 */
export enum GameEventType {
  // Game state events
  GAME_STATE_UPDATE = 'game:updated',
  GAME_CREATED = 'game:created',
  GAME_STARTED = 'game:started',
  GAME_OVER = 'game:over',
  GAME_ABANDONED = 'game:abandoned',
  // Game control events
  GAME_RESIGN = 'game:resign',
  GAME_OFFER_DRAW = 'game:offerDraw',
  GAME_RESPOND_DRAW = 'game:respondDraw',
  
  // Player events
  PLAYER_JOINED = 'game:playerJoined',
  PLAYER_LEFT = 'game:playerLeft',
  PLAYER_RECONNECTED = 'game:playerReconnected',
  PLAYER_DISCONNECTED = 'game:playerDisconnected',
  
  // Move events
  MOVE_REQUESTED = 'game:moveRequested',
  MOVE_RESULT = 'game:moveResult',
  
  // Duel events
  DUEL_INITIATED = 'game:duelInitiated',
  DUEL_ALLOCATE = 'game:duelAllocate',
  DUEL_OUTCOME = 'game:duelOutcome',
  
  // Retreat events
  RETREAT_OPTIONS = 'game:retreatOptions',
  RETREAT_SELECTED = 'game:retreatSelected',
  
  // Spectator events
  SPECTATOR_JOINED = 'game:spectatorJoined',
  SPECTATOR_LEFT = 'game:spectatorLeft',
  
  // Chat events
  CHAT_MESSAGE = 'chat.message',
  
  // Authentication events
  AUTH_CHALLENGE = 'auth:challenge',
  AUTH_RESPONSE = 'auth:response',
  AUTH_RESULT = 'auth:result',
  
  // Session events
  SESSION_JOINED = 'session:joined',
  STATE_SYNC_REQUEST = 'state:syncRequest',
  STATE_SYNC_RESPONSE = 'state:syncResponse',
  
  // BP commitment scheme events
  DUEL_COMMITMENT = 'game:duelCommitment',
  DUEL_REVEAL = 'game:duelReveal',
  
  // Connection events
  CONNECTION_STATUS = 'connection:status',
  CONNECTION_RECONNECT = 'connection:reconnect',
  CONNECTION_PING = 'connection:ping',
  CONNECTION_PONG = 'connection:pong',
  
  // System events
  ERROR = 'error',
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
export type TacticalAdvantageData<T extends BPRegenBonusType> = 
  T extends BPRegenBonusType.DISCOVERED_CHECK ? DiscoveredAttackData :
  T extends BPRegenBonusType.DISCOVERED_ATTACK ? DiscoveredAttackData :
  T extends BPRegenBonusType.PIN ? PinData :
  T extends BPRegenBonusType.SKEWER ? SkewerData :
  T extends BPRegenBonusType.FORK ? ForkData :
  T extends BPRegenBonusType.DIRECT_DEFENSE ? DefenseData :
  T extends BPRegenBonusType.CHECK ? CheckData :
  T extends BPRegenBonusType.DOUBLE_CHECK ? DoubleCheckData :
  never;



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