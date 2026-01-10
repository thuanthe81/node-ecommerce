/**
 * Request Deduplication System for Build-time Operations
 *
 * This module provides request deduplication functionality to avoid
 * duplicate API calls during build time by caching ongoing requests
 * and implementing intelligent cache key generation.
 */

export interface DeduplicationConfig {
  maxCacheSize: number; // Maximum number of cached requests
  cacheTTL: number; // Time-to-live for cached requests (ms)
  enableBatching: boolean; // Enable request batching
  batchWindow: number; // Batching window in milliseconds
  batchSize: number; // Maximum batch size
}

export interface CachedRequest<T> {
  promise: Promise<T>;
  timestamp: Date;
  url: string;
  cacheKey: string;
  requestCount: number; // Number of times this request was deduplicated
}

export interface BatchRequest {
  id: string;
  url: string;
  options: RequestInit;
  cacheKey: string;
  timestamp: Date;
  resolve: (value: any) => void;
  reject: (error: Error) => void;
}

export interface DeduplicationMetrics {
  totalRequests: number;
  deduplicatedRequests: number;
  cacheHits: number;
  cacheMisses: number;
  batchedRequests: number;
  averageBatchSize: number;
  cacheSize: number;
  deduplicationRate: number;
}

// Default configuration
const DEFAULT_CONFIG: DeduplicationConfig = {
  maxCacheSize: parseInt(process.env.BUILD_DEDUP_CACHE_SIZE || '100', 10),
  cacheTTL: parseInt(process.env.BUILD_DEDUP_TTL || '300000', 10), // 5 minutes
  enableBatching: process.env.BUILD_ENABLE_BATCHING !== 'false',
  batchWindow: parseInt(process.env.BUILD_BATCH_WINDOW || '100', 10), // 100ms
  batchSize: parseInt(process.env.BUILD_BATCH_SIZE || '10', 10),
};

/**
 * Request Deduplication Manager
 */
export class RequestDeduplicator {
  private config: DeduplicationConfig;
  private requestCache: Map<string, CachedRequest<any>> = new Map();
  private batchQueue: Map<string, BatchRequest[]> = new Map();
  private batchTimers: Map<string, NodeJS.Timeout> = new Map();
  private metrics: DeduplicationMetrics;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<DeduplicationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.metrics = {
      totalRequests: 0,
      deduplicatedRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      batchedRequests: 0,
      averageBatchSize: 0,
      cacheSize: 0,
      deduplicationRate: 0,
    };

    this.startCleanupTimer();
  }

  /**
   * Makes a deduplicated request
   */
  async request<T>(
    url: string,
    options: RequestInit = {},
    fetchFunction: (url: string, options: RequestInit) => Promise<T>
  ): Promise<T> {
    this.metrics.totalRequests++;

    const cacheKey = this.generateCacheKey(url, options);

    // Check if request is already in progress
    const cachedRequest = this.requestCache.get(cacheKey);
    if (cachedRequest && !this.isExpired(cachedRequest)) {
      console.log(`[DEDUPLICATION] Cache hit for ${cacheKey}`);
      this.metrics.cacheHits++;
      this.metrics.deduplicatedRequests++;
      cachedRequest.requestCount++;
      return cachedRequest.promise;
    }

    this.metrics.cacheMisses++;

    // Check if batching is enabled and this request can be batched
    if (this.config.enableBatching && this.canBatch(url, options)) {
      return this.handleBatchedRequest<T>(url, options, cacheKey, fetchFunction);
    }

    // Make individual request
    return this.makeIndividualRequest<T>(url, options, cacheKey, fetchFunction);
  }

  /**
   * Handles batched requests
   */
  private async handleBatchedRequest<T>(
    url: string,
    options: RequestInit,
    cacheKey: string,
    fetchFunction: (url: string, options: RequestInit) => Promise<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const batchKey = this.getBatchKey(url, options);

      const batchRequest: BatchRequest = {
        id: this.generateRequestId(),
        url,
        options,
        cacheKey,
        timestamp: new Date(),
        resolve,
        reject,
      };

      // Add to batch queue
      if (!this.batchQueue.has(batchKey)) {
        this.batchQueue.set(batchKey, []);
      }

      const batch = this.batchQueue.get(batchKey)!;
      batch.push(batchRequest);

      console.log(`[DEDUPLICATION] Added request to batch ${batchKey} (${batch.length}/${this.config.batchSize})`);

      // Process batch if it's full or start timer for partial batch
      if (batch.length >= this.config.batchSize) {
        this.processBatch(batchKey, fetchFunction);
      } else if (!this.batchTimers.has(batchKey)) {
        const timer = setTimeout(() => {
          this.processBatch(batchKey, fetchFunction);
        }, this.config.batchWindow);

        this.batchTimers.set(batchKey, timer);
      }
    });
  }

  /**
   * Makes an individual (non-batched) request
   */
  private async makeIndividualRequest<T>(
    url: string,
    options: RequestInit,
    cacheKey: string,
    fetchFunction: (url: string, options: RequestInit) => Promise<T>
  ): Promise<T> {
    console.log(`[DEDUPLICATION] Making individual request for ${cacheKey}`);

    const promise = fetchFunction(url, options);

    // Cache the promise
    const newCachedRequest: CachedRequest<T> = {
      promise,
      timestamp: new Date(),
      url,
      cacheKey,
      requestCount: 1,
    };

    this.requestCache.set(cacheKey, newCachedRequest);
    this.updateCacheSize();

    try {
      const result = await promise;
      console.log(`[DEDUPLICATION] Individual request completed for ${cacheKey}`);
      return result;
    } catch (error) {
      // Remove failed request from cache
      this.requestCache.delete(cacheKey);
      this.updateCacheSize();
      throw error;
    }
  }

  /**
   * Processes a batch of requests
   */
  private async processBatch<T>(
    batchKey: string,
    fetchFunction: (url: string, options: RequestInit) => Promise<T>
  ): Promise<void> {
    const batch = this.batchQueue.get(batchKey);
    if (!batch || batch.length === 0) {
      return;
    }

    // Clear batch timer
    const timer = this.batchTimers.get(batchKey);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(batchKey);
    }

    // Remove batch from queue
    this.batchQueue.delete(batchKey);

    console.log(`[DEDUPLICATION] Processing batch ${batchKey} with ${batch.length} requests`);

    this.metrics.batchedRequests += batch.length;
    this.updateAverageBatchSize(batch.length);

    // Group requests by identical cache keys (true duplicates)
    const requestGroups = new Map<string, BatchRequest[]>();

    for (const request of batch) {
      if (!requestGroups.has(request.cacheKey)) {
        requestGroups.set(request.cacheKey, []);
      }
      requestGroups.get(request.cacheKey)!.push(request);
    }

    // Process each unique request
    for (const [cacheKey, requests] of requestGroups) {
      if (requests.length === 0) continue;

      const firstRequest = requests[0];

      try {
        // Check cache again in case another batch processed this
        const cachedRequest = this.requestCache.get(cacheKey);
        if (cachedRequest && !this.isExpired(cachedRequest)) {
          console.log(`[DEDUPLICATION] Batch cache hit for ${cacheKey}`);
          const result = await cachedRequest.promise;

          // Resolve all requests in this group
          requests.forEach(req => req.resolve(result));
          continue;
        }

        // Make the actual request
        const promise = fetchFunction(firstRequest.url, firstRequest.options);

        // Cache the promise
        const newCachedRequest: CachedRequest<T> = {
          promise,
          timestamp: new Date(),
          url: firstRequest.url,
          cacheKey,
          requestCount: requests.length,
        };

        this.requestCache.set(cacheKey, newCachedRequest);
        this.updateCacheSize();

        // Wait for result
        const result = await promise;

        console.log(`[DEDUPLICATION] Batch request completed for ${cacheKey}, resolving ${requests.length} requests`);

        // Resolve all requests in this group
        requests.forEach(req => req.resolve(result));

        // Update deduplication metrics
        if (requests.length > 1) {
          this.metrics.deduplicatedRequests += requests.length - 1;
        }

      } catch (error) {
        console.error(`[DEDUPLICATION] Batch request failed for ${cacheKey}:`, error);

        // Remove failed request from cache
        this.requestCache.delete(cacheKey);
        this.updateCacheSize();

        // Reject all requests in this group
        requests.forEach(req => req.reject(error as Error));
      }
    }
  }

  /**
   * Generates a cache key based on URL and options
   */
  private generateCacheKey(url: string, options: RequestInit): string {
    const method = options.method || 'GET';
    const headers = options.headers ? JSON.stringify(options.headers) : '';
    const body = options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : '';

    // Create a hash-like key from the request components
    const keyComponents = [method, url, headers, body].join('|');

    // Simple hash function for cache key
    let hash = 0;
    for (let i = 0; i < keyComponents.length; i++) {
      const char = keyComponents.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return `${method}_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Gets batch key for grouping similar requests
   */
  private getBatchKey(url: string, options: RequestInit): string {
    const method = options.method || 'GET';
    const baseUrl = url.split('?')[0]; // Remove query parameters for batching
    return `${method}_${baseUrl}`;
  }

  /**
   * Checks if a request can be batched
   */
  private canBatch(url: string, options: RequestInit): boolean {
    const method = (options.method || 'GET').toUpperCase();

    // Only batch GET requests for now
    if (method !== 'GET') {
      return false;
    }

    // Don't batch requests with custom headers that might affect caching
    const headers = options.headers as Record<string, string> || {};
    const customHeaders = Object.keys(headers).filter(key =>
      !['accept', 'content-type', 'user-agent'].includes(key.toLowerCase())
    );

    return customHeaders.length === 0;
  }

  /**
   * Checks if a cached request is expired
   */
  private isExpired(cachedRequest: CachedRequest<any>): boolean {
    const now = Date.now();
    const requestTime = cachedRequest.timestamp.getTime();
    return (now - requestTime) > this.config.cacheTTL;
  }

  /**
   * Updates cache size metric
   */
  private updateCacheSize(): void {
    this.metrics.cacheSize = this.requestCache.size;
  }

  /**
   * Updates average batch size metric
   */
  private updateAverageBatchSize(batchSize: number): void {
    const totalBatches = Math.ceil(this.metrics.batchedRequests / this.config.batchSize);
    if (totalBatches === 1) {
      this.metrics.averageBatchSize = batchSize;
    } else {
      this.metrics.averageBatchSize =
        ((this.metrics.averageBatchSize * (totalBatches - 1)) + batchSize) / totalBatches;
    }
  }

  /**
   * Starts cleanup timer for expired cache entries
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredEntries();
    }, this.config.cacheTTL / 2); // Clean up twice per TTL period
  }

  /**
   * Cleans up expired cache entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, cachedRequest] of this.requestCache.entries()) {
      if (this.isExpired(cachedRequest)) {
        this.requestCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`[DEDUPLICATION] Cleaned up ${cleanedCount} expired cache entries`);
      this.updateCacheSize();
    }

    // Enforce max cache size
    if (this.requestCache.size > this.config.maxCacheSize) {
      const entriesToRemove = this.requestCache.size - this.config.maxCacheSize;
      const sortedEntries = Array.from(this.requestCache.entries())
        .sort(([, a], [, b]) => a.timestamp.getTime() - b.timestamp.getTime());

      for (let i = 0; i < entriesToRemove; i++) {
        const [key] = sortedEntries[i];
        this.requestCache.delete(key);
      }

      console.log(`[DEDUPLICATION] Removed ${entriesToRemove} oldest cache entries to enforce size limit`);
      this.updateCacheSize();
    }

    // Update deduplication rate
    if (this.metrics.totalRequests > 0) {
      this.metrics.deduplicationRate =
        (this.metrics.deduplicatedRequests / this.metrics.totalRequests) * 100;
    }
  }

  /**
   * Gets current deduplication metrics
   */
  getMetrics(): DeduplicationMetrics {
    return { ...this.metrics };
  }

  /**
   * Clears the request cache
   */
  clearCache(): void {
    const cacheSize = this.requestCache.size;
    this.requestCache.clear();
    this.updateCacheSize();

    console.log(`[DEDUPLICATION] Cleared ${cacheSize} cached requests`);
  }

  /**
   * Shuts down the deduplicator
   */
  shutdown(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    // Clear all batch timers
    for (const timer of this.batchTimers.values()) {
      clearTimeout(timer);
    }
    this.batchTimers.clear();

    // Clear batch queue
    for (const batch of this.batchQueue.values()) {
      batch.forEach(request => {
        request.reject(new Error('Deduplicator shutting down'));
      });
    }
    this.batchQueue.clear();

    this.clearCache();

    console.log('[DEDUPLICATION] Request deduplicator shut down');
  }

  /**
   * Generates unique request ID
   */
  private generateRequestId(): string {
    return `dedup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Global deduplicator instance for build operations
let globalRequestDeduplicator: RequestDeduplicator | null = null;

/**
 * Gets or creates the global request deduplicator
 */
export function getRequestDeduplicator(config?: Partial<DeduplicationConfig>): RequestDeduplicator {
  if (!globalRequestDeduplicator) {
    globalRequestDeduplicator = new RequestDeduplicator(config);
  }
  return globalRequestDeduplicator;
}

/**
 * Resets the global request deduplicator (useful for testing)
 */
export function resetRequestDeduplicator(): void {
  if (globalRequestDeduplicator) {
    globalRequestDeduplicator.shutdown();
    globalRequestDeduplicator = null;
  }
}

/**
 * Convenience function for making deduplicated requests
 */
export async function deduplicatedFetch<T>(
  url: string,
  options: RequestInit = {},
  fetchFunction: (url: string, options: RequestInit) => Promise<T> = fetch as any
): Promise<T> {
  const deduplicator = getRequestDeduplicator();
  return deduplicator.request<T>(url, options, fetchFunction);
}