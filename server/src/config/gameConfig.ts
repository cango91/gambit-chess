import { PieceType } from '@gambit-chess/shared';

/**
 * Game configuration parameters
 * These can be overridden through environment variables
 */
export const gameConfig = {
  // Initial Battle Points pool for each player
  INITIAL_BP_POOL: parseInt(process.env.INITIAL_BP_POOL || '39'),
  
  // Maximum Battle Points allocation for a single piece
  MAX_BP_ALLOCATION: parseInt(process.env.MAX_BP_ALLOCATION || '10'),
  
  // Base BP regeneration per turn
  BASE_BP_REGEN: parseInt(process.env.BASE_BP_REGEN || '1'),
  
  // BP regeneration for chess tactics
  TACTICS_BP_REGEN: {
    // Putting opponent in check
    CHECK: parseInt(process.env.BP_REGEN_CHECK || '2'),
    
    // Creating a fork (threatening multiple pieces)
    FORK: parseInt(process.env.BP_REGEN_FORK || '3'),
    
    // Creating a pin (piece can't move or exposes more valuable piece)
    PIN: parseInt(process.env.BP_REGEN_PIN || '2'),
    
    // Creating a skewer (forcing piece to move, exposing another)
    SKEWER: parseInt(process.env.BP_REGEN_SKEWER || '2'),
    
    // Creating a discovered attack
    DISCOVERED_ATTACK: parseInt(process.env.BP_REGEN_DISCOVERED_ATTACK || '2'),
    
    // Creating a discovered check
    DISCOVERED_CHECK: parseInt(process.env.BP_REGEN_DISCOVERED_CHECK || '3')
  },
  
  // BP capacities for each piece type (using classic chess values)
  BP_CAPACITIES: {
    [PieceType.PAWN]: parseInt(process.env.BP_CAPACITY_PAWN || '1'),
    [PieceType.KNIGHT]: parseInt(process.env.BP_CAPACITY_KNIGHT || '3'),
    [PieceType.BISHOP]: parseInt(process.env.BP_CAPACITY_BISHOP || '3'),
    [PieceType.ROOK]: parseInt(process.env.BP_CAPACITY_ROOK || '5'),
    [PieceType.QUEEN]: parseInt(process.env.BP_CAPACITY_QUEEN || '9'),
    [PieceType.KING]: parseInt(process.env.BP_CAPACITY_KING || '0') // King has no BP capacity
  },
  
  // Game session expiry time (in seconds)
  GAME_EXPIRY: parseInt(process.env.GAME_EXPIRY || '86400'), // 24 hours
  
  // Matchmaking settings
  MATCHMAKING: {
    // Maximum wait time in matchmaking queue (in seconds)
    MAX_WAIT_TIME: parseInt(process.env.MATCHMAKING_MAX_WAIT_TIME || '60'),
    
    // Matchmaking queue check interval (in milliseconds)
    CHECK_INTERVAL: parseInt(process.env.MATCHMAKING_CHECK_INTERVAL || '5000')
  }
}; 