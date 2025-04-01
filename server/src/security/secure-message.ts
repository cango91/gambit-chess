import * as crypto from 'crypto';

/**
 * Security metadata for secure message protocol
 */
export interface SecurityMetadata {
    token: string;           // Session token
    signature?: string;      // HMAC signature (required for critical operations)
    timestamp: number;       // Message timestamp for replay attack prevention
    nonce: string;           // Unique nonce for replay attack prevention
}

/**
 * Generic game event
 */
export interface GameEvent {
    type: string;
    [key: string]: any;
}

/**
 * Secure message container for WebSocket communication
 */
export interface SecureMessage<T extends GameEvent = GameEvent> {
    event: T;                // The wrapped game event
    security: SecurityMetadata;  // Security metadata
}

/**
 * Session data stored on the server
 */
export interface SessionData {
    playerId: string;        // Player ID associated with this session
    token: string;           // Session token
    secret: string;          // Session secret for signing messages
    timestamp: number;       // Creation timestamp
    lastActive: number;      // Last activity timestamp
    nonces: Set<string>;     // Recent nonces to prevent replay attacks
    connectionInfo: {        // Connection metadata for fingerprinting
        ip: string;
        userAgent: string;
    };
}

/**
 * Result of security validation
 */
export interface ValidationResult {
    valid: boolean;
    error?: string;
}

/**
 * Constants for security configuration
 */
export const SECURITY_CONSTANTS = {
    NONCE_WINDOW_SIZE: 100,          // Maximum number of nonces to track
    NONCE_WINDOW_EXPIRY: 5 * 60000,  // Nonce expiry time (5 minutes in ms)
    TOKEN_EXPIRY: 24 * 60 * 60000,   // Token expiry time (24 hours in ms)
    MAX_TIMESTAMP_DRIFT: 30000,      // Maximum allowed timestamp drift (30 seconds)
    SIGNATURE_ALGORITHM: 'sha256',   // HMAC signature algorithm
    CHALLENGE_SIZE: 32,              // Size of challenge string in bytes
    MIN_SECRET_SIZE: 32,             // Minimum size of session secret in bytes
    MIN_TOKEN_SIZE: 32               // Minimum size of session token in bytes
};

/**
 * Manages secure message protocol for WebSocket communication
 */
export class SecureMessageManager {
    private sessions: Map<string, SessionData> = new Map();
    private challenges: Map<string, { challenge: string, timestamp: number }> = new Map();
    
    /**
     * Generate a cryptographic challenge
     */
    public generateChallenge(clientId: string): string {
        const challenge = crypto.randomBytes(SECURITY_CONSTANTS.CHALLENGE_SIZE).toString('hex');
        
        // Store challenge for validation
        this.challenges.set(clientId, {
            challenge,
            timestamp: Date.now()
        });
        
        return challenge;
    }
    
    /**
     * Create a new session for a player
     */
    public createSession(playerId: string, connectionInfo: { ip: string, userAgent: string }): { token: string, secret: string } {
        // Generate random token and secret
        const token = crypto.randomBytes(SECURITY_CONSTANTS.MIN_TOKEN_SIZE).toString('hex');
        const secret = crypto.randomBytes(SECURITY_CONSTANTS.MIN_SECRET_SIZE).toString('hex');
        
        // Store session data
        const now = Date.now();
        this.sessions.set(token, {
            playerId,
            token,
            secret,
            timestamp: now,
            lastActive: now,
            nonces: new Set(),
            connectionInfo
        });
        
        return { token, secret };
    }
    
    /**
     * Sign a message with HMAC-SHA256
     */
    public signMessage(
        event: GameEvent,
        secret: string,
        nonce: string,
        timestamp: number
    ): string {
        const hmac = crypto.createHmac(SECURITY_CONSTANTS.SIGNATURE_ALGORITHM, secret);
        
        // Create consistent string representation for signing
        const payload = JSON.stringify({
            event,
            nonce,
            timestamp
        });
        
        // Generate HMAC signature
        hmac.update(payload);
        return hmac.digest('hex');
    }
    
    /**
     * Verify message signature
     */
    private verifySignature(message: SecureMessage, secret: string): boolean {
        if (!message.security.signature) {
            return false;
        }
        
        // Recreate signature from message contents
        const expectedSignature = this.signMessage(
            message.event,
            secret,
            message.security.nonce,
            message.security.timestamp
        );
        
        // Use constant time comparison to prevent timing attacks
        return crypto.timingSafeEqual(
            Buffer.from(message.security.signature, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    }
    
    /**
     * Check if timestamp is recent enough
     */
    private isTimestampValid(timestamp: number): boolean {
        const now = Date.now();
        const drift = Math.abs(now - timestamp);
        return drift <= SECURITY_CONSTANTS.MAX_TIMESTAMP_DRIFT;
    }
    
    /**
     * Record a nonce for replay protection
     */
    private recordNonce(session: SessionData, nonce: string): boolean {
        // Check if nonce has been used
        if (session.nonces.has(nonce)) {
            return false;
        }
        
        // Record nonce
        session.nonces.add(nonce);
        
        // Prune old nonces if needed
        if (session.nonces.size > SECURITY_CONSTANTS.NONCE_WINDOW_SIZE) {
            // This is a simplified approach; a real implementation would track
            // nonce timestamps and remove oldest ones
            const nonceArray = Array.from(session.nonces);
            const oldestNonce = nonceArray[0];
            session.nonces.delete(oldestNonce);
        }
        
        return true;
    }
    
    /**
     * Validate a secure message
     */
    public validateMessage(message: SecureMessage): ValidationResult {
        // Check if message has required security fields
        if (!message.security || !message.security.token || !message.security.timestamp || !message.security.nonce) {
            return { valid: false, error: 'Missing security metadata' };
        }
        
        // Get session for token
        const session = this.sessions.get(message.security.token);
        if (!session) {
            return { valid: false, error: 'Invalid session token' };
        }
        
        // Check if token has expired
        const now = Date.now();
        if (now - session.timestamp > SECURITY_CONSTANTS.TOKEN_EXPIRY) {
            this.sessions.delete(message.security.token);
            return { valid: false, error: 'Session expired' };
        }
        
        // Check timestamp
        if (!this.isTimestampValid(message.security.timestamp)) {
            return { valid: false, error: 'Invalid timestamp' };
        }
        
        // Check nonce
        if (!this.recordNonce(session, message.security.nonce)) {
            return { valid: false, error: 'Nonce already used' };
        }
        
        // Check signature if provided
        if (message.security.signature) {
            // Some operations may require signatures while others don't
            if (!this.verifySignature(message, session.secret)) {
                return { valid: false, error: 'Invalid signature' };
            }
        }
        
        // Update last active time
        session.lastActive = now;
        
        return { valid: true };
    }
    
    /**
     * Create a secure message response
     */
    public createSecureResponse<T extends GameEvent>(
        token: string,
        event: T
    ): SecureMessage<T> {
        const session = this.sessions.get(token);
        if (!session) {
            throw new Error('Invalid session token');
        }
        
        const timestamp = Date.now();
        const nonce = crypto.randomBytes(16).toString('hex');
        
        // Sign critical game messages
        let signature: string | undefined;
        if (this.isCriticalOperation(event.type)) {
            signature = this.signMessage(event, session.secret, nonce, timestamp);
        }
        
        return {
            event,
            security: {
                token,
                signature,
                timestamp,
                nonce
            }
        };
    }
    
    /**
     * Check if operation requires a signature
     */
    private isCriticalOperation(eventType: string): boolean {
        // Define which event types are considered critical and require signatures
        const criticalEventTypes = [
            'MOVE_REQUEST',
            'BP_ALLOCATION',
            'TACTICAL_RETREAT',
            'CHAT_MESSAGE',
            'GAME_RESIGN',
            'DRAW_OFFER',
            'DRAW_RESPONSE'
        ];
        
        return criticalEventTypes.includes(eventType);
    }
    
    /**
     * Revoke a session token
     */
    public revokeToken(token: string): boolean {
        return this.sessions.delete(token);
    }
    
    /**
     * Clean up expired sessions
     */
    public cleanupExpiredSessions(): number {
        const now = Date.now();
        let count = 0;
        
        for (const [token, session] of this.sessions.entries()) {
            // Check if session has expired
            if (now - session.timestamp > SECURITY_CONSTANTS.TOKEN_EXPIRY) {
                this.sessions.delete(token);
                count++;
            }
        }
        
        return count;
    }
    
    /**
     * Generate a nonce for client use
     */
    public generateNonce(): string {
        return crypto.randomBytes(16).toString('hex');
    }
} 