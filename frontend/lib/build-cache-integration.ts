/**
 * Build Cache Integration
 *
 * This module provides integration points for the build system to use
 * cache invariant error handling throughout the build process.
 */

import {
  buildPageWithCacheErrorHandling,
  buildApiCallWithCacheErrorHandling,
  generateStaticWithCacheErrorHandling,
  getBuildOperationConfig,
  logBuildOperationStats,
  BuildOperationResult
} from './build-operation-wrapper';

import {
  createCacheInvariantHandler,
  createCacheRecoveryManager
} from './cache-invariant-handler';

import { fetchWithBuildTimeout } from './build-timeout-wrapper';

/**
 * Enhanced fetch function with cache error handling for build-time API calls
 */
export async function fetchWithCacheErrorHandling<T>(
  url: string,
  options: RequestInit = {},
  pageId?: string
): Promise<T> {
  const config = getBuildOperationConfig();

  const result = await buildApiCallWithCacheErrorHandling(
    url,
    () => fetchWithBuildTimeout<T>(url, options, config),
    { pageId }
  );

  if (!result.success) {
    throw result.error || new Error(`Failed to fetch ${url}`);
  }

  return result.data!;
}

/**
 * Wraps Next.js getStaticProps with cache error handling
 */
export function withCacheErrorHandling<P extends Record<string, any>>(
  getStaticPropsFunction: () => Promise<{ props: P } | { notFound: true } | { redirect: any }>
) {
  return async (): Promise<{ props: P } | { notFound: true } | { redirect: any }> => {
    const config = getBuildOperationConfig();

    const result = await generateStaticWithCacheErrorHandling(
      getStaticPropsFunction,
      config
    );

    if (!result.success) {
      // If cache error handling failed, fall back to SSR or notFound
      if (result.usedFallback && result.fallbackType === 'ssr') {
        console.warn('[BUILD CACHE] Falling back to SSR due to cache errors');
        // Return empty props to trigger SSR
        return { props: {} as P };
      }

      console.error('[BUILD CACHE] Static generation failed, returning notFound');
      return { notFound: true };
    }

    return result.data!;
  };
}

/**
 * Wraps Next.js generateStaticParams with cache error handling
 */
export function withCacheErrorHandlingForParams<T extends Record<string, string>>(
  generateParamsFunction: () => Promise<T[]>
) {
  return async (): Promise<T[]> => {
    const config = getBuildOperationConfig();

    const result = await generateStaticWithCacheErrorHandling(
      generateParamsFunction,
      config
    );

    if (!result.success) {
      console.error('[BUILD CACHE] Failed to generate static params, returning empty array');
      return [];
    }

    return result.data || [];
  };
}

/**
 * Initializes cache error handling for the build process
 */
export function initializeBuildCacheHandling(): void {
  console.log('[BUILD CACHE] Initializing cache error handling system');

  const config = getBuildOperationConfig();

  // Create global handlers
  const cacheHandler = createCacheInvariantHandler(config);
  const recoveryManager = createCacheRecoveryManager(config);

  // Set up global error handlers for unhandled cache errors
  if (typeof process !== 'undefined') {
    const originalUncaughtException = process.listeners('uncaughtException');

    process.on('uncaughtException', (error: Error) => {
      if (cacheHandler.detectInvariantError(error)) {
        console.error('[BUILD CACHE] Uncaught cache invariant error detected:', error.message);

        const invariantError = cacheHandler.createInvariantError(error);
        cacheHandler.logInvariantError(invariantError);

        // Attempt recovery
        recoveryManager.handleInvariantError(invariantError)
          .then(result => {
            if (result.success) {
              console.log('[BUILD CACHE] Successfully recovered from uncaught cache error');
            } else {
              console.error('[BUILD CACHE] Failed to recover from uncaught cache error');
            }
          })
          .catch(recoveryError => {
            console.error('[BUILD CACHE] Recovery attempt failed:', recoveryError);
          });
      }

      // Call original handlers
      originalUncaughtException.forEach(handler => {
        if (typeof handler === 'function') {
          handler(error, 'uncaughtException');
        }
      });
    });
  }

  // Set up build completion handler
  if (typeof process !== 'undefined') {
    process.on('beforeExit', () => {
      logBuildOperationStats();
    });
  }

  console.log('[BUILD CACHE] Cache error handling system initialized');
}

/**
 * Validates cache state before build operations
 */
export async function validateBuildCache(): Promise<boolean> {
  console.log('[BUILD CACHE] Validating cache state before build');

  const config = getBuildOperationConfig();
  const recoveryManager = createCacheRecoveryManager(config);

  try {
    const validation = await recoveryManager.validateCacheState();

    if (!validation.isValid) {
      console.warn('[BUILD CACHE] Cache validation failed:', {
        corruptedKeys: validation.corruptedKeys.length,
        errors: validation.errors.length,
      });

      // Clear corrupted cache
      await recoveryManager.clearCorruptedCache();
      console.log('[BUILD CACHE] Corrupted cache cleared');

      return false;
    }

    console.log('[BUILD CACHE] Cache validation passed');
    return true;
  } catch (error) {
    console.error('[BUILD CACHE] Cache validation error:', error);
    return false;
  }
}

/**
 * Optimizes cache before build operations
 */
export async function optimizeBuildCache(): Promise<void> {
  console.log('[BUILD CACHE] Optimizing cache before build');

  const config = getBuildOperationConfig();
  const recoveryManager = createCacheRecoveryManager(config);

  try {
    await recoveryManager.optimizeCache();
    console.log('[BUILD CACHE] Cache optimization completed');
  } catch (error) {
    console.error('[BUILD CACHE] Cache optimization failed:', error);
  }
}

/**
 * Wraps any build operation with cache error handling
 */
export async function withBuildCacheHandling<T>(
  operation: () => Promise<T>,
  operationName: string,
  pageId?: string
): Promise<T> {
  const config = getBuildOperationConfig();

  const result = await generateStaticWithCacheErrorHandling(
    operation,
    { ...config, operationName, pageId }
  );

  if (!result.success) {
    throw result.error || new Error(`Build operation failed: ${operationName}`);
  }

  return result.data!;
}

/**
 * Creates a cache-aware API client for build-time operations
 */
export function createBuildApiClient(baseUrl: string) {
  return {
    async get<T>(path: string, pageId?: string): Promise<T> {
      const url = `${baseUrl}${path}`;
      return fetchWithCacheErrorHandling<T>(url, { method: 'GET' }, pageId);
    },

    async post<T>(path: string, data: any, pageId?: string): Promise<T> {
      const url = `${baseUrl}${path}`;
      return fetchWithCacheErrorHandling<T>(
        url,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
        pageId
      );
    },
  };
}

/**
 * Environment-specific initialization
 */
export function initializeForEnvironment(): void {
  const env = process.env.NODE_ENV || 'development';

  console.log(`[BUILD CACHE] Initializing for environment: ${env}`);

  // Only initialize in build environments
  if (env === 'production' || process.env.NEXT_PHASE === 'phase-production-build') {
    initializeBuildCacheHandling();

    // Pre-validate and optimize cache
    validateBuildCache()
      .then(isValid => {
        if (isValid) {
          return optimizeBuildCache();
        }
      })
      .catch(error => {
        console.error('[BUILD CACHE] Initialization error:', error);
      });
  }
}

// Auto-initialize if in build environment
if (typeof process !== 'undefined' &&
    (process.env.NODE_ENV === 'production' || process.env.NEXT_PHASE === 'phase-production-build')) {
  initializeForEnvironment();
}