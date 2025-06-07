/**
 * Bug Reporting System
 * 
 * Captures comprehensive debugging information when users report issues.
 * Designed for simple UX on the frontend with maximum information capture behind the scenes.
 */

export interface BugReport {
  id: string;
  timestamp: number;
  
  // User-provided information (simple UX)
  title: string;
  description: string;
  category: BugCategory;
  severity: BugSeverity;
  
  // Automatically captured context
  gameContext?: GameContext;
  systemContext: SystemContext;
  userContext: UserContext;
  
  // Debugging artifacts
  debugData: DebugData;
  
  // Processing status
  status: BugReportStatus;
  assignedTo?: string;
  resolution?: string;
  resolvedAt?: number;
}

export enum BugCategory {
  GAMEPLAY = 'gameplay',
  UI_UX = 'ui_ux',
  PERFORMANCE = 'performance',
  DUEL_SYSTEM = 'duel_system',
  BP_CALCULATION = 'bp_calculation',
  TACTICAL_RETREAT = 'tactical_retreat',
  MOBILE = 'mobile',
  OTHER = 'other'
}

export enum BugSeverity {
  CRITICAL = 'critical',      // Game breaking, unable to play
  HIGH = 'high',             // Major functionality affected
  MEDIUM = 'medium',         // Minor functionality affected
  LOW = 'low',              // Cosmetic or quality of life
  ENHANCEMENT = 'enhancement' // Feature request
}

export enum BugReportStatus {
  SUBMITTED = 'submitted',
  TRIAGED = 'triaged',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

/**
 * Game-specific context at time of bug report
 */
export interface GameContext {
  gameId: string;
  gameType: 'practice' | 'human' | 'ai' | undefined;
  gameStatus: string;
  currentTurn: 'w' | 'b';
  moveCount: number;
  
  // Current game state snapshot
  position: string; // FEN string
  moveHistory: Array<{
    notation: string;
    captureAttempt?: boolean;
    duelResult?: any;
  }>;
  
  // Player information
  whitePlayer: {
    id: string;
    battlePoints: number;
    isAI: boolean;
  };
  blackPlayer: {
    id: string;
    battlePoints: number;
    isAI: boolean;
  };
  
  // BP and tactical information
  bpCalculationReport?: any;
  lastMoveAnalysis?: {
    detectedTactics: string[];
    bpRegeneration: number;
    formula?: string;
  };
  
  // Active game mechanics
  pendingDuel?: {
    attackingPiece: string;
    defendingPiece: string;
    allocations?: { attacker?: number; defender?: number };
  };
  
  tacticalRetreatState?: {
    retreatingPiece: string;
    availableSquares: string[];
  };
  
  // Server-side analysis data
  serverAnalysis?: {
    fullGameStateSerialized: string;
    serverMetrics: {
      memoryUsage: any;
      uptime: number;
      timestamp: number;
    };
    recentBPAnalysis: Array<{
      move: string;
      detectedTactics: string[];
      bpChange: number;
      timestamp?: number;
    }>;
    gameConfiguration: any;
    validationHistory: any[];
    socketRoomInfo: {
      gameRoomId: string;
    };
  };
}

/**
 * System and browser context
 */
export interface SystemContext {
  // Browser information
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
  devicePixelRatio: number;
  
  // Platform detection
  isMobile: boolean;
  isTablet: boolean;
  platform: string; // iOS, Android, Windows, macOS, Linux
  
  // Performance metrics
  memoryUsage?: {
    used: number;
    total: number;
  };
  
  // Network information
  connectionType?: string;
  effectiveType?: string;
  
  // Application state
  buildVersion: string;
  deploymentEnvironment: 'development' | 'staging' | 'production';
}

/**
 * User behavior and interaction context
 */
export interface UserContext {
  // Session information
  sessionId: string;
  sessionDuration: number; // milliseconds since page load
  pageUrl: string;
  referrer?: string;
  
  // User interaction history (last 10 actions)
  recentActions: UserAction[];
  
  // UI state
  activeComponent?: string;
  focusedElement?: string;
  
  // Error history (JavaScript errors in this session)
  recentErrors: Array<{
    message: string;
    stack?: string;
    timestamp: number;
  }>;
  
  // Feature usage
  featuresUsed: string[]; // e.g., ['duel_system', 'tactical_retreat', 'bp_display']
}

export interface UserAction {
  type: 'click' | 'move' | 'duel_allocation' | 'retreat' | 'navigation';
  target: string; // CSS selector or component name
  timestamp: number;
  details?: Record<string, any>;
}

/**
 * Comprehensive debugging data
 */
export interface DebugData {
  // Console logs (last 50 entries)
  consoleLogs: ConsoleEntry[];
  
  // Network requests (last 20)
  networkRequests: NetworkRequest[];
  
  // Local storage / session storage state
  storageState: {
    localStorage: Record<string, string>;
    sessionStorage: Record<string, string>;
  };
  
  // React component tree (if applicable)
  componentTree?: string;
  
  // Redux/state management state
  applicationState?: any;
  
  // WebSocket connection state
  websocketState?: {
    connected: boolean;
    lastMessage?: any;
    connectionHistory: Array<{
      event: 'connect' | 'disconnect' | 'error';
      timestamp: number;
      details?: string;
    }>;
  };
  
  // Performance measurements
  performanceMetrics?: {
    renderTimes: number[];
    memorySnapshots: Array<{
      timestamp: number;
      heapUsed: number;
    }>;
    networkLatency?: number;
  };
}

export interface ConsoleEntry {
  level: 'log' | 'warn' | 'error' | 'info' | 'debug';
  message: string;
  timestamp: number;
  stack?: string;
}

export interface NetworkRequest {
  url: string;
  method: string;
  status: number;
  duration: number;
  timestamp: number;
  size?: number;
  error?: string;
}

/**
 * Bug report submission data (what users fill out)
 */
export interface BugReportSubmission {
  title: string;
  description: string;
  category: BugCategory;
  severity: BugSeverity;
  
  // Optional user-provided context
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  additionalNotes?: string;
  
  // Optional file attachments (screenshots, etc.)
  attachments?: Array<{
    name: string;
    type: string;
    size: number;
    data: string; // base64 encoded
  }>;
}

/**
 * Server-side bug report processing
 */
export interface BugReportAnalysis {
  reportId: string;
  
  // Automated analysis
  automaticClassification: {
    suggestedCategory: BugCategory;
    confidence: number;
    reasoning: string[];
  };
  
  duplicateDetection: {
    isDuplicate: boolean;
    similarReports: string[]; // IDs of similar reports
    similarity: number;
  };
  
  // Priority scoring
  priorityScore: number;
  priorityFactors: string[];
  
  // Technical analysis
  technicalAnalysis: {
    affectedComponents: string[];
    potentialCauses: string[];
    reproducibilityScore: number;
  };
} 