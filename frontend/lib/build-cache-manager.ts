/**
 * Build Cache Manager
 *
 * Implements in-memory cache with TTL support, persistent cache storage,
 * and cache invalidation strategies for build-time operations.
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import { gzipSync, gunzipSync } from 'zlib';

export interface BuildCacheConfig {
  apiResponseTTL: number; // 300 seconds (5 minutes)
  staticAssetTTL: number; // 3600 seconds (1 hour)
  maxCacheSize: number; // 500MB in bytes
  compressionEnabled: boolean;
  persistentCache: boolean;
  cacheDirectory: string;
  maxMemoryEntries: number; // Maximum entries in memory cache
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  compressed: boolean;
  size: number; // Size in bytes
  accessCount: number;
  lastAccessed: number;
}

export interface CacheStats {
  hitRate: number;
  totalSize: number;
  entryCount: number;
  oldestEntry: Date;
  newestEntry: Date;
  memoryEntries: number;
  persistentEntries: number;
  compressionRatio: number;
}

export interface CacheInvalidationRule {
  pattern: string | RegExp;
  dependencies: string[];
  maxAge: number;
}

export class BuildCacheManager {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private config: BuildCacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    evictions: 0,
    compressionSaves: 0,
  };
  private invalidationRules: CacheInvalidationRule[] = [];

  constructor(config: Partial<BuildCacheConfig> = {}) {
    this.config = {
      apiResponseTTL: 300, // 5 minutes
      staticAssetTTL: 3600, // 1 hour
      maxCacheSize: 500 * 1024 * 1024, // 500MB
      compressionEnabled: true,
      persistentCache: true,
      cacheDirectory: join(process.cwd(), '.next', 'build-cache'),
      maxMemoryEntries: 1000,
      ...config,
    };

    this.ensureCacheDirectory();
  }

  /**
   * Get cached value by key
   */
  async get<T>(key: string): Promise<T | null> {
    const cacheKey = this.generateCacheKey(key);

    // Check memory cache first
    const memoryEntry = this.memoryCache.get(cacheKey);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      memoryEntry.accessCount++;
      memoryEntry.lastAccessed = Date.now();
      this.stats.hits++;
      return this.deserializeData<T>(memoryEntry);
    }

    // Check persistent cache
    if (this.config.persistentCache) {
      try {
        const persistentEntry = await this.getPersistentEntry<T>(cacheKey);
        if (persistentEntry && !this.isExpired(persistentEntry)) {
          // Restore to memory cache if there's space
          if (this.memoryCache.size < this.config.maxMemoryEntries) {
            this.memoryCache.set(cacheKey, persistentEntry);
          }
          this.stats.hits++;
          return this.deserializeData<T>(persistentEntry);
        }
      } catch (error) {
        console.warn(`[BUILD CACHE] Failed to read persistent cache for ${cacheKey}:`, error);
      }
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Set cached value with TTL
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const cacheKey = this.generateCacheKey(key);
    const finalTTL = (ttl || this.config.apiResponseTTL) * 1000; // Convert to milliseconds

    const serializedData = this.serializeData(data);
    const compressed = this.config.compressionEnabled ?
      this.compressData(serializedData) : serializedData;

    const entry: CacheEntry = {
      data: compressed,
      timestamp: Date.now(),
      ttl: finalTTL,
      compressed: this.config.compressionEnabled,
      size: Buffer.byteLength(JSON.stringify(compressed)),
      accessCount: 0,
      lastAccessed: Date.now(),
    };

    // Check if we need to evict entries to stay within size limits
    await this.evictIfNecessary(entry.size);

    // Store in memory cache
    this.memoryCache.set(cacheKey, entry);

    // Store in persistent cache
    if (this.config.persistentCache) {
      try {
        await this.setPersistentEntry(cacheKey, entry);
      } catch (error) {
        console.warn(`[BUILD CACHE] Failed to write persistent cache for ${cacheKey}:`, error);
      }
    }

    this.stats.sets++;
  }

  /**
   * Invalidate cache entries matching pattern
   */
  async invalidate(pattern: string | RegExp): Promise<void> {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    const keysToDelete: string[] = [];

    // Find matching keys in memory cache
    Array.from(this.memoryCache.keys()).forEach(key => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });

    // Remove from memory cache
    for (const key of keysToDelete) {
      this.memoryCache.delete(key);
    }

    // Remove from persistent cache
    if (this.config.persistentCache) {
      try {
        const files = await fs.readdir(this.config.cacheDirectory);
        for (const file of files) {
          if (regex.test(file)) {
            await fs.unlink(join(this.config.cacheDirectory, file));
          }
        }
      } catch (error) {
        console.warn('[BUILD CACHE] Failed to invalidate persistent cache:', error);
      }
    }

    console.log(`[BUILD CACHE] Invalidated ${keysToDelete.length} entries matching pattern: ${pattern}`);
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();

    if (this.config.persistentCache) {
      try {
        const files = await fs.readdir(this.config.cacheDirectory);
        await Promise.all(
          files.map(file => fs.unlink(join(this.config.cacheDirectory, file)))
        );
      } catch (error) {
        console.warn('[BUILD CACHE] Failed to clear persistent cache:', error);
      }
    }

    console.log('[BUILD CACHE] All cache entries cleared');
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    const memoryEntries = Array.from(this.memoryCache.values());
    const totalMemorySize = memoryEntries.reduce((sum, entry) => sum + entry.size, 0);

    let persistentEntries = 0;
    let totalPersistentSize = 0;

    if (this.config.persistentCache) {
      try {
        const files = await fs.readdir(this.config.cacheDirectory);
        persistentEntries = files.length;

        const stats = await Promise.all(
          files.map(file => fs.stat(join(this.config.cacheDirectory, file)))
        );
        totalPersistentSize = stats.reduce((sum, stat) => sum + stat.size, 0);
      } catch (error) {
        console.warn('[BUILD CACHE] Failed to get persistent cache stats:', error);
      }
    }

    const timestamps = memoryEntries.map(entry => entry.timestamp);
    const hitRate = this.stats.hits + this.stats.misses > 0 ?
      this.stats.hits / (this.stats.hits + this.stats.misses) : 0;

    return {
      hitRate,
      totalSize: totalMemorySize + totalPersistentSize,
      entryCount: memoryEntries.length + persistentEntries,
      oldestEntry: timestamps.length > 0 ? new Date(Math.min(...timestamps)) : new Date(),
      newestEntry: timestamps.length > 0 ? new Date(Math.max(...timestamps)) : new Date(),
      memoryEntries: memoryEntries.length,
      persistentEntries,
      compressionRatio: this.stats.compressionSaves > 0 ?
        this.stats.compressionSaves / this.stats.sets : 0,
    };
  }

  /**
   * Optimize cache by removing expired entries and compacting storage
   */
  async optimizeCache(): Promise<void> {
    console.log('[BUILD CACHE] Starting cache optimization');

    let removedCount = 0;
    let reclaimedSize = 0;

    // Clean expired entries from memory cache
    Array.from(this.memoryCache.entries()).forEach(([key, entry]) => {
      if (this.isExpired(entry)) {
        reclaimedSize += entry.size;
        this.memoryCache.delete(key);
        removedCount++;
      }
    });

    // Clean expired entries from persistent cache
    if (this.config.persistentCache) {
      try {
        const files = await fs.readdir(this.config.cacheDirectory);

        for (const file of files) {
          try {
            const filePath = join(this.config.cacheDirectory, file);
            const content = await fs.readFile(filePath, 'utf8');
            const entry = JSON.parse(content) as CacheEntry;

            if (this.isExpired(entry)) {
              await fs.unlink(filePath);
              removedCount++;
            }
          } catch (error) {
            // Remove corrupted files
            await fs.unlink(join(this.config.cacheDirectory, file));
            removedCount++;
          }
        }
      } catch (error) {
        console.warn('[BUILD CACHE] Failed to optimize persistent cache:', error);
      }
    }

    // Apply LRU eviction if memory cache is still too large
    await this.applyLRUEviction();

    console.log(`[BUILD CACHE] Optimization complete: removed ${removedCount} entries, reclaimed ${reclaimedSize} bytes`);
  }

  /**
   * Add cache invalidation rule
   */
  addInvalidationRule(rule: CacheInvalidationRule): void {
    this.invalidationRules.push(rule);
  }

  /**
   * Apply invalidation rules based on dependencies
   */
  async applyInvalidationRules(changedDependencies: string[]): Promise<void> {
    for (const rule of this.invalidationRules) {
      const shouldInvalidate = rule.dependencies.some(dep =>
        changedDependencies.includes(dep)
      );

      if (shouldInvalidate) {
        await this.invalidate(rule.pattern);
      }
    }
  }

  /**
   * Generate cache key from input
   */
  private generateCacheKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Serialize data for storage
   */
  private serializeData<T>(data: T): string {
    return JSON.stringify(data);
  }

  /**
   * Deserialize data from storage
   */
  private deserializeData<T>(entry: CacheEntry): T {
    let data = entry.data;

    if (entry.compressed && typeof data === 'string') {
      data = this.decompressData(data);
    }

    return typeof data === 'string' ? JSON.parse(data) : data;
  }

  /**
   * Compress data using gzip
   */
  private compressData(data: string): string {
    try {
      const compressed = gzipSync(Buffer.from(data)).toString('base64');
      const originalSize = Buffer.byteLength(data);
      const compressedSize = Buffer.byteLength(compressed);

      if (compressedSize < originalSize * 0.8) { // Only use if 20%+ savings
        this.stats.compressionSaves++;
        return compressed;
      }

      return data;
    } catch (error) {
      console.warn('[BUILD CACHE] Compression failed:', error);
      return data;
    }
  }

  /**
   * Decompress data using gzip
   */
  private decompressData(data: string): string {
    try {
      return gunzipSync(Buffer.from(data, 'base64')).toString();
    } catch (error) {
      // If decompression fails, assume data is not compressed
      return data;
    }
  }

  /**
   * Ensure cache directory exists
   */
  private async ensureCacheDirectory(): Promise<void> {
    if (this.config.persistentCache) {
      try {
        await fs.mkdir(this.config.cacheDirectory, { recursive: true });
      } catch (error) {
        console.warn('[BUILD CACHE] Failed to create cache directory:', error);
        this.config.persistentCache = false;
      }
    }
  }

  /**
   * Get entry from persistent cache
   */
  private async getPersistentEntry<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const filePath = join(this.config.cacheDirectory, `${key}.json`);
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content) as CacheEntry<T>;
    } catch (error) {
      return null;
    }
  }

  /**
   * Set entry in persistent cache
   */
  private async setPersistentEntry<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    const filePath = join(this.config.cacheDirectory, `${key}.json`);
    await fs.writeFile(filePath, JSON.stringify(entry), 'utf8');
  }

  /**
   * Evict entries if necessary to stay within size limits
   */
  private async evictIfNecessary(newEntrySize: number): Promise<void> {
    const currentSize = Array.from(this.memoryCache.values())
      .reduce((sum, entry) => sum + entry.size, 0);

    if (currentSize + newEntrySize > this.config.maxCacheSize) {
      await this.applyLRUEviction(newEntrySize);
    }
  }

  /**
   * Apply LRU (Least Recently Used) eviction
   */
  private async applyLRUEviction(requiredSpace: number = 0): Promise<void> {
    const entries = Array.from(this.memoryCache.entries())
      .map(([key, entry]) => ({ key, entry }))
      .sort((a, b) => a.entry.lastAccessed - b.entry.lastAccessed);

    let freedSpace = 0;
    let evictedCount = 0;

    for (const { key, entry } of entries) {
      if (this.memoryCache.size <= this.config.maxMemoryEntries * 0.8 &&
          freedSpace >= requiredSpace) {
        break;
      }

      freedSpace += entry.size;
      this.memoryCache.delete(key);
      evictedCount++;
      this.stats.evictions++;
    }

    if (evictedCount > 0) {
      console.log(`[BUILD CACHE] LRU eviction: removed ${evictedCount} entries, freed ${freedSpace} bytes`);
    }
  }
}

/**
 * Create a singleton build cache manager instance
 */
let buildCacheManager: BuildCacheManager | null = null;

export function createBuildCacheManager(config?: Partial<BuildCacheConfig>): BuildCacheManager {
  if (!buildCacheManager) {
    buildCacheManager = new BuildCacheManager(config);
  }
  return buildCacheManager;
}

/**
 * Get the singleton build cache manager instance
 */
export function getBuildCacheManager(): BuildCacheManager {
  if (!buildCacheManager) {
    buildCacheManager = new BuildCacheManager();
  }
  return buildCacheManager;
}

/**
 * Default cache configuration for different environments
 */
export function getDefaultCacheConfig(): BuildCacheConfig {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    apiResponseTTL: isDevelopment ? 60 : 300, // 1 min dev, 5 min prod
    staticAssetTTL: isDevelopment ? 300 : 3600, // 5 min dev, 1 hour prod
    maxCacheSize: isDevelopment ? 100 * 1024 * 1024 : 500 * 1024 * 1024, // 100MB dev, 500MB prod
    compressionEnabled: !isDevelopment,
    persistentCache: !isDevelopment,
    cacheDirectory: join(process.cwd(), '.next', 'build-cache'),
    maxMemoryEntries: isDevelopment ? 500 : 1000,
  };
}