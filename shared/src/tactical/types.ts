/**
 * Tactical Advantage Types for BP Regeneration
 * 
 * This module defines the types of tactical advantages that can be detected
 * in the game, which can lead to BP regeneration bonuses.
 */

import { IChessPiece } from "../chess/contracts";

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
  export type TacticalAdvantageData<T extends TacticalAdvantageType> = {
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
    [K in TacticalAdvantageType]: (data: TacticalAdvantageData<K>) => number;
  };
  
  /**
   * BP Regeneration Bonus Calculator
   * 
   * A map of BP regeneration bonuses for each tactical advantage type
   * The key is the type of tactical advantage and the value is a function that returns the BP regeneration bonus
   * The function takes a data object that matches the type of the tactical advantage
   */
  export type BPRegenBonusCalculator = {
      [K in TacticalAdvantageType]: (data: TacticalAdvantageData<K>) => number;
  };