/**
 * Tests for validation utility functions
 */

import {
  validatePosition,
  validatePieceColor,
  validateGamePhase,
  validateGameResult,
  validateGameId,
  validateSequence,
  validateTimestamp,
  validateBPAmount,
  validateTime,
  validateName,
  validateChatMessage,
  validateGameStateDTO,
  validateMoveDTO,
  validateBPAllocationDTO,
  validateRetreatDTO,
  validateDuelInitiatedDTO,
  validateDuelOutcomeDTO,
  validateRetreatOptionsDTO,
  validateBPUpdateDTO,
  validateChatMessageDTO,
  validatePlayerDTO,
  validateSpectatorDTO
} from '../../validation';
import { GamePhase, GameResult, PieceColor } from '../../types';
import { GameStateDTO, DuelOutcomeDTO, PlayerDTO } from '../../dtos';

describe('Basic Validation Functions', () => {
  describe('validatePosition', () => {
    it('should validate chess positions correctly', () => {
      expect(validatePosition('a1')).toBe(true);
      expect(validatePosition('h8')).toBe(true);
      expect(validatePosition('e4')).toBe(true);
      
      expect(validatePosition('a0')).toBe(false);
      expect(validatePosition('i1')).toBe(false);
      expect(validatePosition('a9')).toBe(false);
      expect(validatePosition('')).toBe(false);
      expect(validatePosition(null as any)).toBe(false);
      expect(validatePosition(undefined as any)).toBe(false);
    });
  });

  describe('validatePieceColor', () => {
    it('should validate piece colors correctly', () => {
      expect(validatePieceColor('white')).toBe(true);
      expect(validatePieceColor('black')).toBe(true);
      
      expect(validatePieceColor('red' as any)).toBe(false);
      expect(validatePieceColor('' as any)).toBe(false);
      expect(validatePieceColor(null as any)).toBe(false);
      expect(validatePieceColor(undefined as any)).toBe(false);
    });
  });

  describe('validateGamePhase', () => {
    it('should validate game phases correctly', () => {
      expect(validateGamePhase(GamePhase.NORMAL)).toBe(true);
      expect(validateGamePhase(GamePhase.DUEL_ALLOCATION)).toBe(true);
      expect(validateGamePhase(GamePhase.TACTICAL_RETREAT)).toBe(true);
      expect(validateGamePhase(GamePhase.GAME_OVER)).toBe(true);
      
      expect(validateGamePhase('invalid' as any)).toBe(false);
      expect(validateGamePhase('' as any)).toBe(false);
      expect(validateGamePhase(null as any)).toBe(false);
      expect(validateGamePhase(undefined as any)).toBe(false);
    });
  });

  describe('validateGameResult', () => {
    it('should validate game results correctly', () => {
      expect(validateGameResult(GameResult.WHITE_WIN)).toBe(true);
      expect(validateGameResult(GameResult.BLACK_WIN)).toBe(true);
      expect(validateGameResult(GameResult.DRAW)).toBe(true);
      expect(validateGameResult(GameResult.IN_PROGRESS)).toBe(true);
      expect(validateGameResult(null)).toBe(true);  // Null is valid (optional)
      expect(validateGameResult(undefined)).toBe(true);  // Undefined is valid (optional)
      
      expect(validateGameResult('invalid' as any)).toBe(false);
      expect(validateGameResult('' as any)).toBe(true);
    });
  });

  describe('validateGameId', () => {
    it('should validate game IDs correctly', () => {
      expect(validateGameId('game-123')).toBe(true);
      expect(validateGameId('abc123')).toBe(true);
      
      expect(validateGameId('')).toBe(false);
      expect(validateGameId('   ')).toBe(false);
      expect(validateGameId(null as any)).toBe(false);
      expect(validateGameId(undefined as any)).toBe(false);
    });
  });

  describe('validateSequence', () => {
    it('should validate sequence numbers correctly', () => {
      expect(validateSequence(0)).toBe(true);
      expect(validateSequence(1)).toBe(true);
      expect(validateSequence(100)).toBe(true);
      
      expect(validateSequence(-1)).toBe(false);
      expect(validateSequence(1.5)).toBe(false);
      expect(validateSequence(null as any)).toBe(false);
      expect(validateSequence(undefined as any)).toBe(false);
    });
  });

  describe('validateTimestamp', () => {
    it('should validate timestamps correctly', () => {
      expect(validateTimestamp(1)).toBe(true);
      expect(validateTimestamp(1616161616)).toBe(true);
      
      expect(validateTimestamp(0)).toBe(false);
      expect(validateTimestamp(-1)).toBe(false);
      expect(validateTimestamp(null as any)).toBe(false);
      expect(validateTimestamp(undefined as any)).toBe(false);
    });
  });

  describe('validateBPAmount', () => {
    it('should validate BP amounts correctly', () => {
      expect(validateBPAmount(0)).toBe(true);
      expect(validateBPAmount(1)).toBe(true);
      expect(validateBPAmount(100)).toBe(true);
      
      expect(validateBPAmount(-1)).toBe(false);
      expect(validateBPAmount(1.5)).toBe(false);
      expect(validateBPAmount(null as any)).toBe(false);
      expect(validateBPAmount(undefined as any)).toBe(false);
    });
  });

  describe('validateTime', () => {
    it('should validate time values correctly', () => {
      expect(validateTime(0)).toBe(true);
      expect(validateTime(1000)).toBe(true);
      expect(validateTime(60000)).toBe(true);
      
      expect(validateTime(-1)).toBe(false);
      expect(validateTime(null as any)).toBe(false);
      expect(validateTime(undefined as any)).toBe(false);
    });
  });

  describe('validateName', () => {
    it('should validate names correctly', () => {
      expect(validateName('Player1')).toBe(true);
      expect(validateName('John Doe')).toBe(true);
      expect(validateName('A')).toBe(true);
      
      expect(validateName('')).toBe(false);
      expect(validateName('   ')).toBe(false);
      expect(validateName('A'.repeat(31))).toBe(false); // Too long
      expect(validateName(null as any)).toBe(false);
      expect(validateName(undefined as any)).toBe(false);
    });
  });

  describe('validateChatMessage', () => {
    it('should validate chat messages correctly', () => {
      expect(validateChatMessage('Hello')).toBe(true);
      expect(validateChatMessage('A')).toBe(true);
      
      expect(validateChatMessage('')).toBe(false);
      expect(validateChatMessage('   ')).toBe(false);
      expect(validateChatMessage('A'.repeat(501))).toBe(false); // Too long
      expect(validateChatMessage(null as any)).toBe(false);
      expect(validateChatMessage(undefined as any)).toBe(false);
    });
  });
});

describe('DTO Validation Functions', () => {
  describe('validateGameStateDTO', () => {
    it('should validate a complete GameStateDTO', () => {
      const validDTO: Partial<GameStateDTO> = {
        gameId: 'game-123',
        phase: GamePhase.NORMAL,
        turn: 'white' as PieceColor,
        pieces: [],
        moveNumber: 1,
        inCheck: false,
        whiteTimeRemaining: 300000,
        blackTimeRemaining: 300000,
        sequence: 1,
        timestamp: 1616161616,
        players: [],
        spectators: []
      };
      
      expect(validateGameStateDTO(validDTO)).toBe(true);
    });
    
    it('should reject an incomplete GameStateDTO', () => {
      const invalidDTO: Partial<GameStateDTO> = {
        gameId: 'game-123',
        // Missing required fields
      };
      
      expect(validateGameStateDTO(invalidDTO)).toBe(false);
    });
    
    it('should validate optional fields correctly', () => {
      const validDTO: Partial<GameStateDTO> = {
        gameId: 'game-123',
        phase: GamePhase.NORMAL,
        turn: 'white' as PieceColor,
        pieces: [],
        moveNumber: 1,
        inCheck: false,
        whiteTimeRemaining: 300000,
        blackTimeRemaining: 300000,
        sequence: 1,
        timestamp: 1616161616,
        players: [],
        spectators: [],
        bp: 10,
        result: GameResult.IN_PROGRESS,
        activeTimer: 'white' as PieceColor
      };
      
      expect(validateGameStateDTO(validDTO)).toBe(true);
    });
  });

  describe('validateMoveDTO', () => {
    it('should validate a valid MoveDTO', () => {
      const validDTO = {
        gameId: 'game-123',
        from: 'e2',
        to: 'e4',
        sequence: 1
      };
      
      expect(validateMoveDTO(validDTO)).toBe(true);
    });
    
    it('should reject an invalid MoveDTO', () => {
      const invalidDTO = {
        gameId: 'game-123',
        from: 'e2',
        // Missing 'to' field
        sequence: 1
      };
      
      expect(validateMoveDTO(invalidDTO)).toBe(false);
    });
  });

  describe('validateBPAllocationDTO', () => {
    it('should validate a valid BPAllocationDTO', () => {
      const validDTO = {
        gameId: 'game-123',
        amount: 5,
        sequence: 1
      };
      
      expect(validateBPAllocationDTO(validDTO)).toBe(true);
    });
    
    it('should reject an invalid BPAllocationDTO', () => {
      const invalidDTO = {
        gameId: 'game-123',
        amount: -1, // Invalid amount
        sequence: 1
      };
      
      expect(validateBPAllocationDTO(invalidDTO)).toBe(false);
    });
  });

  describe('validateRetreatDTO', () => {
    it('should validate a valid RetreatDTO', () => {
      const validDTO = {
        gameId: 'game-123',
        position: 'e3',
        sequence: 1
      };
      
      expect(validateRetreatDTO(validDTO)).toBe(true);
    });
    
    it('should reject an invalid RetreatDTO', () => {
      const invalidDTO = {
        gameId: 'game-123',
        position: 'invalid', // Invalid position
        sequence: 1
      };
      
      expect(validateRetreatDTO(invalidDTO)).toBe(false);
    });
  });

  describe('validateDuelInitiatedDTO', () => {
    it('should validate a valid DuelInitiatedDTO', () => {
      const validDTO = {
        gameId: 'game-123',
        attackingPiece: 'e2',
        defendingPiece: 'e4',
        position: 'e4'
      };
      
      expect(validateDuelInitiatedDTO(validDTO)).toBe(true);
    });
    
    it('should reject an invalid DuelInitiatedDTO', () => {
      const invalidDTO = {
        gameId: 'game-123',
        attackingPiece: 'e2',
        // Missing defendingPiece
        position: 'e4'
      };
      
      expect(validateDuelInitiatedDTO(invalidDTO)).toBe(false);
    });
  });

  describe('validateDuelOutcomeDTO', () => {
    it('should validate a valid DuelOutcomeDTO', () => {
      const validDTO: Partial<DuelOutcomeDTO> = {
        gameId: 'game-123',
        winner: 'white' as PieceColor,
        result: 'success',
        attackerAllocation: 5,
        defenderAllocation: 3
      };
      
      expect(validateDuelOutcomeDTO(validDTO)).toBe(true);
    });
    
    it('should reject an invalid DuelOutcomeDTO', () => {
      const invalidDTO = {
        gameId: 'game-123',
        winner: 'white' as PieceColor,
        result: 'invalid' as any, // Invalid result
        attackerAllocation: 5,
        defenderAllocation: 3
      };
      
      expect(validateDuelOutcomeDTO(invalidDTO)).toBe(false);
    });
  });

  describe('validateRetreatOptionsDTO', () => {
    it('should validate a valid RetreatOptionsDTO', () => {
      const validDTO = {
        gameId: 'game-123',
        piece: 'e2',
        validPositions: ['e1', 'e3'],
        costs: [0, 1]
      };
      
      expect(validateRetreatOptionsDTO(validDTO)).toBe(true);
    });
    
    it('should reject an invalid RetreatOptionsDTO', () => {
      const invalidDTO = {
        gameId: 'game-123',
        piece: 'e2',
        validPositions: ['e1', 'e3'],
        costs: [0] // Length mismatch with validPositions
      };
      
      expect(validateRetreatOptionsDTO(invalidDTO)).toBe(false);
    });
  });

  describe('validateBPUpdateDTO', () => {
    it('should validate a valid BPUpdateDTO', () => {
      const validDTO = {
        gameId: 'game-123',
        currentBP: 10
      };
      
      expect(validateBPUpdateDTO(validDTO)).toBe(true);
    });
    
    it('should reject an invalid BPUpdateDTO', () => {
      const invalidDTO = {
        gameId: 'game-123',
        currentBP: -1 // Invalid BP amount
      };
      
      expect(validateBPUpdateDTO(invalidDTO)).toBe(false);
    });
  });

  describe('validateChatMessageDTO', () => {
    it('should validate a valid ChatMessageDTO', () => {
      const validDTO = {
        gameId: 'game-123',
        senderId: 'user-1',
        senderName: 'Player 1',
        message: 'Hello',
        timestamp: 1616161616
      };
      
      expect(validateChatMessageDTO(validDTO)).toBe(true);
    });
    
    it('should reject an invalid ChatMessageDTO', () => {
      const invalidDTO = {
        gameId: 'game-123',
        senderId: 'user-1',
        senderName: 'Player 1',
        // Missing message
        timestamp: 1616161616
      };
      
      expect(validateChatMessageDTO(invalidDTO)).toBe(false);
    });
  });

  describe('validatePlayerDTO', () => {
    it('should validate a valid PlayerDTO', () => {
      const validDTO: Partial<PlayerDTO> = {
        gameId: 'game-123',
        id: 'user-1',
        name: 'Player 1',
        color: 'white' as PieceColor
      };
      
      expect(validatePlayerDTO(validDTO)).toBe(true);
    });
    
    it('should reject an invalid PlayerDTO', () => {
      const invalidDTO = {
        gameId: 'game-123',
        id: 'user-1',
        name: 'Player 1',
        color: 'red' as any // Invalid color
      };
      
      expect(validatePlayerDTO(invalidDTO)).toBe(false);
    });
  });

  describe('validateSpectatorDTO', () => {
    it('should validate a valid SpectatorDTO', () => {
      const validDTO = {
        gameId: 'game-123',
        id: 'user-1',
        name: 'Spectator 1'
      };
      
      expect(validateSpectatorDTO(validDTO)).toBe(true);
    });
    
    it('should reject an invalid SpectatorDTO', () => {
      const invalidDTO = {
        gameId: 'game-123',
        id: 'user-1',
        name: '' // Invalid name
      };
      
      expect(validateSpectatorDTO(invalidDTO)).toBe(false);
    });
  });
}); 