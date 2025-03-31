import { ChessPieceTypeSymbol } from "@/chess/types";
import { BPRegenBonuses } from "../types";

/**
 * BP Regeneration Settings
 */
export interface BPRegenerationSettings
{
    /**
     * The Base amount of BP to regenerate per turn
     */
    base: number;

    /**
     * BP Regeneration Bonus for each type of tactical advantage
     */
    bonus: BPRegenBonuses;
}

/**
 * Piece Type BP Capacity Settings
 */
export type PieceTypeBPCapacities = Record<ChessPieceTypeSymbol, number>;

/**
 * Time Control Settings
 */
export interface TimeControlSettings
{
    /**
     * Initial time in seconds
     */
    initial: number;
    /**
     * Time increment in seconds
     */
    increment: number;
    /**
     * Time for BP allocation in seconds
     */
    bpAllocationTime: number;
    /**
     * Time for tactical retreat in seconds
     */
    tacticalRetreatTime: number;
    /**
     * BP Allocation Pauses Game Timer
     */
    bpAllocationPausesGameTimer: boolean;
    /**
     * Tactical Retreat Pauses Game Timer
     */
    tacticalRetreatPausesGameTimer: boolean;
}

/**
 * Chat Settings
 */
export interface ChatSettings
{
    /**
     * Maximum chat message length
     */
    maxMessageLength: number;
    /**
     * Whether to filter profanity
     */
    profanityFilter: boolean;
    /**
     * List of words to filter
     */
    profanityFilterWords?: string[];
}

/**
 * Gambit Chess Settings
 */
export interface GambitChessSettings
{
    /**
     * Initial BP Pools
     */
    initialBP: number;
    /**
     * Maximum BP allocation per piece
     */
    maxBPAllocation: number;
    /**
     * BP Capacity per piece
     */
    bpCapacities: PieceTypeBPCapacities;
    /**
     * BP Capacity Overload Multiplier
     */
    bpCapacityOverloadMultiplier: number;
    /**
     * BP Regen Settings
     */
    bpRegen: BPRegenerationSettings;
    /**
     * Time control settings
     */
    timeControl: TimeControlSettings;
    /**
     * Char to display for opponent BP allocation
     */
    opponentBPChar: string;
}

export interface GameNetworkSettings
{
    /**
     * Player reconnection window
     */
    playerReconnectionWindow: number;
    /**
     * 
     */
}

/**
 * Game Config
 */
export interface GameConfig
{
    /**
     * Chat settings
     */
    chat: ChatSettings;
    /**
     * Gambit Chess settings
     */
    gambitChess: GambitChessSettings;
    /**
     * Game network settings
     */
    network: GameNetworkSettings;
}