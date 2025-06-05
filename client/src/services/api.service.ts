import { 
  MoveAction, 
  DuelAllocationAction, 
  TacticalRetreatAction,
  GameAction 
} from '@gambit-chess/shared';

export interface CreateGameOptions {
  gameType: 'ai' | 'human' | 'practice';
  colorPreference: 'white' | 'black' | 'random';
  aiDifficulty?: 'easy' | 'medium' | 'hard';
}

export interface AnonymousSession {
  sessionId: string;
  sessionToken: string;
  expiresAt: string;
  gamesPlayed: number;
}

export interface GameListItem {
  id: string;
  status: string;
  whitePlayer: {
    id: string;
    isAnonymous: boolean;
  };
  blackPlayer: {
    id: string;
    isAnonymous: boolean;
  };
  createdAt: string;
}

class ApiService {
  private baseUrl: string;
  private sessionToken: string | null = null;

  constructor() {
    this.baseUrl = import.meta.env.VITE_SERVER_URL || '';
  }

  // Anonymous session management
  async createAnonymousSession(): Promise<AnonymousSession> {
    const response = await this.post('/api/anonymous/session', {
      // Remove userAgent and acceptLanguage - let server get them from headers
      // This ensures consistency with WebSocket authentication
    });
    if (!response.ok) {
      throw new Error('Failed to create anonymous session');
    }
    const data = await response.json();
    this.sessionToken = data.sessionToken;
    return data;
  }

  async validateAnonymousSession(): Promise<boolean> {
    if (!this.sessionToken) return false;
    
    try {
      const response = await this.get('/api/anonymous/session/validate', {
        headers: {
          'Authorization': `Bearer ${this.sessionToken}`
        }
      });
      const data = await response.json();
      return data.valid;
    } catch {
      return false;
    }
  }

  // Game management
  async createGame(options: CreateGameOptions): Promise<{ gameId: string; gameState: any }> {
    const response = await this.post('/api/games', {
      ...options,
      anonymousSessionToken: this.sessionToken
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create game');
    }
    
    return response.json();
  }

  async getWaitingGames(): Promise<{ games: GameListItem[] }> {
    const response = await this.get('/api/games/waiting');
    
    if (!response.ok) {
      throw new Error('Failed to fetch waiting games');
    }
    
    return response.json();
  }

  async joinGame(gameId: string): Promise<any> {
    const response = await this.post(`/api/games/${gameId}/join`, {
      anonymousSessionToken: this.sessionToken
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to join game');
    }
    
    return response.json();
  }

  async getGameState(gameId: string): Promise<any> {
    const response = await this.get(`/api/games/${gameId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get game state');
    }
    
    return response.json();
  }

  // Game actions
  async sendGameAction(gameId: string, action: GameAction): Promise<any> {
    const response = await this.post(`/api/games/${gameId}/actions`, {
      action,
      playerId: this.getCurrentPlayerId()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send game action');
    }
    
    return response.json();
  }

  // Utility methods
  private async get(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = new URL(`${this.baseUrl}${endpoint}`, window.location.origin);
    
    // Add session token as query parameter if available
    if (this.sessionToken) {
      url.searchParams.set('anonymousSessionToken', this.sessionToken);
    }
    
    return fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    });
  }

  private async post(endpoint: string, data: any, options: RequestInit = {}): Promise<Response> {
    // Include session token in request body if available
    const requestData = this.sessionToken ? {
      ...data,
      anonymousSessionToken: this.sessionToken
    } : data;
    
    return fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      body: JSON.stringify(requestData),
      ...options,
    });
  }

  getCurrentPlayerId(): string | null {
    // Extract player ID from session token or return null
    if (!this.sessionToken) return null;
    
    try {
      // Decode JWT payload (simple base64 decode - not for security!)
      const payload = JSON.parse(atob(this.sessionToken.split('.')[1]));
      return payload.sessionId || payload.userId || null;
    } catch {
      return null;
    }
  }

  getSessionToken(): string | null {
    return this.sessionToken;
  }

  setSessionToken(token: string): void {
    this.sessionToken = token;
  }
}

// Singleton instance
export const apiService = new ApiService(); 