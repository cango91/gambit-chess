import {
  IConfigProvider,
  GameConfig,
  GambitChessSettings,
  TimeControlSettings,
  ChatSettings,
  SharedConfigKey,
  SharedConfigValue,
  ConfigurationValidationResult
} from './types';

/**
 * Configuration error thrown when accessing uninitialized config
 * or when configuration validation fails.
 */
export class ConfigurationError extends Error {
  constructor(message: string) {
    super(`Configuration Error: ${message}`);
  }
}

/**
 * Error thrown when attempting to access configuration before initialization.
 */
export class UninitializedConfigError extends ConfigurationError {
  constructor() {
    super('Configuration provider not initialized');
  }
}

/**
 * Shared configuration provider implementation.
 * Used to access game configuration in a type-safe manner.
 * 
 * @example
 * ```typescript
 * // Initialize in your client bootstrap
 * const config = await fetchConfigFromServer();
 * const provider = ConfigProvider.getInstance();
 * const result = provider.initialize(config);
 * 
 * if (!result.isValid) {
 *   console.error('Invalid config:', result.errors);
 *   return;
 * }
 * 
 * // Use in components/engines
 * class BPCalculator {
 *   constructor(private config = ConfigProvider.getInstance()) {}
 * 
 *   calculateCost(amount: number, piece: Piece): number {
 *     const capacity = this.config.get(SharedConfigKey.BP_CAPACITIES)[piece.type];
 *     const multiplier = this.config.get(SharedConfigKey.BP_CAPACITY_OVERLOAD);
 *     return amount <= capacity ? amount : capacity + ((amount - capacity) * multiplier);
 *   }
 * }
 * ```
 */
export class ConfigProvider implements IConfigProvider {
  private static instance: ConfigProvider | null = null;
  private config: Partial<GameConfig> = {};
  private initialized = false;

  protected constructor() {}

  /**
   * Gets the singleton instance of the configuration provider.
   * 
   * @returns The shared configuration provider instance
   */
  static getInstance(): ConfigProvider {
    if (!ConfigProvider.instance) {
      ConfigProvider.instance = new ConfigProvider();
    }
    return ConfigProvider.instance;
  }

  /**
   * Initializes the configuration provider with the provided config.
   * 
   * @param config - The complete game configuration
   * @returns Validation result indicating success or failure
   * @throws {ConfigurationError} If provider is already initialized
   */
  initialize(config: GameConfig): ConfigurationValidationResult {
    if (this.initialized) {
      throw new ConfigurationError('Config provider already initialized');
    }

    const validationResult = this.validateConfig(config);
    if (!validationResult.isValid) {
      return validationResult;
    }

    this.config = Object.freeze({ ...config });
    this.initialized = true;
    return { isValid: true };
  }

  /**
   * Gets a configuration value in a type-safe manner.
   * 
   * @param key - The shared configuration key to get
   * @returns The strongly typed configuration value
   * @throws {UninitializedConfigError} If provider is not initialized
   * @throws {ConfigurationError} If key is invalid or value is missing
   */
  get<K extends SharedConfigKey>(key: K): SharedConfigValue<K> {
    if (!this.initialized) {
      throw new UninitializedConfigError();
    }

    switch (key) {
      case SharedConfigKey.INITIAL_BP:
        return this.config.gambitChess?.initialBP as SharedConfigValue<K>;
      case SharedConfigKey.MAX_BP_ALLOCATION:
        return this.config.gambitChess?.maxBPAllocation as SharedConfigValue<K>;
      case SharedConfigKey.BP_CAPACITIES:
        return this.config.gambitChess?.bpCapacities as SharedConfigValue<K>;
      case SharedConfigKey.BP_CAPACITY_OVERLOAD:
        return this.config.gambitChess?.bpCapacityOverloadMultiplier as SharedConfigValue<K>;
      case SharedConfigKey.BASE_BP_REGEN:
        return this.config.gambitChess?.bpRegen.baseBPRegeneration as SharedConfigValue<K>;
      case SharedConfigKey.TIME_CONTROL:
        return this.config.gambitChess?.timeControl as SharedConfigValue<K>;
      case SharedConfigKey.CHAT_SETTINGS:
        return this.config.chat as SharedConfigValue<K>;
      case SharedConfigKey.OPPONENT_BP_CHAR:
        return this.config.gambitChess?.opponentBPChar as SharedConfigValue<K>;
      default:
        throw new ConfigurationError(`Unknown config key: ${key}`);
    }
  }

  get gambitChess(): Readonly<GambitChessSettings> {
    if (!this.initialized) throw new UninitializedConfigError();
    return this.config.gambitChess!;
  }

  get timeControl(): Readonly<TimeControlSettings> {
    if (!this.initialized) throw new UninitializedConfigError();
    return this.config.gambitChess!.timeControl;
  }

  get chat(): Readonly<ChatSettings> {
    if (!this.initialized) throw new UninitializedConfigError();
    return this.config.chat!;
  }

  isConfigured(): boolean {
    return this.initialized;
  }

  validateConfig(config: Partial<GameConfig>): ConfigurationValidationResult {
    const errors: string[] = [];

    // Validate Gambit Chess settings
    if (!config.gambitChess) {
      errors.push('Missing Gambit Chess settings');
    } else {
      const gc = config.gambitChess;
      
      if (gc.initialBP <= 0) {
        errors.push('Initial BP must be positive');
      }
      
      if (gc.maxBPAllocation <= 0) {
        errors.push('Maximum BP allocation must be positive');
      }
      
      if (gc.bpCapacityOverloadMultiplier <= 1) {
        errors.push('BP capacity overload multiplier must be greater than 1');
      }
      
      if (!gc.bpCapacities || Object.keys(gc.bpCapacities).length === 0) {
        errors.push('BP capacities must be defined for all piece types');
      }
      
      if (!gc.bpRegen || gc.bpRegen.baseBPRegeneration < 0) {
        errors.push('Base BP regeneration must be non-negative');
      }

      if (!gc.timeControl) {
        errors.push('Missing time control settings');
      }

      if (!gc.opponentBPChar) {
        errors.push('Missing opponent BP character');
      }
    }

    // Validate Chat settings
    if (!config.chat) {
      errors.push('Missing Chat settings');
    } else {
      if (config.chat.maxMessageLength <= 0) {
        errors.push('Maximum message length must be positive');
      }
    }

    return errors.length === 0 
      ? { isValid: true }
      : { isValid: false, errors };
  }
} 