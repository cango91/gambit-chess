import { 
  GamePhase, 
  GameResult, 
  MoveOutcome, 
  BPRegenBonusType,
  type Move,
  type Duel,
  type ExtendedMove,
  type Player,
  type Spectator,
  type ChatMessage,
  type PGNHeaders,
  type PGNData
} from '../types';
import { ChessPieceColor, ChessPieceType, ChessPosition } from '../chess/types';

describe('Game Types', () => {
  describe('Enums', () => {
    it('should have correct GamePhase values', () => {
      expect(GamePhase.NORMAL).toBe('normal');
      expect(GamePhase.DUEL_ALLOCATION).toBe('duel_allocation');
      expect(GamePhase.TACTICAL_RETREAT).toBe('tactical_retreat');
      expect(GamePhase.GAME_OVER).toBe('game_over');
    });

    it('should have correct GameResult values', () => {
      expect(GameResult.WHITE_WIN).toBe('white_win');
      expect(GameResult.BLACK_WIN).toBe('black_win');
      expect(GameResult.DRAW).toBe('draw');
      expect(GameResult.IN_PROGRESS).toBe('in_progress');
    });

    it('should have correct BPRegenBonusType values', () => {
      expect(BPRegenBonusType.CHECK).toBe('check');
      expect(BPRegenBonusType.DOUBLE_CHECK).toBe('double_check');
      expect(BPRegenBonusType.PIN).toBe('pin');
      expect(BPRegenBonusType.FORK).toBe('fork');
      expect(BPRegenBonusType.SKEWER).toBe('skewer');
      expect(BPRegenBonusType.DISCOVERED_ATTACK).toBe('discovered_attack');
      expect(BPRegenBonusType.DISCOVERED_CHECK).toBe('discovered_check');
      expect(BPRegenBonusType.DIRECT_DEFENSE).toBe('direct_defense');
    });
  });

  describe('Move type', () => {
    it('should create a basic move object', () => {
      const move: Move = {
        from: new ChessPosition('e2'),
        to: new ChessPosition('e4'),
        piece: new ChessPieceType('p'),
        turnNumber: 1
      };

      expect(move.from.value).toBe('e2');
      expect(move.to.value).toBe('e4');
      expect(move.piece.value).toBe('p');
      expect(move.turnNumber).toBe(1);
    });

    it('should create a move with capture', () => {
      const move: Move = {
        from: new ChessPosition('e4'),
        to: new ChessPosition('d5'),
        piece: new ChessPieceType('p'),
        capture: new ChessPieceType('p'),
        turnNumber: 5
      };

      expect(move.capture?.value).toBe('p');
    });

    it('should create a move with promotion', () => {
      const move: Move = {
        from: new ChessPosition('e7'),
        to: new ChessPosition('e8'),
        piece: new ChessPieceType('p'),
        promotion: new ChessPieceType('q'),
        turnNumber: 40
      };

      expect(move.promotion?.value).toBe('q');
    });

    it('should create a castle move', () => {
      const move: Move = {
        from: new ChessPosition('e1'),
        to: new ChessPosition('g1'),
        piece: new ChessPieceType('k'),
        castle: 'kingside',
        turnNumber: 10
      };

      expect(move.castle).toBe('kingside');
    });

    it('should create a move with check', () => {
      const move: Move = {
        from: new ChessPosition('d1'),
        to: new ChessPosition('d7'),
        piece: new ChessPieceType('q'),
        check: true,
        turnNumber: 15
      };

      expect(move.check).toBe(true);
    });

    it('should create a move with en passant', () => {
      const move: Move = {
        from: new ChessPosition('e5'),
        to: new ChessPosition('d6'),
        piece: new ChessPieceType('p'),
        capture: new ChessPieceType('p'),
        enPassant: true,
        turnNumber: 12
      };

      expect(move.enPassant).toBe(true);
    });
  });

  describe('Duel type', () => {
    it('should create a duel object', () => {
      const duel: Duel = {
        attacker: new ChessPieceColor('w'),
        attackerAllocation: 3,
        defenderAllocation: 2,
        outcome: 'success'
      };

      expect(duel.attacker.value).toBe('w');
      expect(duel.attackerAllocation).toBe(3);
      expect(duel.defenderAllocation).toBe(2);
      expect(duel.outcome).toBe('success');
    });

    it('should handle different outcomes', () => {
      const successDuel: Duel = {
        attacker: new ChessPieceColor('w'),
        attackerAllocation: 5,
        defenderAllocation: 2,
        outcome: 'success'
      };
      
      const failedDuel: Duel = {
        attacker: new ChessPieceColor('b'),
        attackerAllocation: 2,
        defenderAllocation: 5,
        outcome: 'failed'
      };

      expect(successDuel.outcome).toBe('success');
      expect(failedDuel.outcome).toBe('failed');
    });
  });

  describe('ExtendedMove type', () => {
    it('should create an extended move object with all properties', () => {
      const extendedMove: ExtendedMove = {
        move: {
          from: new ChessPosition('e4'),
          to: new ChessPosition('d5'),
          piece: new ChessPieceType('p'),
          capture: new ChessPieceType('p'),
          turnNumber: 5
        },
        duel: {
          attacker: new ChessPieceColor('w'),
          attackerAllocation: 3,
          defenderAllocation: 2,
          outcome: 'success'
        },
        retreat: null,
        bpRegeneration: 2,
        playerColor: new ChessPieceColor('w'),
        turnNumber: 5
      };

      expect(extendedMove.move.from.value).toBe('e4');
      expect(extendedMove.move.to.value).toBe('d5');
      expect(extendedMove.duel?.attackerAllocation).toBe(3);
      expect(extendedMove.retreat).toBeNull();
      expect(extendedMove.bpRegeneration).toBe(2);
      expect(extendedMove.playerColor.value).toBe('w');
      expect(extendedMove.turnNumber).toBe(5);
    });

    it('should create an extended move object without a duel', () => {
      const extendedMove: ExtendedMove = {
        move: {
          from: new ChessPosition('e2'),
          to: new ChessPosition('e4'),
          piece: new ChessPieceType('p'),
          turnNumber: 1
        },
        duel: null,
        retreat: null,
        bpRegeneration: 1,
        playerColor: new ChessPieceColor('w'),
        turnNumber: 1
      };

      expect(extendedMove.move.from.value).toBe('e2');
      expect(extendedMove.move.to.value).toBe('e4');
      expect(extendedMove.duel).toBeNull();
    });
  });

  describe('Player and Spectator types', () => {
    it('should create a player object', () => {
      const player: Player = {
        id: 'player123',
        name: 'Bobby Fischer',
        color: new ChessPieceColor('w')
      };

      expect(player.id).toBe('player123');
      expect(player.name).toBe('Bobby Fischer');
      expect(player.color.value).toBe('w');
    });

    it('should create a spectator object', () => {
      const spectator: Spectator = {
        id: 'spec456',
        name: 'Garry Kasparov'
      };

      expect(spectator.id).toBe('spec456');
      expect(spectator.name).toBe('Garry Kasparov');
    });
  });

  describe('Chat message type', () => {
    it('should create a chat message object', () => {
      const message: ChatMessage = {
        senderName: 'Bobby Fischer',
        message: 'Good move!',
        timestamp: Date.now()
      };

      expect(message.senderName).toBe('Bobby Fischer');
      expect(message.message).toBe('Good move!');
      expect(typeof message.timestamp).toBe('number');
    });
  });

  describe('PGN data types', () => {
    it('should create PGN headers', () => {
      const headers: PGNHeaders = {
        Event: 'World Championship Match',
        Site: 'Reykjavik, Iceland',
        Date: '1972.07.11',
        Round: '1',
        White: 'Spassky, Boris V',
        Black: 'Fischer, Robert J',
        Result: '1-0'
      };

      expect(headers.Event).toBe('World Championship Match');
      expect(headers.White).toBe('Spassky, Boris V');
      expect(headers.Result).toBe('1-0');
    });

    it('should create complete PGN data', () => {
      const pgnData: PGNData = {
        headers: {
          Event: 'Casual Game',
          White: 'Player 1',
          Black: 'Player 2',
          Result: '*'
        },
        moves: [
          {
            move: {
              from: new ChessPosition('e2'),
              to: new ChessPosition('e4'),
              piece: new ChessPieceType('p'),
              turnNumber: 1
            },
            duel: null,
            retreat: null,
            bpRegeneration: 0,
            playerColor: new ChessPieceColor('w'),
            turnNumber: 1
          },
          {
            move: {
              from: new ChessPosition('e7'),
              to: new ChessPosition('e5'),
              piece: new ChessPieceType('p'),
              turnNumber: 2
            },
            duel: null,
            retreat: null,
            bpRegeneration: 0,
            playerColor: new ChessPieceColor('b'),
            turnNumber: 2
          }
        ]
      };

      expect(pgnData.headers.Event).toBe('Casual Game');
      expect(pgnData.moves.length).toBe(2);
      expect(pgnData.moves[0].move.from.value).toBe('e2');
      expect(pgnData.moves[1].move.from.value).toBe('e7');
    });
  });
}); 