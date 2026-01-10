/**
 * Build timeout initialization and setup
 *
 * This module initializes timeout monitoring and logging for build-time operations.
 * It should be imported early in the build process to ensure proper monitoring.
 */

import {
  getTimeoutConfig,
  logTimeoutStats,
  clearTimeoutMetrics
} from './build-timeout-wrapper';
import {
  startPeriodicMonitoring,
  stopPeriodicMonitoring,
  logPerformanceReport,
  clearAlerts
} from './build-timeout-monitor';

// Global monitoring state
let monitoringInterval: NodeJS.Timeout | null = null;
let isInitialized = false;

/**
 * Initializes build timeout monitoring
 */
export function initializeBuildTimeouts(): void {
  if (isInitialized) {
    console.log('[BUILD TIMEOUT] Already initialized, skipping...');
    return;
  }

  console.log('[BUILD TIMEOUT] Initializing timeout monitoring...');

  const config = getTimeoutConfig();

  console.log('[BUILD TIMEOUT] Configuration:', {
    apiTimeout: `${config.apiTimeout}ms`,
    buildTimeout: `${config.buildTimeout}ms`,
    totalBuildTimeout: `${config.totalBuildTimeout}ms`,
    retryAttempts: config.retryAttempts,
    retryDelay: `${config.retryDelay}ms`,
  });

  // Clear any existing metrics and alerts
  clearTimeoutMetrics();
  clearAlerts();

  // Start periodic monitoring during build
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_BUILD_MONITORING === 'true') {
    monitoringInterval = startPeriodicMonitoring(30000); // Monitor every 30 seconds
  }

  // Set up process exit handlers to log final stats
  setupExitHandlers();

  isInitialized = true;
  console.log('[BUILD TIMEOUT] Initialization complete');
}

/**
 * Shuts down build timeout monitoring
 */
export function shutdownBuildTimeouts(): void {
  if (!isInitialized) {
    return;
  }

  console.log('[BUILD TIMEOUT] Shutting down timeout monitoring...');

  if (monitoringInterval) {
    stopPeriodicMonitoring(monitoringInterval);
    monitoringInterval = null;
  }

  // Log final statistics
  logTimeoutStats();
  logPerformanceReport();

  isInitialized = false;
  console.log('[BUILD TIMEOUT] Shutdown complete');
}

/**
 * Sets up process exit handlers to ensure stats are logged
 */
function setupExitHandlers(): void {
  // Handle normal process exit
  process.on('exit', () => {
    if (isInitialized) {
      console.log('[BUILD TIMEOUT] Process exiting, logging final stats...');
      logTimeoutStats();
    }
  });

  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    console.log('\n[BUILD TIMEOUT] Received SIGINT, shutting down gracefully...');
    shutdownBuildTimeouts();
    process.exit(0);
  });

  // Handle SIGTERM
  process.on('SIGTERM', () => {
    console.log('\n[BUILD TIMEOUT] Received SIGTERM, shutting down gracefully...');
    shutdownBuildTimeouts();
    process.exit(0);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('[BUILD TIMEOUT] Uncaught exception:', error);
    shutdownBuildTimeouts();
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('[BUILD TIMEOUT] Unhandled promise rejection:', reason);
    shutdownBuildTimeouts();
    process.exit(1);
  });
}

/**
 * Gets current initialization status
 */
export function isTimeoutMonitoringInitialized(): boolean {
  return isInitialized;
}

/**
 * Logs current timeout configuration
 */
export function logTimeoutConfiguration(): void {
  const config = getTimeoutConfig();

  console.log('\n=== BUILD TIMEOUT CONFIGURATION ===');
  console.log(`API Timeout: ${config.apiTimeout}ms`);
  console.log(`Build Timeout: ${config.buildTimeout}ms`);
  console.log(`Total Build Timeout: ${config.totalBuildTimeout}ms`);
  console.log(`Retry Attempts: ${config.retryAttempts}`);
  console.log(`Retry Delay: ${config.retryDelay}ms`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('=== END CONFIGURATION ===\n');
}

// Auto-initialize if this module is imported during build
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
  // Only auto-initialize in production builds
  initializeBuildTimeouts();
}

// Export for manual initialization in development
export default {
  initialize: initializeBuildTimeouts,
  shutdown: shutdownBuildTimeouts,
  isInitialized: isTimeoutMonitoringInitialized,
  logConfiguration: logTimeoutConfiguration,
};