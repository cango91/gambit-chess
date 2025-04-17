import { DEFAULT_GAME_CONFIG, BEGINNER_GAME_CONFIG, ADVANCED_GAME_CONFIG } from '../constants/game-defaults';
import { STANDARD_PIECE_VALUES, TOTAL_STARTING_PIECES_VALUE } from '../constants/piece-values';
import { SpecialAttackType } from './tactics';

describe('Game Configuration', () => {
  describe('DEFAULT_GAME_CONFIG', () => {
    it('should set initialBattlePoints to the total starting piece value', () => {
      expect(DEFAULT_GAME_CONFIG.initialBattlePoints).toBe(TOTAL_STARTING_PIECES_VALUE);
      
      // Cross-check: TOTAL_STARTING_PIECES_VALUE should be (8*p + 2*n + 2*b + 2*r + 1*q)
      const expected = 
        8 * STANDARD_PIECE_VALUES.p +
        2 * STANDARD_PIECE_VALUES.n +
        2 * STANDARD_PIECE_VALUES.b +
        2 * STANDARD_PIECE_VALUES.r +
        1 * STANDARD_PIECE_VALUES.q;
      
      expect(TOTAL_STARTING_PIECES_VALUE).toBe(expected);
      expect(TOTAL_STARTING_PIECES_VALUE).toBe(39); // 8 + 6 + 6 + 10 + 9
    });
    
    it('should set maxPieceBattlePoints to 10', () => {
      expect(DEFAULT_GAME_CONFIG.maxPieceBattlePoints).toBe(10);
    });
    
    it('should use standard piece values', () => {
      expect(DEFAULT_GAME_CONFIG.pieceValues).toEqual(STANDARD_PIECE_VALUES);
      expect(DEFAULT_GAME_CONFIG.pieceValues.p).toBe(1);
      expect(DEFAULT_GAME_CONFIG.pieceValues.n).toBe(3);
      expect(DEFAULT_GAME_CONFIG.pieceValues.b).toBe(3);
      expect(DEFAULT_GAME_CONFIG.pieceValues.r).toBe(5);
      expect(DEFAULT_GAME_CONFIG.pieceValues.q).toBe(9);
      expect(DEFAULT_GAME_CONFIG.pieceValues.k).toBeGreaterThan(10);
    });
    
    it('should configure standard BP regeneration rules', () => {
      expect(DEFAULT_GAME_CONFIG.regenerationRules.baseTurnRegeneration).toBe(1);
      
      // Check all special attack types are enabled
      Object.values(SpecialAttackType).forEach(attackType => {
        expect(DEFAULT_GAME_CONFIG.regenerationRules.specialAttackRegeneration[attackType].enabled).toBe(true);
      });
    });
    
    it('should enable tactical retreats', () => {
      expect(DEFAULT_GAME_CONFIG.tacticalRetreatRules.enabled).toBe(true);
      expect(DEFAULT_GAME_CONFIG.tacticalRetreatRules.longRangePiecesEnabled).toBe(true);
      expect(DEFAULT_GAME_CONFIG.tacticalRetreatRules.knightsEnabled).toBe(true);
      expect(DEFAULT_GAME_CONFIG.tacticalRetreatRules.costCalculation.baseReturnCost).toBe(0);
    });
    
    it('should not hide information by default', () => {
      expect(DEFAULT_GAME_CONFIG.informationHiding.hideBattlePoints).toBe(false);
      expect(DEFAULT_GAME_CONFIG.informationHiding.hideAllocationHistory).toBe(false);
    });
  });
  
  describe('BEGINNER_GAME_CONFIG', () => {
    it('should set initialBattlePoints higher than default', () => {
      expect(BEGINNER_GAME_CONFIG.initialBattlePoints).toBeGreaterThan(DEFAULT_GAME_CONFIG.initialBattlePoints);
    });
    
    it('should set higher baseTurnRegeneration', () => {
      expect(BEGINNER_GAME_CONFIG.regenerationRules.baseTurnRegeneration).toBe(2);
      expect(BEGINNER_GAME_CONFIG.regenerationRules.baseTurnRegeneration).toBeGreaterThan(
        DEFAULT_GAME_CONFIG.regenerationRules.baseTurnRegeneration
      );
    });
    
    it('should disable complex special attack types', () => {
      expect(BEGINNER_GAME_CONFIG.regenerationRules.specialAttackRegeneration[SpecialAttackType.PIN].enabled).toBe(false);
      expect(BEGINNER_GAME_CONFIG.regenerationRules.specialAttackRegeneration[SpecialAttackType.SKEWER].enabled).toBe(false);
      expect(BEGINNER_GAME_CONFIG.regenerationRules.specialAttackRegeneration[SpecialAttackType.FORK].enabled).toBe(false);
      expect(BEGINNER_GAME_CONFIG.regenerationRules.specialAttackRegeneration[SpecialAttackType.DISCOVERED_ATTACK].enabled).toBe(false);
    });
    
    it('should enable simpler special attack types', () => {
      expect(BEGINNER_GAME_CONFIG.regenerationRules.specialAttackRegeneration[SpecialAttackType.DIRECT_DEFENCE].enabled).toBe(true);
      expect(BEGINNER_GAME_CONFIG.regenerationRules.specialAttackRegeneration[SpecialAttackType.CHECK].enabled).toBe(true);
    });
    
    it('should have lower tactical retreat costs', () => {
      expect(BEGINNER_GAME_CONFIG.tacticalRetreatRules.costCalculation.distanceMultiplier).toBe(0.5);
      expect(BEGINNER_GAME_CONFIG.tacticalRetreatRules.costCalculation.distanceMultiplier).toBeLessThan(
        DEFAULT_GAME_CONFIG.tacticalRetreatRules.costCalculation.distanceMultiplier
      );
    });
  });
  
  describe('ADVANCED_GAME_CONFIG', () => {
    it('should set initialBattlePoints lower than default', () => {
      expect(ADVANCED_GAME_CONFIG.initialBattlePoints).toBeLessThan(DEFAULT_GAME_CONFIG.initialBattlePoints);
    });
    
    it('should set higher maxPieceBattlePoints', () => {
      expect(ADVANCED_GAME_CONFIG.maxPieceBattlePoints).toBe(15);
      expect(ADVANCED_GAME_CONFIG.maxPieceBattlePoints).toBeGreaterThan(
        DEFAULT_GAME_CONFIG.maxPieceBattlePoints
      );
    });
    
    it('should have zero baseTurnRegeneration', () => {
      expect(ADVANCED_GAME_CONFIG.regenerationRules.baseTurnRegeneration).toBe(0);
    });
    
    it('should have enhanced special attack regeneration', () => {
      // Check all special attack types have more complex formulas
      Object.values(SpecialAttackType).forEach(attackType => {
        expect(ADVANCED_GAME_CONFIG.regenerationRules.specialAttackRegeneration[attackType as SpecialAttackType].enabled).toBe(true);
      });
    });
    
    it('should have higher tactical retreat costs', () => {
      expect(ADVANCED_GAME_CONFIG.tacticalRetreatRules.costCalculation.distanceMultiplier).toBe(1.5);
      expect(ADVANCED_GAME_CONFIG.tacticalRetreatRules.costCalculation.distanceMultiplier).toBeGreaterThan(
        DEFAULT_GAME_CONFIG.tacticalRetreatRules.costCalculation.distanceMultiplier
      );
    });
    
    it('should hide battle points', () => {
      expect(ADVANCED_GAME_CONFIG.informationHiding.hideBattlePoints).toBe(true);
    });
  });
}); 