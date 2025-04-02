// Re-export commonly used types
export type {
  GameConfig,
  GambitChessSettings,
  TimeControlSettings,
  ChatSettings,
  ConfigurationValidationResult,
  BPRegenerationSettings,
  PieceTypeBPCapacities,
  SharedConfigValue,
  SharedConfigKey,
  IConfigProvider,
} from './types';

// Re-export error types
export { ConfigurationError, UninitializedConfigError } from './provider';