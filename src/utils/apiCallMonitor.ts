/**
 * API Call Monitor - Track Supabase API calls for performance monitoring
 */

interface ApiCallLog {
  timestamp: number;
  endpoint: string;
  method: string;
  source: string;
}

class ApiCallMonitor {
  private calls: ApiCallLog[] = [];
  private sessionStart: number = Date.now();
  private isEnabled: boolean = true;

  /**
   * Log an API call
   */
  logCall(endpoint: string, method: string = 'GET', source: string = 'unknown'): void {
    if (!this.isEnabled) return;

    const call: ApiCallLog = {
      timestamp: Date.now(),
      endpoint,
      method,
      source
    };

    this.calls.push(call);

    // Keep only last 1000 calls to prevent memory issues
    if (this.calls.length > 1000) {
      this.calls = this.calls.slice(-1000);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Monitor] ${method} ${endpoint} (from: ${source})`);
    }
  }

  /**
   * Get call statistics for current session
   */
  getSessionStats(): {
    totalCalls: number;
    callsPerMinute: number;
    sessionDuration: number;
    callsByEndpoint: { [key: string]: number };
    callsBySource: { [key: string]: number };
    recentCalls: ApiCallLog[];
  } {
    const now = Date.now();
    const sessionDuration = now - this.sessionStart;
    const sessionMinutes = sessionDuration / (1000 * 60);

    // Group by endpoint
    const callsByEndpoint: { [key: string]: number } = {};
    const callsBySource: { [key: string]: number } = {};

    this.calls.forEach(call => {
      callsByEndpoint[call.endpoint] = (callsByEndpoint[call.endpoint] || 0) + 1;
      callsBySource[call.source] = (callsBySource[call.source] || 0) + 1;
    });

    return {
      totalCalls: this.calls.length,
      callsPerMinute: sessionMinutes > 0 ? this.calls.length / sessionMinutes : 0,
      sessionDuration,
      callsByEndpoint,
      callsBySource,
      recentCalls: this.calls.slice(-10) // Last 10 calls
    };
  }

  /**
   * Get calls in the last N minutes
   */
  getRecentCalls(minutes: number = 5): ApiCallLog[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.calls.filter(call => call.timestamp >= cutoff);
  }

  /**
   * Check if we're making too many calls
   */
  isExcessiveUsage(): boolean {
    const recentCalls = this.getRecentCalls(1); // Last minute
    return recentCalls.length > 10; // More than 10 calls per minute is excessive
  }

  /**
   * Reset monitoring data
   */
  reset(): void {
    this.calls = [];
    this.sessionStart = Date.now();
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Export data for analysis
   */
  exportData(): string {
    const stats = this.getSessionStats();
    return JSON.stringify({
      ...stats,
      exportTime: new Date().toISOString(),
      sessionStartTime: new Date(this.sessionStart).toISOString()
    }, null, 2);
  }

  /**
   * Display summary in console
   */
  logSummary(): void {
    const stats = this.getSessionStats();
    const sessionMinutes = Math.round(stats.sessionDuration / (1000 * 60) * 10) / 10;
    
    console.group('🔍 API Call Monitor Summary');
    console.log(`📊 Total Calls: ${stats.totalCalls}`);
    console.log(`⏱️  Session Duration: ${sessionMinutes} minutes`);
    console.log(`📈 Calls per Minute: ${Math.round(stats.callsPerMinute * 10) / 10}`);
    
    console.log('\n📍 Calls by Endpoint:');
    Object.entries(stats.callsByEndpoint)
      .sort(([,a], [,b]) => b - a)
      .forEach(([endpoint, count]) => {
        console.log(`  ${endpoint}: ${count} calls`);
      });
    
    console.log('\n🏷️  Calls by Source:');
    Object.entries(stats.callsBySource)
      .sort(([,a], [,b]) => b - a)
      .forEach(([source, count]) => {
        console.log(`  ${source}: ${count} calls`);
      });

    if (this.isExcessiveUsage()) {
      console.warn('⚠️  WARNING: Excessive API usage detected!');
    } else {
      console.log('✅ API usage is within normal limits');
    }
    
    console.groupEnd();
  }
}

// Export singleton instance
export const apiCallMonitor = new ApiCallMonitor();

// Auto-log summary every 5 minutes in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  setInterval(() => {
    apiCallMonitor.logSummary();
  }, 5 * 60 * 1000);
}

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).apiCallMonitor = apiCallMonitor;
}
