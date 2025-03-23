// Export interfaces
export * from './GameStateStorage';

// Export implementations
export * from './RedisGameStateStorage';
export * from './InMemoryGameStateStorage';

// Create default instances
import { RedisGameStateStorage } from './RedisGameStateStorage';
import { InMemoryGameStateStorage } from './InMemoryGameStateStorage';

// Default Redis implementation for production
export const defaultGameStateStorage = new RedisGameStateStorage();

// Default in-memory implementation for testing
export const inMemoryGameStateStorage = new InMemoryGameStateStorage(); 