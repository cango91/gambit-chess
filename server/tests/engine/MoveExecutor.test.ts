import { GameState } from '../../src/engine/GameState';
import { MoveExecutor } from '../../src/engine/MoveExecutor';
import { ScenarioFactory } from '../../src/utils/ScenarioFactory';
import {
  PlayerColor,
  GamePhase,
  PieceType,
  MoveType,
  Position
} from '@gambit-chess/shared';

describe('MoveExecutor', () => {
  // Basic move validation
  describe('move validation', () => {
    it('should validate and execute a valid pawn move', () => {
      const gameState = new GameState();
      const moveExecutor = new MoveExecutor(gameState);
      
      // Move white pawn from e2 to e4
      const result = moveExecutor.executeMove(
        { x: 4, y: 1 }, // e2
        { x: 4, y: 3 }, // e4
        PlayerColor.WHITE
      );
      
      expect(result.success).toBe(true);
      expect(result.moveType).toBe(MoveType.NORMAL);
      expect(result.triggersDuel).toBe(false);
      
      // Check that the pawn moved
      const state = gameState.getState();
      const movedPawn = state.pieces.find(p => 
        p.type === PieceType.PAWN && 
        p.color === PlayerColor.WHITE && 
        p.position.x === 4 && 
        p.position.y === 3
      );
      
      expect(movedPawn).toBeDefined();
      expect(state.currentTurn).toBe(PlayerColor.BLACK); // Turn should switch
    });
    
    it('should reject a move when it is not the player\'s turn', () => {
      const gameState = new GameState();
      const moveExecutor = new MoveExecutor(gameState);
      
      // Try to move a black pawn on white's turn
      const result = moveExecutor.executeMove(
        { x: 4, y: 6 }, // e7
        { x: 4, y: 5 }, // e6
        PlayerColor.BLACK
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Not your turn');
    });
    
    it('should reject a move when the piece does not belong to the player', () => {
      const gameState = new GameState();
      const moveExecutor = new MoveExecutor(gameState);
      
      // Try to move a black pawn as white
      const result = moveExecutor.executeMove(
        { x: 4, y: 6 }, // e7 (black pawn)
        { x: 4, y: 5 }, // e6
        PlayerColor.WHITE
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('No piece at starting position');
    });
    
    it('should reject an invalid move', () => {
      const gameState = new GameState();
      const moveExecutor = new MoveExecutor(gameState);
      
      // Try to move white pawn diagonally with no capture
      const result = moveExecutor.executeMove(
        { x: 4, y: 1 }, // e2
        { x: 5, y: 2 }, // f3
        PlayerColor.WHITE
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
  
  // Capture and duel initiation
  describe('captures and duels', () => {
    it('should trigger a duel when capturing', () => {
      // Setup a board where white can capture black's pawn
      const gameState = new GameState();
      const moveExecutor = new MoveExecutor(gameState);
      
      // First move e2 to e4
      moveExecutor.executeMove(
        { x: 4, y: 1 }, // e2
        { x: 4, y: 3 }, // e4
        PlayerColor.WHITE
      );
      
      // Then move d7 to d5
      moveExecutor.executeMove(
        { x: 3, y: 6 }, // d7
        { x: 3, y: 4 }, // d5
        PlayerColor.BLACK
      );
      
      // Now attempt to capture with e4 takes d5
      const result = moveExecutor.executeMove(
        { x: 4, y: 3 }, // e4
        { x: 3, y: 4 }, // d5
        PlayerColor.WHITE
      );
      
      expect(result.success).toBe(true);
      expect(result.moveType).toBe(MoveType.CAPTURE);
      expect(result.triggersDuel).toBe(true);
      expect(result.capturedPiece).toBeDefined();
      expect(result.capturedPiece?.type).toBe(PieceType.PAWN);
      expect(result.capturedPiece?.color).toBe(PlayerColor.BLACK);
      
      // Check that the game is now in duel allocation phase
      expect(gameState.getState().gamePhase).toBe(GamePhase.DUEL_ALLOCATION);
    });
  });
  
  // Special moves
  describe('special moves', () => {
    it('should handle castling correctly', () => {
      // Create a scenario where castling is possible
      const gameState = ScenarioFactory.createEmptyBoardWithKings();
      
      // Add white rook at h1 and make sure king hasn't moved
      const whiteKing = gameState.findPieceAt({ x: 4, y: 0 });
      const pieces = gameState.getState().pieces;
      
      pieces.push({
        id: 'white-rook',
        type: PieceType.ROOK,
        color: PlayerColor.WHITE,
        position: { x: 7, y: 0 },
        hasMoved: false
      });
      
      gameState.setBoardState(pieces);
      
      const moveExecutor = new MoveExecutor(gameState);
      
      // Execute castling move (king from e1 to g1)
      const result = moveExecutor.executeMove(
        { x: 4, y: 0 }, // e1
        { x: 6, y: 0 }, // g1
        PlayerColor.WHITE
      );
      
      expect(result.success).toBe(true);
      expect(result.moveType).toBe(MoveType.CASTLE);
      
      // Check king and rook positions after castling
      const stateAfter = gameState.getState();
      const kingAfter = stateAfter.pieces.find(p => 
        p.type === PieceType.KING && p.color === PlayerColor.WHITE
      );
      const rookAfter = stateAfter.pieces.find(p =>
        p.type === PieceType.ROOK && p.color === PlayerColor.WHITE
      );
      
      expect(kingAfter?.position).toEqual({ x: 6, y: 0 }); // King at g1
      expect(rookAfter?.position).toEqual({ x: 5, y: 0 }); // Rook at f1
    });
    
    it('should handle en passant correctly', () => {
      // Create a scenario where en passant is possible
      const gameState = ScenarioFactory.createEmptyBoardWithKings();
      const pieces = gameState.getState().pieces;
      
      // Add white pawn at e5
      pieces.push({
        id: 'white-pawn',
        type: PieceType.PAWN,
        color: PlayerColor.WHITE,
        position: { x: 4, y: 4 }, // e5
        hasMoved: true
      });
      
      // Add black pawn at f7
      pieces.push({
        id: 'black-pawn',
        type: PieceType.PAWN,
        color: PlayerColor.BLACK,
        position: { x: 5, y: 6 }, // f7
        hasMoved: false
      });
      
      gameState.setBoardState(pieces);
      
      const moveExecutor = new MoveExecutor(gameState);
      
      // Move black pawn from f7 to f5 (double move)
      moveExecutor.executeMove(
        { x: 5, y: 6 }, // f7
        { x: 5, y: 4 }, // f5
        PlayerColor.BLACK
      );
      
      // Now white should be able to capture en passant
      const result = moveExecutor.executeMove(
        { x: 4, y: 4 }, // e5
        { x: 5, y: 5 }, // f6
        PlayerColor.WHITE
      );
      
      // This would trigger a duel with the black pawn at f5
      expect(result.success).toBe(true);
      expect(result.moveType).toBe(MoveType.CAPTURE);
      expect(result.triggersDuel).toBe(true);
      expect(result.capturedPiece?.type).toBe(PieceType.PAWN);
      expect(result.capturedPiece?.color).toBe(PlayerColor.BLACK);
    });
    
    it('should handle pawn promotion correctly', () => {
      // Create a scenario where promotion is possible
      const gameState = ScenarioFactory.createEmptyBoardWithKings();
      const pieces = gameState.getState().pieces;
      
      // Add white pawn at e7
      pieces.push({
        id: 'white-pawn',
        type: PieceType.PAWN,
        color: PlayerColor.WHITE,
        position: { x: 4, y: 6 }, // e7
        hasMoved: true
      });
      
      gameState.setBoardState(pieces);
      
      const moveExecutor = new MoveExecutor(gameState);
      
      // Move pawn to e8 and promote to queen
      const result = moveExecutor.executeMove(
        { x: 4, y: 6 }, // e7
        { x: 4, y: 7 }, // e8
        PlayerColor.WHITE,
        PieceType.QUEEN
      );
      
      expect(result.success).toBe(true);
      
      // Check that the pawn was promoted
      const stateAfter = gameState.getState();
      const promotedPiece = stateAfter.pieces.find(p => 
        p.position.x === 4 && p.position.y === 7
      );
      
      expect(promotedPiece?.type).toBe(PieceType.QUEEN);
      expect(promotedPiece?.color).toBe(PlayerColor.WHITE);
    });
  });
  
  // Check and checkmate detection
  describe('check and checkmate', () => {
    it('should prevent moves that would result in self-check', () => {
      // Create a scenario where moving would result in check
      const gameState = ScenarioFactory.createEmptyBoardWithKings();
      const pieces = gameState.getState().pieces;
      
      // Add black rook at e8
      pieces.push({
        id: 'black-rook',
        type: PieceType.ROOK,
        color: PlayerColor.BLACK,
        position: { x: 4, y: 7 }, // e8
        hasMoved: true
      });
      
      // Add white pawn at e2 blocking the check
      pieces.push({
        id: 'white-pawn',
        type: PieceType.PAWN,
        color: PlayerColor.WHITE,
        position: { x: 4, y: 1 }, // e2
        hasMoved: false
      });
      
      gameState.setBoardState(pieces);
      
      const moveExecutor = new MoveExecutor(gameState);
      
      // Try to move the pawn, which would expose the king to check
      const result = moveExecutor.executeMove(
        { x: 4, y: 1 }, // e2
        { x: 4, y: 2 }, // e3
        PlayerColor.WHITE
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('check');
    });
  });
}); 