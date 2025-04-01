import { IConfigProvider } from '../config';
import { GamePhase, GameResult } from '../types';
import { ChessPieceDTO, GameStateDTO } from '../dtos';
import { IBoard, IMinimalChessEngine, IMinimalEngineState, IMoveValidationResult, IBPAllocationValidationResult, IRetreatOption } from './contracts';
import { ChessPosition, ChessPieceColor, ChessPieceType } from './types';
import { calculateTacticalRetreats } from '../tactical';
import { BoardSnapshot } from './board';

/**
 * Minimal chess engine implementation
 * Provides client-side validation and state management while keeping server as authority
 */
export class MinimalChessEngine implements IMinimalChessEngine {
    private state: IMinimalEngineState;
    private config: IConfigProvider;
    private board: IBoard;

    constructor(config: IConfigProvider, board?: IBoard) {
        this.config = config;
        this.board = board || this.createBoard();
        this.state = this.getInitialState();
    }

    private createBoard(): IBoard {
        return new BoardSnapshot(true); // Creates a board with initial piece setup
    }

    private getInitialState(): IMinimalEngineState {
        const pieces = this.board.getAllPieces();
        const timeControl = this.config.timeControl;
        
        return {
            phase: GamePhase.NORMAL,
            turn: 'w',
            pieces: pieces.map(p => ({
                type: p.type.value,
                color: p.color.value,
                position: p.position?.value || '',
                hasMoved: p.hasMoved,
                lastMoveTurn: p.lastMoveTurn
            })),
            moveNumber: 1,
            inCheck: false,
            whiteTimeRemaining: timeControl.initial,
            blackTimeRemaining: timeControl.initial,
            activeTimer: null,
            players: [],
            spectators: []
        };
    }

    // State Management
    public getState(): IMinimalEngineState {
        return {
            ...this.state,
            pieces: [...this.state.pieces],
            players: [...this.state.players],
            spectators: [...this.state.spectators]
        };
    }

    public setState(state: GameStateDTO): void {
        // Update internal state
        this.state = {
            ...state,
            phase: state.phase as GamePhase,
            result: state.result as GameResult,
            turn: state.turn as 'w' | 'b',
            activeTimer: state.activeTimer as 'w' | 'b' | null,
            players: state.players.map(p => ({
                ...p,
                color: p.color as 'w' | 'b'
            }))
        };
        
        // Create a new board with the updated pieces
        const newBoard = new BoardSnapshot(false);
        for (const piece of state.pieces) {
            if (piece.position) {
                (newBoard as BoardSnapshot).addPiece(
                    piece.type,
                    piece.color,
                    piece.position,
                    piece.lastMoveTurn
                );
            }
        }
        this.board = newBoard;
    }

    // Board Access
    public getBoard(): IBoard {
        return this.board;
    }

    // Core Game Logic
    public validateMove(from: string, to: string): IMoveValidationResult {
        try {
            const fromPos = new ChessPosition(from);
            const toPos = new ChessPosition(to);
            
            // Get the piece at the starting position
            const piece = this.board.getPieceAt(fromPos);
            if (!piece) {
                return {
                    valid: false,
                    reason: 'No piece at starting position'
                };
            }

            // Verify it's the correct player's turn
            if (piece.color.value !== this.state.turn) {
                return {
                    valid: false,
                    reason: 'Not your turn'
                };
            }

            // Validate the move using the board
            if (!this.board.isValidMove(fromPos, toPos)) {
                return {
                    valid: false,
                    reason: 'Invalid move according to chess rules'
                };
            }

            // Clone board and try move to check for check/checkmate
            const testBoard = this.board.clone();
            const moveResult = testBoard.makeMove(fromPos, toPos);

            if (!moveResult.success) {
                return {
                    valid: false,
                    reason: 'Move would leave king in check'
                };
            }

            return {
                valid: true,
                inCheck: moveResult.check,
                isCheckmate: moveResult.checkmate,
                capturedPiece: moveResult.captured ? {
                    type: moveResult.captured.type.value,
                    color: moveResult.captured.color.value,
                    position: moveResult.captured.position?.value || '',
                    hasMoved: moveResult.captured.hasMoved,
                    lastMoveTurn: moveResult.captured.lastMoveTurn
                } : undefined
            };
        } catch (e) {
            return {
                valid: false,
                reason: 'Invalid position format'
            };
        }
    }

    public validateBPAllocation(amount: number, piecePos: string): IBPAllocationValidationResult {
        const maxBP = this.config.gambitChess?.maxBPAllocation || 0;
        const currentBP = this.state.bp || 0;

        try {
            const pos = new ChessPosition(piecePos);
            const piece = this.board.getPieceAt(pos);

            if (!piece) {
                return {
                    valid: false,
                    reason: 'No piece at specified position',
                    maxAllowed: 0
                };
            }

            if (piece.color.value !== this.state.turn) {
                return {
                    valid: false,
                    reason: 'Cannot allocate BP to opponent\'s pieces',
                    maxAllowed: 0
                };
            }

            if (amount < 0) {
                return {
                    valid: false,
                    reason: 'Cannot allocate negative BP',
                    maxAllowed: maxBP
                };
            }

            if (amount > maxBP) {
                return {
                    valid: false,
                    reason: `Cannot allocate more than ${maxBP} BP`,
                    maxAllowed: maxBP
                };
            }

            if (amount > currentBP) {
                return {
                    valid: false,
                    reason: 'Not enough BP available',
                    maxAllowed: currentBP
                };
            }

            return { valid: true, maxAllowed: maxBP };
        } catch (e) {
            return {
                valid: false,
                reason: 'Invalid position format',
                maxAllowed: 0
            };
        }
    }

    public validateTacticalRetreat(piecePos: string, failedTarget: string): IRetreatOption[] {
        try {
            const pos = new ChessPosition(piecePos);
            const target = new ChessPosition(failedTarget);
            const piece = this.board.getPieceAt(pos);

            if (!piece || piece.color.value !== this.state.turn) {
                return [];
            }

            // Create a map of the current board state
            const boardState = new Map();
            this.board.getAllPieces().forEach(p => {
                if (p.position) {
                    boardState.set(p.position.value, p);
                }
            });

            // Calculate retreat options
            const retreatOptions = calculateTacticalRetreats(pos, target, boardState);
            
            return retreatOptions.map(option => ({
                to: option.to.value,
                cost: option.cost
            }));
        } catch (e) {
            return [];
        }
    }

    // Utility Functions
    public getPossibleMoves(position: string): string[] {
        try {
            const pos = new ChessPosition(position);
            const piece = this.board.getPieceAt(pos);

            if (!piece || piece.color.value !== this.state.turn) {
                return [];
            }

            // Get all valid moves for the piece
            const allPositions = this.getAllBoardPositions();
            return allPositions
                .filter(toPos => this.board.isValidMove(pos, toPos))
                .map(pos => pos.value);
        } catch (e) {
            return [];
        }
    }

    private getAllBoardPositions(): ChessPosition[] {
        const positions: ChessPosition[] = [];
        for (let file of 'abcdefgh') {
            for (let rank = 1; rank <= 8; rank++) {
                positions.push(new ChessPosition(`${file}${rank}`));
            }
        }
        return positions;
    }

    public isInCheck(color: 'w' | 'b' = this.state.turn): boolean {
        return this.board.isInCheck(color);
    }

    public isGameOver(): boolean {
        return this.state.phase === GamePhase.GAME_OVER;
    }

    // Time Management
    public getRemainingTime(color: 'w' | 'b'): number {
        return color === 'w' ? this.state.whiteTimeRemaining : this.state.blackTimeRemaining;
    }

    public getActiveTimer(): 'w' | 'b' | null {
        return this.state.activeTimer;
    }
} 