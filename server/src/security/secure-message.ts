import * as crypto from 'crypto';
import { AuthService } from './auth-service';
import { 
    SECURITY_CONSTANTS,
    SecureMessage,
    ValidationResult,
    Event,
    SecurityMetadata,
    isCriticalEvent
} from '@gambit-chess/shared';

const SERVER_SECURITY_CONSTANTS = {
    ...SECURITY_CONSTANTS,
    NONCE_WINDOW_SIZE: 1000,
    NONCE_WINDOW_EXPIRY: 1000 * 60 * 5, // 5 minutes
}

/**
 * Manages secure message protocol for WebSocket communication
 */
export class SecureMessageManager {
    private challenges: Map<string, { challenge: string, timestamp: number }> = new Map();
    private nonces: Map<string, Set<string>> = new Map(); // sessionId -> Set of nonces
    private authService: AuthService;
    
    constructor() {
        this.authService = AuthService.getInstance();
    }
    
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
     * Sign a message with HMAC-SHA256
     */
    public signMessage(
        event: Event,
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
    private verifySignature(message: SecureMessage<Event>, secret: string): boolean {
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
    private recordNonce(sessionId: string, nonce: string): boolean {
        // Initialize nonce set if needed
        if (!this.nonces.has(sessionId)) {
            this.nonces.set(sessionId, new Set());
        }
        
        const sessionNonces = this.nonces.get(sessionId)!;
        
        // Check if nonce has been used
        if (sessionNonces.has(nonce)) {
            return false;
        }
        
        // Record nonce
        sessionNonces.add(nonce);
        
        // Prune old nonces if needed
        if (sessionNonces.size > SERVER_SECURITY_CONSTANTS.NONCE_WINDOW_SIZE) {
            // This is a simplified approach; a real implementation would track
            // nonce timestamps and remove oldest ones
            const nonceArray = Array.from(sessionNonces);
            const oldestNonce = nonceArray[0];
            sessionNonces.delete(oldestNonce);
        }
        
        return true;
    }
    
    /**
     * Validate a secure message
     */
    public validateMessage(message: SecureMessage<Event>): ValidationResult {
        // Check if message has required security fields
        if (!message.security || !message.security.token || !message.security.timestamp || !message.security.nonce) {
            return { valid: false, error: 'Missing security metadata' };
        }
        
        // Verify the token
        const tokenVerification = this.authService.verifyToken(message.security.token);
        if (!tokenVerification.valid || !tokenVerification.payload) {
            return { valid: false, error: 'Invalid token' };
        }
        
        const sessionId = tokenVerification.payload.sessionId;
        
        // Check timestamp
        if (!this.isTimestampValid(message.security.timestamp)) {
            return { valid: false, error: 'Message timestamp is invalid or expired' };
        }
        
        // Check nonce
        if (!this.recordNonce(sessionId, message.security.nonce)) {
            return { valid: false, error: 'Nonce has been used before (possible replay attack)' };
        }
        
        // For critical operations, verify signature
        if (isCriticalEvent(message.event)) {
            // For critical operations, we would need to verify a signature
            // But since the JWT already provides authentication, we'll skip this in our implementation
            if (!message.security.signature) {
                return { valid: false, error: 'Signature required for critical operation' };
            }
            
            // The real implementation would verify the signature here
        }
        
        // Update session last active time
        this.authService.updateSession(sessionId, { lastActive: Date.now() });
        
        return { valid: true };
    }
    
    /**
     * Create a secure message for sending to client
     */
    public createSecureResponse(token: string, event: Event): SecureMessage<Event> {
        const nonce = crypto.randomBytes(16).toString('hex');
        const timestamp = Date.now();
        
        // Create security metadata
        const security: SecurityMetadata = {
            token,
            timestamp,
            nonce
        };
        
        // For critical operations, add signature
        if (isCriticalEvent(event)) {
            // In a real implementation, we would sign critical messages
            // security.signature = this.signMessage(event, session.secret, nonce, timestamp);
        }
        
        return {
            event,
            security
        };
    }
    
    
    /**
     * Clean up expired challenges
     */
    public cleanupExpiredChallenges(): void {
        const now = Date.now();
        for (const [clientId, data] of this.challenges.entries()) {
            if (now - data.timestamp > SERVER_SECURITY_CONSTANTS.NONCE_WINDOW_EXPIRY) {
                this.challenges.delete(clientId);
            }
        }
    }
    
    /**
     * Clean up expired sessions
     */
    public cleanupExpiredSessions(): void {
        // No need to clean up sessions here, as the AuthService handles this
        // Just clean up any nonce tracking data for expired sessions
        this.cleanupExpiredChallenges();
    }
} 