/**
 * Tactical utilities for Gambit Chess
 * 
 * This module provides utilities for tactical calculations like retreats
 * after failed captures, tactical advantages, etc.
 */

// Re-export the calculate functions but rename the Retreat interface to TacticalRetreat
import { calculateTacticalRetreats, Retreat as TacticalRetreatOption } from './retreat';

export {
  calculateTacticalRetreats,
  // Re-export with a new name to avoid conflict with types/index.ts Retreat
  TacticalRetreatOption
}; 