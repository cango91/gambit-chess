import { 
    IConfigProvider, 
    GambitChessSettings, 
    TimeControlSettings,
    ChatSettings,
    GameConfig,
    ValidationResult,
    SharedConfigKey,
    SharedConfigValue,
    PieceTypeBPCapacities
} from '@gambit-chess/shared';

/**
 * Server configuration provider for Gambit Chess
 * Implements IConfigProvider from shared module
 */
export class ServerConfigProvider implements IConfigProvider {
    private static instance: ServerConfigProvider;
    private isInitialized: boolean = false;
    private config: GameConfig;

    /**
     * Private constructor to enforce singleton pattern
     */
    private constructor() {
        // Create default piece capacities based on traditional chess values
        const pieceCapacities: PieceTypeBPCapacities = {
            p: 1, // pawn
            n: 3, // knight
            b: 3, // bishop
            r: 5, // rook
            q: 9, // queen
            k: 0  // king (special case, can't be captured)
        };

        // Default configuration
        this.config = {
            gambitChess: {
                initialBP: 39, // Sum of classic chess values
                maxBPAllocation: 10,
                bpCapacities: pieceCapacities,
                bpCapacityOverloadMultiplier: 2,
                bpRegen: {
                    baseBPRegeneration: 1
                },
                timeControl: {
                    initial: 600000, // 10 minutes in ms
                    increment: 5000,  // 5 seconds in ms
                    bpAllocationTime: 15000, // 15 seconds for BP allocation
                    tacticalRetreatTime: 10000, // 10 seconds for tactical retreat
                    bpAllocationPausesGameTimer: true,
                    tacticalRetreatPausesGameTimer: true
                },
                opponentBPChar: '?'
            },
            chat: {
                maxMessageLength: 200,
                profanityFilter: true
            }
        };

        this.isInitialized = true;
    }

    /**
     * Get singleton instance of the config provider
     */
    public static getInstance(): ServerConfigProvider {
        if (!ServerConfigProvider.instance) {
            ServerConfigProvider.instance = new ServerConfigProvider();
        }
        return ServerConfigProvider.instance;
    }

    /**
     * Get game settings related to Gambit Chess
     */
    get gambitChess(): Readonly<GambitChessSettings> {
        return this.config.gambitChess;
    }

    /**
     * Get time control settings
     */
    get timeControl(): Readonly<TimeControlSettings> {
        return this.config.gambitChess.timeControl;
    }

    /**
     * Get chat settings
     */
    get chat(): Readonly<ChatSettings> {
        return this.config.chat;
    }

    /**
     * Type-safe getter for configuration values
     */
    public get<K extends SharedConfigKey>(key: K): SharedConfigValue<K> {
        // This is a simplified implementation
        switch (key) {
            case 'initialBP':
                return this.config.gambitChess.initialBP as SharedConfigValue<K>;
            case 'maxBPAllocation':
                return this.config.gambitChess.maxBPAllocation as SharedConfigValue<K>;
            case 'bpCapacities':
                return this.config.gambitChess.bpCapacities as SharedConfigValue<K>;
            case 'bpCapacityOverloadMultiplier':
                return this.config.gambitChess.bpCapacityOverloadMultiplier as SharedConfigValue<K>;
            case 'baseBPRegeneration':
                return this.config.gambitChess.bpRegen.baseBPRegeneration as SharedConfigValue<K>;
            case 'timeControl':
                return this.config.gambitChess.timeControl as SharedConfigValue<K>;
            case 'chatSettings':
                return this.config.chat as SharedConfigValue<K>;
            case 'opponentBPChar':
                return this.config.gambitChess.opponentBPChar as SharedConfigValue<K>;
            default:
                throw new Error(`Unknown config key: ${key}`);
        }
    }

    /**
     * Check if provider has been initialized with configuration
     */
    public isConfigured(): boolean {
        return this.isInitialized;
    }

    /**
     * Validate partial configuration object
     */
    public validateConfig(config: Partial<GameConfig>): ValidationResult {
        // Basic validation - this would be more comprehensive in a real implementation
        const errors: string[] = [];

        // Validate gambitChess settings if present
        if (config.gambitChess) {
            if (config.gambitChess.initialBP !== undefined && config.gambitChess.initialBP < 1) {
                errors.push('initialBP must be at least 1');
            }
            if (config.gambitChess.maxBPAllocation !== undefined && config.gambitChess.maxBPAllocation < 1) {
                errors.push('maxBPAllocation must be at least 1');
            }
        }
        
        // Validate timeControl settings if present
        if (config.gambitChess?.timeControl) {
            if (config.gambitChess.timeControl.initial !== undefined && config.gambitChess.timeControl.initial < 10000) {
                errors.push('initial time must be at least 10 seconds');
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined
        };
    }

    /**
     * Update configuration with partial config object
     * Note: This is a server-specific method, not part of IConfigProvider
     */
    public updateConfig(config: Partial<GameConfig>): ValidationResult {
        const validationResult = this.validateConfig(config);
        
        if (validationResult.isValid) {
            // Deep merge to preserve nested properties
            this.config = {
                ...this.config,
                gambitChess: config.gambitChess ? {
                    ...this.config.gambitChess,
                    ...config.gambitChess,
                    bpRegen: config.gambitChess.bpRegen ? {
                        ...this.config.gambitChess.bpRegen,
                        ...config.gambitChess.bpRegen
                    } : this.config.gambitChess.bpRegen,
                    timeControl: config.gambitChess.timeControl ? {
                        ...this.config.gambitChess.timeControl,
                        ...config.gambitChess.timeControl
                    } : this.config.gambitChess.timeControl
                } : this.config.gambitChess,
                chat: config.chat ? {
                    ...this.config.chat,
                    ...config.chat
                } : this.config.chat
            };
        }
        
        return validationResult;
    }
} 