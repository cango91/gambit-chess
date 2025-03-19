// Export types for communication
import * as Types from './types';
import * as Rules from './rules';
import * as Utils from './utils';
import * as Constants from './constants';
import * as Events from './events';

export { Types, Rules, Utils, Constants, Events };

// Export module documentation for reference by other modules
export const __documentation = {
  name: "GambitChess-Shared",
  purpose: "Shared types and utilities for Gambit Chess client-server communication",
  publicAPI: {
    types: "Types, enums, and DTOs for client-server communication",
    rules: "Basic piece movement rules that can be used by both client and server",
    utils: "Shared utility functions for chess-related logic",
    constants: "Shared constants like initial board setup",
    events: "WebSocket event definitions for client-server communication"
  },
  dependencies: [],
  securityNotes: "This module contains only information that can be safely shared between client and server. Sensitive game logic and state management is kept server-side only.",
  implementationStatus: "In Progress"
}; 