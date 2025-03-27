# Domain Boundary Definition Document

## 1. Core Principles

### 1.1 Server Authority
- **Single Source of Truth**: The server is the only authoritative source of game state.
- **Rule Enforcement**: All game rules are enforced by the server, regardless of client-side validation.
- **State Progression**: Only the server can advance the official game state.
- **Randomness and Timing**: Any random elements or timing-sensitive operations must be server-controlled.

### 1.2 Client Responsibilities
- **Rendering and Display**: Presenting the game state to the user.
- **Input Collection**: Gathering player inputs and intentions.
- **User Experience**: Providing feedback, animations, and a responsive interface.
- **Non-authoritative Validation**: Performing basic move validation for UX purposes only.
- **Prediction**: Optionally implementing optimistic updates before server confirmation.

### 1.3 Shared Domain
- **Data Transfer Objects (DTOs)**: Structures for client-server communication.
- **Type Definitions**: Common types used across the system.
- **Utility Functions**: Pure functions with no side effects or game state dependencies.
- **Constants**: Only truly immutable values that will never change for balancing.

### 1.4 Trust Boundaries
- **Zero Trust from Client**: The server must verify all client inputs.
- **Hidden Information**: Server must never send information that should be hidden from a player.
- **Input Sanitization**: All client inputs must be sanitized and validated.
- **Authentication**: All communication must be authenticated and authorized.

## 2. Domain-Specific Boundaries

### 2.1 Game State
- **Server Domain**: 
  - Full game state including hidden information
  - Complete BP pools for both players
  - Move history and state for repetition detection
  - Game session management
  - Previous board states for de novo tactical assessment
  - Chess timer control and enforcement
  - Time remaining for each player
  - Chat message history and broadcasting
  - Spectator management and visibility filtering
  - Player identification

- **Client Domain**: 
  - Visible subset of game state
  - Only the player's own BP pool (opponent's remains hidden)
  - Local move highlighting
  - Animation state
  - UI state for player interaction
  - Display of both players' remaining time
  - Chat interface and message display
  - Player name display
  - Spectator count display

- **Shared Domain**: 
  - GameStateDTO (filtered for visibility)
  - Position and Coordinate types
  - MoveDTO for communicating moves

### 2.2 Battle Points System
- **Server Domain**: 
  - BP allocation processing and resolution
  - BP pool tracking for both players
  - BP regeneration calculations based on de novo tactics only
  - Previous board state tracking to identify new tactical advantages
  - All BP-related rules enforcement

- **Client Domain**: 
  - BP allocation interface
  - Visual representation of player's own BP only
  - "?" representation for opponent's BP (until duel resolution)
  - Animated feedback of duel outcomes
  - Display of opponent's BP allocation after duel resolution

- **Shared Domain**: 
  - BPAllocationDTO
  - Duel outcome notification structures

### 2.3 Movement and Captures
- **Server Domain**: 
  - Authoritative move validation
  - Capture resolution via duel system
  - Final tactical retreat validation (board state verification)
  - Check and checkmate detection
  - Tracking board state changes for de novo tactical advantage detection

- **Client Domain**: 
  - Move input collection
  - Preliminary move validation (for UX)
  - Movement animation
  - Highlighting valid moves
  - Displaying tactical retreat options

- **Shared Domain**: 
  - Move and Position types
  - Basic chess piece movement patterns
  - Knight Retreat Table (pre-computed)
  - Tactical Retreat Calculation for all pieces
  - Long-range piece retreat validation (along attack axis)
  - Retreat cost calculation functions
  - Check detection algorithm (for UX validation, with server remaining authoritative)

### 2.6 Configuration
- **Server Domain**: 
  - Game balance parameters
  - BP regeneration rates
  - Initial BP pools
  - Maximum BP allocations

- **Client Domain**: 
  - UI configuration
  - Animation timing
  - Visual presentation

- **Shared Domain**: 
  - Immutable chess rules (how pieces move)
  - Board dimensions

## 3. Trust and Security Boundaries

### 3.1 Server Trust Model
- Must validate all moves against current game state
- Must validate BP allocations against player's available BP
- Must validate tactical retreats against valid options
- Must enforce all timing controls
- Must enforce chess timer rules and handle timeouts
- Must prevent information leakage about opponent's BP pool (until duel resolution)
- Must track previous board states to properly identify de novo tactical advantages

### 3.2 Client Trust Assumptions
- Client contains only the information it should know
- Client-side validation is for UX improvement only
- Client predictions are always subject to server confirmation
- Client cannot be trusted with hidden information
- Client should never receive opponent's actual BP values

### 3.3 Shared Code Trust
- No game logic that affects state should exist in shared code
- Shared utilities must be pure functions without side effects
- Type definitions must not include implementation details
- Shared code must not contain logic that could reveal hidden information