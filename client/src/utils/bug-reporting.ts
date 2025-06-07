/**
 * Bug Reporting Utilities
 * 
 * Client-side utilities for capturing comprehensive context information
 * when users submit bug reports. Designed to gather maximum debugging
 * information automatically while keeping the UX simple.
 */

import * as shared from '@gambit-chess/shared';

/**
 * Global context tracking for bug reporting
 */
class BugReportingContext {
  private userActions: shared.UserAction[] = [];
  private consoleLogs: shared.ConsoleEntry[] = [];
  private networkRequests: shared.NetworkRequest[] = [];
  private recentErrors: Array<{ message: string; stack?: string; timestamp: number }> = [];
  private sessionId: string;
  private sessionStartTime: number;
  private featuresUsed: Set<string> = new Set();

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.setupErrorTracking();
    this.setupConsoleTracking();
    this.setupNetworkTracking();
  }

  /**
   * Track user action
   */
  trackAction(action: Omit<shared.UserAction, 'timestamp'>): void {
    const userAction: shared.UserAction = {
      ...action,
      timestamp: Date.now()
    };

    this.userActions.push(userAction);
    
    // Keep only last 20 actions
    if (this.userActions.length > 20) {
      this.userActions.shift();
    }

    // Track feature usage
    if (action.type === 'duel_allocation') {
      this.featuresUsed.add('duel_system');
    } else if (action.type === 'retreat') {
      this.featuresUsed.add('tactical_retreat');
    }
  }

  /**
   * Mark feature as used
   */
  markFeatureUsed(feature: string): void {
    this.featuresUsed.add(feature);
  }

  /**
   * Capture current system context
   */
  captureSystemContext(): shared.SystemContext {
    const nav = navigator as any;
    
    return {
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      devicePixelRatio: window.devicePixelRatio || 1,
      isMobile: this.detectMobile(),
      isTablet: this.detectTablet(),
      platform: this.detectPlatform(),
      memoryUsage: this.getMemoryUsage(),
      connectionType: nav.connection?.type,
      effectiveType: nav.connection?.effectiveType,
      buildVersion: import.meta.env.VITE_APP_VERSION || 'unknown',
      deploymentEnvironment: import.meta.env.MODE as 'development' | 'staging' | 'production'
    };
  }

  /**
   * Capture current user context
   */
  captureUserContext(): shared.UserContext {
    return {
      sessionId: this.sessionId,
      sessionDuration: Date.now() - this.sessionStartTime,
      pageUrl: window.location.href,
      referrer: document.referrer || undefined,
      recentActions: [...this.userActions],
      activeComponent: this.getActiveComponent(),
      focusedElement: this.getFocusedElement(),
      recentErrors: [...this.recentErrors],
      featuresUsed: Array.from(this.featuresUsed)
    };
  }

  /**
   * Capture debug data
   */
  captureDebugData(): shared.DebugData {
    return {
      consoleLogs: [...this.consoleLogs],
      networkRequests: [...this.networkRequests],
      storageState: {
        localStorage: this.getStorageState('localStorage'),
        sessionStorage: this.getStorageState('sessionStorage')
      },
      componentTree: this.getReactComponentTree(),
      applicationState: this.getApplicationState(),
      websocketState: this.getWebSocketState(),
      performanceMetrics: this.getPerformanceMetrics()
    };
  }

  /**
   * Setup error tracking
   */
  private setupErrorTracking(): void {
    window.addEventListener('error', (event) => {
      this.recentErrors.push({
        message: event.message,
        stack: event.error?.stack,
        timestamp: Date.now()
      });

      // Keep only last 10 errors
      if (this.recentErrors.length > 10) {
        this.recentErrors.shift();
      }
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.recentErrors.push({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        timestamp: Date.now()
      });

      if (this.recentErrors.length > 10) {
        this.recentErrors.shift();
      }
    });
  }

  /**
   * Setup console tracking
   */
  private setupConsoleTracking(): void {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = (...args) => {
      this.addConsoleEntry('log', args.join(' '));
      originalLog.apply(console, args);
    };

    console.warn = (...args) => {
      this.addConsoleEntry('warn', args.join(' '));
      originalWarn.apply(console, args);
    };

    console.error = (...args) => {
      this.addConsoleEntry('error', args.join(' '), new Error().stack);
      originalError.apply(console, args);
    };
  }

  /**
   * Setup network request tracking
   */
  private setupNetworkTracking(): void {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = Date.now();
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
      const method = args[1]?.method || 'GET';

      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;

        this.addNetworkRequest({
          url,
          method,
          status: response.status,
          duration,
          timestamp: startTime,
          size: Number(response.headers.get('content-length')) || undefined
        });

        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        this.addNetworkRequest({
          url,
          method,
          status: 0,
          duration,
          timestamp: startTime,
          error: error instanceof Error ? error.message : 'Network error'
        });

        throw error;
      }
    };
  }

  private addConsoleEntry(level: shared.ConsoleEntry['level'], message: string, stack?: string): void {
    this.consoleLogs.push({
      level,
      message,
      timestamp: Date.now(),
      stack
    });

    // Keep only last 50 entries
    if (this.consoleLogs.length > 50) {
      this.consoleLogs.shift();
    }
  }

  private addNetworkRequest(request: shared.NetworkRequest): void {
    this.networkRequests.push(request);

    // Keep only last 20 requests
    if (this.networkRequests.length > 20) {
      this.networkRequests.shift();
    }
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private detectMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  private detectTablet(): boolean {
    return /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
  }

  private detectPlatform(): string {
    const userAgent = navigator.userAgent;
    if (/Windows/i.test(userAgent)) return 'Windows';
    if (/Mac/i.test(userAgent)) return 'macOS';
    if (/Linux/i.test(userAgent)) return 'Linux';
    if (/Android/i.test(userAgent)) return 'Android';
    if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iOS';
    return 'Unknown';
  }

  private getMemoryUsage(): { used: number; total: number } | undefined {
    const memory = (performance as any).memory;
    if (memory) {
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize
      };
    }
    return undefined;
  }

  private getActiveComponent(): string | undefined {
    // Try to determine active React component from DOM
    const activeElement = document.activeElement;
    if (activeElement) {
      return activeElement.getAttribute('data-component') || 
             activeElement.className || 
             activeElement.tagName;
    }
    return undefined;
  }

  private getFocusedElement(): string | undefined {
    const focused = document.activeElement;
    if (focused && focused !== document.body) {
      return focused.tagName.toLowerCase() + 
             (focused.id ? `#${focused.id}` : '') +
             (focused.className ? `.${focused.className.split(' ').join('.')}` : '');
    }
    return undefined;
  }

  private getStorageState(storageType: 'localStorage' | 'sessionStorage'): Record<string, string> {
    const storage = window[storageType];
    const state: Record<string, string> = {};
    
    try {
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key) {
          state[key] = storage.getItem(key) || '';
        }
      }
    } catch (error) {
      // Storage access might be blocked
    }
    
    return state;
  }

  private getReactComponentTree(): string | undefined {
    // This would require integration with React DevTools or custom tracking
    return undefined;
  }

  private getApplicationState(): any {
    // This would capture Redux store state or other global state
    return undefined;
  }

  private getWebSocketState(): shared.DebugData['websocketState'] {
    // This would need to be integrated with the WebSocket client
    return undefined;
  }

  private getPerformanceMetrics(): shared.DebugData['performanceMetrics'] {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    return {
      renderTimes: [],
      memorySnapshots: [],
      networkLatency: navigation ? navigation.responseEnd - navigation.requestStart : undefined
    };
  }
}

// Global instance
const bugReportingContext = new BugReportingContext();

/**
 * Track a user action for bug reporting
 */
export function trackUserAction(action: Omit<shared.UserAction, 'timestamp'>): void {
  bugReportingContext.trackAction(action);
}

/**
 * Mark a feature as used
 */
export function markFeatureUsed(feature: string): void {
  bugReportingContext.markFeatureUsed(feature);
}

/**
 * Capture all context data for bug reporting
 */
export function captureContextForBugReport(): {
  systemContext: shared.SystemContext;
  userContext: shared.UserContext;
  debugData: shared.DebugData;
} {
  return {
    systemContext: bugReportingContext.captureSystemContext(),
    userContext: bugReportingContext.captureUserContext(),
    debugData: bugReportingContext.captureDebugData()
  };
}

/**
 * Submit a bug report to the server
 */
export async function submitBugReport(
  submission: {
    title: string;
    description: string;
    category: string;
    severity: string;
  },
  gameId?: string
): Promise<{ success: boolean; reportId?: string; error?: string }> {
  try {
    const context = captureContextForBugReport();
    
    const response = await fetch('/api/bug-reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        submission,
        systemContext: context.systemContext,
        userContext: context.userContext,
        debugData: context.debugData,
        gameId
      })
    });

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('Error submitting bug report:', error);
    return {
      success: false,
      error: 'Failed to submit bug report'
    };
  }
} 