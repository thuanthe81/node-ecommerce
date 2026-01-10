/**
 * Build API Response Cache
 *
 * Implements API response caching with appropriate TTL, cache warming for critical data,
 * and cache compression to reduce memory usage during build time.
 */

import { getBuildCacheManager, BuildCacheManager } from './build-cache-manager';
import { fetchWithBuildTimeout } from './build-timeout-wrapper';

export interface ApiCacheConfig {
  defaultTTL: number; // 300 seconds (5 minutes)
  criticalDataTTL: number; // 600 seconds (10 minutes)
  maxRetries: number; // 3
  retryDelay: number; // 1000ms
  enableCacheWarming: boolean;
  compressionThreshold: number; // Compress responses larger than this (bytes)
  warmupEndpoints: string[];
}

export interface CachedApiResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
  timestamp: number;
  url: string;
  cacheHit: boolean;
}

export interface ApiCacheStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  averageResponseTime: number;
  warmupCompleted: boolean;
  failedWarmups: string[];
}

export class BuildApiResponseCache {
  private cacheManager: BuildCacheManager;
  private config: ApiCacheConfig;
  private stats: ApiCacheStats = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    hitRate: 0,
    averageResponseTime: 0,
    warmupCompleted: false,
    failedWarmups: [],
  };
  private responseTimes: number[] = [];

  constructor(config: Partial<ApiCacheConfig> = {}) {
    this.cacheManager = getBuildCacheManager();
    this.config = {
      defaultTTL: 300, // 5 minutes
      criticalDataTTL: 600, // 10 minutes
      maxRetries: 3,
      retryDelay: 1000,
      enableCacheWarming: true,
      compressionThreshold: 1024, // 1KB
      warmupEndpoints: [],
      ...config,
    };
  }

  /**
   * Fetch API response with caching
   */
  async fetchWithCache<T>(
    url: string,
    options: RequestInit = {},
    cacheOptions: {
      ttl?: number;
      bypassCache?: boolean;
      cacheKey?: string;
      isCritical?: boolean;
    } = {}
  ): Promise<CachedApiResponse<T>> {
    const startTime = Date.now();
    this.stats.totalRequests++;

    const cacheKey = cacheOptions.cacheKey || this.generateCacheKey(url, options);
    const ttl = cacheOptions.ttl ||
      (cacheOptions.isCritical ? this.config.criticalDataTTL : this.config.defaultTTL);

    // Check cache first (unless bypassed)
    if (!cacheOptions.bypassCache) {
      const cachedResponse = await this.getCachedResponse<T>(cacheKey);
      if (cachedResponse) {
        this.stats.cacheHits++;
        this.updateStats(Date.now() - startTime);
        return {
          ...cachedResponse,
          cacheHit: true,
        };
      }
    }

    // Cache miss - fetch from API
    this.stats.cacheMisses++;

    try {
      const response = await this.fetchWithRetry<T>(url, options);
      const responseTime = Date.now() - startTime;

      const cachedResponse: CachedApiResponse<T> = {
        data: response.data,
        status: response.status,
        headers: response.headers,
        timestamp: Date.now(),
        url,
        cacheHit: false,
      };

      // Cache the response
      await this.setCachedResponse(cacheKey, cachedResponse, ttl);

      this.updateStats(responseTime);
      return cachedResponse;

    } catch (error) {
      // Try to return stale cache data if available
      const staleResponse = await this.getStaleResponse<T>(cacheKey);
      if (staleResponse) {
        console.warn(`[API CACHE] Using stale cache data for ${url} due to error:`, error);
        return {
          ...staleResponse,
          cacheHit: true,
        };
      }

      throw error;
    }
  }

  /**
   * Warm up cache with critical endpoints
   */
  async warmupCache(): Promise<void> {
    if (!this.config.enableCacheWarming || this.config.warmupEndpoints.length === 0) {
      this.stats.warmupCompleted = true;
      return;
    }

    console.log(`[API CACHE] Starting cache warmup for ${this.config.warmupEndpoints.length} endpoints`);

    const warmupPromises = this.config.warmupEndpoints.map(async (endpoint) => {
      try {
        await this.fetchWithCache(endpoint, {}, { isCritical: true });
        console.log(`[API CACHE] Warmed up: ${endpoint}`);
      } catch (error) {
        console.warn(`[API CACHE] Failed to warm up ${endpoint}:`, error);
        this.stats.failedWarmups.push(endpoint);
      }
    });

    await Promise.allSettled(warmupPromises);
    this.stats.warmupCompleted = true;

    const successCount = this.config.warmupEndpoints.length - this.stats.failedWarmups.length;
    console.log(`[API CACHE] Cache warmup completed: ${successCount}/${this.config.warmupEndpoints.length} successful`);
  }

  /**
   * Preload specific API responses
   */
  async preloadResponses(endpoints: Array<{
    url: string;
    options?: RequestInit;
    ttl?: number;
    isCritical?: boolean;
  }>): Promise<void> {
    console.log(`[API CACHE] Preloading ${endpoints.length} API responses`);

    const preloadPromises = endpoints.map(async ({ url, options = {}, ttl, isCritical }) => {
      try {
        await this.fetchWithCache(url, options, { ttl, isCritical });
      } catch (error) {
        console.warn(`[API CACHE] Failed to preload ${url}:`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
    console.log('[API CACHE] Response preloading completed');
  }

  /**
   * Invalidate cached responses by pattern
   */
  async invalidateByPattern(pattern: string | RegExp): Promise<void> {
    await this.cacheManager.invalidate(pattern);
    console.log(`[API CACHE] Invalidated responses matching pattern: ${pattern}`);
  }

  /**
   * Invalidate cached responses by URL
   */
  async invalidateByUrl(url: string, options?: RequestInit): Promise<void> {
    const cacheKey = this.generateCacheKey(url, options);
    await this.cacheManager.invalidate(new RegExp(`^${cacheKey}$`));
    console.log(`[API CACHE] Invalidated response for: ${url}`);
  }

  /**
   * Get cache statistics
   */
  getStats(): ApiCacheStats {
    this.stats.hitRate = this.stats.totalRequests > 0 ?
      this.stats.cacheHits / this.stats.totalRequests : 0;

    this.stats.averageResponseTime = this.responseTimes.length > 0 ?
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length : 0;

    return { ...this.stats };
  }

  /**
   * Clear all cached responses
   */
  async clearCache(): Promise<void> {
    await this.cacheManager.clear();
    this.resetStats();
    console.log('[API CACHE] All cached responses cleared');
  }

  /**
   * Get cached response if available and not expired
   */
  private async getCachedResponse<T>(cacheKey: string): Promise<CachedApiResponse<T> | null> {
    try {
      return await this.cacheManager.get<CachedApiResponse<T>>(cacheKey);
    } catch (error) {
      console.warn(`[API CACHE] Failed to get cached response for ${cacheKey}:`, error);
      return null;
    }
  }

  /**
   * Set cached response with TTL
   */
  private async setCachedResponse<T>(
    cacheKey: string,
    response: CachedApiResponse<T>,
    ttl: number
  ): Promise<void> {
    try {
      await this.cacheManager.set(cacheKey, response, ttl);
    } catch (error) {
      console.warn(`[API CACHE] Failed to cache response for ${cacheKey}:`, error);
    }
  }

  /**
   * Get stale cached response (ignoring TTL)
   */
  private async getStaleResponse<T>(cacheKey: string): Promise<CachedApiResponse<T> | null> {
    try {
      // Temporarily disable TTL checking by accessing cache directly
      const cacheManager = this.cacheManager as any;
      const entry = cacheManager.memoryCache?.get(cacheKey);

      if (entry) {
        return cacheManager.deserializeData(entry);
      }

      // Check persistent cache
      const persistentEntry = await (cacheManager as any).getPersistentEntry(cacheKey);
      if (persistentEntry) {
        return cacheManager.deserializeData(persistentEntry);
      }

      return null;
    } catch (error) {
      console.warn(`[API CACHE] Failed to get stale response for ${cacheKey}:`, error);
      return null;
    }
  }

  /**
   * Fetch with retry logic
   */
  private async fetchWithRetry<T>(url: string, options: RequestInit): Promise<CachedApiResponse<T>> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const response = await fetchWithBuildTimeout<any>(url, options);

        return {
          data: response,
          status: 200, // fetchWithBuildTimeout throws on non-200 status
          headers: {},
          timestamp: Date.now(),
          url,
          cacheHit: false,
        };

      } catch (error) {
        lastError = error as Error;

        if (attempt < this.config.maxRetries) {
          const delay = this.config.retryDelay * attempt;
          console.warn(`[API CACHE] Attempt ${attempt} failed for ${url}, retrying in ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  /**
   * Generate cache key from URL and options
   */
  private generateCacheKey(url: string, options: RequestInit = {}): string {
    const keyData = {
      url,
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.body || null,
    };

    return `api_${Buffer.from(JSON.stringify(keyData)).toString('base64')}`;
  }

  /**
   * Update performance statistics
   */
  private updateStats(responseTime: number): void {
    this.responseTimes.push(responseTime);

    // Keep only last 100 response times for average calculation
    if (this.responseTimes.length > 100) {
      this.responseTimes = this.responseTimes.slice(-100);
    }
  }

  /**
   * Reset statistics
   */
  private resetStats(): void {
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      hitRate: 0,
      averageResponseTime: 0,
      warmupCompleted: false,
      failedWarmups: [],
    };
    this.responseTimes = [];
  }
}

/**
 * Create a singleton API response cache instance
 */
let apiResponseCache: BuildApiResponseCache | null = null;

export function createApiResponseCache(config?: Partial<ApiCacheConfig>): BuildApiResponseCache {
  if (!apiResponseCache) {
    apiResponseCache = new BuildApiResponseCache(config);
  }
  return apiResponseCache;
}

/**
 * Get the singleton API response cache instance
 */
export function getApiResponseCache(): BuildApiResponseCache {
  if (!apiResponseCache) {
    apiResponseCache = new BuildApiResponseCache();
  }
  return apiResponseCache;
}

/**
 * Enhanced fetch function with API response caching
 */
export async function fetchWithApiCache<T>(
  url: string,
  options: RequestInit = {},
  cacheOptions: {
    ttl?: number;
    bypassCache?: boolean;
    isCritical?: boolean;
  } = {}
): Promise<T> {
  const cache = getApiResponseCache();
  const response = await cache.fetchWithCache<T>(url, options, cacheOptions);
  return response.data;
}

/**
 * Batch fetch multiple URLs with caching
 */
export async function batchFetchWithCache<T>(
  requests: Array<{
    url: string;
    options?: RequestInit;
    cacheOptions?: {
      ttl?: number;
      bypassCache?: boolean;
      isCritical?: boolean;
    };
  }>
): Promise<Array<CachedApiResponse<T>>> {
  const cache = getApiResponseCache();

  const fetchPromises = requests.map(({ url, options = {}, cacheOptions = {} }) =>
    cache.fetchWithCache<T>(url, options, cacheOptions)
  );

  return Promise.all(fetchPromises);
}

/**
 * Default API cache configuration for different environments
 */
export function getDefaultApiCacheConfig(): ApiCacheConfig {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isTest = process.env.NODE_ENV === 'test';

  return {
    defaultTTL: isDevelopment ? 60 : 300, // 1 min dev, 5 min prod
    criticalDataTTL: isDevelopment ? 120 : 600, // 2 min dev, 10 min prod
    maxRetries: 3,
    retryDelay: 1000,
    enableCacheWarming: !isDevelopment && !isTest, // Disable in dev and test
    compressionThreshold: 1024, // 1KB
    warmupEndpoints: [
      // Add critical endpoints that should be warmed up
      '/api/categories',
      '/api/products/featured',
      '/api/content/homepage',
      '/api/footer-settings',
    ],
  };
}

/**
 * Initialize API response cache for build environment
 */
export async function initializeApiResponseCache(): Promise<void> {
  const config = getDefaultApiCacheConfig();
  const cache = createApiResponseCache(config);

  if (config.enableCacheWarming) {
    await cache.warmupCache();
  }

  console.log('[API CACHE] API response cache initialized');
}