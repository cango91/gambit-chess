import { randomUUID } from 'crypto';
import {
  PieceDTO,
  PieceType,
  PlayerColor,
  Position,
  MoveType,
  Board,
  Piece,
  MoveValidator,
  isLongRangePiece
} from 'gambit-chess-shared';
import { GameState } from './GameState';

/**
 * Base BP regeneration amount per turn
 */
const BASE_BP_REGEN = 1;

/**
 * BP regeneration amounts for different chess tactics
 */
const BP_REGEN_AMOUNTS = {
  BASE: 1,
  FORK: 1,
  PIN: 1,
  SKEWER: 1,
  DISCOVERED_ATTACK: 1,
  DOUBLE_CHECK: 1
};

/**
 * BPRegenerationService
 * Responsible for calculating BP regeneration based on chess tactics
 */
export class BPRegenerationService {
  constructor(private gameState: GameState) {}

  /**
   * Calculate BP regeneration for a move
   * @param from Starting position
   * @param to Destination position
   * @param moveType Type of move
   * @param piece The piece that moved
   * @returns Amount of BP to regenerate
   */
  calculateRegeneration(
    from: Position,
    to: Position,
    moveType: MoveType,
    piece: PieceDTO
  ): number {
    // Always grant base regeneration
    let regeneration = BASE_BP_REGEN;
    
    // Add tactical bonuses (in a real implementation, these would be properly detected)
    // For now, just implement placeholder detection
    
    // Check for fork (piece attacks two or more enemy pieces)
    if (this.detectFork(piece, to)) {
      regeneration += BP_REGEN_AMOUNTS.FORK;
    }
    
    // Check for pin (piece pins enemy piece to more valuable piece)
    if (this.detectPin(piece, to)) {
      regeneration += BP_REGEN_AMOUNTS.PIN;
    }
    
    // Check for skewer (attacking two pieces in a line)
    if (this.detectSkewer(piece, to)) {
      regeneration += BP_REGEN_AMOUNTS.SKEWER;
    }
    
    // Check for discovered attack (moving reveals an attack by another piece)
    if (this.detectDiscoveredAttack(piece, from, to)) {
      regeneration += BP_REGEN_AMOUNTS.DISCOVERED_ATTACK;
    }
    
    // Check for double check
    if (this.detectDoubleCheck(piece, to)) {
      regeneration += BP_REGEN_AMOUNTS.DOUBLE_CHECK;
    }
    
    return regeneration;
  }

  /**
   * Detect if a move creates a fork
   * (piece attacks two or more enemy pieces simultaneously)
   * @param piece The piece that moved
   * @param to Destination position
   * @returns True if the move creates a fork
   */
  private detectFork(piece: PieceDTO, to: Position): boolean {
    const board = this.gameState.getBoard();
    const attackedPieces = this.getAttackedPieces(board, piece, to);
    
    // A fork requires attacking at least two pieces
    return attackedPieces.length >= 2;
  }
  
  /**
   * Detect if a move creates a pin
   * (enemy piece can't move without exposing a more valuable piece)
   * @param piece The piece that moved
   * @param to Destination position
   * @returns True if the move creates a pin
   */
  private detectPin(piece: PieceDTO, to: Position): boolean {
    const board = this.gameState.getBoard();
    const opponentColor = piece.color === PlayerColor.WHITE 
      ? PlayerColor.BLACK 
      : PlayerColor.WHITE;
    
    // Check if the piece is a long-range piece (bishop, rook, queen)
    if (!isLongRangePiece(piece.type)) {
      return false;
    }
    
    // For each opponent piece
    const opponentPieces = board.getPieces().filter(p => p.color === opponentColor);
    for (const opponentPiece of opponentPieces) {
      // Don't consider king (can't be behind a pinned piece)
      if (opponentPiece.type === PieceType.KING) {
        continue;
      }
      
      // Check if there's a more valuable piece behind it
      const direction = this.getDirection(to, opponentPiece.position);
      if (!direction) {
        continue; // Not in line with the piece
      }
      
      // Look for a more valuable piece behind the potential pinned piece
      const behindPiece = this.findPieceBehind(
        board, 
        opponentPiece.position, 
        direction, 
        opponentColor
      );
      
      if (behindPiece && this.isMoreValuable(behindPiece.type, opponentPiece.type)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Detect if a move creates a skewer
   * (forces an enemy piece to move, exposing a less valuable piece behind it)
   * @param piece The piece that moved
   * @param to Destination position
   * @returns True if the move creates a skewer
   */
  private detectSkewer(piece: PieceDTO, to: Position): boolean {
    const board = this.gameState.getBoard();
    const opponentColor = piece.color === PlayerColor.WHITE 
      ? PlayerColor.BLACK 
      : PlayerColor.WHITE;
    
    // Check if the piece is a long-range piece (bishop, rook, queen)
    if (!isLongRangePiece(piece.type)) {
      return false;
    }
    
    // For each opponent piece
    const opponentPieces = board.getPieces().filter(p => p.color === opponentColor);
    for (const opponentPiece of opponentPieces) {
      // Check if there's a less valuable piece behind it
      const direction = this.getDirection(to, opponentPiece.position);
      if (!direction) {
        continue; // Not in line with the piece
      }
      
      // Look for a less valuable piece behind the potential skewered piece
      const behindPiece = this.findPieceBehind(
        board, 
        opponentPiece.position, 
        direction, 
        opponentColor
      );
      
      if (behindPiece && this.isMoreValuable(opponentPiece.type, behindPiece.type)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Detect if a move creates a discovered attack
   * (moving a piece reveals an attack by another piece)
   * @param piece The piece that moved
   * @param from Starting position
   * @param to Destination position
   * @returns True if the move creates a discovered attack
   */
  private detectDiscoveredAttack(piece: PieceDTO, from: Position, to: Position): boolean {
    const board = this.gameState.getBoard();
    const opponentColor = piece.color === PlayerColor.WHITE 
      ? PlayerColor.BLACK 
      : PlayerColor.WHITE;
    
    // Check all friendly long-range pieces
    const friendlyPieces = board.getPieces().filter(p => 
      p.color === piece.color && 
      // Don't compare the piece with itself (use position comparison since Piece might not have id)
      !(p.position.x === piece.position.x && p.position.y === piece.position.y) && 
      isLongRangePiece(p.type)
    );
    
    for (const friendlyPiece of friendlyPieces) {
      // Was the moved piece blocking this piece's attack?
      const direction = this.getDirection(friendlyPiece.position, from);
      if (!direction) {
        continue; // Not in line with the moved piece
      }
      
      // Check if there's now an opponent piece in the attack line
      const nowAttacked = this.findPieceInDirection(
        board,
        friendlyPiece.position,
        direction,
        opponentColor
      );
      
      if (nowAttacked) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Detect if a move creates a double check
   * (king is attacked by two pieces simultaneously)
   * @param piece The piece that moved
   * @param to Destination position
   * @returns True if the move creates a double check
   */
  private detectDoubleCheck(piece: PieceDTO, to: Position): boolean {
    const board = this.gameState.getBoard();
    const opponentColor = piece.color === PlayerColor.WHITE 
      ? PlayerColor.BLACK 
      : PlayerColor.WHITE;
    
    // Find the opponent's king
    const opponentKing = board.getPieces().find(p => 
      p.color === opponentColor && p.type === PieceType.KING
    );
    
    if (!opponentKing) {
      return false;
    }
    
    // Count pieces attacking the king
    const attackingPieces = board.getPieces().filter(p => {
      if (p.color !== piece.color) {
        return false;
      }
      
      try {
        // Check if this piece can capture the king (which would be a check)
        MoveValidator.validateMove(board, p.position, opponentKing.position);
        return true;
      } catch (e) {
        return false;
      }
    });
    
    // Double check requires at least 2 attacking pieces
    return attackingPieces.length >= 2;
  }
  
  /**
   * Get all opponent pieces attacked by a piece
   * @param board The board
   * @param piece The attacking piece
   * @param position Position of the attacking piece
   * @returns Array of attacked pieces
   */
  private getAttackedPieces(board: Board, piece: PieceDTO, position: Position): PieceDTO[] {
    const opponentColor = piece.color === PlayerColor.WHITE 
      ? PlayerColor.BLACK 
      : PlayerColor.WHITE;
    
    // Get all opponent pieces
    const opponentPieces = board.getPieces().filter(p => p.color === opponentColor);
    
    // Check which ones can be attacked
    return opponentPieces.filter(target => {
      try {
        // Check if the piece can move to the target's position (capture)
        MoveValidator.validateMove(board, position, target.position);
        return true;
      } catch (e) {
        return false;
      }
    }).map(p => ({
      // Convert Piece to PieceDTO format
      id: (p as any).id || randomUUID(), // Use type assertion and UUID fallback
      type: p.type,
      color: p.color,
      position: { ...p.position },
      hasMoved: p.hasMoved
    }));
  }
  
  /**
   * Get the direction from one position to another
   * @param from Starting position
   * @param to Destination position
   * @returns Direction as [dx, dy] or null if not in a straight line
   */
  private getDirection(from: Position, to: Position): [number, number] | null {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    
    // If not in a straight line (horizontal, vertical, or diagonal), return null
    if (dx !== 0 && dy !== 0 && Math.abs(dx) !== Math.abs(dy)) {
      return null;
    }
    
    const dirX = dx === 0 ? 0 : dx > 0 ? 1 : -1;
    const dirY = dy === 0 ? 0 : dy > 0 ? 1 : -1;
    
    return [dirX, dirY];
  }
  
  /**
   * Find a piece behind another piece in a specific direction
   * @param board The board
   * @param position Starting position
   * @param direction Direction to look in
   * @param color Optional color to filter by
   * @returns The found piece or null
   */
  private findPieceBehind(
    board: Board, 
    position: Position, 
    direction: [number, number],
    color?: PlayerColor
  ): Piece | null {
    const [dirX, dirY] = direction;
    let x = position.x + dirX;
    let y = position.y + dirY;
    
    // Skip the immediate position (we're looking behind it)
    x += dirX;
    y += dirY;
    
    // Look until we find a piece or reach the edge of the board
    while (x >= 0 && x < 8 && y >= 0 && y < 8) {
      const piece = board.getPieceAt({ x, y });
      
      if (piece && (color === undefined || piece.color === color)) {
        return piece;
      }
      
      if (piece) {
        // Found a piece of the wrong color, stop looking
        break;
      }
      
      x += dirX;
      y += dirY;
    }
    
    return null;
  }
  
  /**
   * Find the first piece in a specific direction
   * @param board The board
   * @param position Starting position
   * @param direction Direction to look in
   * @param color Optional color to filter by
   * @returns The found piece or null
   */
  private findPieceInDirection(
    board: Board, 
    position: Position, 
    direction: [number, number],
    color?: PlayerColor
  ): Piece | null {
    const [dirX, dirY] = direction;
    let x = position.x + dirX;
    let y = position.y + dirY;
    
    // Look until we find a piece or reach the edge of the board
    while (x >= 0 && x < 8 && y >= 0 && y < 8) {
      const piece = board.getPieceAt({ x, y });
      
      if (piece && (color === undefined || piece.color === color)) {
        return piece;
      }
      
      if (piece) {
        // Found a piece of the wrong color, stop looking
        break;
      }
      
      x += dirX;
      y += dirY;
    }
    
    return null;
  }
  
  /**
   * Check if one piece type is more valuable than another
   * @param piece1 First piece type
   * @param piece2 Second piece type
   * @returns True if piece1 is more valuable than piece2
   */
  private isMoreValuable(piece1: PieceType, piece2: PieceType): boolean {
    const values = {
      [PieceType.PAWN]: 1,
      [PieceType.KNIGHT]: 3,
      [PieceType.BISHOP]: 3,
      [PieceType.ROOK]: 5,
      [PieceType.QUEEN]: 9,
      [PieceType.KING]: 100 // King is most valuable
    };
    
    return values[piece1] > values[piece2];
  }
} 