# Security Model Document

## 1. Player Identity & Authentication

### 1.1 Challenge: No Login/Signup Requirement
Per game jam rules, the game must be accessible without any login or signup, while still maintaining secure player verification.

### 1.2 Session-Based Authentication
- **Game Session Token**: When a game is created, generate unique cryptographic session tokens for each player.
- **Token Distribution**: Securely provide tokens to each player's client to be stored in local storage.
- **Request Authentication**: All subsequent requests must include this token for validation.

### 1.3 Cryptographic Challenge-Response
- **Initial Connection**: When a client connects, server issues a cryptographic challenge.
- **Client Response**: Client signs the challenge with their session token.
- **Server Verification**: Server verifies the signature to authenticate the client.
- **Periodic Challenges**: Server periodically issues new challenges to maintain session integrity.

### 1.4 Connection Fingerprinting
- **Connection Metadata**: Record initial connection metadata (IP, user-agent, etc.).
- **Consistency Checking**: Flag suspicious activity if connection characteristics change dramatically.
- **Rate Limiting**: Implement per-connection rate limiting to prevent brute force attacks.
- **Spectator Management**: Verify spectator connections to prevent information leakage.
- **Separate Session Types**: Maintain different session types for players vs. spectators with appropriate access rights.

## 2. WebSocket Security Layer

### 2.1 Secure Message Protocol
- **Message Wrapping**: All game events are wrapped in a `SecureMessage` container.
- **Security Metadata**: Each message includes security metadata (token, signature, timestamp, nonce).
- **Selective Signing**: Critical game state-changing events require signatures, while informational events may not.
- **Integrity Protection**: Message signatures ensure the integrity and authenticity of game actions.

```typescript
interface SecureMessage<T extends GameEvent = GameEvent> {
  event: T;                // The wrapped game event
  security: {
    token: string;         // Session token
    signature?: string;    // Message signature (required for critical actions)
    timestamp: number;     // Timestamp to prevent replay attacks
    nonce: string;         // Unique nonce for each message
  }
}
```

### 2.2 Challenge-Response Authentication Flow
- **Challenge Generation**: Server generates random challenge on client connection.
- **Challenge Response**: Client responds with appropriately signed challenge if authenticated, or simple acknowledgment if new connection.
- **Token Issuance**: Server issues token and secret upon successful game join.
- **Signature Verification**: Server verifies signatures using HMAC-SHA256 with client-specific secrets.

```
Client connects -> Server sends challenge -> Client responds ->
Server verifies -> Server issues token -> Secure communication begins
```

### A.2.3 Replay Attack Prevention
- **Timestamp Validation**: Reject messages with timestamps too far from current server time.
- **Nonce Validation**: Each message includes a unique nonce to prevent exact duplication.
- **Sliding Window**: Implement a sliding window of recently seen nonces to prevent replay attacks.
- **Session Expiration**: Tokens expire after a configurable period of inactivity.

## 3. Hidden Information Protection

### 3.1 BP Allocation Security
- **Constant-Time Processing**: Process BP allocations in constant time to prevent timing attacks.
- **SecureMessage Wrapping**: BP allocations are transmitted using the secure message protocol.
- **Server-Side Validation**: Validate that BP allocations do not exceed player's available BP.
- **Information Hiding**: BP allocations are never revealed until duel resolution.

### 3.2 Information Filtering
- **Server-Side Filtering**: Remove all hidden information before sending game state to clients.
- **Separate Response Generation**: Generate different game state responses for each player.
- **Spectator Filtering**: Apply additional filtering for spectator views to hide both players' BP data.
- **Minimal Information**: Send only the information needed for current game phase.
- **Chat Filtering**: Filter chat messages for inappropriate content.

### 3.3 Timing Attack Prevention
- **Constant-Time Operations**: Process BP allocations in constant time regardless of allocation amount.
- **Delayed Responses**: Implement minimum response times for duel resolution to prevent inferring allocation amounts.
- **Batched Updates**: Send game state updates at fixed intervals to mask processing time differences.
- **Fixed Message Sizes**: Standardize message sizes to prevent information leakage through message length.

## 4. Anti-Cheat Measures

### 4.1 Server Authority
- **Server Validation**: All game state changes must be validated by the server.
- **Client Prediction**: Client may predict outcomes for UI responsiveness, but server has final authority.
- **State Reconciliation**: Any client-server state discrepancy is resolved in favor of the server.
- **Shared Validation Code**: Even though validation code like check detection is shared, server implementation remains authoritative and controls game progression.

### 4.2 Move Validation
- **Comprehensive Validation**: Validate all moves against current game state.
- **Sequence Validation**: Ensure moves are received in the correct order.
- **Timestamp Checking**: Verify moves are made within reasonable time of the player's turn.
- **Signature Verification**: All move requests must include valid signatures.

### 4.3 Unusual Behavior Detection
- **Pattern Analysis**: Monitor for suspicious patterns in BP allocation.
- **Statistical Analysis**: Compare player behavior to expected distributions.
- **Rapid Input Detection**: Flag suspiciously fast inputs that might indicate automation.
- **Signature Failures**: Track signature verification failures to detect tampering attempts.

## 5. Input Validation & Sanitization

### 5.1 Request Validation
- **Schema Validation**: Validate all incoming requests against predefined schemas.
- **Type Checking**: Ensure all parameters have the expected types.
- **Range Validation**: Verify numeric values are within acceptable ranges.
- **Format Validation**: Check that string inputs match expected formats.
- **Signature Verification**: Validate signatures on critical game actions.

### 5.2 Sanitization
- **Input Cleaning**: Remove potentially harmful characters from all inputs.
- **Normalization**: Normalize inputs to consistent formats before processing.
- **Size Limiting**: Enforce maximum sizes for all input fields.
- **Message Validation**: Validate every secure message based on its event type.

### 5.3 Error Handling
- **Generic Error Messages**: Return generic error messages to clients to avoid information leakage.
- **Detailed Logging**: Log detailed error information server-side for debugging.
- **Rate Limiting**: Implement escalating timeouts for repeated invalid requests.
- **Silent Failures**: Critical security failures do not provide detailed error feedback to clients.

## 6. Network Security

### 6.1 Transport Security
- **WebSocket Security**: Use secure WebSocket connections (WSS).
- **HTTPS**: Serve all content over HTTPS.
- **Content Security Policy**: Implement strict CSP headers.
- **Secure Message Protocol**: Implement the `SecureMessage` wrapper for all game events.

### 6.2 Denial of Service Protection
- **Request Rate Limiting**: Limit requests per IP address.
- **Connection Limiting**: Limit concurrent connections per IP.
- **Resource Monitoring**: Monitor server resource usage and implement throttling.
- **Signature Verification Costs**: Limit the number of signature verifications per second.

### 6.3 State Expiration
- **Session Timeout**: Implement session expiration for inactive games.
- **Resource Cleanup**: Properly clean up resources for abandoned games.
- **Reconnection Window**: Allow a limited window for reconnection after disconnection.
- **Token Revocation**: Revoke tokens when players leave or are disconnected for too long.

## 7. Implementation Details

### 7.1 WebSocketController
The WebSocketController manages all WebSocket communication, including:
- Authentication challenges and responses
- Secure message validation
- Event routing to appropriate services
- Broadcasting game events with proper security

### 7.2 AuthenticationService
The AuthenticationService handles authentication-related operations:
- Token generation and management
- Challenge generation
- Signature verification
- Token revocation

### 7.3 Constant-Time Comparison
For operations like BP allocation that must be secure against timing attacks:
- Use constant-time comparison algorithms
- Process all actions in fixed time regardless of input values
- Avoid early returns and conditional exits in security-sensitive code
- Add random timing noise to further mask processing times

### 7.4 Client Security Implementation
The client implements corresponding security measures:
- Proper token and secret storage
- Challenge response generation
- Message signing
- Nonce generation
- Timestamp validation

## 8. Player Identification and Chat Security

### 8.1 Player Name Security
- **Input Validation**: Validate player names against allowed character sets.
- **Length Restrictions**: Enforce minimum and maximum length requirements.
- **Content Filtering**: Filter out inappropriate or offensive names.
- **Storage Security**: Store player names with appropriate encoding.
- **Display Escaping**: Properly escape player names when rendering in UI.

### 8.2 Chat Security
- **Message Filtering**: Implement text content filtering for inappropriate language.
- **Rate Limiting**: Prevent spam by limiting message frequency.
- **Message Size**: Restrict maximum message length.
- **Input Sanitization**: Escape all user input to prevent script injection.
- **Abuse Reporting**: Allow players to report inappropriate chat behavior.

### 8.3 Spectator Security
- **Spectator Isolation**: Prevent spectators from affecting game state.
- **Delayed Broadcasting**: Implement configurable delay for spectator view to prevent cheating.
- **Limited Permissions**: Ensure spectator sessions have minimal access rights.
- **Connection Monitoring**: Monitor for suspicious patterns like multiple connections from same IP.
- **Identity Separation**: Prevent players from simultaneously being spectators in their own game.

### 9.1 Server-Side Security
- **Input Validation Middleware**: Validate all incoming WebSocket and HTTP requests.
- **Authentication Middleware**: Verify session tokens on all protected routes.
- **Authorization Checks**: Ensure players can only access their own game data.
- **Secure Random Number Generation**: Use cryptographically secure RNG for tokens.

### 9.2 Client-Side Security
- **Token Storage**: Securely store session tokens in localStorage or sessionStorage.
- **Input Validation**: Validate user inputs before sending to server.
- **CSRF Protection**: Implement protection against cross-site request forgery.
- **Secure Communication**: Encrypt sensitive data before transmission.

### 9.3 Shared Security Utilities
- **Cryptographic Primitives**: Standard encryption and hashing functions.
- **Data Validation Schemas**: Define shared validation schemas.
- **Security Constants**: Define security-related constants (e.g., token expiration times).