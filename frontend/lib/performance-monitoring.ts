/**
 * Performance monitoring utilities for SSR pages and API responses
 * Tracks Core Web Vitals, cache performance, and server-side rendering metrics
 */

import { PERFORMANCE_CONFIG } from './cache-config';

export interface PerformanceMetrics {
  requestId: string;
  path: string;
  method: string;
  startTime: number;
  endTime: number;
  duration: number;
  cacheHit: boolean;
  ssrRenderTime?: number;
  apiCallTime?: number;
  errorCount: number;
  userAgent?: string;
  locale?: string;
}

export interface CoreWebVitalsMetrics {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
}

export interface CachePerformanceMetrics {
  hitRate: number;
  missRate: number;
  averageResponseTime: number;
  revalidationCount: number;
  errorRate: number;
  timestamp: string;
}

/**
 * Performance monitoring class for tracking SSR and cache metrics
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private cacheMetrics: Map<string, CachePerformanceMetrics> = new Map();

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start tracking a request
   */
  startRequest(requestId: string, path: string, method: string): void {
    const metric: PerformanceMetrics = {
      requestId,
      path,
      method,
      startTime: Date.now(),
      endTime: 0,
      duration: 0,
      cacheHit: false,
      errorCount: 0
    };

    this.metrics.push(metric);
  }

  /**
   * End tracking a request
   */
  endRequest(requestId: string, cacheHit: boolean = false, errorCount: number = 0): void {
    const metric = this.metrics.find(m => m.requestId === requestId);
    if (metric) {
      metric.endTime = Date.now();
      metric.duration = metric.endTime - metric.startTime;
      metric.cacheHit = cacheHit;
      metric.errorCount = errorCount;

      // Log performance if enabled
      if (this.shouldLogPerformance()) {
        this.logPerformanceMetric(metric);
      }

      // Check for performance issues
      this.checkPerformanceThresholds(metric);
    }
  }

  /**
   * Track SSR rendering time
   */
  trackSSRRender(requestId: string, renderTime: number): void {
    const metric = this.metrics.find(m => m.requestId === requestId);
    if (metric) {
      metric.ssrRenderTime = renderTime;
    }
  }

  /**
   * Track API call time
   */
  trackAPICall(requestId: string, apiCallTime: number): void {
    const metric = this.metrics.find(m => m.requestId === requestId);
    if (metric) {
      metric.apiCallTime = apiCallTime;
    }
  }

  /**
   * Track Core Web Vitals (client-side)
   */
  trackCoreWebVitals(path: string, vitals: CoreWebVitalsMetrics): void {
    // Log Core Web Vitals
    console.log('Core Web Vitals:', { path, ...vitals });

    // Check against thresholds
    const { coreWebVitals } = PERFORMANCE_CONFIG;

    if (vitals.lcp && vitals.lcp > coreWebVitals.lcp) {
      console.warn(`LCP threshold exceeded: ${vitals.lcp}ms > ${coreWebVitals.lcp}ms for ${path}`);
    }

    if (vitals.fid && vitals.fid > coreWebVitals.fid) {
      console.warn(`FID threshold exceeded: ${vitals.fid}ms > ${coreWebVitals.fid}ms for ${path}`);
    }

    if (vitals.cls && vitals.cls > coreWebVitals.cls) {
      console.warn(`CLS threshold exceeded: ${vitals.cls} > ${coreWebVitals.cls} for ${path}`);
    }

    // Send to analytics service (if configured)
    this.sendToAnalytics('core-web-vitals', { path, ...vitals });
  }

  /**
   * Update cache performance metrics
   */
  updateCacheMetrics(cacheKey: string, hit: boolean, responseTime: number, error: boolean = false): void {
    const existing = this.cacheMetrics.get(cacheKey) || {
      hitRate: 0,
      missRate: 0,
      averageResponseTime: 0,
      revalidationCount: 0,
      errorRate: 0,
      timestamp: new Date().toISOString()
    };

    // Update hit/miss rates
    const totalRequests = existing.hitRate + existing.missRate + 1;
    if (hit) {
      existing.hitRate = (existing.hitRate + 1) / totalRequests;
      existing.missRate = existing.missRate / totalRequests;
    } else {
      existing.hitRate = existing.hitRate / totalRequests;
      existing.missRate = (existing.missRate + 1) / totalRequests;
    }

    // Update average response time
    existing.averageResponseTime = (existing.averageResponseTime + responseTime) / 2;

    // Update error rate
    if (error) {
      existing.errorRate = (existing.errorRate + 1) / totalRequests;
    } else {
      existing.errorRate = existing.errorRate / totalRequests;
    }

    existing.timestamp = new Date().toISOString();
    this.cacheMetrics.set(cacheKey, existing);

    // Check cache performance thresholds
    this.checkCachePerformance(cacheKey, existing);
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(timeWindow: number = 3600000): { // 1 hour default
    requests: PerformanceMetrics[];
    averageResponseTime: number;
    cacheHitRate: number;
    errorRate: number;
    slowRequests: PerformanceMetrics[];
  } {
    const cutoff = Date.now() - timeWindow;
    const recentMetrics = this.metrics.filter(m => m.startTime > cutoff);

    const totalRequests = recentMetrics.length;
    const cacheHits = recentMetrics.filter(m => m.cacheHit).length;
    const errors = recentMetrics.filter(m => m.errorCount > 0).length;
    const totalResponseTime = recentMetrics.reduce((sum, m) => sum + m.duration, 0);
    const slowRequests = recentMetrics.filter(m => m.duration > 1000); // > 1 second

    return {
      requests: recentMetrics,
      averageResponseTime: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
      cacheHitRate: totalRequests > 0 ? cacheHits / totalRequests : 0,
      errorRate: totalRequests > 0 ? errors / totalRequests : 0,
      slowRequests
    };
  }

  /**
   * Get cache performance summary
   */
  getCachePerformanceSummary(): Map<string, CachePerformanceMetrics> {
    return new Map(this.cacheMetrics);
  }

  /**
   * Clear old metrics to prevent memory leaks
   */
  cleanupOldMetrics(maxAge: number = 86400000): void { // 24 hours default
    const cutoff = Date.now() - maxAge;
    this.metrics = this.metrics.filter(m => m.startTime > cutoff);
  }

  /**
   * Check if performance logging is enabled
   */
  private shouldLogPerformance(): boolean {
    return process.env.NODE_ENV === 'development' ||
           process.env.ENABLE_PERF_MONITORING === 'true';
  }

  /**
   * Log performance metric
   */
  private logPerformanceMetric(metric: PerformanceMetrics): void {
    console.log('Performance Metric:', {
      path: metric.path,
      duration: `${metric.duration}ms`,
      cacheHit: metric.cacheHit,
      ssrRenderTime: metric.ssrRenderTime ? `${metric.ssrRenderTime}ms` : 'N/A',
      apiCallTime: metric.apiCallTime ? `${metric.apiCallTime}ms` : 'N/A',
      errors: metric.errorCount
    });
  }

  /**
   * Check performance against thresholds and alert if needed
   */
  private checkPerformanceThresholds(metric: PerformanceMetrics): void {
    const { ssrTimeouts } = PERFORMANCE_CONFIG;

    // Check overall response time
    if (metric.duration > ssrTimeouts.pageRender) {
      console.warn(`Slow page render: ${metric.path} took ${metric.duration}ms`);
      this.sendAlert('slow-page-render', metric);
    }

    // Check SSR render time
    if (metric.ssrRenderTime && metric.ssrRenderTime > ssrTimeouts.pageRender) {
      console.warn(`Slow SSR render: ${metric.path} took ${metric.ssrRenderTime}ms`);
      this.sendAlert('slow-ssr-render', metric);
    }

    // Check API call time
    if (metric.apiCallTime && metric.apiCallTime > ssrTimeouts.apiCall) {
      console.warn(`Slow API call: ${metric.path} API took ${metric.apiCallTime}ms`);
      this.sendAlert('slow-api-call', metric);
    }
  }

  /**
   * Check cache performance against thresholds
   */
  private checkCachePerformance(cacheKey: string, metrics: CachePerformanceMetrics): void {
    const { cacheMetrics } = PERFORMANCE_CONFIG;

    // Check cache hit rate
    if (metrics.hitRate < cacheMetrics.hitRateThreshold) {
      console.warn(`Low cache hit rate: ${cacheKey} has ${(metrics.hitRate * 100).toFixed(1)}% hit rate`);
      this.sendAlert('low-cache-hit-rate', { cacheKey, metrics });
    }

    // Check response time
    if (metrics.averageResponseTime > cacheMetrics.responseTimeThreshold) {
      console.warn(`Slow cache response: ${cacheKey} averages ${metrics.averageResponseTime}ms`);
      this.sendAlert('slow-cache-response', { cacheKey, metrics });
    }
  }

  /**
   * Send alert (placeholder for actual alerting system)
   */
  private sendAlert(type: string, data: any): void {
    // In production, this would integrate with alerting services like:
    // - Slack webhooks
    // - Email notifications
    // - PagerDuty
    // - DataDog alerts

    if (process.env.NODE_ENV === 'development') {
      console.warn(`ALERT [${type}]:`, data);
    }

    // Example webhook integration:
    // if (process.env.ALERT_WEBHOOK_URL) {
    //   fetch(process.env.ALERT_WEBHOOK_URL, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ type, data, timestamp: new Date().toISOString() })
    //   }).catch(console.error);
    // }
  }

  /**
   * Send metrics to analytics service
   */
  private sendToAnalytics(event: string, data: any): void {
    // In production, this would integrate with analytics services like:
    // - Google Analytics
    // - DataDog
    // - New Relic
    // - Custom analytics endpoint

    if (process.env.NODE_ENV === 'development') {
      console.log(`Analytics [${event}]:`, data);
    }

    // Example analytics integration:
    // if (process.env.ANALYTICS_ENDPOINT) {
    //   fetch(process.env.ANALYTICS_ENDPOINT, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ event, data, timestamp: new Date().toISOString() })
    //   }).catch(console.error);
    // }
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = PerformanceMonitor.getInstance();

/**
 * Utility function to measure execution time
 */
export async function measureExecutionTime<T>(
  operation: () => Promise<T>,
  label: string
): Promise<{ result: T; duration: number }> {
  const startTime = Date.now();

  try {
    const result = await operation();
    const duration = Date.now() - startTime;

    console.log(`${label} completed in ${duration}ms`);

    return { result, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`${label} failed after ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Client-side Core Web Vitals tracking
 */
export function initCoreWebVitalsTracking(): void {
  if (typeof window === 'undefined') return;

  // Track LCP (Largest Contentful Paint)
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];

    if (lastEntry) {
      performanceMonitor.trackCoreWebVitals(window.location.pathname, {
        lcp: lastEntry.startTime
      });
    }
  });

  try {
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    // LCP not supported
  }

  // Track FID (First Input Delay)
  const fidObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry: any) => {
      performanceMonitor.trackCoreWebVitals(window.location.pathname, {
        fid: entry.processingStart - entry.startTime
      });
    });
  });

  try {
    fidObserver.observe({ entryTypes: ['first-input'] });
  } catch (e) {
    // FID not supported
  }

  // Track CLS (Cumulative Layout Shift)
  let clsValue = 0;
  const clsObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry: any) => {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
      }
    });

    performanceMonitor.trackCoreWebVitals(window.location.pathname, {
      cls: clsValue
    });
  });

  try {
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  } catch (e) {
    // CLS not supported
  }

  // Track TTFB (Time to First Byte)
  const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (navigationEntry) {
    const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
    performanceMonitor.trackCoreWebVitals(window.location.pathname, {
      ttfb
    });
  }
}