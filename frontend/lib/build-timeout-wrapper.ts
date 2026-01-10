/**
 * Build-time timeout wrapper for API calls
 *
 * This module provides timeout handling specifically for build-time operations
 * to prevent builds from hanging on slow API calls during static generation.
 */

export interface TimeoutConfig {
  apiTimeout: number; // Timeout for individual API calls (ms)
  buildTimeout: number; // Timeout for page builds (ms)
  totalBuildTimeout: number; // Total build timeout (ms)
  retryAttempts: number; // Number of retry attempts
  retryDelay: number; // Delay between retries (ms)
}

export interface TimeoutMetrics {
  operation: string;
  duration: number;
  success: boolean;
  retryCount: number;
  timestamp: Date;
  error?: string;
}

// Default timeout configuration from environment variables
const DEFAULT_TIMEOUT_CONFIG: TimeoutConfig = {
  apiTimeout: parseInt(process.env.API_TIMEOUT || '10000', 10),
  buildTimeout: parseInt(process.env.BUILD_TIMEOUT || '45000', 10),
  totalBuildTimeout: parseInt(process.env.TOTAL_BUILD_TIMEOUT || '600000', 10),
  retryAttempts: 3,
  retryDelay: 1000,
};

// Metrics collection for monitoring
const timeoutMetrics: TimeoutMetrics[] = [];

/**
 * Wraps a promise with timeout functionality
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string = 'API call'
): Promise<T> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const timeoutId = setTimeout(() => {
      const duration = Date.now() - startTime;
      const error = `${operation} timed out after ${timeoutMs}ms`;

      // Record timeout metrics
      timeoutMetrics.push({
        operation,
        duration,
        success: false,
        retryCount: 0,
        timestamp: new Date(),
        error,
      });

      console.warn(`[BUILD TIMEOUT] ${error}`);
      reject(new Error(error));
    }, timeoutMs);

    promise
      .then(result => {
        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;

        // Record success metrics
        timeoutMetrics.push({
          operation,
          duration,
          success: true,
          retryCount: 0,
          timestamp: new Date(),
        });

        if (duration > timeoutMs * 0.8) {
          console.warn(`[BUILD PERFORMANCE] ${operation} took ${duration}ms (${Math.round(duration/timeoutMs*100)}% of timeout)`);
        }

        resolve(result);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;

        // Record error metrics
        timeoutMetrics.push({
          operation,
          duration,
          success: false,
          retryCount: 0,
          timestamp: new Date(),
          error: error.message,
        });

        reject(error);
      });
  });
}

/**
 * Wraps API calls with timeout and retry logic
 */
export async function withTimeoutAndRetry<T>(
  apiCall: () => Promise<T>,
  config: Partial<TimeoutConfig> = {},
  operation: string = 'API call'
): Promise<T> {
  const finalConfig = { ...DEFAULT_TIMEOUT_CONFIG, ...config };
  let lastError: Error | undefined;
  let retryCount = 0;

  for (let attempt = 1; attempt <= finalConfig.retryAttempts; attempt++) {
    try {
      retryCount = attempt - 1;
      const result = await withTimeout(
        apiCall(),
        finalConfig.apiTimeout,
        `${operation} (attempt ${attempt})`
      );

      if (attempt > 1) {
        console.log(`[BUILD RETRY SUCCESS] ${operation} succeeded on attempt ${attempt}`);
      }

      return result;
    } catch (error) {
      lastError = error as Error;

      if (attempt < finalConfig.retryAttempts) {
        const delay = finalConfig.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.warn(`[BUILD RETRY] ${operation} failed (attempt ${attempt}), retrying in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Update metrics with final retry count
  const lastMetric = timeoutMetrics[timeoutMetrics.length - 1];
  if (lastMetric) {
    lastMetric.retryCount = retryCount;
  }

  console.error(`[BUILD FAILURE] ${operation} failed after ${finalConfig.retryAttempts} attempts`);
  throw lastError || new Error(`${operation} failed after ${finalConfig.retryAttempts} attempts`);
}

/**
 * Wraps fetch calls with build-time timeout
 */
export async function fetchWithBuildTimeout<T>(
  url: string,
  options: RequestInit = {},
  config: Partial<TimeoutConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_TIMEOUT_CONFIG, ...config };

  return withTimeoutAndRetry(
    async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), finalConfig.apiTimeout);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } finally {
        clearTimeout(timeoutId);
      }
    },
    config,
    `fetch ${url}`
  );
}

/**
 * Gets timeout metrics for monitoring
 */
export function getTimeoutMetrics(): TimeoutMetrics[] {
  return [...timeoutMetrics];
}

/**
 * Clears timeout metrics (useful for testing)
 */
export function clearTimeoutMetrics(): void {
  timeoutMetrics.length = 0;
}

/**
 * Logs timeout statistics
 */
export function logTimeoutStats(): void {
  if (timeoutMetrics.length === 0) {
    console.log('[BUILD TIMEOUT STATS] No timeout metrics recorded');
    return;
  }

  const successful = timeoutMetrics.filter(m => m.success);
  const failed = timeoutMetrics.filter(m => !m.success);
  const avgDuration = timeoutMetrics.reduce((sum, m) => sum + m.duration, 0) / timeoutMetrics.length;
  const maxDuration = Math.max(...timeoutMetrics.map(m => m.duration));

  console.log('[BUILD TIMEOUT STATS]', {
    total: timeoutMetrics.length,
    successful: successful.length,
    failed: failed.length,
    successRate: `${Math.round(successful.length / timeoutMetrics.length * 100)}%`,
    avgDuration: `${Math.round(avgDuration)}ms`,
    maxDuration: `${maxDuration}ms`,
  });

  // Log slowest operations
  const slowest = [...timeoutMetrics]
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 5);

  if (slowest.length > 0) {
    console.log('[BUILD TIMEOUT STATS] Slowest operations:');
    slowest.forEach((metric, index) => {
      console.log(`  ${index + 1}. ${metric.operation}: ${metric.duration}ms ${metric.success ? '✓' : '✗'}`);
    });
  }
}

/**
 * Timeout configuration for different environments
 */
export const TIMEOUT_CONFIGS = {
  development: {
    apiTimeout: 15000, // More lenient for development
    buildTimeout: 60000,
    totalBuildTimeout: 900000, // 15 minutes
    retryAttempts: 2,
    retryDelay: 1000,
  },
  production: {
    apiTimeout: 10000,
    buildTimeout: 45000,
    totalBuildTimeout: 600000, // 10 minutes
    retryAttempts: 3,
    retryDelay: 1000,
  },
  test: {
    apiTimeout: 5000,
    buildTimeout: 30000,
    totalBuildTimeout: 300000, // 5 minutes
    retryAttempts: 1,
    retryDelay: 500,
  },
} as const;

/**
 * Gets timeout configuration for current environment
 */
export function getTimeoutConfig(): TimeoutConfig {
  const env = process.env.NODE_ENV || 'development';
  const envConfig = TIMEOUT_CONFIGS[env as keyof typeof TIMEOUT_CONFIGS] || TIMEOUT_CONFIGS.development;

  return {
    apiTimeout: parseInt(process.env.API_TIMEOUT || envConfig.apiTimeout.toString(), 10),
    buildTimeout: parseInt(process.env.BUILD_TIMEOUT || envConfig.buildTimeout.toString(), 10),
    totalBuildTimeout: parseInt(process.env.TOTAL_BUILD_TIMEOUT || envConfig.totalBuildTimeout.toString(), 10),
    retryAttempts: parseInt(process.env.RETRY_ATTEMPTS || envConfig.retryAttempts.toString(), 10),
    retryDelay: parseInt(process.env.RETRY_DELAY || envConfig.retryDelay.toString(), 10),
  };
}