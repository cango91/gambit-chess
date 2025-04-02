import { EventType } from '../types';
import { Event } from '../events';

/**
 * Critical Events
 * 
 * These are the events that are considered critical and need to be validated
 * i.e. all events that are sent from the client.
 */
type CriticalEvent = 
    | EventType.AUTH_RESPONSE
    | EventType.STATE_SYNC_REQUEST
    | EventType.MOVE_REQUEST
    | EventType.DUEL_ALLOCATE
    | EventType.GAME_RESIGN
    | EventType.GAME_OFFER_DRAW
    | EventType.GAME_RESPOND_DRAW
    | EventType.CHAT_MESSAGE;

const CRITICAL_EVENTS: string[] = [
    EventType.AUTH_RESPONSE,
    EventType.STATE_SYNC_REQUEST,
    EventType.MOVE_REQUEST,
    EventType.DUEL_ALLOCATE,
    EventType.GAME_RESIGN,
    EventType.GAME_OFFER_DRAW,
    EventType.GAME_RESPOND_DRAW,
    EventType.CHAT_MESSAGE,
];

/**
 * Check if an event is critical
 * 
 * @param event - The event to check
 * @returns True if the event is critical, false otherwise
 */
export const isCriticalEvent = (event: Event): boolean => CRITICAL_EVENTS.includes(event.type);


/**
 * Security Constants
 * 
 * Shared security constants for secure messaging
 */
export const SECURITY_CONSTANTS = {
    MAX_TIMESTAMP_DRIFT: 30000,      // Maximum allowed timestamp drift (30 seconds)
    SIGNATURE_ALGORITHM: 'sha256',   // HMAC signature algorithm
    CHALLENGE_SIZE: 32,              // Size of challenge string in bytes
};


/**
 * Security Metadata
 * 
 * This interface defines the security metadata for a secure message
 */
export interface SecurityMetadata {
    token: string;
    signature?: string;
    timestamp: number;
    nonce: string;
}

/**
 * Secure Message
 * 
 * This interface defines the secure message for an event
 */
export interface SecureMessage<T extends Event> {
    event: T;
    security: SecurityMetadata;
}

/**
 * Validation Result
 * 
 * This interface defines the validation result for a secure message
 */
export interface ValidationResult {
    valid: boolean;
    error?: string;
}

/**
 * Secure Message Validator
 * 
 * This interface defines the secure message validator
 */
export interface SecureMessageValidator {
    validate(message: SecureMessage<Event>): ValidationResult;
}