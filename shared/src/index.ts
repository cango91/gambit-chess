/**
 * Gambit Chess Shared Module
 * 
 * This module contains shared code and interfaces for the Gambit Chess game,
 * used by both the client and server components.
 * 
 * - Types: Game data structures and enums
 * - Utils: Shared utility functions
 * - Rules: Basic movement and game rules
 * - Constants: Game constants and configurations
 * - Events: WebSocket event types for communication
 * - Models: Piece and board implementations
 * - Validation: Check detection and move validation
 * - Config: Game configuration
 */

// Export types
export * from './types';

// Export utilities
export * from './utils';

// Export rules
export * from './rules';

// Export constants
export * from './constants';

// Export events
export * from './events';

// Export models
export * from './models';

// Export validation
export * from './validation';

// Export config
export * from './config';

/**
 * Initialize the knight retreat table.
 * This function ensures the compressed knight retreat data is decompressed
 * and ready for use. It should be called early in both client and server
 * initialization.
 */
export function initializeGameData() {
  // Initialize the knight retreat table
  // This is a no-op if already initialized
  const { initializeKnightRetreatTable } = require('./utils');
  initializeKnightRetreatTable();
  console.log('Gambit Chess shared game data initialized');
}

// Export module documentation for reference by other modules
export const __documentation = {
  name: "GambitChess-Shared",
  version: "1.0.0",
  purpose: "Shared types and utilities for Gambit Chess client-server communication",
  publicAPI: {
    types: "Types, enums, and DTOs for client-server communication",
    rules: "Basic piece movement rules that can be used by both client and server",
    utils: "Shared utility functions for chess-related logic",
    constants: "Shared constants like initial board setup",
    events: "WebSocket event definitions for client-server communication",
    models: "Piece and board implementations for shared validation",
    validation: "Check detection and move validation utilities",
    config: "Game configuration types and defaults",
    initializeGameData: "Function to initialize game data like the knight retreat table"
  },
  submodules: {
    types: {
      purpose: "Core type definitions for the chess game",
      implementationStatus: "Complete"
    },
    utils: {
      purpose: "Utility functions for chess operations",
      implementationStatus: "Complete" 
    },
    rules: {
      purpose: "Basic rules for piece movement",
      implementationStatus: "Complete"
    },
    models: {
      purpose: "Piece and board implementations",
      implementationStatus: "Complete"
    },
    validation: {
      purpose: "Check detection and move validation",
      implementationStatus: "Complete"
    },
    config: {
      purpose: "Game configuration system",
      implementationStatus: "Complete"
    }
  },
  dependencies: [
    "uuid (for generating unique IDs)"
  ],
  securityNotes: "This module contains only information that can be safely shared between client and server. Sensitive game logic and state management is kept server-side only.",
  implementationStatus: "Complete",
  optimizations: [
    "Knight retreat lookup table is pre-computed and compressed to improve performance",
    "Board validation uses efficient path-checking algorithms",
    "Piece hierarchy is optimized for extensibility and validation"
  ],
  changes: [
    "Added board representation for validation",
    "Added check detection functionality",
    "Added comprehensive move validation",
    "Added game configuration system",
    "Implemented piece class hierarchy",
    "Fixed export ambiguities in utility functions"
  ]
}; 