import { v4 as uuidv4 } from 'uuid';

/**
 * Represents a chess game session with players and game state
 */
export interface Player {
  id: string;
  name: string;
  color: 'white' | 'black';
  socketId?: string;
  bpPool: number;
  connected: boolean;
  timeRemaining: number; // in seconds
}

export interface Spectator {
  id: string;
  name: string;
  socketId: string;
}

export interface GameState {
  boardState: any; // Will be replaced with proper type from shared library
  activeColor: 'white' | 'black';
  inCheck: boolean;
  checkmate: boolean;
  stalemate: boolean;
  draw: boolean;
  drawReason?: string;
  moveHistory: string[];
  lastMoveTimestamp: number;
  duelInProgress: boolean;
  retreatInProgress: boolean;
}

export interface Game {
  id: string;
  players: {
    white?: Player;
    black?: Player;
  };
  spectators: Spectator[];
  state: GameState;
  createdAt: number;
  startedAt?: number;
  endedAt?: number;
  timerPaused: boolean;
  timeLimit: number; // in seconds
  initialBP: number;
  maxBPAllocation: number;
  boardStates: any[]; // Previous board states for detecting tactical advantages
}

/**
 * Create a new game with initial state
 */
export function createGame(timeLimit = 300, initialBP = 39, maxBPAllocation = 10): Game {
  return {
    id: uuidv4(),
    players: {},
    spectators: [],
    state: {
      boardState: null, // Will be initialized with shared library
      activeColor: 'white',
      inCheck: false,
      checkmate: false,
      stalemate: false,
      draw: false,
      moveHistory: [],
      lastMoveTimestamp: Date.now(),
      duelInProgress: false,
      retreatInProgress: false
    },
    createdAt: Date.now(),
    timerPaused: true,
    timeLimit,
    initialBP,
    maxBPAllocation,
    boardStates: []
  };
}

/**
 * Add a player to the game
 */
export function addPlayer(game: Game, playerId: string, playerName: string): Player | null {
  // Determine available color
  let color: 'white' | 'black' | null = null;
  
  if (!game.players.white) {
    color = 'white';
  } else if (!game.players.black) {
    color = 'black';
  }
  
  if (!color) return null; // Game is full
  
  const player: Player = {
    id: playerId,
    name: playerName,
    color,
    bpPool: game.initialBP,
    connected: true,
    timeRemaining: game.timeLimit
  };
  
  game.players[color] = player;
  
  // If both players are now present, start the game
  if (game.players.white && game.players.black && !game.startedAt) {
    game.startedAt = Date.now();
    game.timerPaused = false;
  }
  
  return player;
}

/**
 * Add a spectator to the game
 */
export function addSpectator(game: Game, spectatorId: string, spectatorName: string, socketId: string): Spectator {
  const spectator: Spectator = {
    id: spectatorId,
    name: spectatorName,
    socketId
  };
  
  game.spectators.push(spectator);
  return spectator;
}

/**
 * Remove a spectator from the game
 */
export function removeSpectator(game: Game, spectatorId: string): boolean {
  const initialLength = game.spectators.length;
  game.spectators = game.spectators.filter(s => s.id !== spectatorId);
  return game.spectators.length !== initialLength;
}

/**
 * Check if the game is in a terminal state (checkmate, stalemate, draw)
 */
export function isGameOver(game: Game): boolean {
  return game.state.checkmate || game.state.stalemate || game.state.draw;
} 