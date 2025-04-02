import {
    MinimalChessEngine,
    POSITION,
    IConfigProvider,
    GameStateDTO,
    IBPAllocationValidationResult,
    ChessPieceDTO,
    TacticalAdvantageType,
    ChessPieceTypeSymbol,
    IBoard,
    GamePhase,
    IDuelState,
    IGameState,
    IDuelOutcome,
    MoveOutcome,
    IChessPiece,
    Player,
    PIECE_COLOR
} from '@gambit-chess/shared';

export interface IBPPools {
    w: number;
    b: number;
}

export interface IServerDuelState extends IDuelState, IDuelOutcome {
    get attackerAllocation(): number;
    get defenderAllocation(): number;
    get outcome(): MoveOutcome;
    get attackingPiece(): IChessPiece;
    get defendingPiece(): IChessPiece;
    get initiatedAt(): number;
    init(attacker: IChessPiece, defender: IChessPiece): void;
    allocate(side: 'w' | 'b', amount: number): boolean;
    getPlayerAllocated(side: 'w' | 'b'): boolean;
    onResolve(callback: (outcome: IDuelOutcome) => void): void;
}

/**
 * Game state with server-side-only properties
 */
export interface ServerGameState extends IGameState {
    playerBPPools: IBPPools;
    previousBoardState: IBoard | null;
    duel: IServerDuelState | undefined;
}

/**
 * GambitChessEngine extends MinimalChessEngine with server-specific functionality
 */
export class GambitChessEngine extends MinimalChessEngine {
    // Server-side state
    private gameState: ServerGameState;
    private configProvider: IConfigProvider;

    /**
     * Create a new GambitChessEngine
     */
    constructor(config: IConfigProvider, gameState: ServerGameState | undefined) {
        super(config);
        this.configProvider = config;
        if (gameState) {
            this.gameState = gameState;
        } else {
            const initialBP = this.configProvider.gambitChess.initialBP;
            this.gameState = {
                playerBPPools: { w: initialBP, b: initialBP },
                previousBoardState: null,
                duel: undefined,
                phase: GamePhase.SETUP,
                turn: 'w',
                pieces: [],
                moveNumber: 0,
                inCheck: false,
                bp: 0,
                whiteTimeRemaining: 0,
                blackTimeRemaining: 0,
                activeTimer: null,
                players: [],
                spectators: []
            };
        }
    }

    /**
     * Add a player to the game
     */
    public addPlayer(player: Player): boolean {
        if (this.gameState.players.length >= 2 || this.gameState.players.find(p => p?.id === player.id)) {
            return false;
        }

        this.gameState.players.push(player);
        if(this.gameState.players.length === 2)
        {
            this.initPlayers();
            this.setGamePhase(GamePhase.NORMAL);
        }
        return true;
    }

    private setGamePhase(phase: GamePhase): boolean {
        switch(phase)
        {
            case GamePhase.SETUP:
                return false;
            case GamePhase.NORMAL:
                if(this.gameState.phase === GamePhase.SETUP)
                {
                    this.setupBoard();
                    this.initializeTimers();

                }
            default:
                return false;
        }
    }

    private setupBoard(): boolean {
        if(this.gameState.currentBoardState)
        {
            return false;
        }

        this.gameState.currentBoardState = this.getBoard().clone();
        return true;
    }

    private initPlayers(): boolean {
        if (this.gameState.players.length !== 2)
        {
            return false;
        }

        const randomColor = Math.random() < 0.5 ? 'w' : 'b';

        this.gameState.players[0].color = PIECE_COLOR(randomColor);
        this.gameState.players[1].color = PIECE_COLOR(randomColor === 'w' ? 'b' : 'w');
        return true;
    }


    /**
     * Convert internal color code to player ID
     */
    private colorToPlayerId(color: 'w' | 'b'): string | undefined {
        if(this.gameState.players.length)
        {
            return this.gameState.players.find(p => p?.color === PIECE_COLOR(color))?.id;
        }
        return undefined;
    }

    /**
     * Convert player ID to internal color code
     */
    private playerIdToColor(playerId: string): 'w' | 'b' | undefined {
        if(this.gameState.players.length)
        {
            return this.gameState.players.find(p => p?.id === playerId)?.color?.value as 'w' | 'b' ?? undefined;
        }
        return undefined;
    }

    /**
     * Get the current BP pool for a player
     */
    public getPlayerBP(playerId: string): number {
        const color = this.playerIdToColor(playerId);
        if(color)
        {
            return this.gameState.playerBPPools[color] || 0;
        }
        return 0;
    }

    /**
     * Add BP to a player's pool
     */
    public addPlayerBP(playerId: string, amount: number): void {
        const color = this.playerIdToColor(playerId);
        if(color)
        {
            const currentBP = this.gameState.playerBPPools[color] || 0;
            this.gameState.playerBPPools[color] = currentBP + amount;
        }
    }

    /**
     * Subtract BP from a player's pool
     */
    public subtractPlayerBP(playerId: string, amount: number): boolean {
        const color = this.playerIdToColor(playerId);
        if(color)
        {
            const currentBP = this.gameState.playerBPPools[color] || 0;

        // Check if player has enough BP
        if (currentBP < amount) {
            return false;
        }

            // Subtract BP
            this.gameState.playerBPPools[color] = currentBP - amount;
            return true;
        }
        return false;
    }

    /**
     * Save current board state for tactical advantage detection
     */
    public saveCurrentBoardState(): void {
        this.gameState.previousBoardState = this.getBoard().clone();
    }

    /**
     * Initiate a BP duel between attacker and defender
     */
    public initiateDuel(attackerId: string, defenderId: string, attackingPiecePos: string, defendingPiecePos: string): void {
        // Save the current duel information
        this.duelInProgress = true;
        this.currentDuel = {
            attackerId,
            defenderId,
            attackingPiecePos,
            defendingPiecePos,
            initiatedAt: Date.now()
        };

        // Clear any previous allocations
        this.bpAllocations.delete(attackerId);
        this.bpAllocations.delete(defenderId);
    }

    /**
     * Validate BP allocation amount for a duel
     */
    public validateBPAllocation(amount: number, piecePos: string): IBPAllocationValidationResult {
        // Check if a duel is in progress
        if (!this.duelInProgress || !this.currentDuel) {
            return { valid: false, reason: 'No duel in progress' };
        }

        // Check if the piece position matches the duel
        const isAttacker = piecePos === this.currentDuel.attackingPiecePos;
        const isDefender = piecePos === this.currentDuel.defendingPiecePos;

        if (!isAttacker && !isDefender) {
            return { valid: false, reason: 'Piece is not part of the current duel' };
        }

        // Get the max allocation allowed
        const maxBPAllocation = this.configProvider.gambitChess.maxBPAllocation;

        // Check if the amount is within valid range
        if (amount < 0) {
            return { valid: false, reason: 'BP allocation cannot be negative', maxAllowed: maxBPAllocation };
        }

        if (amount > maxBPAllocation) {
            return { valid: false, reason: `BP allocation cannot exceed ${maxBPAllocation}`, maxAllowed: maxBPAllocation };
        }

        // Check BP capacity of the piece
        const board = this.getBoard();
        const piece = board.getPieceAt(piecePos);
        if (!piece) {
            return { valid: false, reason: 'Piece not found' };
        }

        const pieceTypeValue = piece.type.value as ChessPieceTypeSymbol;
        const capacities = this.configProvider.gambitChess.bpCapacities;
        const pieceCapacity = capacities[pieceTypeValue];
        const overloadMultiplier = this.configProvider.gambitChess.bpCapacityOverloadMultiplier;
        const maxCapacity = pieceCapacity * overloadMultiplier;

        if (amount > maxCapacity) {
            return {
                valid: false,
                reason: `BP allocation exceeds capacity for ${pieceTypeValue} (max: ${maxCapacity})`,
                maxAllowed: maxCapacity
            };
        }

        // Ensure player has enough BP
        const playerId = isAttacker ? this.currentDuel.attackerId : this.currentDuel.defenderId;
        const playerBP = this.getPlayerBP(playerId);

        if (amount > playerBP) {
            return { valid: false, reason: 'Insufficient BP', maxAllowed: playerBP };
        }

        // All checks passed
        return { valid: true };
    }

    /**
     * Record a BP allocation for a duel
     */
    public recordBPAllocation(playerId: string, piecePosition: string, amount: number): void {
        // Validate BP allocation
        const validation = this.validateBPAllocation(amount, piecePosition);

        if (!validation.valid) {
            throw new Error(`Invalid BP allocation: ${validation.reason}`);
        }

        // Ensure player has enough BP
        if (!this.subtractPlayerBP(playerId, amount)) {
            throw new Error('Insufficient BP for allocation');
        }

        // Record allocation
        this.bpAllocations.set(playerId, {
            playerId,
            piecePosition,
            amount,
            timestamp: Date.now()
        });
    }

    /**
     * Resolve a BP duel between attacker and defender
     */
    public resolveBPDuel(
        attackerPlayerId: string,
        defenderPlayerId: string
    ): { attackerWins: boolean, attackerAmount: number, defenderAmount: number } {
        // Check if a duel is in progress
        if (!this.duelInProgress || !this.currentDuel) {
            throw new Error('No duel in progress');
        }

        // Check if the player IDs match the current duel
        if (this.currentDuel.attackerId !== attackerPlayerId || this.currentDuel.defenderId !== defenderPlayerId) {
            throw new Error('Player IDs do not match current duel');
        }

        // Get allocations
        const attackerAllocation = this.bpAllocations.get(attackerPlayerId);
        const defenderAllocation = this.bpAllocations.get(defenderPlayerId);

        if (!attackerAllocation || !defenderAllocation) {
            throw new Error('Missing BP allocation for duel');
        }

        // Compare BP allocations
        const attackerAmount = attackerAllocation.amount;
        const defenderAmount = defenderAllocation.amount;

        // Apply tactical advantages to determine the winner
        let modifiedAttackerAmount = attackerAmount;
        let modifiedDefenderAmount = defenderAmount;

        // Check for tactical advantages that affect duels
        const attackerAdvantages = this.tacticalAdvantages.filter(
            adv => adv.playerId === attackerPlayerId
        );

        const defenderAdvantages = this.tacticalAdvantages.filter(
            adv => adv.playerId === defenderPlayerId
        );

        // Apply tactical advantages to duel outcome (simplified)
        // In a full implementation, different advantages would have different effects

        // Determine winner (attacker wins ties)
        const attackerWins = modifiedAttackerAmount >= modifiedDefenderAmount;

        // Clear allocations and end duel
        this.bpAllocations.delete(attackerPlayerId);
        this.bpAllocations.delete(defenderPlayerId);
        this.duelInProgress = false;
        this.currentDuel = undefined;

        return {
            attackerWins,
            attackerAmount: modifiedAttackerAmount,
            defenderAmount: modifiedDefenderAmount
        };
    }

    /**
     * Validate tactical retreat options
     */
    public validateTacticalRetreat(piecePos: string, failedTarget: string): { to: string, cost: number }[] {
        const board = this.getBoard();
        const piece = board.getPieceAt(piecePos);

        if (!piece) {
            throw new Error('Piece not found');
        }

        // Always allow returning to original position at no cost
        const retreatOptions = [
            { to: piecePos, cost: 0 }
        ];

        // Get possible retreat squares and their costs
        // This would use the calculateTacticalRetreats function from shared module in a real implementation

        // For now, provide some basic retreat options based on piece type
        const pieceType = piece.type.value;

        if (pieceType === 'n') {
            // Knight has fixed retreat pattern
            const knightRetreats = this.getKnightRetreats(piecePos, failedTarget);
            retreatOptions.push(...knightRetreats);
        } else if (['b', 'r', 'q'].includes(pieceType)) {
            // Sliding pieces retreat along their attack axis
            const slidingRetreats = this.getSlidingPieceRetreats(piecePos, failedTarget, pieceType);
            retreatOptions.push(...slidingRetreats);
        }

        // Filter out invalid positions (occupied or off-board)
        return retreatOptions.filter(option => {
            // Skip self-position check (already valid)
            if (option.to === piecePos) return true;

            // Ensure position is on board
            try {
                const pos = POSITION(option.to);

                // Ensure position is not occupied
                return !board.getPieceAt(pos);
            } catch (e) {
                return false;
            }
        });
    }

    /**
     * Get knight retreat options
     */
    private getKnightRetreats(knightPos: string, targetPos: string): { to: string, cost: number }[] {
        // This is a simplified implementation
        // A real implementation would use pre-calculated data from shared module
        const retreats: { to: string, cost: number }[] = [];
        const pos = POSITION(knightPos);
        const [startX, startY] = pos.toCoordinates();

        // Knight move pattern
        const knightMoves = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];

        // Add all valid knight moves as retreat options
        for (const [dx, dy] of knightMoves) {
            const newX = startX + dx;
            const newY = startY + dy;

            // Check if position is on board
            if (newX >= 0 && newX < 8 && newY >= 0 && newY < 8) {
                try {
                    const newPos = POSITION(String.fromCharCode(97 + newX) + (newY + 1));

                    // Cost is always 1 for knights
                    retreats.push({ to: newPos.value, cost: 1 });
                } catch (e) {
                    // Invalid position, skip
                }
            }
        }

        return retreats;
    }

    /**
     * Get sliding piece retreat options
     */
    private getSlidingPieceRetreats(piecePos: string, targetPos: string, pieceType: string): { to: string, cost: number }[] {
        // This is a simplified implementation
        // A real implementation would calculate all valid positions along the attack axis

        const retreats: { to: string, cost: number }[] = [];
        const pos = POSITION(piecePos);
        const target = POSITION(targetPos);

        const [startX, startY] = pos.toCoordinates();
        const [targetX, targetY] = target.toCoordinates();

        // Calculate direction vector
        const dx = Math.sign(targetX - startX);
        const dy = Math.sign(targetY - startY);

        // Check if this is a valid direction for the piece
        const isDiagonal = Math.abs(dx) === Math.abs(dy);
        const isOrthogonal = dx === 0 || dy === 0;

        if ((pieceType === 'b' && !isDiagonal) ||
            (pieceType === 'r' && !isOrthogonal) ||
            (pieceType === 'q' && !isDiagonal && !isOrthogonal)) {
            return retreats;
        }

        // Calculate retreat positions in both directions
        // Forward direction (beyond target)
        let cost = 1;
        let x = targetX + dx;
        let y = targetY + dy;

        // Add positions beyond target
        while (x >= 0 && x < 8 && y >= 0 && y < 8 && cost <= 3) {
            const newPos = POSITION(String.fromCharCode(97 + x) + (y + 1));
            retreats.push({ to: newPos.value, cost });

            x += dx;
            y += dy;
            cost++;
        }

        // Opposite direction (away from target)
        cost = 1;
        x = startX - dx;
        y = startY - dy;

        // Add positions in opposite direction
        while (x >= 0 && x < 8 && y >= 0 && y < 8 && cost <= 3) {
            const newPos = POSITION(String.fromCharCode(97 + x) + (y + 1));
            retreats.push({ to: newPos.value, cost });

            x -= dx;
            y -= dy;
            cost++;
        }

        return retreats;
    }

    /**
     * Detect tactical advantages for BP regeneration
     */
    public detectTacticalAdvantages(playerId: string): TacticalAdvantage[] {
        // Clear previous advantages for this player
        this.tacticalAdvantages = this.tacticalAdvantages.filter(
            advantage => advantage.playerId !== playerId
        );

        if (!this.previousBoardState) {
            // No previous state to compare with
            return [];
        }

        const advantages: TacticalAdvantage[] = [];
        const board = this.getBoard();
        const color = this.playerIdToColor(playerId);

        // Detect checks
        if (this.isInCheck(this.playerIdToColor(playerId === 'white' ? 'black' : 'white'))) {
            const pieces = board.getPiecesByColor(color);

            // Find checking pieces
            const checkingPieces = pieces.filter(piece => {
                const from = piece.position?.value;
                if (!from) return false;

                const opponentColor = color === 'w' ? 'b' : 'w';
                const kingPos = board.getKingPosition(opponentColor);
                if (!kingPos) return false;

                return board.isValidMove(from, kingPos.value);
            });

            if (checkingPieces.length === 1) {
                // Single check
                const checkAdvantage: CheckAdvantage = {
                    type: TacticalAdvantageType.CHECK,
                    playerId,
                    bpRegeneration: 2,
                    checkingPiecePosition: checkingPieces[0].position!.value
                };
                advantages.push(checkAdvantage);
            } else if (checkingPieces.length === 2) {
                // Double check
                const doubleCheckAdvantage: DoubleCheckAdvantage = {
                    type: TacticalAdvantageType.DOUBLE_CHECK,
                    playerId,
                    bpRegeneration: 3,
                    checkingPiece1Position: checkingPieces[0].position!.value,
                    checkingPiece2Position: checkingPieces[1].position!.value
                };
                advantages.push(doubleCheckAdvantage);
            }
        }

        // Detect pins (simplified)
        const pins = this.detectPins(playerId);
        advantages.push(...pins);

        // Detect forks (simplified)
        const forks = this.detectForks(playerId);
        advantages.push(...forks);

        // Store new advantages
        this.tacticalAdvantages = [
            ...this.tacticalAdvantages,
            ...advantages
        ];

        return advantages;
    }

    /**
     * Detect pins (piece between attacker and more valuable piece)
     */
    private detectPins(playerId: string): PinAdvantage[] {
        const pins: PinAdvantage[] = [];
        const board = this.getBoard();
        const color = this.playerIdToColor(playerId);
        const opponentColor = color === 'w' ? 'b' : 'w';

        // Get all player's sliding pieces (bishop, rook, queen)
        const pieces = board.getPiecesByColor(color).filter(piece => {
            const type = piece.type.value;
            return type === 'b' || type === 'r' || type === 'q';
        });

        for (const piece of pieces) {
            if (!piece.position) continue;

            const piecePos = piece.position.value;
            const pieceType = piece.type.value;
            const [pieceX, pieceY] = piece.position.toCoordinates();

            // Define directions based on piece type
            const directions: number[][] = [];
            if (pieceType === 'r' || pieceType === 'q') {
                // Orthogonal directions
                directions.push([0, 1], [1, 0], [0, -1], [-1, 0]);
            }
            if (pieceType === 'b' || pieceType === 'q') {
                // Diagonal directions
                directions.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
            }

            // Check each direction for pins
            for (const [dx, dy] of directions) {
                let x = pieceX + dx;
                let y = pieceY + dy;
                let firstPiece: { piece: any, pos: string } | null = null;

                // Scan until we find two pieces or edge of board
                while (x >= 0 && x < 8 && y >= 0 && y < 8) {
                    const pos = POSITION(String.fromCharCode(97 + x) + (y + 1));
                    const pieceAtPos = board.getPieceAt(pos);

                    if (pieceAtPos) {
                        if (!firstPiece) {
                            // Found first piece, store it
                            if (pieceAtPos.color.value === opponentColor) {
                                firstPiece = { piece: pieceAtPos, pos: pos.value };
                            } else {
                                // Same color piece, no pin possible
                                break;
                            }
                        } else {
                            // Found second piece
                            if (pieceAtPos.color.value === opponentColor) {
                                // Check if this is a valuable piece (especially king)
                                const isKing = pieceAtPos.type.value === 'k';
                                const firstPieceValue = this.getPieceValue(firstPiece.piece.type.value);
                                const secondPieceValue = this.getPieceValue(pieceAtPos.type.value);

                                if (isKing || secondPieceValue > firstPieceValue) {
                                    // This is a pin!
                                    pins.push({
                                        type: TacticalAdvantageType.PIN,
                                        playerId,
                                        bpRegeneration: isKing ? 3 : 2,
                                        pinnedPiecePosition: firstPiece.pos,
                                        pinnedToPosition: pos.value,
                                        isPinnedToKing: isKing
                                    });
                                }
                            }
                            break;
                        }
                    }

                    x += dx;
                    y += dy;
                }
            }
        }

        return pins;
    }

    /**
     * Detect forks (piece attacking multiple opponent pieces)
     */
    private detectForks(playerId: string): ForkAdvantage[] {
        const forks: ForkAdvantage[] = [];
        const board = this.getBoard();
        const color = this.playerIdToColor(playerId);
        const opponentColor = color === 'w' ? 'b' : 'w';

        // Get all player's pieces
        const pieces = board.getPiecesByColor(color);

        for (const piece of pieces) {
            if (!piece.position) continue;

            const piecePos = piece.position.value;

            // Get all possible moves for this piece
            const possibleMoves = this.getPossibleMoves(piecePos);

            // Find moves that attack opponent pieces
            const attackedPositions: string[] = [];

            for (const move of possibleMoves) {
                const pieceAtTarget = board.getPieceAt(move);
                if (pieceAtTarget && pieceAtTarget.color.value === opponentColor) {
                    attackedPositions.push(move);
                }
            }

            // If piece attacks multiple valuable pieces, it's a fork
            if (attackedPositions.length >= 2) {
                // Calculate value of forked pieces
                const totalValue = attackedPositions.reduce((sum, pos) => {
                    const pieceAtPos = board.getPieceAt(pos);
                    if (pieceAtPos) {
                        return sum + this.getPieceValue(pieceAtPos.type.value);
                    }
                    return sum;
                }, 0);

                // Fork is significant if total value is high enough or king is involved
                const isKingInvolved = attackedPositions.some(pos => {
                    const pieceAtPos = board.getPieceAt(pos);
                    return pieceAtPos && pieceAtPos.type.value === 'k';
                });

                if (totalValue >= 6 || isKingInvolved) {
                    forks.push({
                        type: TacticalAdvantageType.FORK,
                        playerId,
                        bpRegeneration: isKingInvolved ? 3 : 2,
                        forkedPositions: attackedPositions
                    });
                }
            }
        }

        return forks;
    }

    /**
     * Get the relative value of a piece
     */
    private getPieceValue(pieceType: string): number {
        switch (pieceType) {
            case 'p': return 1;
            case 'n': return 3;
            case 'b': return 3;
            case 'r': return 5;
            case 'q': return 9;
            case 'k': return 100; // King is invaluable
            default: return 0;
        }
    }

    /**
     * Calculate BP regeneration based on tactical advantages
     */
    public calculateBPRegeneration(playerId: string): number {
        // Base regeneration
        let bpRegen = this.configProvider.gambitChess.bpRegen.baseBPRegeneration;

        // Add regeneration from tactical advantages
        const advantages = this.detectTacticalAdvantages(playerId);

        // Only count the highest regen amount from each advantage type
        const typeMaxRegen = new Map<TacticalAdvantageType, number>();

        advantages.forEach(advantage => {
            const currentMax = typeMaxRegen.get(advantage.type) || 0;
            if (advantage.bpRegeneration > currentMax) {
                typeMaxRegen.set(advantage.type, advantage.bpRegeneration);
            }
        });

        // Sum up all regen bonuses
        typeMaxRegen.forEach(regenAmount => {
            bpRegen += regenAmount;
        });

        return bpRegen;
    }

    /**
     * Apply BP regeneration after a player's turn
     */
    public applyBPRegeneration(playerId: string): number {
        const regenAmount = this.calculateBPRegeneration(playerId);
        this.addPlayerBP(playerId, regenAmount);
        return regenAmount;
    }

    public getState(): ServerGameState {
        return this.gameState;
    }

    /**
     * Generate game state DTO for specific player
     * Filters out information that should be hidden from the player
     */
    public getStateForPlayer(playerId: string): GameStateDTO {
        const state = this.getState();
        const color = this.playerIdToColor(playerId);

        // Get board pieces information
        const pieces: ChessPieceDTO[] = [];
        const board = this.getBoard();

        board.getAllPieces().forEach(piece => {
            pieces.push({
                type: piece.type.value,
                color: piece.color.value,
                position: piece.position ? piece.position.value : '',
                hasMoved: piece.hasMoved,
                lastMoveTurn: piece.lastMoveTurn
            });
        });

        // Create duel info if a duel is in progress
        let duel: DuelInfoDTO | undefined = undefined;
        if (this.duelInProgress && this.currentDuel) {
            const now = Date.now();
            const elapsed = now - this.currentDuel.initiatedAt;
            const allocationTime = this.configProvider.gambitChess.timeControl.bpAllocationTime;
            const remainingTime = Math.max(0, allocationTime - elapsed);

            duel = {
                inProgress: true,
                attackerId: this.currentDuel.attackerId,
                defenderId: this.currentDuel.defenderId,
                attackingPiecePos: this.currentDuel.attackingPiecePos,
                defendingPiecePos: this.currentDuel.defendingPiecePos,
                // Only tell the player if they have allocated BP themselves
                playerAllocated: this.bpAllocations.has(playerId),
                initiatedAt: this.currentDuel.initiatedAt,
                remainingAllocationTime: remainingTime
            };
        }

        // Convert to DTO format and filter hidden information
        const gameState: GameStateDTO = {
            phase: 'in_progress', // This would be more dynamic in a real implementation
            turn: state.turn,
            pieces,
            moveNumber: state.moveNumber,
            inCheck: this.isInCheck(color),
            bp: this.getPlayerBP(playerId), // Only include this player's BP
            duel,
            whiteTimeRemaining: this.getRemainingTime('w'),
            blackTimeRemaining: this.getRemainingTime('b'),
            activeTimer: this.getActiveTimer(),
            players: [
                { id: 'white', name: 'White Player', color: 'white' },
                { id: 'black', name: 'Black Player', color: 'black' }
            ],
            spectators: []
        };

        return gameState;
    }

    /**
     * Check if a move is a capture attempt
     * @param fromPosition Starting position (e.g., "e2")
     * @param toPosition Target position (e.g., "e4")
     * @returns True if the move is a capture attempt
     */
    public isCaptureMove(fromPosition: string, toPosition: string): boolean {
        try {
            const board = this.getBoard();
            const targetPiece = board.getPieceAt(toPosition);

            // If there's a piece at the target position and it's of the opposite color,
            // then this is a capture move
            if (targetPiece) {
                const fromPiece = board.getPieceAt(fromPosition);
                if (fromPiece && fromPiece.color.value !== targetPiece.color.value) {
                    return true;
                }
            }

            return false;
        } catch (error) {
            console.error('Error checking capture move:', error);
            return false;
        }
    }

    /**
     * Execute a move
     * @param fromPosition Starting position (e.g., "e2") 
     * @param toPosition Target position (e.g., "e4")
     * @returns Result of the move
     */
    public move(fromPosition: string, toPosition: string): { success: boolean, error?: string } {
        try {
            // Validate the move first
            const validation = this.validateMove(fromPosition, toPosition);

            if (!validation.valid) {
                return { success: false, error: validation.reason };
            }

            // If it's a capture move, it should be handled by the duel system
            if (this.isCaptureMove(fromPosition, toPosition)) {
                return { success: false, error: 'Capture moves must be processed through the duel system' };
            }

            // Save current board state for tactical advantage detection
            this.saveCurrentBoardState();

            // Execute the move on the board
            const board = this.getBoard();
            const moveResult = board.makeMove(fromPosition, toPosition);

            if (!moveResult.success) {
                return { success: false, error: 'Move failed' };
            }

            // Get current state from parent class
            const currentState = this.getState();

            // Update game state
            const nextTurn = currentState.turn === 'w' ? 'b' : 'w';
            const moveNumber = currentState.turn === 'b' ? currentState.moveNumber + 1 : currentState.moveNumber;

            // Update the state using parent class method
            super.setState({
                ...currentState,
                turn: nextTurn,
                moveNumber,
                inCheck: moveResult.check || false,
                pieces: board.getAllPieces().map(p => ({
                    type: p.type.value,
                    color: p.color.value,
                    position: p.position ? p.position.value : '',
                    hasMoved: p.hasMoved,
                    lastMoveTurn: p.lastMoveTurn
                }))
            });

            // Apply BP regeneration for the player who just moved
            const playerId = this.colorToPlayerId(nextTurn === 'w' ? 'b' : 'w');
            this.applyBPRegeneration(playerId);

            return { success: true };
        } catch (error) {
            console.error('Error executing move:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    /**
     * Get the previous board state (before the last move)
     * Used for tactical advantage detection
     */
    public getPreviousBoardState(): IBoard | null {
        return this.previousBoardState || null;
    }

    /**
     * Add tactical advantages to the current game state
     * @param advantages Array of tactical advantages to add
     */
    public addTacticalAdvantages(advantages: TacticalAdvantage[]): void {
        if (!advantages || advantages.length === 0) {
            return;
        }

        // Add new advantages to the current list
        this.tacticalAdvantages = [...this.tacticalAdvantages, ...advantages];

        // Apply BP regeneration based on advantages
        for (const advantage of advantages) {
            if (advantage.bpRegeneration && advantage.bpRegeneration > 0) {
                this.addPlayerBP(advantage.playerId, advantage.bpRegeneration);
            }
        }
    }
} 