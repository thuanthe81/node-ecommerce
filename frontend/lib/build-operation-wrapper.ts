/**
 * Build Operation Wrapper with Cache Invariant Error Handling
 *
 * This module wraps build operations with comprehensive error handling,
 * including cache invariant error detection, recovery, and fallback strategies.
 */

import {
  CacheInvariantHandler,
  CacheRecoveryManager,
  CacheInvariantError,
  RecoveryResult,
  createCacheInvariantHandler,
  createCacheRecoveryManager,
  CacheInvariantConfig
} from './cache-invariant-handler';

import {
  withTimeoutAndRetry,
  TimeoutConfig,
  getTimeoutConfig,
  TimeoutMetrics
} from './build-timeout-wrapper';

export interface BuildOperationConfig extends Partial<TimeoutConfig>, Partial<CacheInvariantConfig> {
  enableCacheErrorHandling: boolean;
  enableSSRFallback: boolean;
  operationName?: string;
  pageId?: string;
  enableDetailedLogging?: boolean;
}

export interface BuildOperationResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  usedFallback: boolean;
  fallbackType?: 'ssr' | 'cached' | 'minimal';
  cacheErrorsHandled: number;
  recoveryResults: RecoveryResult[];
  timeoutMetrics?: TimeoutMetrics;
  duration: number;
}

export interface BuildOperationMetrics {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  cacheErrorsDetected: number;
  cacheErrorsRecovered: number;
  ssrFallbacksUsed: number;
  averageDuration: number;
  operationsByType: Record<string, number>;
}

// Default configuration
const DEFAULT_BUILD_CONFIG: BuildOperationConfig = {
  enableCacheErrorHandling: true,
  enableSSRFallback: true,
  enableDetailedLogging: process.env.NODE_ENV === 'development',
  operationName: 'build-operation',
  // Inherit timeout defaults
  ...getTimeoutConfig(),
  // Inherit cache invariant defaults
  maxRetryAttempts: 3,
  retryDelayMs: 1000,
  cacheValidationEnabled: true,
  fallbackToSSR: true,
  logLevel: 'error' as const,
};

// Global metrics tracking
const buildMetrics: BuildOperationMetrics = {
  totalOperations: 0,
  successfulOperations: 0,
  failedOperations: 0,
  cacheErrorsDetected: 0,
  cacheErrorsRecovered: 0,
  ssrFallbacksUsed: 0,
  averageDuration: 0,
  operationsByType: {},
};

/**
 * Wraps a build operation with comprehensive error handling
 */
export async function withBuildErrorHandling<T>(
  operation: () => Promise<T>,
  config: Partial<BuildOperationConfig> = {}
): Promise<BuildOperationResult<T>> {
  const finalConfig = { ...DEFAULT_BUILD_CONFIG, ...config };
  const startTime = Date.now();

  // Initialize handlers
  const cacheHandler = createCacheInvariantHandler(finalConfig);
  const recoveryManager = createCacheRecoveryManager(finalConfig);

  const result: BuildOperationResult<T> = {
    success: false,
    usedFallback: false,
    cacheErrorsHandled: 0,
    recoveryResults: [],
    duration: 0,
  };

  // Update metrics
  buildMetrics.totalOperations++;
  if (finalConfig.operationName) {
    buildMetrics.operationsByType[finalConfig.operationName] =
      (buildMetrics.operationsByType[finalConfig.operationName] || 0) + 1;
  }

  try {
    if (finalConfig.enableDetailedLogging) {
      console.log(`[BUILD OPERATION] Starting: ${finalConfig.operationName} (Page: ${finalConfig.pageId || 'unknown'})`);
    }

    // Validate cache state before operation if enabled
    if (finalConfig.cacheValidationEnabled) {
      const validation = await recoveryManager.validateCacheState();
      if (!validation.isValid) {
        console.warn(`[BUILD OPERATION] Cache validation failed, clearing cache before operation`);
        await recoveryManager.clearCorruptedCache();
      }
    }

    // Wrap the operation with cache error handling and timeout
    const wrappedOperation = async (): Promise<T> => {
      return await withCacheErrorHandling(
        operation,
        cacheHandler,
        recoveryManager,
        finalConfig,
        result
      );
    };

    // Execute with timeout and retry logic
    const data = await withTimeoutAndRetry(
      wrappedOperation,
      finalConfig,
      finalConfig.operationName || 'build-operation'
    );

    result.success = true;
    result.data = data as T;
    buildMetrics.successfulOperations++;

    if (finalConfig.enableDetailedLogging) {
      console.log(`[BUILD OPERATION] Completed successfully: ${finalConfig.operationName}`);
    }

  } catch (error) {
    result.error = error as Error;
    buildMetrics.failedOperations++;

    console.error(`[BUILD OPERATION] Failed: ${finalConfig.operationName}`, error);

    // Try fallback strategies if enabled
    if (finalConfig.enableSSRFallback && !result.usedFallback) {
      try {
        const fallbackResult = await attemptFallbackStrategy(
          error as Error,
          finalConfig,
          cacheHandler
        );

        if (fallbackResult.success) {
          result.success = true;
          result.data = fallbackResult.data as T;
          result.usedFallback = true;
          result.fallbackType = fallbackResult.type;
          buildMetrics.ssrFallbacksUsed++;

          console.log(`[BUILD OPERATION] Fallback successful: ${fallbackResult.type}`);
        }
      } catch (fallbackError) {
        console.error(`[BUILD OPERATION] Fallback also failed:`, fallbackError);
      }
    }
  } finally {
    result.duration = Date.now() - startTime;

    // Update average duration
    const totalDuration = buildMetrics.averageDuration * (buildMetrics.totalOperations - 1) + result.duration;
    buildMetrics.averageDuration = totalDuration / buildMetrics.totalOperations;

    if (finalConfig.enableDetailedLogging) {
      console.log(`[BUILD OPERATION] Duration: ${result.duration}ms, Cache errors handled: ${result.cacheErrorsHandled}`);
    }
  }

  return result;
}

/**
 * Wraps operation with cache error detection and recovery
 */
async function withCacheErrorHandling<T>(
  operation: () => Promise<T>,
  cacheHandler: CacheInvariantHandler,
  recoveryManager: CacheRecoveryManager,
  config: BuildOperationConfig,
  result: BuildOperationResult<T>
): Promise<T> {
  const maxAttempts = config.maxRetryAttempts || 3;
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Check if this is a cache invariant error
      if (config.enableCacheErrorHandling && cacheHandler.detectInvariantError(lastError)) {
        console.warn(`[BUILD OPERATION] Cache invariant error detected on attempt ${attempt}`);

        buildMetrics.cacheErrorsDetected++;
        result.cacheErrorsHandled++;

        // Create structured error object
        const invariantError = cacheHandler.createInvariantError(lastError, config.pageId);

        // Log the error
        cacheHandler.logInvariantError(invariantError);

        if (attempt < maxAttempts) {
          // Attempt recovery
          try {
            const recoveryResult = await recoveryManager.handleInvariantError(invariantError);
            result.recoveryResults.push(recoveryResult);

            if (recoveryResult.success) {
              buildMetrics.cacheErrorsRecovered++;
              console.log(`[BUILD OPERATION] Cache error recovery successful, retrying operation`);

              // Wait before retry
              const delay = config.retryDelayMs || 1000;
              await new Promise(resolve => setTimeout(resolve, delay * attempt));
              continue;
            } else {
              console.error(`[BUILD OPERATION] Cache error recovery failed:`, recoveryResult.error);
            }
          } catch (recoveryError) {
            console.error(`[BUILD OPERATION] Cache recovery threw error:`, recoveryError);
          }
        }
      }

      // If not a cache error or recovery failed, and we have more attempts, just retry
      if (attempt < maxAttempts) {
        const delay = (config.retryDelayMs || 1000) * Math.pow(2, attempt - 1);
        console.warn(`[BUILD OPERATION] Attempt ${attempt} failed, retrying in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Operation failed after all attempts');
}

/**
 * Attempts fallback strategies when primary operation fails
 */
async function attemptFallbackStrategy<T>(
  error: Error,
  config: BuildOperationConfig,
  cacheHandler: CacheInvariantHandler
): Promise<{ success: boolean; data?: T; type: 'ssr' | 'cached' | 'minimal' }> {
  console.log(`[BUILD OPERATION] Attempting fallback strategies for: ${config.operationName}`);

  // Strategy 1: Try to use cached data if available
  try {
    const cachedData = await attemptCachedFallback<T>(config);
    if (cachedData) {
      return { success: true, data: cachedData, type: 'cached' };
    }
  } catch (cacheError) {
    console.warn(`[BUILD OPERATION] Cached fallback failed:`, cacheError);
  }

  // Strategy 2: Generate minimal/empty state for SSR
  try {
    const minimalData = await attemptMinimalFallback<T>(config);
    if (minimalData) {
      return { success: true, data: minimalData, type: 'minimal' };
    }
  } catch (minimalError) {
    console.warn(`[BUILD OPERATION] Minimal fallback failed:`, minimalError);
  }

  // Strategy 3: Signal for SSR fallback (return undefined to trigger SSR)
  if (config.fallbackToSSR) {
    console.log(`[BUILD OPERATION] Triggering SSR fallback for: ${config.operationName}`);
    return { success: true, data: undefined, type: 'ssr' };
  }

  return { success: false, type: 'ssr' };
}

/**
 * Attempts to use cached data as fallback
 */
async function attemptCachedFallback<T>(config: BuildOperationConfig): Promise<T | null> {
  // This would integrate with your existing cache system
  // For now, return null to indicate no cached data available
  console.log(`[BUILD OPERATION] Checking for cached fallback data for: ${config.operationName}`);
  return null;
}

/**
 * Attempts to generate minimal/empty state as fallback
 */
async function attemptMinimalFallback<T>(config: BuildOperationConfig): Promise<T | null> {
  // Generate minimal data based on operation type
  console.log(`[BUILD OPERATION] Generating minimal fallback for: ${config.operationName}`);

  // This would be customized based on your specific needs
  // For now, return null to indicate no minimal fallback available
  return null;
}

/**
 * Wraps page generation with cache error handling
 */
export async function buildPageWithCacheErrorHandling<T>(
  pageId: string,
  buildFunction: () => Promise<T>,
  config: Partial<BuildOperationConfig> = {}
): Promise<BuildOperationResult<T>> {
  const pageConfig: BuildOperationConfig = {
    ...config,
    operationName: `build-page-${pageId}`,
    pageId,
    enableCacheErrorHandling: true,
    enableSSRFallback: true,
  };

  return withBuildErrorHandling(buildFunction, pageConfig);
}

/**
 * Wraps API calls during build with cache error handling
 */
export async function buildApiCallWithCacheErrorHandling<T>(
  url: string,
  apiCall: () => Promise<T>,
  config: Partial<BuildOperationConfig> = {}
): Promise<BuildOperationResult<T>> {
  const apiConfig: BuildOperationConfig = {
    ...config,
    operationName: `api-call-${url}`,
    enableCacheErrorHandling: true,
    enableSSRFallback: false, // API calls don't need SSR fallback
  };

  return withBuildErrorHandling(apiCall, apiConfig);
}

/**
 * Wraps static generation with cache error handling
 */
export async function generateStaticWithCacheErrorHandling<T>(
  operation: () => Promise<T>,
  config: Partial<BuildOperationConfig> = {}
): Promise<BuildOperationResult<T>> {
  const staticConfig: BuildOperationConfig = {
    ...config,
    operationName: 'static-generation',
    enableCacheErrorHandling: true,
    enableSSRFallback: true,
    cacheValidationEnabled: true,
  };

  return withBuildErrorHandling(operation, staticConfig);
}

/**
 * Gets build operation metrics
 */
export function getBuildOperationMetrics(): BuildOperationMetrics {
  return { ...buildMetrics };
}

/**
 * Clears build operation metrics (useful for testing)
 */
export function clearBuildOperationMetrics(): void {
  buildMetrics.totalOperations = 0;
  buildMetrics.successfulOperations = 0;
  buildMetrics.failedOperations = 0;
  buildMetrics.cacheErrorsDetected = 0;
  buildMetrics.cacheErrorsRecovered = 0;
  buildMetrics.ssrFallbacksUsed = 0;
  buildMetrics.averageDuration = 0;
  buildMetrics.operationsByType = {};
}

/**
 * Logs build operation statistics
 */
export function logBuildOperationStats(): void {
  console.log('\n=== BUILD OPERATION STATISTICS ===');
  console.log(`Total Operations: ${buildMetrics.totalOperations}`);
  console.log(`Success Rate: ${Math.round(buildMetrics.successfulOperations / buildMetrics.totalOperations * 100)}%`);
  console.log(`Cache Errors Detected: ${buildMetrics.cacheErrorsDetected}`);
  console.log(`Cache Errors Recovered: ${buildMetrics.cacheErrorsRecovered}`);
  console.log(`SSR Fallbacks Used: ${buildMetrics.ssrFallbacksUsed}`);
  console.log(`Average Duration: ${Math.round(buildMetrics.averageDuration)}ms`);

  if (Object.keys(buildMetrics.operationsByType).length > 0) {
    console.log('\nOperations by Type:');
    Object.entries(buildMetrics.operationsByType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
  }

  console.log('=== END STATISTICS ===\n');
}

/**
 * Configuration presets for different environments
 */
export const BUILD_OPERATION_PRESETS = {
  development: {
    enableDetailedLogging: true,
    maxRetryAttempts: 2,
    retryDelayMs: 500,
    apiTimeout: 15000,
    buildTimeout: 60000,
  },
  production: {
    enableDetailedLogging: false,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    apiTimeout: 10000,
    buildTimeout: 45000,
  },
  test: {
    enableDetailedLogging: false,
    maxRetryAttempts: 1,
    retryDelayMs: 100,
    apiTimeout: 5000,
    buildTimeout: 30000,
  },
} as const;

/**
 * Gets configuration preset for current environment
 */
export function getBuildOperationConfig(env?: string): BuildOperationConfig {
  const environment = env || process.env.NODE_ENV || 'development';
  const preset = BUILD_OPERATION_PRESETS[environment as keyof typeof BUILD_OPERATION_PRESETS]
    || BUILD_OPERATION_PRESETS.development;

  return { ...DEFAULT_BUILD_CONFIG, ...preset };
}