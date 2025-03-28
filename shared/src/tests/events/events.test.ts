/**
 * Event Types and Validation Tests
 */

import {
  MoveRequestEvent,
  MoveResultEvent,
  DuelInitiatedEvent,
  DuelAllocationEvent,
  DuelOutcomeEvent,
  RetreatOptionsEvent,
  RetreatSelectionEvent,
  CheckEvent,
  GameOverEvent,
  PlayerJoinedEvent,
  PlayerLeftEvent,
  PlayerReconnectedEvent,
  SpectatorJoinedEvent,
  SpectatorLeftEvent,
  ChatMessageEvent,
  GameStateUpdateEvent,
  ErrorEvent,
  GameResignEvent,
  GameOfferDrawEvent,
  GameRespondDrawEvent,
  ConnectionPingEvent,
  PlayerSetNameEvent,
  SpectatorJoinEvent,
  validateMoveRequestEvent,
  validateMoveResultEvent,
  validateDuelInitiatedEvent,
  validateDuelAllocationEvent,
  validateDuelOutcomeEvent,
  validateRetreatOptionsEvent,
  validateRetreatSelectionEvent,
  validateCheckEvent,
  validateGameOverEvent,
  validatePlayerJoinedEvent,
  validatePlayerLeftEvent,
  validatePlayerReconnectedEvent,
  validateSpectatorJoinedEvent,
  validateSpectatorLeftEvent,
  validateChatMessageEvent,
  validateGameStateUpdateEvent,
  validateErrorEvent,
  validateGameResignEvent,
  validateGameOfferDrawEvent,
  validateGameRespondDrawEvent,
  validateConnectionPingEvent,
  validatePlayerSetNameEvent,
  validateSpectatorJoinEvent,
  validateSharedEvent
} from '../../events';

import { GamePhase, PieceColor } from '../../types';

describe('Event Definitions', () => {
  describe('Move Events', () => {
    test('MoveRequestEvent has correct properties', () => {
      const event: MoveRequestEvent = {
        type: 'move.request',
        payload: {
          gameId: 'game123',
          from: 'e2',
          to: 'e4',
          sequence: 1
        }
      };
      
      expect(event.type).toBe('move.request');
      expect(event.payload.gameId).toBe('game123');
      expect(event.payload.from).toBe('e2');
      expect(event.payload.to).toBe('e4');
      expect(event.payload.sequence).toBe(1);
    });
    
    test('MoveResultEvent has correct properties', () => {
      const event: MoveResultEvent = {
        type: 'move.result',
        payload: {
          success: true,
          checkDetected: true,
          captureAttempted: false
        }
      };
      
      expect(event.type).toBe('move.result');
      expect(event.payload.success).toBe(true);
      expect(event.payload.checkDetected).toBe(true);
      expect(event.payload.captureAttempted).toBe(false);
    });
  });
  
  describe('Duel Events', () => {
    test('DuelInitiatedEvent has correct properties', () => {
      const event: DuelInitiatedEvent = {
        type: 'duel.initiated',
        payload: {
          gameId: 'game123',
          attackingPiece: 'e4',
          defendingPiece: 'd5',
          position: 'd5'
        }
      };
      
      expect(event.type).toBe('duel.initiated');
      expect(event.payload.gameId).toBe('game123');
      expect(event.payload.attackingPiece).toBe('e4');
      expect(event.payload.defendingPiece).toBe('d5');
      expect(event.payload.position).toBe('d5');
    });
    
    test('DuelAllocationEvent has correct properties', () => {
      const event: DuelAllocationEvent = {
        type: 'duel.allocate',
        payload: {
          gameId: 'game123',
          amount: 5,
          sequence: 2
        }
      };
      
      expect(event.type).toBe('duel.allocate');
      expect(event.payload.gameId).toBe('game123');
      expect(event.payload.amount).toBe(5);
      expect(event.payload.sequence).toBe(2);
    });
    
    test('DuelOutcomeEvent has correct properties', () => {
      const event: DuelOutcomeEvent = {
        type: 'duel.outcome',
        payload: {
          gameId: 'game123',
          winner: 'white',
          result: 'success',
          attackerAllocation: 5,
          defenderAllocation: 3
        }
      };
      
      expect(event.type).toBe('duel.outcome');
      expect(event.payload.gameId).toBe('game123');
      expect(event.payload.winner).toBe('white');
      expect(event.payload.result).toBe('success');
      expect(event.payload.attackerAllocation).toBe(5);
      expect(event.payload.defenderAllocation).toBe(3);
    });
  });
  
  describe('Retreat Events', () => {
    test('RetreatOptionsEvent has correct properties', () => {
      const event: RetreatOptionsEvent = {
        type: 'retreat.options',
        payload: {
          gameId: 'game123',
          piece: 'e4',
          validPositions: ['e2', 'e3'],
          costs: [0, 1]
        }
      };
      
      expect(event.type).toBe('retreat.options');
      expect(event.payload.gameId).toBe('game123');
      expect(event.payload.piece).toBe('e4');
      expect(event.payload.validPositions).toEqual(['e2', 'e3']);
      expect(event.payload.costs).toEqual([0, 1]);
    });
    
    test('RetreatSelectionEvent has correct properties', () => {
      const event: RetreatSelectionEvent = {
        type: 'retreat.select',
        payload: {
          gameId: 'game123',
          position: 'e2',
          sequence: 3
        }
      };
      
      expect(event.type).toBe('retreat.select');
      expect(event.payload.gameId).toBe('game123');
      expect(event.payload.position).toBe('e2');
      expect(event.payload.sequence).toBe(3);
    });
  });
  
  describe('Game Status Events', () => {
    test('CheckEvent has correct properties', () => {
      const event: CheckEvent = {
        type: 'game.check',
        payload: {
          gameId: 'game123',
          kingPosition: 'e1',
          color: 'white'
        }
      };
      
      expect(event.type).toBe('game.check');
      expect(event.payload.gameId).toBe('game123');
      expect(event.payload.kingPosition).toBe('e1');
      expect(event.payload.color).toBe('white');
    });
    
    test('GameOverEvent has correct properties', () => {
      const event: GameOverEvent = {
        type: 'game.over',
        payload: {
          gameId: 'game123',
          result: 'white_win',
          reason: 'checkmate'
        }
      };
      
      expect(event.type).toBe('game.over');
      expect(event.payload.gameId).toBe('game123');
      expect(event.payload.result).toBe('white_win');
      expect(event.payload.reason).toBe('checkmate');
    });
  });
  
  describe('Player and Spectator Events', () => {
    test('PlayerJoinedEvent has correct properties', () => {
      const event: PlayerJoinedEvent = {
        type: 'player.joined',
        payload: {
          gameId: 'game123',
          id: 'player1',
          name: 'Player 1',
          color: 'white'
        }
      };
      
      expect(event.type).toBe('player.joined');
      expect(event.payload.gameId).toBe('game123');
      expect(event.payload.id).toBe('player1');
      expect(event.payload.name).toBe('Player 1');
      expect(event.payload.color).toBe('white');
    });
    
    test('PlayerLeftEvent has correct properties', () => {
      const event: PlayerLeftEvent = {
        type: 'player.left',
        payload: {
          gameId: 'game123',
          playerId: 'player1'
        }
      };
      
      expect(event.type).toBe('player.left');
      expect(event.payload.gameId).toBe('game123');
      expect(event.payload.playerId).toBe('player1');
    });
    
    test('SpectatorJoinedEvent has correct properties', () => {
      const event: SpectatorJoinedEvent = {
        type: 'spectator.joined',
        payload: {
          gameId: 'game123',
          id: 'spec1',
          name: 'Spectator 1'
        }
      };
      
      expect(event.type).toBe('spectator.joined');
      expect(event.payload.gameId).toBe('game123');
      expect(event.payload.id).toBe('spec1');
      expect(event.payload.name).toBe('Spectator 1');
    });
  });
  
  describe('Chat and Error Events', () => {
    test('ChatMessageEvent has correct properties', () => {
      const event: ChatMessageEvent = {
        type: 'chat.message',
        payload: {
          gameId: 'game123',
          senderId: 'player1',
          senderName: 'Player 1',
          message: 'Hello!',
          timestamp: 1617189123456
        }
      };
      
      expect(event.type).toBe('chat.message');
      expect(event.payload.gameId).toBe('game123');
      expect(event.payload.senderId).toBe('player1');
      expect(event.payload.message).toBe('Hello!');
    });
    
    test('ErrorEvent has correct properties', () => {
      const event: ErrorEvent = {
        type: 'error',
        payload: {
          code: 'invalid_move',
          message: 'Invalid move'
        }
      };
      
      expect(event.type).toBe('error');
      expect(event.payload.code).toBe('invalid_move');
      expect(event.payload.message).toBe('Invalid move');
    });
  });
});

describe('Event Validation', () => {
  describe('Move Event Validation', () => {
    test('validateMoveRequestEvent validates correctly', () => {
      const validEvent: MoveRequestEvent = {
        type: 'move.request',
        payload: {
          gameId: 'game123',
          from: 'e2',
          to: 'e4',
          sequence: 1
        }
      };
      
      const invalidEvent = {
        type: 'move.request',
        payload: {
          // missing required fields
          gameId: 'game123'
        }
      };
      
      expect(validateMoveRequestEvent(validEvent)).toBe(true);
      expect(validateMoveRequestEvent(invalidEvent as any)).toBe(false);
    });
    
    test('validateMoveResultEvent validates correctly', () => {
      const validEvent: MoveResultEvent = {
        type: 'move.result',
        payload: {
          success: true,
          checkDetected: true
        }
      };
      
      const invalidEvent = {
        type: 'move.result',
        payload: {
          // missing success field
          checkDetected: true
        }
      };
      
      const wrongTypeEvent = {
        type: 'wrong.type',
        payload: {
          success: true
        }
      };
      
      expect(validateMoveResultEvent(validEvent)).toBe(true);
      expect(validateMoveResultEvent(invalidEvent as any)).toBe(false);
      expect(validateMoveResultEvent(wrongTypeEvent as any)).toBe(false);
    });
  });
  
  describe('Duel Event Validation', () => {
    test('validateDuelInitiatedEvent validates correctly', () => {
      const validEvent: DuelInitiatedEvent = {
        type: 'duel.initiated',
        payload: {
          gameId: 'game123',
          attackingPiece: 'e4',
          defendingPiece: 'd5',
          position: 'd5'
        }
      };
      
      const invalidEvent = {
        type: 'duel.initiated',
        payload: {
          gameId: 'game123',
          // missing required fields
          attackingPiece: 'e4'
        }
      };
      
      expect(validateDuelInitiatedEvent(validEvent)).toBe(true);
      expect(validateDuelInitiatedEvent(invalidEvent as any)).toBe(false);
    });
    
    test('validateDuelAllocationEvent validates correctly', () => {
      const validEvent: DuelAllocationEvent = {
        type: 'duel.allocate',
        payload: {
          gameId: 'game123',
          amount: 5,
          sequence: 2
        }
      };
      
      const invalidEvent = {
        type: 'duel.allocate',
        payload: {
          gameId: 'game123',
          // negative amount is invalid
          amount: -1,
          sequence: 2
        }
      };
      
      expect(validateDuelAllocationEvent(validEvent)).toBe(true);
      expect(validateDuelAllocationEvent(invalidEvent as any)).toBe(false);
    });
    
    test('validateDuelOutcomeEvent validates correctly', () => {
      const validEvent: DuelOutcomeEvent = {
        type: 'duel.outcome',
        payload: {
          gameId: 'game123',
          winner: 'white',
          result: 'success',
          attackerAllocation: 5,
          defenderAllocation: 3
        }
      };
      
      const invalidEvent = {
        type: 'duel.outcome',
        payload: {
          gameId: 'game123',
          winner: 'white',
          // invalid result value
          result: 'invalid',
          attackerAllocation: 5,
          defenderAllocation: 3
        }
      };
      
      expect(validateDuelOutcomeEvent(validEvent)).toBe(true);
      expect(validateDuelOutcomeEvent(invalidEvent as any)).toBe(false);
    });
  });
  
  describe('Retreat Event Validation', () => {
    test('validateRetreatOptionsEvent validates correctly', () => {
      const validEvent: RetreatOptionsEvent = {
        type: 'retreat.options',
        payload: {
          gameId: 'game123',
          piece: 'e4',
          validPositions: ['e2', 'e3'],
          costs: [0, 1]
        }
      };
      
      const invalidEvent = {
        type: 'retreat.options',
        payload: {
          gameId: 'game123',
          piece: 'e4',
          // Different lengths for positions and costs
          validPositions: ['e2', 'e3'],
          costs: [0]
        }
      };
      
      expect(validateRetreatOptionsEvent(validEvent)).toBe(true);
      expect(validateRetreatOptionsEvent(invalidEvent as any)).toBe(false);
    });
    
    test('validateRetreatSelectionEvent validates correctly', () => {
      const validEvent: RetreatSelectionEvent = {
        type: 'retreat.select',
        payload: {
          gameId: 'game123',
          position: 'e2',
          sequence: 3
        }
      };
      
      const invalidEvent = {
        type: 'retreat.select',
        payload: {
          gameId: 'game123',
          // Invalid position
          position: 'z9',
          sequence: 3
        }
      };
      
      expect(validateRetreatSelectionEvent(validEvent)).toBe(true);
      expect(validateRetreatSelectionEvent(invalidEvent as any)).toBe(false);
    });
  });
  
  describe('Game Status Event Validation', () => {
    test('validateCheckEvent validates correctly', () => {
      const validEvent: CheckEvent = {
        type: 'game.check',
        payload: {
          gameId: 'game123',
          kingPosition: 'e1',
          color: 'white'
        }
      };
      
      const invalidEvent = {
        type: 'game.check',
        payload: {
          gameId: 'game123',
          kingPosition: 'e1',
          // Invalid color
          color: 'purple'
        }
      };
      
      expect(validateCheckEvent(validEvent)).toBe(true);
      expect(validateCheckEvent(invalidEvent as any)).toBe(false);
    });
    
    test('validateGameOverEvent validates correctly', () => {
      const validEvent: GameOverEvent = {
        type: 'game.over',
        payload: {
          gameId: 'game123',
          result: 'white_win',
          reason: 'checkmate'
        }
      };
      
      const invalidEvent = {
        type: 'game.over',
        payload: {
          gameId: 'game123',
          // Invalid result
          result: 'draw_by_agreement',
          reason: 'checkmate'
        }
      };
      
      expect(validateGameOverEvent(validEvent)).toBe(true);
      expect(validateGameOverEvent(invalidEvent as any)).toBe(false);
    });
  });
  
  describe('Player and Spectator Event Validation', () => {
    test('validatePlayerJoinedEvent validates correctly', () => {
      const validEvent: PlayerJoinedEvent = {
        type: 'player.joined',
        payload: {
          gameId: 'game123',
          id: 'player1',
          name: 'Player 1',
          color: 'white'
        }
      };
      
      const invalidEvent = {
        type: 'player.joined',
        payload: {
          gameId: 'game123',
          id: 'player1',
          // Name too long (over 30 chars)
          name: 'This is a very very very very very long player name',
          color: 'white'
        }
      };
      
      expect(validatePlayerJoinedEvent(validEvent)).toBe(true);
      expect(validatePlayerJoinedEvent(invalidEvent as any)).toBe(false);
    });
    
    test('validatePlayerLeftEvent validates correctly', () => {
      const validEvent: PlayerLeftEvent = {
        type: 'player.left',
        payload: {
          gameId: 'game123',
          playerId: 'player1'
        }
      };
      
      const invalidEvent = {
        type: 'player.left',
        payload: {
          // Missing gameId
          playerId: 'player1'
        }
      };
      
      expect(validatePlayerLeftEvent(validEvent)).toBe(true);
      expect(validatePlayerLeftEvent(invalidEvent as any)).toBe(false);
    });
    
    test('validatePlayerReconnectedEvent validates correctly', () => {
      const validEvent: PlayerReconnectedEvent = {
        type: 'player.reconnected',
        payload: {
          gameId: 'game123',
          playerId: 'player1'
        }
      };
      
      const invalidEvent = {
        type: 'player.reconnected',
        payload: {
          gameId: 'game123',
          // Missing playerId
        }
      };
      
      expect(validatePlayerReconnectedEvent(validEvent)).toBe(true);
      expect(validatePlayerReconnectedEvent(invalidEvent as any)).toBe(false);
    });
    
    test('validateSpectatorJoinedEvent validates correctly', () => {
      const validEvent: SpectatorJoinedEvent = {
        type: 'spectator.joined',
        payload: {
          gameId: 'game123',
          id: 'spec1',
          name: 'Spectator 1'
        }
      };
      
      const invalidEvent = {
        type: 'spectator.joined',
        payload: {
          gameId: 'game123',
          // Missing id
          name: 'Spectator 1'
        }
      };
      
      expect(validateSpectatorJoinedEvent(validEvent)).toBe(true);
      expect(validateSpectatorJoinedEvent(invalidEvent as any)).toBe(false);
    });
    
    test('validateSpectatorLeftEvent validates correctly', () => {
      const validEvent: SpectatorLeftEvent = {
        type: 'spectator.left',
        payload: {
          gameId: 'game123',
          spectatorId: 'spec1'
        }
      };
      
      const invalidEvent = {
        type: 'spectator.left',
        payload: {
          // Missing gameId
          spectatorId: 'spec1'
        }
      };
      
      expect(validateSpectatorLeftEvent(validEvent)).toBe(true);
      expect(validateSpectatorLeftEvent(invalidEvent as any)).toBe(false);
    });
  });
  
  describe('Chat and Error Event Validation', () => {
    test('validateChatMessageEvent validates correctly', () => {
      const validEvent: ChatMessageEvent = {
        type: 'chat.message',
        payload: {
          gameId: 'game123',
          senderId: 'player1',
          senderName: 'Player 1',
          message: 'Hello!',
          timestamp: 1617189123456
        }
      };
      
      const invalidEvent = {
        type: 'chat.message',
        payload: {
          gameId: 'game123',
          senderId: 'player1',
          senderName: 'Player 1',
          // Empty message
          message: '',
          timestamp: 1617189123456
        }
      };
      
      expect(validateChatMessageEvent(validEvent)).toBe(true);
      expect(validateChatMessageEvent(invalidEvent as any)).toBe(false);
    });
    
    test('validateErrorEvent validates correctly', () => {
      const validEvent: ErrorEvent = {
        type: 'error',
        payload: {
          code: 'invalid_move',
          message: 'Invalid move'
        }
      };
      
      const invalidEvent = {
        type: 'error',
        payload: {
          // Missing code
          message: 'Invalid move'
        }
      };
      
      expect(validateErrorEvent(validEvent)).toBe(true);
      expect(validateErrorEvent(invalidEvent as any)).toBe(false);
    });
  });
  
  describe('Game Control Events', () => {
    test('GameResignEvent has correct properties', () => {
      const event: GameResignEvent = {
        type: 'game.resign',
        payload: {
          gameId: 'game123',
          sequence: 5
        }
      };
      
      expect(event.type).toBe('game.resign');
      expect(event.payload.gameId).toBe('game123');
      expect(event.payload.sequence).toBe(5);
    });
    
    test('GameOfferDrawEvent has correct properties', () => {
      const event: GameOfferDrawEvent = {
        type: 'game.offerDraw',
        payload: {
          gameId: 'game123',
          sequence: 6
        }
      };
      
      expect(event.type).toBe('game.offerDraw');
      expect(event.payload.gameId).toBe('game123');
      expect(event.payload.sequence).toBe(6);
    });
    
    test('GameRespondDrawEvent has correct properties', () => {
      const event: GameRespondDrawEvent = {
        type: 'game.respondDraw',
        payload: {
          gameId: 'game123',
          accept: true,
          sequence: 7
        }
      };
      
      expect(event.type).toBe('game.respondDraw');
      expect(event.payload.gameId).toBe('game123');
      expect(event.payload.accept).toBe(true);
      expect(event.payload.sequence).toBe(7);
    });
  });

  describe('Connection Events', () => {
    test('ConnectionPingEvent has correct properties', () => {
      const event: ConnectionPingEvent = {
        type: 'connection.ping',
        payload: {
          gameId: 'game123',
          timestamp: 1617189123456
        }
      };
      
      expect(event.type).toBe('connection.ping');
      expect(event.payload.gameId).toBe('game123');
      expect(event.payload.timestamp).toBe(1617189123456);
    });
  });

  describe('Player and Spectator Management Events', () => {
    test('PlayerSetNameEvent has correct properties', () => {
      const event: PlayerSetNameEvent = {
        type: 'player.setName',
        payload: {
          gameId: 'game123',
          name: 'New Player Name'
        }
      };
      
      expect(event.type).toBe('player.setName');
      expect(event.payload.gameId).toBe('game123');
      expect(event.payload.name).toBe('New Player Name');
    });
    
    test('SpectatorJoinEvent has correct properties', () => {
      const event: SpectatorJoinEvent = {
        type: 'spectator.join',
        payload: {
          gameId: 'game123',
          name: 'Spectator 2'
        }
      };
      
      expect(event.type).toBe('spectator.join');
      expect(event.payload.gameId).toBe('game123');
      expect(event.payload.name).toBe('Spectator 2');
    });
  });

  describe('Game Control Event Validation', () => {
    test('validateGameResignEvent validates correctly', () => {
      const validEvent: GameResignEvent = {
        type: 'game.resign',
        payload: {
          gameId: 'game123',
          sequence: 5
        }
      };
      
      const invalidEvent = {
        type: 'game.resign',
        payload: {
          // Missing gameId
          sequence: 5
        }
      };
      
      expect(validateGameResignEvent(validEvent)).toBe(true);
      expect(validateGameResignEvent(invalidEvent as any)).toBe(false);
    });
    
    test('validateGameOfferDrawEvent validates correctly', () => {
      const validEvent: GameOfferDrawEvent = {
        type: 'game.offerDraw',
        payload: {
          gameId: 'game123',
          sequence: 6
        }
      };
      
      const invalidEvent = {
        type: 'game.offerDraw',
        payload: {
          gameId: 'game123',
          // Negative sequence is invalid
          sequence: -1
        }
      };
      
      expect(validateGameOfferDrawEvent(validEvent)).toBe(true);
      expect(validateGameOfferDrawEvent(invalidEvent as any)).toBe(false);
    });
    
    test('validateGameRespondDrawEvent validates correctly', () => {
      const validEvent: GameRespondDrawEvent = {
        type: 'game.respondDraw',
        payload: {
          gameId: 'game123',
          accept: true,
          sequence: 7
        }
      };
      
      const invalidEvent = {
        type: 'game.respondDraw',
        payload: {
          gameId: 'game123',
          // Missing accept field
          sequence: 7
        }
      };
      
      expect(validateGameRespondDrawEvent(validEvent)).toBe(true);
      expect(validateGameRespondDrawEvent(invalidEvent as any)).toBe(false);
    });
  });
  
  describe('Connection Event Validation', () => {
    test('validateConnectionPingEvent validates correctly', () => {
      const validEvent: ConnectionPingEvent = {
        type: 'connection.ping',
        payload: {
          gameId: 'game123',
          timestamp: 1617189123456
        }
      };
      
      const invalidEvent = {
        type: 'connection.ping',
        payload: {
          gameId: 'game123',
          // Negative timestamp is invalid
          timestamp: -1
        }
      };
      
      expect(validateConnectionPingEvent(validEvent)).toBe(true);
      expect(validateConnectionPingEvent(invalidEvent as any)).toBe(false);
    });
  });
  
  describe('Player and Spectator Management Event Validation', () => {
    test('validatePlayerSetNameEvent validates correctly', () => {
      const validEvent: PlayerSetNameEvent = {
        type: 'player.setName',
        payload: {
          gameId: 'game123',
          name: 'New Player Name'
        }
      };
      
      const invalidEvent = {
        type: 'player.setName',
        payload: {
          gameId: 'game123',
          // Name too short
          name: 'AB'
        }
      };
      
      expect(validatePlayerSetNameEvent(validEvent)).toBe(true);
      expect(validatePlayerSetNameEvent(invalidEvent as any)).toBe(false);
    });
    
    test('validateSpectatorJoinEvent validates correctly', () => {
      const validEvent: SpectatorJoinEvent = {
        type: 'spectator.join',
        payload: {
          gameId: 'game123',
          name: 'Spectator 2'
        }
      };
      
      const invalidEvent = {
        type: 'spectator.join',
        payload: {
          // Missing gameId
          name: 'Spectator 2'
        }
      };
      
      expect(validateSpectatorJoinEvent(validEvent)).toBe(true);
      expect(validateSpectatorJoinEvent(invalidEvent as any)).toBe(false);
    });
  });

  describe('validateSharedEvent', () => {
    test('validates new event types correctly', () => {
      const resignEvent: GameResignEvent = {
        type: 'game.resign',
        payload: {
          gameId: 'game123',
          sequence: 5
        }
      };
      
      const drawOfferEvent: GameOfferDrawEvent = {
        type: 'game.offerDraw',
        payload: {
          gameId: 'game123',
          sequence: 6
        }
      };
      
      const drawResponseEvent: GameRespondDrawEvent = {
        type: 'game.respondDraw',
        payload: {
          gameId: 'game123',
          accept: true,
          sequence: 7
        }
      };
      
      const connectionPingEvent: ConnectionPingEvent = {
        type: 'connection.ping',
        payload: {
          gameId: 'game123',
          timestamp: 1617189123456
        }
      };
      
      const playerSetNameEvent: PlayerSetNameEvent = {
        type: 'player.setName',
        payload: {
          gameId: 'game123',
          name: 'New Player Name'
        }
      };
      
      const spectatorJoinEvent: SpectatorJoinEvent = {
        type: 'spectator.join',
        payload: {
          gameId: 'game123',
          name: 'Spectator 2'
        }
      };
      
      expect(validateSharedEvent(resignEvent)).toBe(true);
      expect(validateSharedEvent(drawOfferEvent)).toBe(true);
      expect(validateSharedEvent(drawResponseEvent)).toBe(true);
      expect(validateSharedEvent(connectionPingEvent)).toBe(true);
      expect(validateSharedEvent(playerSetNameEvent)).toBe(true);
      expect(validateSharedEvent(spectatorJoinEvent)).toBe(true);
    });
  });
}); 