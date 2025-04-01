import { ChessPieceTypeSymbol } from "../chess/types";
import { BPRegenBonuses, BPRegenBonusType } from "../types";

/**
 * Shared configuration keys that are safe to use in both client and server code.
 * Server-specific keys are defined in the server workspace.
 * 
 * @example
 * ```typescript
 * const maxBP = config.get(SharedConfigKey.MAX_BP_ALLOCATION);
 * const capacities = config.get(SharedConfigKey.BP_CAPACITIES);
 * ```
 */
export enum SharedConfigKey {
  INITIAL_BP = 'initialBP',
  MAX_BP_ALLOCATION = 'maxBPAllocation',
  BP_CAPACITIES = 'bpCapacities',
  BP_CAPACITY_OVERLOAD = 'bpCapacityOverloadMultiplier',
  BASE_BP_REGEN = 'baseBPRegeneration',
  TIME_CONTROL = 'timeControl',
  CHAT_SETTINGS = 'chatSettings',
  OPPONENT_BP_CHAR = 'opponentBPChar'
}

/**
 * Type-safe configuration value types for shared configuration keys.
 * Server-specific value types are defined in the server workspace.
 */
export type SharedConfigValue<K extends SharedConfigKey> = 
  K extends SharedConfigKey.INITIAL_BP ? number :
  K extends SharedConfigKey.MAX_BP_ALLOCATION ? number :
  K extends SharedConfigKey.BP_CAPACITIES ? PieceTypeBPCapacities :
  K extends SharedConfigKey.BP_CAPACITY_OVERLOAD ? number :
  K extends SharedConfigKey.BASE_BP_REGEN ? number :
  K extends SharedConfigKey.TIME_CONTROL ? TimeControlSettings :
  K extends SharedConfigKey.CHAT_SETTINGS ? ChatSettings :
  K extends SharedConfigKey.OPPONENT_BP_CHAR ? string :
  never;

/**
 * Core configuration provider interface for accessing game settings.
 * 
 * @example
 * ```typescript
 * const config = ConfigProvider.getInstance();
 * const maxBP = config.get(SharedConfigKey.MAX_BP_ALLOCATION);
 * const cost = calculateBPCost(amount, maxBP);
 * ```
 */
export interface IConfigProvider {
  /** Read-only access to Gambit Chess settings */
  readonly gambitChess: Readonly<GambitChessSettings>;
  /** Read-only access to time control settings */
  readonly timeControl: Readonly<TimeControlSettings>;
  /** Read-only access to chat settings */
  readonly chat: Readonly<ChatSettings>;
  
  /** Type-safe getter for configuration values */
  get<K extends SharedConfigKey>(key: K): SharedConfigValue<K>;
  
  /** Check if provider has been initialized with configuration */
  isConfigured(): boolean;
  /** Validate partial configuration object */
  validateConfig(config: Partial<GameConfig>): ValidationResult;
}

/**
 * Type for BP regeneration bonus descriptions.
 * Used to describe how each tactical advantage bonus is calculated.
 */
export interface BPRegenBonusDescription {
  /** The tactical advantage type */
  type: BPRegenBonusType;
  
  /** Human-readable description of how this bonus is calculated */
  description: string;
  
  /** Example calculation such as "Example: Queen (9) pinned to King = 10 BP" */
  example: string;
}

/**
 * Collection of BP regeneration bonus descriptions
 */
export type BPRegenBonusDescriptions = Record<BPRegenBonusType, BPRegenBonusDescription>;

/**
 * BP Regeneration Settings visible to client.
 * Server-side BP regeneration logic is defined in the server workspace.
 */
export interface BPRegenerationSettings {
  /** Base amount of BP to regenerate per turn */
  readonly baseBPRegeneration: number;
  /** Descriptions of how bonuses are calculated (for UI) */
  readonly bonus_descriptions?: BPRegenBonusDescriptions;
}

/**
 * Piece Type BP Capacity Settings
 */
export type PieceTypeBPCapacities = Record<ChessPieceTypeSymbol, number>;

/**
 * Time Control Settings
 */
export interface TimeControlSettings {
  /** Initial time in seconds */
  readonly initial: number;
  /** Time increment in seconds */
  readonly increment: number;
  /** Time for BP allocation in seconds */
  readonly bpAllocationTime: number;
  /** Time for tactical retreat in seconds */
  readonly tacticalRetreatTime: number;
  /** BP Allocation Pauses Game Timer */
  readonly bpAllocationPausesGameTimer: boolean;
  /** Tactical Retreat Pauses Game Timer */
  readonly tacticalRetreatPausesGameTimer: boolean;
}

/**
 * Chat Settings visible to client.
 * Server-side chat settings (like profanity filter words) are defined in server workspace.
 */
export interface ChatSettings {
  /** Maximum chat message length */
  readonly maxMessageLength: number;
  /** Whether profanity filter is enabled */
  readonly profanityFilter: boolean;
}

/**
 * Gambit Chess Settings visible to client.
 * Server-specific settings are defined in the server workspace.
 */
export interface GambitChessSettings {
  /** Initial BP Pools */
  readonly initialBP: number;
  /** Maximum BP allocation per piece */
  readonly maxBPAllocation: number;
  /** BP Capacity per piece */
  readonly bpCapacities: Readonly<PieceTypeBPCapacities>;
  /** BP Capacity Overload Multiplier */
  readonly bpCapacityOverloadMultiplier: number;
  /** BP Regeneration settings visible to client */
  readonly bpRegen: Readonly<BPRegenerationSettings>;
  /** Time control settings */
  readonly timeControl: Readonly<TimeControlSettings>;
  /** Character to display for opponent BP allocation */
  readonly opponentBPChar: string;
}

/**
 * Complete game configuration visible to client.
 * Server-specific configuration is defined in the server workspace.
 */
export interface GameConfig {
  /** Chat settings */
  readonly chat: Readonly<ChatSettings>;
  /** Gambit Chess settings */
  readonly gambitChess: Readonly<GambitChessSettings>;
}

/**
 * Configuration validation result
 */
export interface ValidationResult {
  /** Whether the configuration is valid */
  isValid: boolean;
  /** Validation errors if any */
  errors?: string[];
}