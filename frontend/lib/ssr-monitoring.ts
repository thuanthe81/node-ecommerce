/**
 * Comprehensive SSR monitoring and alerting system
 * Integrates with existing performance monitoring infrastructure
 */

import { SSRError, getSSREnvVar, isSSRContext } from './ssr-error-handling';

export interface SSRMonitoringConfig {
  enableErrorTracking: boolean;
  enablePerformanceTracking: boolean;
  enableAlerts: boolean;
  errorThreshold: number; // errors per minute
  performanceThreshold: number; // milliseconds
  alertCooldown: number; // minutes
}

export interface SSRMetrics {
  timestamp: string;
  operation: string;
  duration: number;
  success: boolean;
  error?: {
    code: string;
    message: string;
    isRetryable: boolean;
  };
  context: {
    url: string;
    userAgent: string;
    sessionId: string;
    buildId: string;
    environment: string;
  };
}

export interface SSRAlert {
  id: string;
  type: 'error_rate' | 'performance_degradation' | 'circuit_breaker_open';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: any;
  timestamp: string;
  resolved: boolean;
}

/**
 * SSR Monitoring service
 */
export class SSRMonitoringService {
  private config: SSRMonitoringConfig;
  private metrics: SSRMetrics[] = [];
  private alerts: SSRAlert[] = [];
  private lastAlertTime: Map<string, number> = new Map();

  constructor(config: Partial<SSRMonitoringConfig> = {}) {
    this.config = {
      enableErrorTracking: true,
      enablePerformanceTracking: true,
      enableAlerts: true,
      errorThreshold: 10, // 10 errors per minute
      performanceThreshold: 5000, // 5 seconds
      alertCooldown: 15, // 15 minutes
      ...config,
    };

    // Start periodic cleanup and analysis
    if (isSSRContext()) {
      this.startPeriodicTasks();
    }
  }

  /**
   * Records an SSR operation metric
   */
  recordMetric(
    operation: string,
    duration: number,
    success: boolean,
    error?: SSRError,
    additionalContext?: any
  ): void {
    if (!this.config.enablePerformanceTracking) return;

    const metric: SSRMetrics = {
      timestamp: new Date().toISOString(),
      operation,
      duration,
      success,
      error: error ? {
        code: error.code,
        message: error.message,
        isRetryable: error.isRetryable,
      } : undefined,
      context: {
        url: this.getCurrentUrl(),
        userAgent: this.getUserAgent(),
        sessionId: this.getSessionId(),
        buildId: getSSREnvVar('NEXT_BUILD_ID', 'unknown'),
        environment: getSSREnvVar('NODE_ENV', 'unknown'),
        ...additionalContext,
      },
    };

    this.metrics.push(metric);

    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Check for alerts
    if (this.config.enableAlerts) {
      this.checkForAlerts(metric);
    }

    // Send to monitoring endpoint
    this.sendMetricToEndpoint(metric);
  }

  /**
   * Records an SSR error
   */
  recordError(error: SSRError, context: string, additionalDetails?: any): void {
    if (!this.config.enableErrorTracking) return;

    const errorData = {
      timestamp: error.timestamp,
      context,
      code: error.code,
      message: error.message,
      isRetryable: error.isRetryable,
      shouldFallbackToCSR: error.shouldFallbackToCSR,
      technicalDetails: error.technicalDetails,
      userAgent: this.getUserAgent(),
      url: this.getCurrentUrl(),
      sessionId: this.getSessionId(),
      buildId: getSSREnvVar('NEXT_BUILD_ID', 'unknown'),
      environment: getSSREnvVar('NODE_ENV', 'unknown'),
      ...additionalDetails,
    };

    // Send to error tracking endpoint
    this.sendErrorToEndpoint(errorData);

    // Record as metric for alerting
    this.recordMetric(context, 0, false, error);
  }

  /**
   * Gets current SSR metrics summary
   */
  getMetricsSummary(timeWindowMinutes: number = 60): {
    totalOperations: number;
    successRate: number;
    averageDuration: number;
    errorRate: number;
    slowOperations: number;
    topErrors: Array<{ code: string; count: number }>;
  } {
    const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    const recentMetrics = this.metrics.filter(
      m => new Date(m.timestamp) > cutoffTime
    );

    if (recentMetrics.length === 0) {
      return {
        totalOperations: 0,
        successRate: 1,
        averageDuration: 0,
        errorRate: 0,
        slowOperations: 0,
        topErrors: [],
      };
    }

    const successfulOperations = recentMetrics.filter(m => m.success);
    const failedOperations = recentMetrics.filter(m => !m.success);
    const slowOperations = recentMetrics.filter(m => m.duration > this.config.performanceThreshold);

    const totalDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0);
    const averageDuration = totalDuration / recentMetrics.length;

    // Count errors by code
    const errorCounts = new Map<string, number>();
    failedOperations.forEach(m => {
      if (m.error) {
        const count = errorCounts.get(m.error.code) || 0;
        errorCounts.set(m.error.code, count + 1);
      }
    });

    const topErrors = Array.from(errorCounts.entries())
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalOperations: recentMetrics.length,
      successRate: successfulOperations.length / recentMetrics.length,
      averageDuration,
      errorRate: failedOperations.length / recentMetrics.length,
      slowOperations: slowOperations.length,
      topErrors,
    };
  }

  /**
   * Gets active alerts
   */
  getActiveAlerts(): SSRAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Resolves an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  /**
   * Checks for performance and error rate alerts
   */
  private checkForAlerts(metric: SSRMetrics): void {
    const now = Date.now();

    // Check error rate alert
    if (!metric.success) {
      const recentErrors = this.metrics.filter(m =>
        !m.success &&
        new Date(m.timestamp).getTime() > now - 60000 // Last minute
      );

      if (recentErrors.length >= this.config.errorThreshold) {
        this.createAlert('error_rate', 'high',
          `High error rate: ${recentErrors.length} errors in the last minute`,
          { errorCount: recentErrors.length, threshold: this.config.errorThreshold }
        );
      }
    }

    // Check performance degradation alert
    if (metric.duration > this.config.performanceThreshold) {
      const recentSlowOperations = this.metrics.filter(m =>
        m.duration > this.config.performanceThreshold &&
        new Date(m.timestamp).getTime() > now - 300000 // Last 5 minutes
      );

      if (recentSlowOperations.length >= 5) {
        this.createAlert('performance_degradation', 'medium',
          `Performance degradation detected: ${recentSlowOperations.length} slow operations`,
          { slowOperations: recentSlowOperations.length, threshold: this.config.performanceThreshold }
        );
      }
    }
  }

  /**
   * Creates a new alert if not in cooldown
   */
  private createAlert(
    type: SSRAlert['type'],
    severity: SSRAlert['severity'],
    message: string,
    details: any
  ): void {
    const alertKey = `${type}-${severity}`;
    const lastAlertTime = this.lastAlertTime.get(alertKey) || 0;
    const cooldownMs = this.config.alertCooldown * 60 * 1000;

    if (Date.now() - lastAlertTime < cooldownMs) {
      return; // Still in cooldown
    }

    const alert: SSRAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message,
      details,
      timestamp: new Date().toISOString(),
      resolved: false,
    };

    this.alerts.push(alert);
    this.lastAlertTime.set(alertKey, Date.now());

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // Send alert notification
    this.sendAlertNotification(alert);
  }

  /**
   * Sends metric to monitoring endpoint
   */
  private async sendMetricToEndpoint(metric: SSRMetrics): Promise<void> {
    try {
      const performanceUrl = `${getSSREnvVar('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000')}/sitemap-api/performance`;

      await fetch(performanceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'ssr_metric',
          data: metric,
        }),
      });
    } catch (error) {
      console.error('Failed to send metric to endpoint:', error);
    }
  }

  /**
   * Sends error to monitoring endpoint
   */
  private async sendErrorToEndpoint(errorData: any): Promise<void> {
    try {
      const performanceUrl = `${getSSREnvVar('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000')}/sitemap-api/performance`;

      await fetch(performanceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'ssr_error',
          data: errorData,
        }),
      });
    } catch (error) {
      console.error('Failed to send error to endpoint:', error);
    }
  }

  /**
   * Sends alert notification
   */
  private async sendAlertNotification(alert: SSRAlert): Promise<void> {
    try {
      const alertUrl = getSSREnvVar('ALERT_WEBHOOK_URL');
      if (!alertUrl) {
        console.warn('ALERT_WEBHOOK_URL not configured, skipping alert notification');
        return;
      }

      await fetch(alertUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'ssr_alert',
          alert,
        }),
      });
    } catch (error) {
      console.error('Failed to send alert notification:', error);
    }
  }

  /**
   * Starts periodic cleanup and analysis tasks
   */
  private startPeriodicTasks(): void {
    // Clean up old metrics every 10 minutes
    setInterval(() => {
      const cutoffTime = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      this.metrics = this.metrics.filter(m => new Date(m.timestamp) > cutoffTime);
    }, 10 * 60 * 1000);

    // Clean up old alerts every hour
    setInterval(() => {
      const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      this.alerts = this.alerts.filter(a => new Date(a.timestamp) > cutoffTime);
    }, 60 * 60 * 1000);

    // Send periodic health report every 15 minutes
    setInterval(() => {
      this.sendHealthReport();
    }, 15 * 60 * 1000);
  }

  /**
   * Sends periodic health report
   */
  private async sendHealthReport(): Promise<void> {
    const summary = this.getMetricsSummary(15); // Last 15 minutes
    const activeAlerts = this.getActiveAlerts();

    const healthReport = {
      timestamp: new Date().toISOString(),
      summary,
      activeAlerts: activeAlerts.length,
      alerts: activeAlerts,
    };

    try {
      const performanceUrl = `${getSSREnvVar('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000')}/sitemap-api/performance`;

      await fetch(performanceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'ssr_health_report',
          data: healthReport,
        }),
      });
    } catch (error) {
      console.error('Failed to send health report:', error);
    }
  }

  /**
   * Utility methods
   */
  private getCurrentUrl(): string {
    if (isSSRContext()) {
      return 'SSR';
    }
    return typeof window !== 'undefined' ? window.location.href : 'unknown';
  }

  private getUserAgent(): string {
    if (isSSRContext()) {
      return 'SSR-Server';
    }
    return typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown';
  }

  private getSessionId(): string {
    if (isSSRContext()) {
      return `ssr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    try {
      let sessionId = sessionStorage.getItem('ssr-session-id');
      if (!sessionId) {
        sessionId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('ssr-session-id', sessionId);
      }
      return sessionId;
    } catch {
      return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  }
}

/**
 * Global SSR monitoring instance
 */
export const ssrMonitoring = new SSRMonitoringService({
  enableErrorTracking: getSSREnvVar('NODE_ENV') === 'production',
  enablePerformanceTracking: true,
  enableAlerts: getSSREnvVar('NODE_ENV') === 'production',
  errorThreshold: parseInt(getSSREnvVar('SSR_ERROR_THRESHOLD', '10')),
  performanceThreshold: parseInt(getSSREnvVar('SSR_PERFORMANCE_THRESHOLD', '5000')),
  alertCooldown: parseInt(getSSREnvVar('SSR_ALERT_COOLDOWN', '15')),
});

/**
 * Convenience functions for monitoring
 */
export const monitor = {
  /**
   * Records a successful SSR operation
   */
  recordSuccess: (operation: string, duration: number, context?: any) => {
    ssrMonitoring.recordMetric(operation, duration, true, undefined, context);
  },

  /**
   * Records a failed SSR operation
   */
  recordError: (operation: string, duration: number, error: SSRError, context?: any) => {
    ssrMonitoring.recordMetric(operation, duration, false, error, context);
    ssrMonitoring.recordError(error, operation, context);
  },

  /**
   * Gets current metrics summary
   */
  getSummary: (timeWindowMinutes?: number) => {
    return ssrMonitoring.getMetricsSummary(timeWindowMinutes);
  },

  /**
   * Gets active alerts
   */
  getAlerts: () => {
    return ssrMonitoring.getActiveAlerts();
  },

  /**
   * Resolves an alert
   */
  resolveAlert: (alertId: string) => {
    ssrMonitoring.resolveAlert(alertId);
  },
};

export default ssrMonitoring;