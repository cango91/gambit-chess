# Gambit Chess Development Documentation

## 1. Project Overview

Gambit Chess is a non-deterministic chess variant featuring a Resource Management Duel system that introduces strategic uncertainty to piece captures. This documentation outlines the guidelines and specifications for AI-assisted development of the Gambit Chess web application, ensuring consistent implementation across development sessions.

## 2. Development Environment Guidelines

### 2.1 Cursor IDE Best Practices

- Initialize each development session by reviewing architecture documents
- Generate inline documentation for all created files using JSDoc format
- Create separate documentation files using the export pattern specified in section 6
- Update implementation status in documentation after completing each component
- Maintain decoupling between system layers as outlined in the architecture section
- Reference existing components by importing documentation rather than reimplementing

### 2.2 Code Generation Parameters

- Focus on creating modular, reusable components
- Generate unit tests for core game logic components
- Implement thorough error handling and logging
- Validate game state transitions to ensure rule compliance
- Document all public interfaces and state management approaches

## 3. Technical Architecture
[See diagram](./docs/architecture/TECHNICAL_ARCHITECTURE.mmd)

### 3.1 Architecture Principles

The Gambit Chess application follows a strict separation of concerns with these key architectural boundaries:

1. **Domain Layer**: Contains game rules, entities, and core logic independent of any UI or network concerns
2. **Presentation Layer**: Manages rendering and user interactions without game rule knowledge
3. **Network Layer**: Handles client-server communication using standardized DTOs
4. **State Management**: Centralizes game state with clear update patterns

### 3.2 Client Architecture

The client application employs a layered architecture:

- **UI Layer**: React components rendering the game board and UI elements
- **Presentation Layer**: Translates domain events to visual representations
- **Client Game Logic**: Implements client-side validation and game flow
- **Client Network Layer**: Manages WebSocket connections and API calls
- **Client State Store**: Maintains client-side game state

### 3.3 Server Architecture

The server follows a similar layered approach:

- **API Layer**: Exposes endpoints for game operations and matchmaking
- **Server Game Logic**: Validates moves and implements game rules
- **State Manager**: Maintains active game states and manages persistence
- **Matchmaking Service**: Pairs players for online matches
- **AI Opponent**: Implements computer opponents of varying difficulty

### 3.4 Shared Domain

Both client and server share domain models to ensure consistency:

- **Game Rules Module**: Encapsulates chess and Gambit Chess rules
- **Game Entities**: Defines pieces, board, and game state structures
- **Events System**: Standardizes game events across the application
- **Data Transfer Objects**: Structures for network communication

## 4. Technical Specifications

### 4.1 Frontend Specifications

- **Framework**: React with functional components and hooks
- **3D Rendering**: Three.js for chess board and pieces
- **State Management**: React Context + useReducer or Redux
- **Styling**: CSS Modules or styled-components
- **Animation**: GSAP for game animations
- **Network**: Socket.io client for real-time communication
- **Storage**: LocalStorage for game history and settings

### 4.2 Backend Specifications

- **Runtime**: Node.js with Express
- **Game Engine**: Custom implementation with optional chess.js integration
- **Real-time Communication**: Socket.io for game state updates
- **Temporary Storage**: Redis for matchmaking and active games
- **AI**: Minimax algorithm with alpha-beta pruning for computer opponents

### 4.3 Communication Protocol

- WebSocket events for real-time game updates
- RESTful API for game creation and matchmaking
- Standardized DTOs for all network communications

## 5. Implementation Plan

### 5.1 Phase 1: Core Game Engine

1. Implement chess board representation
2. Develop piece movement validation
3. Create Resource Management Duel system
4. Implement Battle Points allocation and regeneration
5. Build game state management

### 5.2 Phase 2: Server Implementation

1. Develop game session management
2. Implement matchmaking service
3. Create AI opponent with multiple difficulty levels
4. Build WebSocket communication layer
5. Implement temporary state persistence

### 5.3 Phase 3: Client Implementation

1. Develop 3D chess board using Three.js
2. Create UI components for game interaction
3. Implement client-side game state management
4. Build Battle Points visualization
5. Develop animations for moves and captures

### 5.4 Phase 4: Integration and Polish

1. Connect client and server components
2. Implement full game flow
3. Add sound effects and visual feedback
4. Optimize for mobile experience
5. Perform end-to-end testing

## 6. Documentation Standards

### 6.1 Component Documentation Template

Each component should export documentation following this pattern:

```javascript
/**
 * @component ComponentName
 * @description Detailed description of the component's purpose and functionality
 * @dependencies List of dependencies and imported modules
 * @props {Type} propName - Description of each prop
 * @state {Type} stateName - Description of internal state
 * @methods
 *   - methodName(param: Type): ReturnType - Description
 * @events
 *   - eventName - Description of events emitted
 * @example
 *   // Usage example
 */
```

### 6.2 Module Documentation

Each module should export its documentation for reference by other modules:

```javascript
// At the end of each module file
export const __documentation = {
  name: "ModuleName",
  purpose: "Description of module purpose",
  publicAPI: {
    // Document public methods and properties
  },
  dependencies: [
    // List module dependencies
  ],
  stateManagement: "Description of state management approach",
  implementationStatus: "Complete/In Progress/Planned"
};
```

## 7. Game Logic Specifications
[Diagram](./docs/architecture/GAME_FLOW.mmd)


### 7.1 Battle Points System

The Battle Points (BP) system must be implemented with the following requirements:

- Initial BP pool: 39 points per player (sum of classic chess piece values)
- BP allocation during duels: Secret allocation up to piece's BP Capacity
- BP Capacity: Equal to classic chess piece value (1 for pawn, 3 for bishop, etc.)
- Maximum BP: 10 for any single piece
- BP Cost Doubling: Allocating beyond piece's capacity doubles the BP cost
- BP Regeneration: Various chess tactics generate BP as specified in game rules

### 7.2 Resource Management Duel

The duel system must implement these core mechanics:

- Triggered on any capture attempt
- Both players secretly allocate BP
- Higher allocation wins the duel
- All allocated BP is deducted regardless of outcome
- Failed captures allow for tactical retreat option for long-range pieces

### 7.3 Game State Management

Game state must track:

- Current board position
- Each player's BP pool
- Move history
- Duel history
- Game phase (normal move, duel allocation, tactical retreat)
- Check/checkmate status

## 8. Testing Strategy

### 8.1 Unit Testing

- Game rules and logic components
- BP allocation and regeneration
- Duel resolution
- Board state validation

### 8.2 Integration Testing

- Client-server communication
- Game state synchronization
- Move validation across network

### 8.3 End-to-End Testing

- Complete game flow testing
- AI opponent behavior
- Matchmaking functionality

## 9. Code Structure Guidelines

### 9.1 Decoupling Strategies

To ensure proper separation of concerns, implement these decoupling approaches:

1. **Interface-based Programming**: Define clear interfaces between components
2. **Event-driven Communication**: Use events for cross-component communication
3. **Dependency Injection**: Pass dependencies rather than creating them internally
4. **Model-View-Controller Pattern**: Separate data, presentation, and control logic
5. **Command Pattern**: Encapsulate operations as objects
6. **Observer Pattern**: For UI updates based on state changes

### 9.2 Client Code Organization

- React components should be presentational only, without game logic
- Game logic should be implemented in custom hooks or service classes
- Network communication should be abstracted behind service interfaces
- State updates should follow unidirectional data flow

### 9.3 Server Code Organization

- Route handlers should delegate to service classes
- Game logic should be implemented in dedicated service classes
- WebSocket events should be handled by specialized controllers
- AI logic should be contained in isolated modules

## 10. API and WebSocket Protocol

### 10.1 REST API Endpoints

```
POST /api/games/create             // Create new game vs AI
POST /api/matchmaking/join         // Join matchmaking queue
GET  /api/games/:gameId/state      // Get current game state
```

### 10.2 WebSocket Events

```
// Client -> Server
'move:submit'                      // Submit a move
'duel:allocate'                    // Allocate BP during duel
'retreat:select'                   // Select tactical retreat position

// Server -> Client
'game:state'                       // Updated game state
'duel:start'                       // Duel initiated
'duel:result'                      // Duel resolution
'game:end'                         // Game over
```

### 10.3 Data Transfer Objects

Define consistent DTOs for all network communication:

```typescript
// Example DTO structure
interface MoveDTO {
  gameId: string;
  from: Position;
  to: Position;
  timestamp: number;
}

interface DuelAllocationDTO {
  gameId: string;
  battlePoints: number;
  timestamp: number;
}
```

## 11. AI Implementation Guidelines

### 11.1 AI Difficulty Levels

- **Beginner**: Random moves with basic capture prioritization
- **Intermediate**: Simple evaluation function with limited lookahead
- **Advanced**: Enhanced evaluation with deeper search
- **Expert**: Full minimax with alpha-beta pruning and sophisticated evaluation

### 11.2 Evaluation Function Components

The AI evaluation function should consider:

- Material balance (piece values)
- Battle Points balance
- Board position (piece activity, king safety)
- Attack potential
- Defense structures

## 12. Development Milestones

1. **Foundation**: Basic chess board representation and move validation
2. **Core Mechanics**: Implement Resource Management Duel system
3. **Server Infrastructure**: WebSocket communication and game state management
4. **Client Rendering**: 3D board with Three.js
5. **Integration**: Connect client and server components
6. **AI Opponents**: Implement computer opponents
7. **Matchmaking**: Enable online play
8. **Polish**: Add animations, sounds, and visual feedback
9. **Testing & Optimization**: Ensure mobile compatibility and performance