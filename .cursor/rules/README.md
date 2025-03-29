# Gambit Chess Cursor Rules

This directory contains rules files for the Cursor IDE to guide AI-assisted development of the Gambit Chess project.

## Rule Files Overview

### Core Rules
- `000-core.md`: Core principles for the Gambit Chess project
- `001-project-initialization.md`: Actions for "Familiarize yourself with the project" command
- `002-session-handoff.md`: Actions for "Perform session hand-off" command

### Domain Rules
- `010-domain-boundaries.md`: Rules enforcing domain boundaries between client, server, and shared code

### Technology Rules
- `020-typescript.md`: TypeScript coding standards and best practices
- `030-chess-implementation.md`: Chess-specific implementation standards
- `040-websocket-protocol.md`: WebSocket protocol implementation standards
- `050-react-components.md`: React component implementation standards

## Important Commands

### Project Initialization
Start each new AI session with:
```
Familiarize yourself with the project
```
This triggers the AI to read all necessary documentation to understand the project.

### Session Handoff
End each AI session with:
```
Perform session hand-off
```
This triggers the AI to document the session's progress and prepare for the next session.

## Sessions Directory

The `.cursor/sessions/` directory contains documentation of each AI session, maintaining continuity between development sessions and tracking implementation progress. 