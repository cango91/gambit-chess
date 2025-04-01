// Re-export commonly used types
export type {
  GameConfig,
  GambitChessSettings,
  TimeControlSettings,
  ChatSettings,
  ValidationResult,
  BPRegenerationSettings,
  PieceTypeBPCapacities,
  SharedConfigValue,
  SharedConfigKey,
  IConfigProvider,
} from './types';

// Re-export error types
export { ConfigurationError, UninitializedConfigError } from './provider';