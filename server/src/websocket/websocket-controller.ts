import * as WebSocket from 'ws';
import { GameEvent, SecureMessage, SecureMessageManager, ValidationResult } from '../security/secure-message';
import { GambitChessEngine } from '../core/gambit-chess-engine';
import { ServerConfigProvider } from '../config/provider';
import { IncomingMessage } from 'http';
import { GameStateDTO, DuelInfoDTO } from '@gambit-chess/shared';

/**
 * WebSocket client connection
 */
interface WSClient {
    id: string;
    socket: WebSocket;
    playerId?: string;
    isSpectator: boolean;
    gameId?: string;
    lastPing: number;
    ip?: string;       // Store connection IP for fingerprinting
    userAgent?: string; // Store user agent for fingerprinting
}

/**
 * WebSocket controller for managing game communication
 */
export class WebSocketController {
    private clients: Map<string, WSClient> = new Map();
    private games: Map<string, GambitChessEngine> = new Map();
    private security: SecureMessageManager;
    private configProvider: ServerConfigProvider;
    
    constructor() {
        this.security = new SecureMessageManager();
        this.configProvider = ServerConfigProvider.getInstance();
    }
    
    /**
     * Initialize WebSocket server
     */
    public initialize(wss: WebSocket.Server): void {
        wss.on('connection', (socket: WebSocket, request: IncomingMessage) => {
            this.handleConnection(socket, request);
        });
        
        // Set up periodic tasks
        setInterval(() => this.pingClients(), 30000);
        setInterval(() => this.security.cleanupExpiredSessions(), 300000);
    }
    
    /**
     * Handle new WebSocket connection
     */
    private handleConnection(socket: WebSocket, request: IncomingMessage): void {
        const clientId = this.generateClientId();
        
        // Extract connection info for fingerprinting
        const ip = request.socket?.remoteAddress || 'unknown';
        const userAgent = request.headers['user-agent'] || 'unknown';
        
        // Store client information
        this.clients.set(clientId, {
            id: clientId,
            socket,
            isSpectator: false,
            lastPing: Date.now(),
            ip,
            userAgent
        });
        
        // Set up event listeners
        socket.on('message', (data: WebSocket.Data) => {
            this.handleMessage(clientId, data);
        });
        
        socket.on('close', () => {
            this.handleDisconnect(clientId);
        });
        
        socket.on('error', (err: Error) => {
            console.error(`WebSocket error for client ${clientId}:`, err);
            this.handleDisconnect(clientId);
        });
        
        // Send initial authentication challenge
        this.sendAuthChallenge(clientId);
    }
    
    /**
     * Send authentication challenge to new client
     */
    private sendAuthChallenge(clientId: string): void {
        const client = this.clients.get(clientId);
        if (!client) return;
        
        const challenge = this.security.generateChallenge(clientId);
        
        // Auth challenge doesn't use secure message format as client doesn't have a token yet
        const authChallengeEvent: GameEvent = {
            type: 'AUTH_CHALLENGE',
            challenge,
            clientId
        };
        
        client.socket.send(JSON.stringify(authChallengeEvent));
    }
    
    /**
     * Handle incoming WebSocket message
     */
    private handleMessage(clientId: string, data: WebSocket.Data): void {
        const client = this.clients.get(clientId);
        if (!client) return;
        
        try {
            const rawMessage = data.toString();
            const message = JSON.parse(rawMessage);
            
            // Handle authentication events separately
            if (message.type === 'AUTH_RESPONSE') {
                this.handleAuthResponse(clientId, message);
                return;
            }
            
            // For all other messages, validate as secure message
            const secureMessage = message as SecureMessage;
            const validation = this.security.validateMessage(secureMessage);
            
            if (!validation.valid) {
                this.sendError(clientId, validation.error || 'Invalid message');
                return;
            }
            
            // Route message based on event type
            this.routeGameEvent(clientId, secureMessage);
            
        } catch (error) {
            console.error(`Error processing message from client ${clientId}:`, error);
            this.sendError(clientId, 'Invalid message format');
        }
    }
    
    /**
     * Handle client authentication response
     */
    private handleAuthResponse(clientId: string, message: any): void {
        // This can handle both initial auth responses and reconnection attempts
        
        // For the game jam implementation, this might be simplified
        // but a real-world implementation would validate challenge responses
        
        const client = this.clients.get(clientId);
        if (!client) return;
        
        // Check if this is a join request for a new game
        if (message.action === 'join_game') {
            // Create or get the game
            let gameId = message.gameId;
            if (!gameId) {
                // Create new game if no ID provided
                gameId = this.createGame();
            }
            
            // Register player in game
            const playerId = message.playerId || this.generatePlayerId(gameId);
            const isSpectator = message.isSpectator || false;
            
            // Create session
            const connectionInfo = {
                ip: client.ip || 'unknown',
                userAgent: client.userAgent || 'unknown'
            };
            
            const { token, secret } = this.security.createSession(playerId, connectionInfo);
            
            // Update client info
            client.playerId = playerId;
            client.gameId = gameId;
            client.isSpectator = isSpectator;
            
            // Send session info to client
            const authResultEvent: GameEvent = {
                type: 'AUTH_RESULT',
                success: true,
                token,
                secret,
                gameId,
                playerId
            };
            
            client.socket.send(JSON.stringify(authResultEvent));
            
            // Send current game state
            this.sendGameState(clientId);
        }
    }
    
    /**
     * Route game event to appropriate handler
     */
    private routeGameEvent(clientId: string, message: SecureMessage): void {
        const client = this.clients.get(clientId);
        if (!client || !client.gameId || !client.playerId) return;
        
        const gameId = client.gameId;
        const playerId = client.playerId;
        
        // Get game engine
        const engine = this.games.get(gameId);
        if (!engine) {
            this.sendError(clientId, 'Game not found');
            return;
        }
        
        // Handle based on event type
        switch (message.event.type) {
            case 'MOVE_REQUEST':
                this.handleMoveRequest(engine, playerId, message.event);
                break;
                
            case 'BP_ALLOCATION':
                this.handleBPAllocation(engine, playerId, message.event);
                break;
                
            case 'TACTICAL_RETREAT':
                this.handleTacticalRetreat(engine, playerId, message.event);
                break;
                
            case 'CHAT_MESSAGE':
                this.handleChatMessage(gameId, playerId, message.event);
                break;
                
            case 'GAME_RESIGN':
                this.handleGameResign(engine, gameId, playerId);
                break;
                
            case 'DRAW_OFFER':
                this.handleDrawOffer(gameId, playerId);
                break;
                
            case 'DRAW_RESPONSE':
                this.handleDrawResponse(engine, gameId, playerId, message.event);
                break;
                
            case 'STATE_SYNC_REQUEST':
                this.sendGameState(clientId);
                break;
                
            case 'CONNECTION_PING':
                this.handlePing(clientId, message.event);
                break;
                
            default:
                this.sendError(clientId, `Unsupported event type: ${message.event.type}`);
        }
    }
    
    /**
     * Handle move request from client
     */
    private handleMoveRequest(engine: GambitChessEngine, playerId: string, event: GameEvent): void {
        // Extract move data
        const { from, to } = event;
        
        try {
            // Validate and execute move
            const moveValidation = engine.validateMove(from, to);
            
            if (!moveValidation.valid) {
                this.sendPlayerError(playerId, `Invalid move: ${moveValidation.reason}`);
                return;
            }
            
            // Check for capture attempt
            if (moveValidation.capturedPiece) {
                // Initiate duel
                this.initiateDuel(engine, playerId, from, to, moveValidation.capturedPiece);
                return;
            }
            
            // Regular move (no capture)
            // In a real implementation, we would update the game state here
            
            // Broadcast updated game state
            this.broadcastGameState(engine);
            
        } catch (error) {
            console.error('Error processing move request:', error);
            this.sendPlayerError(playerId, 'Error processing move request');
        }
    }
    
    /**
     * Initiate BP duel for capture attempt
     */
    private initiateDuel(
        engine: GambitChessEngine,
        attackerId: string,
        from: string,
        to: string,
        targetPiece: any
    ): void {
        // Determine defender player ID
        // We'll access the color conversion method in a type-safe way
        const attackerColor = attackerId === 'white' ? 'w' : 'b';
        const defenderColor = attackerColor === 'w' ? 'b' : 'w';
        const defenderId = defenderColor === 'w' ? 'white' : 'black';
        
        // Get attacking piece
        const attackingPiece = engine.getBoard().getPieceAt(from);
        if (!attackingPiece) return;
        
        // Send duel initiated event to both players
        const duelInitiatedEvent: GameEvent = {
            type: 'DUEL_INITIATED',
            from,
            to,
            attackingPiece: {
                type: attackingPiece.type.value,
                position: from
            },
            targetPiece: {
                type: targetPiece.type,
                position: to
            },
            allocationTimeMs: this.configProvider.gambitChess.timeControl.bpAllocationTime
        };
        
        // Send to attacker
        this.sendToPlayer(attackerId, duelInitiatedEvent);
        
        // Send to defender
        this.sendToPlayer(defenderId, duelInitiatedEvent);
    }
    
    /**
     * Handle BP allocation for duel
     */
    private handleBPAllocation(engine: GambitChessEngine, playerId: string, event: GameEvent): void {
        const { piecePosition, amount } = event;
        
        try {
            // Record BP allocation
            engine.recordBPAllocation(playerId, piecePosition, amount);
            
            // Get the current duel info
            const playerState = engine.getStateForPlayer(playerId);
            
            if (playerState.duel && playerState.duel.attackerId && playerState.duel.defenderId) {
                const attackerId = playerState.duel.attackerId;
                const defenderId = playerState.duel.defenderId;
                
                // Check if both players have allocated BP
                const otherPlayerId = playerId === attackerId ? defenderId : attackerId;
                const otherPlayerState = engine.getStateForPlayer(otherPlayerId);
                
                if (playerState.duel.playerAllocated && otherPlayerState.duel?.playerAllocated) {
                    // Both players have allocated, resolve the duel
                    const duelResult = engine.resolveBPDuel(attackerId, defenderId);
                    
                    // Broadcast duel outcome
                    this.broadcastDuelOutcome(engine, duelResult);
                } else {
                    // Only one player has allocated, wait for the other
                    // Notify the player that their allocation has been recorded
                    const allocationConfirmEvent: GameEvent = {
                        type: 'BP_ALLOCATION_CONFIRMED',
                        piecePosition,
                        amount
                    };
                    
                    this.sendToPlayer(playerId, allocationConfirmEvent);
                    
                    // Update game state for both players
                    this.broadcastGameState(engine);
                }
            } else {
                this.sendPlayerError(playerId, 'No active duel in progress or missing duel information');
            }
            
        } catch (error) {
            console.error('Error processing BP allocation:', error);
            this.sendPlayerError(playerId, 'Error processing BP allocation');
        }
    }
    
    /**
     * Handle tactical retreat request
     */
    private handleTacticalRetreat(engine: GambitChessEngine, playerId: string, event: GameEvent): void {
        const { piecePosition, targetPosition, failedCaptureTarget } = event;
        
        try {
            // Validate tactical retreat
            const retreatOptions = engine.validateTacticalRetreat(piecePosition, failedCaptureTarget);
            
            // Find the selected retreat option
            const selectedOption = retreatOptions.find(option => option.to === targetPosition);
            
            if (!selectedOption) {
                this.sendPlayerError(playerId, 'Invalid tactical retreat position');
                return;
            }
            
            // Check if player has enough BP for the retreat
            const bpCost = selectedOption.cost;
            if (!engine.subtractPlayerBP(playerId, bpCost)) {
                this.sendPlayerError(playerId, 'Insufficient BP for tactical retreat');
                return;
            }
            
            // Apply the retreat (in a real implementation)
            
            // Broadcast updated game state
            this.broadcastGameState(engine);
            
        } catch (error) {
            console.error('Error processing tactical retreat:', error);
            this.sendPlayerError(playerId, 'Error processing tactical retreat');
        }
    }
    
    /**
     * Handle chat message
     */
    private handleChatMessage(gameId: string, senderId: string, event: GameEvent): void {
        const { message } = event;
        
        // Simple validation
        if (!message || typeof message !== 'string' || message.length > this.configProvider.chat.maxMessageLength) {
            this.sendPlayerError(senderId, 'Invalid chat message');
            return;
        }
        
        // In a real implementation, apply profanity filter if enabled
        
        // Broadcast chat message to all players in the game
        const chatEvent: GameEvent = {
            type: 'CHAT_MESSAGE',
            senderId,
            message,
            timestamp: Date.now()
        };
        
        this.broadcastToGame(gameId, chatEvent);
    }
    
    /**
     * Handle game resignation
     */
    private handleGameResign(engine: GambitChessEngine, gameId: string, playerId: string): void {
        // Set game result (in a real implementation)
        
        // Broadcast game over
        const gameOverEvent: GameEvent = {
            type: 'GAME_OVER',
            result: `${playerId === 'white' ? 'black' : 'white'}_by_resignation`,
            resigningPlayer: playerId
        };
        
        this.broadcastToGame(gameId, gameOverEvent);
    }
    
    /**
     * Handle draw offer
     */
    private handleDrawOffer(gameId: string, playerId: string): void {
        // In a real implementation, record the draw offer
        
        // Notify opponent
        const opponentId = playerId === 'white' ? 'black' : 'white';
        
        const drawOfferEvent: GameEvent = {
            type: 'GAME_OFFER_DRAW',
            offeredBy: playerId
        };
        
        this.sendToPlayer(opponentId, drawOfferEvent);
    }
    
    /**
     * Handle response to draw offer
     */
    private handleDrawResponse(engine: GambitChessEngine, gameId: string, playerId: string, event: GameEvent): void {
        const { accepted } = event;
        
        if (accepted) {
            // End game in a draw
            const gameOverEvent: GameEvent = {
                type: 'GAME_OVER',
                result: 'draw_agreed'
            };
            
            this.broadcastToGame(gameId, gameOverEvent);
        } else {
            // Notify draw was declined
            const opponentId = playerId === 'white' ? 'black' : 'white';
            
            const drawDeclinedEvent: GameEvent = {
                type: 'GAME_RESPOND_DRAW',
                accepted: false,
                respondingPlayer: playerId
            };
            
            this.sendToPlayer(opponentId, drawDeclinedEvent);
        }
    }
    
    /**
     * Handle ping from client
     */
    private handlePing(clientId: string, event: GameEvent): void {
        const client = this.clients.get(clientId);
        if (!client) return;
        
        // Update last ping time
        client.lastPing = Date.now();
        
        // Send pong response
        const pongEvent: GameEvent = {
            type: 'CONNECTION_PONG',
            timestamp: Date.now(),
            clientTimestamp: event.timestamp
        };
        
        this.sendToClient(clientId, pongEvent);
    }
    
    /**
     * Send ping to all clients
     */
    private pingClients(): void {
        const now = Date.now();
        
        // Check each client
        for (const [clientId, client] of this.clients.entries()) {
            // If client hasn't responded in 60 seconds, consider them disconnected
            if (now - client.lastPing > 60000) {
                this.handleDisconnect(clientId);
                continue;
            }
            
            // Send ping to active clients
            const pingEvent: GameEvent = {
                type: 'CONNECTION_PING',
                timestamp: now
            };
            
            this.sendToClient(clientId, pingEvent);
        }
    }
    
    /**
     * Handle client disconnect
     */
    private handleDisconnect(clientId: string): void {
        const client = this.clients.get(clientId);
        if (!client) return;
        
        // Notify other players if this was a game participant
        if (client.gameId && client.playerId) {
            const disconnectEvent: GameEvent = {
                type: 'PLAYER_LEFT',
                playerId: client.playerId,
                reason: 'disconnect'
            };
            
            this.broadcastToGame(client.gameId, disconnectEvent, [clientId]);
        }
        
        // Clean up
        this.clients.delete(clientId);
    }
    
    /**
     * Create a new game
     */
    private createGame(): string {
        const gameId = this.generateGameId();
        
        // Create game engine
        const engine = new GambitChessEngine(this.configProvider);
        this.games.set(gameId, engine);
        
        return gameId;
    }
    
    /**
     * Send game state to a specific client
     */
    private sendGameState(clientId: string): void {
        const client = this.clients.get(clientId);
        if (!client || !client.gameId || !client.playerId) return;
        
        const engine = this.games.get(client.gameId);
        if (!engine) return;
        
        // Get player-specific game state
        const gameState = engine.getStateForPlayer(client.playerId);
        
        // Create game state update event
        const stateEvent: GameEvent = {
            type: 'GAME_STATE_UPDATE',
            state: gameState
        };
        
        // Send state using secure message
        const token = this.getTokenForClient(clientId);
        if (!token) return;
        
        const secureMessage = this.security.createSecureResponse(token, stateEvent);
        client.socket.send(JSON.stringify(secureMessage));
    }
    
    /**
     * Broadcast game state to all players in a game
     */
    private broadcastGameState(engine: GambitChessEngine): void {
        // Find all clients for this game
        for (const [clientId, client] of this.clients.entries()) {
            if (client.gameId && client.playerId) {
                this.sendGameState(clientId);
            }
        }
    }
    
    /**
     * Broadcast duel outcome
     */
    private broadcastDuelOutcome(
        engine: GambitChessEngine,
        result: { attackerWins: boolean, attackerAmount: number, defenderAmount: number }
    ): void {
        // Create duel outcome event
        const duelOutcomeEvent: GameEvent = {
            type: 'DUEL_OUTCOME',
            attackerWins: result.attackerWins,
            attackerAmount: result.attackerAmount,
            defenderAmount: result.defenderAmount,
            // Include tactical advantages if any were gained from this duel
            tacticalAdvantages: [] // This would be populated in a real implementation
        };
        
        // Find game ID for this engine
        let gameId: string | undefined;
        for (const [id, game] of this.games.entries()) {
            if (game === engine) {
                gameId = id;
                break;
            }
        }
        
        if (gameId) {
            this.broadcastToGame(gameId, duelOutcomeEvent);
            
            // After duel outcome, update game state with any tactical advantages
            this.broadcastGameState(engine);
        }
    }
    
    /**
     * Send an event to a specific player
     */
    private sendToPlayer(playerId: string, event: GameEvent): void {
        // Find client with this player ID
        for (const [clientId, client] of this.clients.entries()) {
            if (client.playerId === playerId) {
                this.sendToClient(clientId, event);
                break;
            }
        }
    }
    
    /**
     * Send an event to a specific client
     */
    private sendToClient(clientId: string, event: GameEvent): void {
        const client = this.clients.get(clientId);
        if (!client) return;
        
        const token = this.getTokenForClient(clientId);
        if (!token) {
            // For events that don't need a secure wrapper (like auth results)
            client.socket.send(JSON.stringify(event));
            return;
        }
        
        try {
            // Wrap in secure message
            const secureMessage = this.security.createSecureResponse(token, event);
            client.socket.send(JSON.stringify(secureMessage));
        } catch (error) {
            console.error(`Error sending message to client ${clientId}:`, error);
        }
    }
    
    /**
     * Broadcast an event to all clients in a game
     */
    private broadcastToGame(gameId: string, event: GameEvent, excludeClientIds: string[] = []): void {
        for (const [clientId, client] of this.clients.entries()) {
            if (client.gameId === gameId && !excludeClientIds.includes(clientId)) {
                this.sendToClient(clientId, event);
            }
        }
    }
    
    /**
     * Send error message to a specific client
     */
    private sendError(clientId: string, error: string): void {
        const errorEvent: GameEvent = {
            type: 'ERROR',
            error
        };
        
        this.sendToClient(clientId, errorEvent);
    }
    
    /**
     * Send error message to a specific player
     */
    private sendPlayerError(playerId: string, error: string): void {
        const errorEvent: GameEvent = {
            type: 'ERROR',
            error
        };
        
        this.sendToPlayer(playerId, errorEvent);
    }
    
    /**
     * Get session token for a client
     */
    private getTokenForClient(clientId: string): string | undefined {
        // In a real implementation, we would look up the token from a session store
        // For simplicity, we'll assume it's available for all established connections
        
        // This is a placeholder for a real implementation
        return 'placeholder_token';
    }
    
    /**
     * Generate unique client ID
     */
    private generateClientId(): string {
        return 'client_' + Math.random().toString(36).substring(2, 15);
    }
    
    /**
     * Generate unique game ID
     */
    private generateGameId(): string {
        return 'game_' + Math.random().toString(36).substring(2, 10);
    }
    
    /**
     * Generate player ID for a game
     */
    private generatePlayerId(gameId: string): string {
        // Check existing players for this game
        let hasWhitePlayer = false;
        let hasBlackPlayer = false;
        
        for (const client of this.clients.values()) {
            if (client.gameId === gameId && client.playerId) {
                if (client.playerId === 'white') hasWhitePlayer = true;
                if (client.playerId === 'black') hasBlackPlayer = true;
            }
        }
        
        // Assign first available color
        if (!hasWhitePlayer) return 'white';
        if (!hasBlackPlayer) return 'black';
        
        // If both colors are taken, make them a spectator
        return 'spectator_' + Math.random().toString(36).substring(2, 10);
    }
} 