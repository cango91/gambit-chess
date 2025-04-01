/**
 * Tactical Advantage Types
 * 
 * This module defines the types of tactical advantages that can be detected
 * in the game, which can lead to BP regeneration bonuses.
 */

/**
 * Enum for all possible tactical advantage types
 */
export enum TacticalAdvantageType {
    PIN = 'pin',
    FORK = 'fork',
    SKEWER = 'skewer',
    CHECK = 'check',
    DISCOVERED_ATTACK = 'discovered_attack',
    DIRECT_DEFENSE = 'direct_defense',
    DOUBLE_CHECK = 'double_check'
}

/**
 * Base tactical advantage interface
 */
export interface TacticalAdvantage {
    type: TacticalAdvantageType;
    playerId: string;
    bpRegeneration: number;
}

/**
 * Pin tactical advantage
 */
export interface PinAdvantage extends TacticalAdvantage {
    type: TacticalAdvantageType.PIN;
    pinnedPiecePosition: string;
    pinnedToPosition: string;
    isPinnedToKing: boolean;
}

/**
 * Fork tactical advantage
 */
export interface ForkAdvantage extends TacticalAdvantage {
    type: TacticalAdvantageType.FORK;
    forkedPositions: string[];
}

/**
 * Skewer tactical advantage
 */
export interface SkewerAdvantage extends TacticalAdvantage {
    type: TacticalAdvantageType.SKEWER;
    frontPiecePosition: string;
    backPiecePosition: string;
}

/**
 * Check tactical advantage
 */
export interface CheckAdvantage extends TacticalAdvantage {
    type: TacticalAdvantageType.CHECK;
    checkingPiecePosition: string;
}

/**
 * Discovered attack tactical advantage
 */
export interface DiscoveredAttackAdvantage extends TacticalAdvantage {
    type: TacticalAdvantageType.DISCOVERED_ATTACK;
    attackingPiecePosition: string;
    targetPiecePosition: string;
    movedPiecePosition: string;
}

/**
 * Direct defense tactical advantage
 */
export interface DirectDefenseAdvantage extends TacticalAdvantage {
    type: TacticalAdvantageType.DIRECT_DEFENSE;
    defendingPiecePosition: string;
    defendedPiecePosition: string;
}

/**
 * Double check tactical advantage
 */
export interface DoubleCheckAdvantage extends TacticalAdvantage {
    type: TacticalAdvantageType.DOUBLE_CHECK;
    checkingPiece1Position: string;
    checkingPiece2Position: string;
} 