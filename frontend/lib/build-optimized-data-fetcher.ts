/**
 * Optimized Data Fetcher for Build-time Operations
 *
 * This module integrates connection pooling, request deduplication,
 * and retry logic with exponential backoff to provide a comprehensive
 * solution for optimized data fetching during build time.
 */

import { BuildConnectionPool, getBuildConnectionPool, ConnectionPoolConfig } from './build-connection-pool';
import { RequestDeduplicator, getRequestDeduplicator, DeduplicationConfig } from './build-request-deduplication';
import { RetryManager, getRetryManager, RetryConfig } from './build-retry-logic';
import { withTimeout, TimeoutConfig } from './build-timeout-wrapper';

export interface OptimizedDataFetcherConfig {
  connectionPool?: Partial<ConnectionPoolConfig>;
  deduplication?: Partial<DeduplicationConfig>;
  retry?: Partial<RetryConfig>;
  timeout?: Partial<TimeoutConfig>;
  enableConnectionPooling?: boolean;
  enableDeduplication?: boolean;
  enableRetryLogic?: boolean;
  enableTimeouts?: boolean;
}

export interface FetchMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  cacheHitRate: number;
  retryRate: number;
  timeoutRate: number;
  connectionPoolUtilization: number;
}

export interface BatchFetchRequest {
  id: string;
  url: string;
  options?: RequestInit;
  priority?: 'high' | 'medium' | 'low';
}

export interface BatchFetchResult<T> {
  id: string;
  success: boolean;
  data?: T;
  error?: Error;
  responseTime: number;
  fromCache: boolean;
  retryCount: number;
}

// Default configuration
const DEFAULT_CONFIG: OptimizedDataFetcherConfig = {
  enableConnectionPooling: process.env.BUILD_ENABLE_CONNECTION_POOLING !== 'false',
  enableDeduplication: process.env.BUILD_ENABLE_DEDUPLICATION !== 'false',
  enableRetryLogic: process.env.BUILD_ENABLE_RETRY_LOGIC !== 'false',
  enableTimeouts: process.env.BUILD_ENABLE_TIMEOUTS !== 'false',
};

/**
 * Optimized Data Fetcher that combines all optimization strategies
 */
export class OptimizedDataFetcher {
  private config: OptimizedDataFetcherConfig;
  private connectionPool: BuildConnectionPool | null = null;
  private deduplicator: RequestDeduplicator | null = null;
  private retryManager: RetryManager | null = null;
  private metrics: FetchMetrics;

  constructor(config: OptimizedDataFetcherConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      retryRate: 0,
      timeoutRate: 0,
      connectionPoolUtilization: 0,
    };

    this.initializeComponents();
  }

  /**
   * Initializes the optimization components based on configuration
   */
  private initializeComponents(): void {
    if (this.config.enableConnectionPooling) {
      this.connectionPool = getBuildConnectionPool(this.config.connectionPool);
    }

    if (this.config.enableDeduplication) {
      this.deduplicator = getRequestDeduplicator(this.config.deduplication);
    }

    if (this.config.enableRetryLogic) {
      this.retryManager = getRetryManager(this.config.retry);
    }

    console.log('[OPTIMIZED FETCHER] Initialized with features:', {
      connectionPooling: !!this.connectionPool,
      deduplication: !!this.deduplicator,
      retryLogic: !!this.retryManager,
      timeouts: this.config.enableTimeouts,
    });
  }

  /**
   * Makes an optimized fetch request
   */
  async fetch<T>(
    url: string,
    options: RequestInit = {},
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<T> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      console.log(`[OPTIMIZED FETCHER] Starting optimized fetch for ${url}`);

      const result = await this.executeOptimizedFetch<T>(url, options, priority);

      const responseTime = Date.now() - startTime;
      this.metrics.successfulRequests++;
      this.updateAverageResponseTime(responseTime);

      console.log(`[OPTIMIZED FETCHER] Successfully fetched ${url} in ${responseTime}ms`);
      return result;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.metrics.failedRequests++;
      this.updateAverageResponseTime(responseTime);

      console.error(`[OPTIMIZED FETCHER] Failed to fetch ${url}:`, error);
      throw error;
    }
  }

  /**
   * Executes the optimized fetch with all enabled optimizations
   */
  private async executeOptimizedFetch<T>(
    url: string,
    options: RequestInit,
    priority: 'high' | 'medium' | 'low'
  ): Promise<T> {
    // Create the base fetch function
    let fetchFunction = this.createBaseFetchFunction<T>(url, options, priority);

    // Apply deduplication if enabled
    if (this.deduplicator) {
      const originalFetch = fetchFunction;
      fetchFunction = () => this.deduplicator!.request<T>(url, options, originalFetch);
    }

    // Apply retry logic if enabled
    if (this.retryManager) {
      const originalFetch = fetchFunction;
      fetchFunction = () => this.retryManager!.executeWithRetry(originalFetch, url, `fetch ${url}`);
    }

    // Apply timeout if enabled
    if (this.config.enableTimeouts) {
      const originalFetch = fetchFunction;
      const timeoutMs = this.config.timeout?.apiTimeout || 10000;
      fetchFunction = () => withTimeout(originalFetch(), timeoutMs, `fetch ${url}`);
    }

    return fetchFunction();
  }

  /**
   * Creates the base fetch function with connection pooling if enabled
   */
  private createBaseFetchFunction<T>(
    url: string,
    options: RequestInit,
    priority: 'high' | 'medium' | 'low'
  ): () => Promise<T> {
    if (this.connectionPool) {
      return () => this.connectionPool!.request<T>(url, options, priority);
    } else {
      return async () => {
        const response = await fetch(url, options);

        if (!response.ok) {
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as any;
          error.status = response.status;
          throw error;
        }

        return response.json();
      };
    }
  }

  /**
   * Fetches multiple URLs in parallel with optimization
   */
  async fetchBatch<T>(requests: BatchFetchRequest[]): Promise<BatchFetchResult<T>[]> {
    console.log(`[OPTIMIZED FETCHER] Starting batch fetch for ${requests.length} requests`);

    const results = await Promise.allSettled(
      requests.map(async (request): Promise<BatchFetchResult<T>> => {
        const startTime = Date.now();

        try {
          const data = await this.fetch<T>(request.url, request.options, request.priority);
          const responseTime = Date.now() - startTime;

          return {
            id: request.id,
            success: true,
            data,
            responseTime,
            fromCache: false, // TODO: Detect cache hits
            retryCount: 0, // TODO: Get actual retry count
          };
        } catch (error) {
          const responseTime = Date.now() - startTime;

          return {
            id: request.id,
            success: false,
            error: error as Error,
            responseTime,
            fromCache: false,
            retryCount: 0, // TODO: Get actual retry count
          };
        }
      })
    );

    return results.map(result =>
      result.status === 'fulfilled' ? result.value : {
        id: 'unknown',
        success: false,
        error: new Error('Promise rejected'),
        responseTime: 0,
        fromCache: false,
        retryCount: 0,
      }
    );
  }

  /**
   * Fetches data with automatic fallback to cached version on failure
   */
  async fetchWithFallback<T>(
    url: string,
    options: RequestInit = {},
    fallbackData?: T,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<T> {
    try {
      return await this.fetch<T>(url, options, priority);
    } catch (error) {
      console.warn(`[OPTIMIZED FETCHER] Fetch failed for ${url}, using fallback:`, error);

      if (fallbackData !== undefined) {
        return fallbackData;
      }

      throw error;
    }
  }

  /**
   * Updates average response time metric
   */
  private updateAverageResponseTime(responseTime: number): void {
    const totalRequests = this.metrics.successfulRequests + this.metrics.failedRequests;
    const currentAverage = this.metrics.averageResponseTime;

    this.metrics.averageResponseTime =
      ((currentAverage * (totalRequests - 1)) + responseTime) / totalRequests;
  }

  /**
   * Gets comprehensive metrics from all components
   */
  getMetrics(): FetchMetrics {
    // Update metrics from components
    if (this.connectionPool) {
      const poolMetrics = this.connectionPool.getMetrics();
      this.metrics.connectionPoolUtilization =
        poolMetrics.activeConnections / (this.config.connectionPool?.maxConnections || 5);
    }

    if (this.deduplicator) {
      const dedupMetrics = this.deduplicator.getMetrics();
      this.metrics.cacheHitRate =
        dedupMetrics.totalRequests > 0 ? (dedupMetrics.cacheHits / dedupMetrics.totalRequests) * 100 : 0;
    }

    if (this.retryManager) {
      const retryMetrics = this.retryManager.getMetrics();
      this.metrics.retryRate =
        retryMetrics.totalAttempts > 0 ? (retryMetrics.successfulRetries / retryMetrics.totalAttempts) * 100 : 0;
    }

    return { ...this.metrics };
  }

  /**
   * Gets detailed metrics from all components
   */
  getDetailedMetrics() {
    return {
      fetcher: this.getMetrics(),
      connectionPool: this.connectionPool?.getMetrics(),
      deduplication: this.deduplicator?.getMetrics(),
      retry: this.retryManager?.getMetrics(),
      circuitBreakers: this.retryManager?.getCircuitBreakerStates(),
    };
  }

  /**
   * Logs performance statistics
   */
  logPerformanceStats(): void {
    const metrics = this.getMetrics();

    console.log('[OPTIMIZED FETCHER] Performance Statistics:', {
      totalRequests: metrics.totalRequests,
      successRate: `${((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(1)}%`,
      averageResponseTime: `${metrics.averageResponseTime.toFixed(0)}ms`,
      cacheHitRate: `${metrics.cacheHitRate.toFixed(1)}%`,
      retryRate: `${metrics.retryRate.toFixed(1)}%`,
      connectionPoolUtilization: `${(metrics.connectionPoolUtilization * 100).toFixed(1)}%`,
    });

    // Log component-specific stats
    if (this.connectionPool) {
      const poolMetrics = this.connectionPool.getMetrics();
      console.log('[CONNECTION POOL] Statistics:', poolMetrics);
    }

    if (this.deduplicator) {
      const dedupMetrics = this.deduplicator.getMetrics();
      console.log('[DEDUPLICATION] Statistics:', dedupMetrics);
    }

    if (this.retryManager) {
      const retryMetrics = this.retryManager.getMetrics();
      console.log('[RETRY MANAGER] Statistics:', retryMetrics);
    }
  }

  /**
   * Clears all caches and resets metrics
   */
  reset(): void {
    if (this.deduplicator) {
      this.deduplicator.clearCache();
    }

    if (this.retryManager) {
      this.retryManager.resetMetrics();
      this.retryManager.resetCircuitBreakers();
    }

    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      retryRate: 0,
      timeoutRate: 0,
      connectionPoolUtilization: 0,
    };

    console.log('[OPTIMIZED FETCHER] Reset all metrics and caches');
  }

  /**
   * Shuts down all components
   */
  shutdown(): void {
    if (this.connectionPool) {
      this.connectionPool.shutdown();
    }

    if (this.deduplicator) {
      this.deduplicator.shutdown();
    }

    console.log('[OPTIMIZED FETCHER] Shut down all components');
  }
}

// Global optimized data fetcher instance
let globalOptimizedDataFetcher: OptimizedDataFetcher | null = null;

/**
 * Gets or creates the global optimized data fetcher
 */
export function getOptimizedDataFetcher(config?: OptimizedDataFetcherConfig): OptimizedDataFetcher {
  if (!globalOptimizedDataFetcher) {
    globalOptimizedDataFetcher = new OptimizedDataFetcher(config);
  }
  return globalOptimizedDataFetcher;
}

/**
 * Resets the global optimized data fetcher (useful for testing)
 */
export function resetOptimizedDataFetcher(): void {
  if (globalOptimizedDataFetcher) {
    globalOptimizedDataFetcher.shutdown();
    globalOptimizedDataFetcher = null;
  }
}

/**
 * Convenience function for optimized fetch requests
 */
export async function optimizedFetch<T>(
  url: string,
  options: RequestInit = {},
  priority: 'high' | 'medium' | 'low' = 'medium',
  config?: OptimizedDataFetcherConfig
): Promise<T> {
  const fetcher = getOptimizedDataFetcher(config);
  return fetcher.fetch<T>(url, options, priority);
}

/**
 * Convenience function for batch optimized fetch requests
 */
export async function optimizedFetchBatch<T>(
  requests: BatchFetchRequest[],
  config?: OptimizedDataFetcherConfig
): Promise<BatchFetchResult<T>[]> {
  const fetcher = getOptimizedDataFetcher(config);
  return fetcher.fetchBatch<T>(requests);
}