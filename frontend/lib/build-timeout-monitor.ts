/**
 * Build timeout monitoring and logging system
 *
 * This module provides comprehensive monitoring and alerting for build timeouts
 * to help identify and resolve performance bottlenecks during static generation.
 */

import { TimeoutMetrics, getTimeoutMetrics, logTimeoutStats } from './build-timeout-wrapper';

export interface BuildTimeoutAlert {
  type: 'timeout' | 'slow_operation' | 'high_failure_rate' | 'memory_warning';
  message: string;
  operation?: string;
  duration?: number;
  threshold?: number;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface BuildPerformanceReport {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  successRate: number;
  averageDuration: number;
  maxDuration: number;
  slowestOperations: TimeoutMetrics[];
  alerts: BuildTimeoutAlert[];
  recommendations: string[];
}

// Alert thresholds
const ALERT_THRESHOLDS = {
  slowOperationMs: 8000, // 80% of default API timeout
  highFailureRate: 0.2, // 20% failure rate
  criticalFailureRate: 0.5, // 50% failure rate
  memoryWarningMb: 1500, // 1.5GB memory usage
} as const;

// Collected alerts
const alerts: BuildTimeoutAlert[] = [];

/**
 * Monitors timeout metrics and generates alerts
 */
export function monitorTimeouts(): void {
  const metrics = getTimeoutMetrics();

  if (metrics.length === 0) {
    return;
  }

  // Check for slow operations
  const slowOperations = metrics.filter(m =>
    m.success && m.duration > ALERT_THRESHOLDS.slowOperationMs
  );

  slowOperations.forEach(metric => {
    addAlert({
      type: 'slow_operation',
      message: `Slow operation detected: ${metric.operation} took ${metric.duration}ms`,
      operation: metric.operation,
      duration: metric.duration,
      threshold: ALERT_THRESHOLDS.slowOperationMs,
      timestamp: new Date(),
      severity: metric.duration > ALERT_THRESHOLDS.slowOperationMs * 1.5 ? 'high' : 'medium',
    });
  });

  // Check for timeouts
  const timeouts = metrics.filter(m => !m.success && m.error?.includes('timed out'));

  timeouts.forEach(metric => {
    addAlert({
      type: 'timeout',
      message: `Timeout occurred: ${metric.operation} - ${metric.error}`,
      operation: metric.operation,
      duration: metric.duration,
      timestamp: new Date(),
      severity: 'high',
    });
  });

  // Check failure rate
  const failureRate = metrics.filter(m => !m.success).length / metrics.length;

  if (failureRate >= ALERT_THRESHOLDS.criticalFailureRate) {
    addAlert({
      type: 'high_failure_rate',
      message: `Critical failure rate: ${Math.round(failureRate * 100)}% of operations are failing`,
      threshold: ALERT_THRESHOLDS.criticalFailureRate,
      timestamp: new Date(),
      severity: 'critical',
    });
  } else if (failureRate >= ALERT_THRESHOLDS.highFailureRate) {
    addAlert({
      type: 'high_failure_rate',
      message: `High failure rate: ${Math.round(failureRate * 100)}% of operations are failing`,
      threshold: ALERT_THRESHOLDS.highFailureRate,
      timestamp: new Date(),
      severity: 'high',
    });
  }

  // Check memory usage if available
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const memoryUsage = process.memoryUsage();
    const memoryMb = memoryUsage.heapUsed / 1024 / 1024;

    if (memoryMb > ALERT_THRESHOLDS.memoryWarningMb) {
      addAlert({
        type: 'memory_warning',
        message: `High memory usage during build: ${Math.round(memoryMb)}MB`,
        threshold: ALERT_THRESHOLDS.memoryWarningMb,
        timestamp: new Date(),
        severity: memoryMb > ALERT_THRESHOLDS.memoryWarningMb * 1.5 ? 'critical' : 'high',
      });
    }
  }
}

/**
 * Adds an alert to the collection
 */
function addAlert(alert: BuildTimeoutAlert): void {
  alerts.push(alert);

  // Log alert immediately
  const severityIcon = {
    low: '🟡',
    medium: '🟠',
    high: '🔴',
    critical: '🚨',
  }[alert.severity];

  console.warn(`[BUILD ALERT ${severityIcon}] ${alert.message}`);
}

/**
 * Gets all collected alerts
 */
export function getAlerts(): BuildTimeoutAlert[] {
  return [...alerts];
}

/**
 * Clears all alerts
 */
export function clearAlerts(): void {
  alerts.length = 0;
}

/**
 * Generates a comprehensive performance report
 */
export function generatePerformanceReport(): BuildPerformanceReport {
  const metrics = getTimeoutMetrics();

  if (metrics.length === 0) {
    return {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      successRate: 0,
      averageDuration: 0,
      maxDuration: 0,
      slowestOperations: [],
      alerts: [],
      recommendations: ['No operations recorded yet'],
    };
  }

  const successful = metrics.filter(m => m.success);
  const failed = metrics.filter(m => !m.success);
  const successRate = successful.length / metrics.length;
  const averageDuration = metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
  const maxDuration = Math.max(...metrics.map(m => m.duration));

  // Get slowest operations
  const slowestOperations = [...metrics]
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 10);

  // Generate recommendations
  const recommendations = generateRecommendations(metrics, successRate, averageDuration);

  return {
    totalOperations: metrics.length,
    successfulOperations: successful.length,
    failedOperations: failed.length,
    successRate,
    averageDuration,
    maxDuration,
    slowestOperations,
    alerts: getAlerts(),
    recommendations,
  };
}

/**
 * Generates performance recommendations based on metrics
 */
function generateRecommendations(
  metrics: TimeoutMetrics[],
  successRate: number,
  averageDuration: number
): string[] {
  const recommendations: string[] = [];

  // Success rate recommendations
  if (successRate < 0.8) {
    recommendations.push('Consider increasing API timeout values or optimizing backend performance');
  }

  if (successRate < 0.5) {
    recommendations.push('Critical: Investigate backend API performance and network connectivity');
  }

  // Duration recommendations
  if (averageDuration > 5000) {
    recommendations.push('Average API call duration is high - consider implementing caching');
  }

  if (averageDuration > 8000) {
    recommendations.push('Consider implementing request deduplication and connection pooling');
  }

  // Timeout recommendations
  const timeouts = metrics.filter(m => !m.success && m.error?.includes('timed out'));
  if (timeouts.length > 0) {
    recommendations.push(`${timeouts.length} timeout(s) detected - consider increasing timeout values or optimizing slow operations`);
  }

  // Retry recommendations
  const retriedOperations = metrics.filter(m => m.retryCount > 0);
  if (retriedOperations.length > metrics.length * 0.1) {
    recommendations.push('High retry rate detected - investigate network stability and backend reliability');
  }

  // Memory recommendations
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const memoryUsage = process.memoryUsage();
    const memoryMb = memoryUsage.heapUsed / 1024 / 1024;

    if (memoryMb > 1000) {
      recommendations.push('High memory usage detected - consider implementing memory cleanup between operations');
    }
  }

  // Operation-specific recommendations
  const operationStats = getOperationStats(metrics);
  Object.entries(operationStats).forEach(([operation, stats]) => {
    if (stats.failureRate > 0.3) {
      recommendations.push(`Operation "${operation}" has high failure rate (${Math.round(stats.failureRate * 100)}%) - investigate specific issues`);
    }

    if (stats.averageDuration > 10000) {
      recommendations.push(`Operation "${operation}" is consistently slow (${Math.round(stats.averageDuration)}ms avg) - consider optimization`);
    }
  });

  if (recommendations.length === 0) {
    recommendations.push('Build performance looks good! No specific recommendations at this time.');
  }

  return recommendations;
}

/**
 * Gets statistics per operation type
 */
function getOperationStats(metrics: TimeoutMetrics[]): Record<string, {
  count: number;
  successCount: number;
  failureRate: number;
  averageDuration: number;
  maxDuration: number;
}> {
  const stats: Record<string, {
    count: number;
    successCount: number;
    failureRate: number;
    averageDuration: number;
    maxDuration: number;
  }> = {};

  metrics.forEach(metric => {
    if (!stats[metric.operation]) {
      stats[metric.operation] = {
        count: 0,
        successCount: 0,
        failureRate: 0,
        averageDuration: 0,
        maxDuration: 0,
      };
    }

    const stat = stats[metric.operation];
    stat.count++;
    if (metric.success) {
      stat.successCount++;
    }
    stat.maxDuration = Math.max(stat.maxDuration, metric.duration);
  });

  // Calculate derived stats
  Object.values(stats).forEach(stat => {
    stat.failureRate = (stat.count - stat.successCount) / stat.count;

    const operationMetrics = metrics.filter(m => m.operation === Object.keys(stats).find(op => stats[op] === stat));
    stat.averageDuration = operationMetrics.reduce((sum, m) => sum + m.duration, 0) / operationMetrics.length;
  });

  return stats;
}

/**
 * Logs a comprehensive performance report
 */
export function logPerformanceReport(): void {
  console.log('\n=== BUILD TIMEOUT PERFORMANCE REPORT ===');

  const report = generatePerformanceReport();

  console.log(`Total Operations: ${report.totalOperations}`);
  console.log(`Success Rate: ${Math.round(report.successRate * 100)}% (${report.successfulOperations}/${report.totalOperations})`);
  console.log(`Average Duration: ${Math.round(report.averageDuration)}ms`);
  console.log(`Max Duration: ${Math.round(report.maxDuration)}ms`);

  if (report.alerts.length > 0) {
    console.log(`\nAlerts (${report.alerts.length}):`);
    report.alerts.forEach((alert, index) => {
      const severityIcon = {
        low: '🟡',
        medium: '🟠',
        high: '🔴',
        critical: '🚨',
      }[alert.severity];
      console.log(`  ${index + 1}. ${severityIcon} ${alert.message}`);
    });
  }

  if (report.slowestOperations.length > 0) {
    console.log(`\nSlowest Operations (top 5):`);
    report.slowestOperations.slice(0, 5).forEach((metric, index) => {
      console.log(`  ${index + 1}. ${metric.operation}: ${metric.duration}ms ${metric.success ? '✓' : '✗'}`);
    });
  }

  if (report.recommendations.length > 0) {
    console.log(`\nRecommendations:`);
    report.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }

  console.log('=== END REPORT ===\n');
}

/**
 * Starts periodic monitoring (useful during build)
 */
export function startPeriodicMonitoring(intervalMs: number = 30000): NodeJS.Timeout {
  console.log(`[BUILD MONITOR] Starting periodic timeout monitoring (every ${intervalMs}ms)`);

  return setInterval(() => {
    monitorTimeouts();

    const metrics = getTimeoutMetrics();
    if (metrics.length > 0) {
      logTimeoutStats();
    }
  }, intervalMs);
}

/**
 * Stops periodic monitoring
 */
export function stopPeriodicMonitoring(intervalId: NodeJS.Timeout): void {
  clearInterval(intervalId);
  console.log('[BUILD MONITOR] Stopped periodic timeout monitoring');

  // Log final report
  logPerformanceReport();
}