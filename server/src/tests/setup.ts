import { RedisService } from '../services/redis.service';

// Mock Redis to avoid real connections in tests
jest.mock('../services/redis.service', () => ({
  RedisService: {
    getRedisClient: jest.fn().mockResolvedValue({
      connect: jest.fn(),
      disconnect: jest.fn(),
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn(),
      del: jest.fn(),
      keys: jest.fn().mockResolvedValue([]),
    }),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn(),
    setWithTTL: jest.fn(),
    del: jest.fn(),
    exists: jest.fn().mockResolvedValue(false),
  }
}));

// Mock GameEventsService to avoid Socket.IO issues
jest.mock('../services/game-events.service', () => ({
  GameEventsService: {
    processGameEvent: jest.fn(),
    initialize: jest.fn(),
  },
  default: {
    processGameEvent: jest.fn(),
    initialize: jest.fn(),
  }
}));

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global test cleanup
afterAll(async () => {
  // Force cleanup any hanging connections
  await new Promise(resolve => setTimeout(resolve, 100));
}); 