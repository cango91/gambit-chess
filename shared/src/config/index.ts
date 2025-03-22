/**
 * Config index file
 * Exports all configuration objects and types
 */

export * from './GameConfig';

/**
 * Module documentation
 */
export const __documentation = {
  name: "Config",
  purpose: "Provides configuration interfaces and default values for game settings",
  modules: {
    GameConfig: {
      purpose: "Configuration structure for game settings and balancing values",
      publicAPI: {
        DEFAULT_GAME_CONFIG: "Default configuration values for the game",
        GameConfig: "Interface defining all configurable game parameters"
      }
    }
  },
  notes: "Game configuration can be adjusted by the server for balancing purposes. Clients should use server-provided values.",
  implementationStatus: "Complete"
}; 