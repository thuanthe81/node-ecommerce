/**
 * Production monitoring configuration for SSR enhancements
 * Handles performance tracking, error monitoring, and alerting in production
 */

import { performanceMonitor, initCoreWebVitalsTracking } from './performance-monitoring';

export interface ProductionConfig {
  environment: 'production' | 'staging' | 'development';
  monitoring: {
    enabled: boolean;
    performanceAlerts: boolean;
    errorTracking: boolean;
    coreWebVitals: boolean;
  };
  alerts: {
    webhookUrl?: string;
    slackChannel?: string;
    emailRecipients?: string[];
  };
  thresholds: {
    errorRate: number;
    responseTime: number;
    cacheHitRate: number;
    coreWebVitals: {
      lcp: number;
      fid: number;
      cls: number;
    };
  };
}

/**
 * Production configuration
 */
export const PRODUCTION_CONFIG: ProductionConfig = {
  environment: (process.env.NODE_ENV as any) || 'development',
  monitoring: {
    enabled: process.env.ENABLE_PERF_MONITORING === 'true',
    performanceAlerts: process.env.PERFORMANCE_ALERTS === 'true',
    errorTracking: !!process.env.SENTRY_DSN,
    coreWebVitals: process.env.TRACK_CORE_WEB_VITALS === 'true',
  },
  alerts: {
    webhookUrl: process.env.PERFORMANCE_ALERT_WEBHOOK,
    slackChannel: process.env.SLACK_ALERT_CHANNEL,
    emailRecipients: process.env.ALERT_EMAIL_RECIPIENTS?.split(','),
  },
  thresholds: {
    errorRate: parseFloat(process.env.ERROR_RATE_THRESHOLD || '0.01'), // 1%
    responseTime: parseInt(process.env.RESPONSE_TIME_THRESHOLD || '3000'), // 3 seconds
    cacheHitRate: parseFloat(process.env.CACHE_HIT_RATE_THRESHOLD || '0.8'), // 80%
    coreWebVitals: {
      lcp: parseInt(process.env.LCP_THRESHOLD || '2500'), // 2.5 seconds
      fid: parseInt(process.env.FID_THRESHOLD || '100'), // 100ms
      cls: parseFloat(process.env.CLS_THRESHOLD || '0.1'), // 0.1
    },
  },
};

/**
 * Production monitoring class
 */
export class ProductionMonitor {
  private static instance: ProductionMonitor;
  private alertCooldowns: Map<string, number> = new Map();
  private readonly COOLDOWN_PERIOD = 300000; // 5 minutes

  private constructor() {}

  static getInstance(): ProductionMonitor {
    if (!ProductionMonitor.instance) {
      ProductionMonitor.instance = new ProductionMonitor();
    }
    return ProductionMonitor.instance;
  }

  /**
   * Initialize production monitoring
   */
  init(): void {
    if (!this.isProductionEnvironment()) {
      console.log('Production monitoring disabled in non-production environment');
      return;
    }

    console.log('Initializing production monitoring...');

    // Set up performance monitoring
    if (PRODUCTION_CONFIG.monitoring.enabled) {
      this.setupPerformanceMonitoring();
    }

    // Set up error tracking
    if (PRODUCTION_CONFIG.monitoring.errorTracking) {
      this.setupErrorTracking();
    }

    // Set up Core Web Vitals tracking
    if (PRODUCTION_CONFIG.monitoring.coreWebVitals && typeof window !== 'undefined') {
      this.setupCoreWebVitalsTracking();
    }

    // Set up periodic cleanup
    this.setupPeriodicCleanup();

    console.log('Production monitoring initialized successfully');
  }

  /**
   * Set up performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    // Monitor performance metrics every minute
    setInterval(() => {
      this.checkPerformanceMetrics();
    }, 60000);

    // Monitor cache performance every 5 minutes
    setInterval(() => {
      this.checkCachePerformance();
    }, 300000);
  }

  /**
   * Set up error tracking
   */
  private setupErrorTracking(): void {
    // Global error handler
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.trackError('JavaScript Error', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack,
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.trackError('Unhandled Promise Rejection', {
          reason: event.reason,
          promise: event.promise,
        });
      });
    }

    // Server-side error tracking
    if (typeof process !== 'undefined') {
      process.on('uncaughtException', (error) => {
        this.trackError('Uncaught Exception', {
          message: error.message,
          stack: error.stack,
        });
      });

      process.on('unhandledRejection', (reason, promise) => {
        this.trackError('Unhandled Rejection', {
          reason,
          promise,
        });
      });
    }
  }

  /**
   * Set up Core Web Vitals tracking
   */
  private setupCoreWebVitalsTracking(): void {
    initCoreWebVitalsTracking();

    // Enhanced CWV tracking with alerts
    const originalTrackCoreWebVitals = performanceMonitor.trackCoreWebVitals;
    performanceMonitor.trackCoreWebVitals = (path: string, vitals: any) => {
      originalTrackCoreWebVitals.call(performanceMonitor, path, vitals);

      // Check thresholds and send alerts
      this.checkCoreWebVitalsThresholds(path, vitals);
    };
  }

  /**
   * Set up periodic cleanup
   */
  private setupPeriodicCleanup(): void {
    // Clean up old metrics every hour
    setInterval(() => {
      performanceMonitor.cleanupOldMetrics();
      this.cleanupAlertCooldowns();
    }, 3600000);
  }

  /**
   * Check performance metrics and send alerts if needed
   */
  private checkPerformanceMetrics(): void {
    const summary = performanceMonitor.getPerformanceSummary();

    // Check error rate
    if (summary.errorRate > PRODUCTION_CONFIG.thresholds.errorRate) {
      this.sendAlert('high-error-rate', {
        errorRate: summary.errorRate,
        threshold: PRODUCTION_CONFIG.thresholds.errorRate,
        requests: summary.requests.length,
      });
    }

    // Check response time
    if (summary.averageResponseTime > PRODUCTION_CONFIG.thresholds.responseTime) {
      this.sendAlert('slow-response-time', {
        averageResponseTime: summary.averageResponseTime,
        threshold: PRODUCTION_CONFIG.thresholds.responseTime,
        slowRequests: summary.slowRequests.length,
      });
    }

    // Check cache hit rate
    if (summary.cacheHitRate < PRODUCTION_CONFIG.thresholds.cacheHitRate) {
      this.sendAlert('low-cache-hit-rate', {
        cacheHitRate: summary.cacheHitRate,
        threshold: PRODUCTION_CONFIG.thresholds.cacheHitRate,
        requests: summary.requests.length,
      });
    }
  }

  /**
   * Check cache performance
   */
  private checkCachePerformance(): void {
    const cacheMetrics = performanceMonitor.getCachePerformanceSummary();

    cacheMetrics.forEach((metrics, cacheKey) => {
      if (metrics.hitRate < PRODUCTION_CONFIG.thresholds.cacheHitRate) {
        this.sendAlert('cache-performance-degraded', {
          cacheKey,
          hitRate: metrics.hitRate,
          threshold: PRODUCTION_CONFIG.thresholds.cacheHitRate,
          averageResponseTime: metrics.averageResponseTime,
        });
      }
    });
  }

  /**
   * Check Core Web Vitals thresholds
   */
  private checkCoreWebVitalsThresholds(path: string, vitals: any): void {
    const { coreWebVitals } = PRODUCTION_CONFIG.thresholds;

    if (vitals.lcp && vitals.lcp > coreWebVitals.lcp) {
      this.sendAlert('poor-lcp', {
        path,
        lcp: vitals.lcp,
        threshold: coreWebVitals.lcp,
      });
    }

    if (vitals.fid && vitals.fid > coreWebVitals.fid) {
      this.sendAlert('poor-fid', {
        path,
        fid: vitals.fid,
        threshold: coreWebVitals.fid,
      });
    }

    if (vitals.cls && vitals.cls > coreWebVitals.cls) {
      this.sendAlert('poor-cls', {
        path,
        cls: vitals.cls,
        threshold: coreWebVitals.cls,
      });
    }
  }

  /**
   * Track errors
   */
  private trackError(type: string, details: any): void {
    console.error(`[${type}]`, details);

    // Send to error tracking service
    if (process.env.SENTRY_DSN) {
      // Sentry integration would go here
      this.sendToSentry(type, details);
    }

    // Send alert for critical errors
    if (this.isCriticalError(type, details)) {
      this.sendAlert('critical-error', {
        type,
        details,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Send alert with cooldown protection
   */
  private sendAlert(alertType: string, data: any): void {
    const now = Date.now();
    const lastAlert = this.alertCooldowns.get(alertType);

    // Check cooldown
    if (lastAlert && now - lastAlert < this.COOLDOWN_PERIOD) {
      return;
    }

    this.alertCooldowns.set(alertType, now);

    const alert = {
      type: alertType,
      data,
      timestamp: new Date().toISOString(),
      environment: PRODUCTION_CONFIG.environment,
    };

    console.warn(`PRODUCTION ALERT [${alertType}]:`, data);

    // Send to webhook
    if (PRODUCTION_CONFIG.alerts.webhookUrl) {
      this.sendWebhookAlert(alert);
    }

    // Send to Slack
    if (PRODUCTION_CONFIG.alerts.slackChannel) {
      this.sendSlackAlert(alert);
    }

    // Send email alerts
    if (PRODUCTION_CONFIG.alerts.emailRecipients) {
      this.sendEmailAlert(alert);
    }
  }

  /**
   * Send webhook alert
   */
  private async sendWebhookAlert(alert: any): Promise<void> {
    try {
      const response = await fetch(PRODUCTION_CONFIG.alerts.webhookUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alert),
      });

      if (!response.ok) {
        console.error('Failed to send webhook alert:', response.status);
      }
    } catch (error) {
      console.error('Error sending webhook alert:', error);
    }
  }

  /**
   * Send Slack alert
   */
  private async sendSlackAlert(alert: any): Promise<void> {
    // Slack integration implementation
    console.log('Slack alert would be sent:', alert);
  }

  /**
   * Send email alert
   */
  private async sendEmailAlert(alert: any): Promise<void> {
    // Email alert implementation
    console.log('Email alert would be sent:', alert);
  }

  /**
   * Send to Sentry
   */
  private sendToSentry(type: string, details: any): void {
    // Sentry integration implementation
    console.log('Sentry error would be sent:', { type, details });
  }

  /**
   * Check if error is critical
   */
  private isCriticalError(type: string, details: any): boolean {
    const criticalTypes = [
      'Uncaught Exception',
      'Unhandled Rejection',
      'Database Connection Error',
      'API Gateway Error',
    ];

    return criticalTypes.includes(type) ||
           (details.message && details.message.includes('CRITICAL'));
  }

  /**
   * Clean up old alert cooldowns
   */
  private cleanupAlertCooldowns(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.alertCooldowns.forEach((timestamp, key) => {
      if (now - timestamp > this.COOLDOWN_PERIOD * 2) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => {
      this.alertCooldowns.delete(key);
    });
  }

  /**
   * Check if running in production environment
   */
  private isProductionEnvironment(): boolean {
    return PRODUCTION_CONFIG.environment === 'production' ||
           process.env.VERCEL_ENV === 'production';
  }

  /**
   * Get monitoring status
   */
  getStatus(): {
    environment: string;
    monitoring: boolean;
    alerts: boolean;
    uptime: number;
    lastCleanup: string;
  } {
    return {
      environment: PRODUCTION_CONFIG.environment,
      monitoring: PRODUCTION_CONFIG.monitoring.enabled,
      alerts: !!PRODUCTION_CONFIG.alerts.webhookUrl,
      uptime: process.uptime ? process.uptime() : 0,
      lastCleanup: new Date().toISOString(),
    };
  }
}

/**
 * Global production monitor instance
 */
export const productionMonitor = ProductionMonitor.getInstance();

/**
 * Initialize production monitoring
 */
export function initProductionMonitoring(): void {
  productionMonitor.init();
}

/**
 * Health check endpoint data
 */
export function getHealthCheckData() {
  const summary = performanceMonitor.getPerformanceSummary();
  const status = productionMonitor.getStatus();

  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: status.environment,
    monitoring: status.monitoring,
    performance: {
      averageResponseTime: summary.averageResponseTime,
      errorRate: summary.errorRate,
      cacheHitRate: summary.cacheHitRate,
      requestCount: summary.requests.length,
    },
    uptime: status.uptime,
  };
}