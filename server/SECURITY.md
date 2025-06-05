# Gambit Chess Security Model

## Overview

Gambit Chess implements a **dual authentication system** supporting both registered users and secure anonymous sessions. This document outlines the security measures implemented to prevent session hijacking, unauthorized access, and information leakage.

## 🚨 **Critical Security Vulnerability - RESOLVED**

### **Previous Vulnerability (Fixed)**
The original anonymous user system was **critically insecure**:
- Raw UUIDs used for identification
- No cryptographic verification
- Persistent session hijacking possible
- No session expiration
- Anyone knowing a UUID could impersonate the user

### **Security Solution Implemented**
Replaced with **cryptographically signed anonymous sessions** with:
- JWT-signed session tokens
- Client fingerprinting
- Session expiration (24 hours)
- Server-side session validation
- Automatic session rotation

## Authentication Methods

### 1. **Registered User Authentication (JWT)**
```
Access Token: 15 minutes expiration
Refresh Token: 7 days expiration with rotation
Family-based token blacklisting for security
```

### 2. **Anonymous Session Authentication (Signed Sessions)**
```
Session Token: 24 hours expiration
Client Fingerprinting: Browser + IP based
Cryptographic Signing: HMAC-SHA256
Redis Storage: Server-side session data
```

## Anonymous Session Security Features

### **1. Cryptographic Signatures**
```typescript
// Session tokens are JWT-signed with server secret
const sessionToken = jwt.sign({
  sessionId,
  clientFingerprint,
  type: 'anonymous',
  iat: timestamp,
  exp: expiration
}, ANONYMOUS_SESSION_SECRET);
```

### **2. Client Fingerprinting**
```typescript
// Prevents cross-device session hijacking
const fingerprint = sha256(
  userAgent + "|" + 
  acceptLanguage + "|" + 
  xForwardedFor
);
```

### **3. Session Validation**
```typescript
// Multi-layer validation on every request
1. JWT signature verification
2. Token expiration check
3. Client fingerprint match
4. Redis session existence
5. Last activity update
```

### **4. Automatic Expiration**
- **Redis TTL**: 24 hours with automatic cleanup
- **JWT Expiration**: Built-in token expiration
- **Activity Tracking**: Last activity timestamp
- **Cleanup Task**: Removes sessions inactive >48 hours

## Security Boundaries

### **Information Hiding**
```typescript
// Battle points hidden from unauthorized users
battlePoints: isAuthorized ? actualBP : 0

// Player IDs masked for non-participants  
playerId: isAuthorized ? realId : 'Anonymous'
```

### **Authorization Checks**
```typescript
// Every game operation validates user access
const isAuthorized = 
  gameState.whitePlayer.id === userId || 
  gameState.blackPlayer.id === userId;
```

### **WebSocket Security**
```typescript
// Socket authentication on every connection
1. JWT token validation OR
2. Anonymous session token + fingerprint validation
3. Connection rejection for invalid auth
```

## Session Lifecycle

### **Anonymous Session Creation**
```
1. Client requests session: POST /api/anonymous/session
2. Server generates fingerprint from headers
3. Server creates Redis session with TTL
4. Server returns signed JWT token
5. Client stores token securely
```

### **Session Validation**
```
1. Client sends token in requests/WebSocket auth
2. Server verifies JWT signature
3. Server validates client fingerprint match
4. Server checks Redis session exists
5. Server updates last activity timestamp
```

### **Session Refresh**
```
1. Client requests refresh: POST /api/anonymous/refresh
2. Server validates current token + fingerprint
3. Server generates new token with extended TTL
4. Server updates Redis session data
5. Client updates stored token
```

### **Session Revocation**
```
1. Client or server initiates revocation
2. Server removes session from Redis
3. All subsequent requests with that token fail
4. WebSocket connections using token are terminated
```

## API Security

### **Anonymous Session Endpoints**
```
POST /api/anonymous/session     - Create session
POST /api/anonymous/refresh     - Refresh session  
DELETE /api/anonymous/session   - Revoke session
GET /api/anonymous/session/:id/stats - Session info
```

### **Game Endpoints (Updated)**
```
All game endpoints now require either:
- Valid JWT token (registered users)
- Valid anonymous session token (anonymous users)

Raw UUIDs are NO LONGER accepted.
```

### **WebSocket Events (Updated)**
```
Socket authentication now requires:
- auth.token (JWT) OR
- auth.anonymousSessionToken (signed session)

Raw anonymousId is NO LONGER accepted.
```

## Environment Variables

```bash
# Anonymous Session Security
ANONYMOUS_SESSION_SECRET="strong-secret-change-in-production"

# Existing JWT Security  
ACCESS_TOKEN_SECRET="jwt-access-secret"
REFRESH_TOKEN_SECRET="jwt-refresh-secret"
```

## Attack Mitigation

### **Session Hijacking Prevention**
- Client fingerprinting makes stolen tokens useless on different devices
- Short token expiration limits damage window
- Server-side session storage allows immediate revocation

### **Replay Attack Prevention**
- JWT timestamps prevent old token reuse
- Session activity tracking detects suspicious patterns
- Redis TTL ensures eventual cleanup

### **Cross-Device Protection**
- Fingerprint includes User-Agent + Accept-Language + IP
- Tokens only work from the original client environment
- Stealing token doesn't enable cross-device access

### **Information Leakage Prevention**
- Battle points hidden from unauthorized viewers
- Player identities masked for non-participants
- Game state filtered based on user authorization

## Implementation Status

✅ **IMPLEMENTED**
- Cryptographically signed anonymous sessions
- Client fingerprinting validation
- Automatic session expiration
- WebSocket authentication update
- Game API security update
- Session management endpoints

✅ **SECURITY VERIFIED**
- No raw UUID acceptance
- All anonymous access requires valid session tokens
- Multi-layer validation on every request
- Proper information hiding enforced

## Migration Path

### **Breaking Changes**
```
❌ OLD: anonymousUserId: "uuid-string"
✅ NEW: anonymousSessionToken: "signed-jwt-token"

❌ OLD: socket.handshake.auth.anonymousId
✅ NEW: socket.handshake.auth.anonymousSessionToken
```

### **Client Integration**
```typescript
// 1. Create anonymous session
const response = await fetch('/api/anonymous/session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userAgent: navigator.userAgent,
    acceptLanguage: navigator.language
  })
});
const { sessionToken } = await response.json();

// 2. Use in API calls
await fetch('/api/games', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    gameType: 'ai',
    anonymousSessionToken: sessionToken
  })
});

// 3. Use in WebSocket
const socket = io(serverUrl, {
  auth: {
    anonymousSessionToken: sessionToken
  }
});
```

## Monitoring & Maintenance

### **Session Analytics**
- Track session creation rates
- Monitor suspicious fingerprint patterns
- Alert on unusual token validation failures

### **Cleanup Tasks**
- Automatic Redis TTL handles most cleanup
- Manual cleanup task for sessions inactive >48h
- Session statistics for debugging

### **Security Auditing**
- Log all session creation/validation failures
- Monitor for repeated invalid token attempts
- Track unusual client fingerprint changes

---

**The anonymous session hijacking vulnerability has been completely resolved with this implementation.** 