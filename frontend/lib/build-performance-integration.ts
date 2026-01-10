/**
 * Build Performance Integration
 *
 * Integrates all build performance optimization components including
 * cache management, memory monitoring, image optimization, and GC optimization.
 */

import { createBuildCacheManager, BuildCacheManager, getDefaultCacheConfig } from './build-cache-manager';
import { createApiResponseCache, BuildApiResponseCache, getDefaultApiCacheConfig } from './build-api-response-cache';
import { createIncrementalCache, BuildIncrementalCache, getDefaultIncrementalCacheConfig } from './build-incremental-cache';
import { createMemoryMonitor, BuildMemoryMonitor, getDefaultMemoryConfig } from './build-memory-monitor';
import { createImageOptimizer, BuildImageOptimizer, getDefaultImageOptimizationConfig } from './build-image-optimizer';
import { createGCOptimizer, BuildGCOptimizer, getDefaultGCConfig } from './build-gc-optimizer';
import {
  BuildParallelProcessor,
  ParallelBuildConfig,
  ParallelBuildResult,
  createParallelBuildProcessor,
  getDefaultParallelBuildConfig
} from './build-parallel-integration';
import {
  PageBuildRequest
} from './build-parallel-page-generator';

export interface BuildPerformanceConfig {
  cache: ReturnType<typeof getDefaultCacheConfig>;
  apiCache: ReturnType<typeof getDefaultApiCacheConfig>;
  incrementalCache: ReturnType<typeof getDefaultIncrementalCacheConfig>;
  memory: ReturnType<typeof getDefaultMemoryConfig>;
  imageOptimization: ReturnType<typeof getDefaultImageOptimizationConfig>;
  gcOptimization: ReturnType<typeof getDefaultGCConfig>;
  parallelProcessing: ParallelBuildConfig;
  enableIntegration: boolean;
  enablePerformanceLogging: boolean;
}

export interface BuildPerformanceStats {
  cache: Awaited<ReturnType<BuildCacheManager['getStats']>>;
  apiCache: ReturnType<BuildApiResponseCache['getStats']>;
  incrementalCache: ReturnType<BuildIncrementalCache['getStats']>;
  memory: Awaited<ReturnType<BuildMemoryMonitor['monitorMemoryUsage']>>;
  imageOptimization: ReturnType<BuildImageOptimizer['getStats']>;
  gcOptimization: ReturnType<BuildGCOptimizer['getStats']>;
  parallelProcessing: Awaited<ReturnType<BuildParallelProcessor['getParallelBuildStats']>>;
  overallPerformance: {
    buildTime: number;
    memoryEfficiency: number;
    cacheEfficiency: number;
    optimizationSavings: number;
    parallelEfficiency: number;
  };
}

export class BuildPerformanceManager {
  private config: BuildPerformanceConfig;
  private cacheManager: BuildCacheManager;
  private apiCache: BuildApiResponseCache;
  private incrementalCache: BuildIncrementalCache;
  private memoryMonitor: BuildMemoryMonitor;
  private imageOptimizer: BuildImageOptimizer;
  private gcOptimizer: BuildGCOptimizer;
  private parallelProcessor: BuildParallelProcessor;
  private isInitialized = false;
  private buildStartTime = 0;

  constructor(config?: Partial<BuildPerformanceConfig>) {
    this.config = {
      cache: getDefaultCacheConfig(),
      apiCache: getDefaultApiCacheConfig(),
      incrementalCache: getDefaultIncrementalCacheConfig(),
      memory: getDefaultMemoryConfig(),
      imageOptimization: getDefaultImageOptimizationConfig(),
      gcOptimization: getDefaultGCConfig(),
      parallelProcessing: getDefaultParallelBuildConfig(),
      enableIntegration: true,
      enablePerformanceLogging: process.env.NODE_ENV !== 'production',
      ...config,
    };

    // Initialize all components
    this.cacheManager = createBuildCacheManager(this.config.cache);
    this.apiCache = createApiResponseCache(this.config.apiCache);
    this.incrementalCache = createIncrementalCache(this.config.incrementalCache);
    this.memoryMonitor = createMemoryMonitor(this.config.memory);
    this.imageOptimizer = createImageOptimizer(this.config.imageOptimization);
    this.gcOptimizer = createGCOptimizer(this.config.gcOptimization);
    this.parallelProcessor = createParallelBuildProcessor(this.config.parallelProcessing);
  }

  /**
   * Initialize all performance optimization components
   */
  async initialize(): Promise<void> {
    if (this.isInitialized || !this.config.enableIntegration) {
      return;
    }

    console.log('[BUILD PERFORMANCE] Initializing build performance optimization');
    this.buildStartTime = Date.now();

    try {
      // Initialize incremental cache first (needs to scan files)
      await this.incrementalCache.initialize();

      // Initialize parallel processor
      await this.parallelProcessor.initialize();

      // Initialize API cache (may need to warm up)
      if (this.config.apiCache.enableCacheWarming) {
        await this.apiCache.warmupCache();
      }

      // Start memory monitoring
      this.memoryMonitor.startMonitoring();

      // Start GC optimization
      this.gcOptimizer.startOptimization();

      // Setup integration between components
      this.setupComponentIntegration();

      this.isInitialized = true;
      console.log('[BUILD PERFORMANCE] Build performance optimization initialized');

    } catch (error) {
      console.error('[BUILD PERFORMANCE] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Shutdown all performance optimization components
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    console.log('[BUILD PERFORMANCE] Shutting down build performance optimization');

    try {
      // Stop monitoring and optimization
      this.memoryMonitor.stopMonitoring();
      this.gcOptimizer.stopOptimization();

      // Shutdown parallel processor
      await this.parallelProcessor.shutdown();

      // Save incremental cache state
      await this.incrementalCache.saveManifest();

      // Generate final performance report
      if (this.config.enablePerformanceLogging) {
        const stats = await this.getPerformanceStats();
        this.logPerformanceReport(stats);
      }

      this.isInitialized = false;
      console.log('[BUILD PERFORMANCE] Build performance optimization shutdown complete');

    } catch (error) {
      console.error('[BUILD PERFORMANCE] Error during shutdown:', error);
    }
  }

  /**
   * Check if build needs full rebuild or can use incremental
   */
  async checkBuildRequirements(): Promise<{
    needsFullRebuild: boolean;
    incrementalResult: Awaited<ReturnType<BuildIncrementalCache['checkForChanges']>>;
    recommendations: string[];
  }> {
    const incrementalResult = await this.incrementalCache.checkForChanges();
    const memoryStats = await this.memoryMonitor.monitorMemoryUsage();

    const recommendations: string[] = [];
    let needsFullRebuild = incrementalResult.needsRebuild;

    // Check memory constraints
    if (memoryStats.percentage > 0.8) {
      recommendations.push('High memory usage detected - consider reducing concurrent operations');
      if (memoryStats.percentage > 0.9) {
        needsFullRebuild = true;
        recommendations.push('Memory usage critical - forcing full rebuild for stability');
      }
    }

    // Check cache efficiency
    const apiStats = this.apiCache.getStats();
    if (apiStats.hitRate < 0.5 && apiStats.totalRequests > 10) {
      recommendations.push('Low API cache hit rate - consider cache warming or TTL adjustment');
    }

    return {
      needsFullRebuild,
      incrementalResult,
      recommendations,
    };
  }

  /**
   * Process multiple pages in parallel with full optimization
   */
  async processPages(pages: PageBuildRequest[]): Promise<ParallelBuildResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log(`[BUILD PERFORMANCE] Processing ${pages.length} pages in parallel`);

    try {
      const result = await this.parallelProcessor.processPages(pages);

      if (this.config.enablePerformanceLogging) {
        console.log(`[BUILD PERFORMANCE] Parallel processing completed: ${result.completedPages}/${result.totalPages} pages successful`);
      }

      return result;

    } catch (error) {
      console.error('[BUILD PERFORMANCE] Parallel processing failed:', error);
      throw error;
    }
  }

  /**
   * Optimize build process for a specific page
   */
  async optimizePageBuild(pageId: string, buildFn: () => Promise<any>): Promise<any> {
    console.log(`[BUILD PERFORMANCE] Optimizing build for page: ${pageId}`);

    // Track page build object
    this.gcOptimizer.trackObject(`page_${pageId}`, 'page-build', 0);

    // Register cleanup callback for this page
    this.gcOptimizer.registerCleanupCallback(`page_${pageId}`, async () => {
      await this.apiCache.invalidateByPattern(new RegExp(pageId));
      console.log(`[BUILD PERFORMANCE] Cleaned up resources for page: ${pageId}`);
    });

    try {
      const result = await buildFn();

      // Perform cleanup between pages
      await this.gcOptimizer.cleanupBetweenPages(pageId);

      return result;

    } catch (error) {
      // Cleanup on error
      await this.gcOptimizer.cleanupBetweenPages(pageId);
      throw error;
    } finally {
      // Mark page object for cleanup
      this.gcOptimizer.markObjectForCleanup(`page_${pageId}`);
    }
  }

  /**
   * Get comprehensive performance statistics
   */
  async getPerformanceStats(): Promise<BuildPerformanceStats> {
    const [cacheStats, memoryStats, parallelStats] = await Promise.all([
      this.cacheManager.getStats(),
      this.memoryMonitor.monitorMemoryUsage(),
      this.parallelProcessor.getParallelBuildStats(),
    ]);

    const apiCacheStats = this.apiCache.getStats();
    const incrementalStats = this.incrementalCache.getStats();
    const imageStats = this.imageOptimizer.getStats();
    const gcStats = this.gcOptimizer.getStats();

    // Calculate overall performance metrics
    const buildTime = Date.now() - this.buildStartTime;
    const memoryEfficiency = 1 - memoryStats.percentage;
    const cacheEfficiency = (cacheStats.hitRate + apiCacheStats.hitRate) / 2;
    const optimizationSavings = imageStats.totalSizeReduction + gcStats.totalMemoryFreed;
    const parallelEfficiency = parallelStats.integration.parallelEfficiency;

    return {
      cache: cacheStats,
      apiCache: apiCacheStats,
      incrementalCache: incrementalStats,
      memory: memoryStats,
      imageOptimization: imageStats,
      gcOptimization: gcStats,
      parallelProcessing: parallelStats,
      overallPerformance: {
        buildTime,
        memoryEfficiency,
        cacheEfficiency,
        optimizationSavings,
        parallelEfficiency,
      },
    };
  }

  /**
   * Clear all caches and reset optimization state
   */
  async clearAllCaches(): Promise<void> {
    console.log('[BUILD PERFORMANCE] Clearing all caches');

    await Promise.all([
      this.cacheManager.clear(),
      this.apiCache.clearCache(),
      this.incrementalCache.clearCache(),
      this.imageOptimizer.clearCache(),
    ]);

    console.log('[BUILD PERFORMANCE] All caches cleared');
  }

  /**
   * Force aggressive optimization (emergency cleanup)
   */
  async forceOptimization(): Promise<void> {
    console.log('[BUILD PERFORMANCE] Forcing aggressive optimization');

    try {
      // Force GC and cleanup
      await this.gcOptimizer.forceAggressiveGC();

      // Optimize all caches
      await Promise.all([
        this.cacheManager.optimizeCache(),
        this.incrementalCache.clearCache(), // Clear incremental cache to force rebuild
      ]);

      // Clear non-essential API cache entries
      await this.apiCache.invalidateByPattern(/^(?!critical_)/);

      console.log('[BUILD PERFORMANCE] Aggressive optimization completed');

    } catch (error) {
      console.error('[BUILD PERFORMANCE] Aggressive optimization failed:', error);
      throw error;
    }
  }

  /**
   * Setup integration between components
   */
  private setupComponentIntegration(): void {
    // Memory monitor alerts trigger GC
    this.memoryMonitor.on('memory-alert', async (alert) => {
      if (alert.level === 'critical') {
        await this.gcOptimizer.triggerGarbageCollection('threshold');
      }
    });

    // GC events trigger cache optimization
    this.gcOptimizer.on('gc-completed', async (event) => {
      if (event.memoryFreed > 50 * 1024 * 1024) { // 50MB freed
        await this.cacheManager.optimizeCache();
      }
    });

    // API cache failures trigger incremental cache invalidation
    this.apiCache.getStats(); // This would be extended to emit events in a real implementation

    if (this.config.enablePerformanceLogging) {
      console.log('[BUILD PERFORMANCE] Component integration setup complete');
    }
  }

  /**
   * Log performance report
   */
  private logPerformanceReport(stats: BuildPerformanceStats): void {
    const { overallPerformance } = stats;

    console.log('\n=== BUILD PERFORMANCE REPORT ===');
    console.log(`Build Time: ${this.formatDuration(overallPerformance.buildTime)}`);
    console.log(`Memory Efficiency: ${(overallPerformance.memoryEfficiency * 100).toFixed(1)}%`);
    console.log(`Cache Efficiency: ${(overallPerformance.cacheEfficiency * 100).toFixed(1)}%`);
    console.log(`Parallel Efficiency: ${(overallPerformance.parallelEfficiency * 100).toFixed(1)}%`);
    console.log(`Optimization Savings: ${this.formatBytes(overallPerformance.optimizationSavings)}`);

    console.log('\n--- Cache Statistics ---');
    console.log(`Cache Hit Rate: ${(stats.cache.hitRate * 100).toFixed(1)}%`);
    console.log(`API Cache Hit Rate: ${(stats.apiCache.hitRate * 100).toFixed(1)}%`);
    console.log(`Incremental Cache: ${stats.incrementalCache.artifactCount} artifacts`);

    console.log('\n--- Memory Statistics ---');
    console.log(`Memory Usage: ${(stats.memory.percentage * 100).toFixed(1)}%`);
    console.log(`GC Events: ${stats.gcOptimization.totalGCEvents}`);
    console.log(`Memory Freed: ${this.formatBytes(stats.gcOptimization.totalMemoryFreed)}`);

    console.log('\n--- Parallel Processing ---');
    console.log(`Worker Pool: ${stats.parallelProcessing.workerPool.totalWorkers} workers`);
    console.log(`Throughput: ${stats.parallelProcessing.workerPool.throughput.toFixed(2)} tasks/sec`);
    console.log(`Resource Utilization: ${(stats.parallelProcessing.integration.resourceUtilization * 100).toFixed(1)}%`);
    console.log(`Scaling Events: ${stats.parallelProcessing.integration.scalingEvents}`);

    console.log('\n--- Image Optimization ---');
    console.log(`Images Processed: ${stats.imageOptimization.processedImages}`);
    console.log(`Size Reduction: ${this.formatBytes(stats.imageOptimization.totalSizeReduction)}`);

    console.log('================================\n');
  }

  /**
   * Format duration for display
   */
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);

    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }

  /**
   * Format bytes for display
   */
  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}

/**
 * Create singleton build performance manager
 */
let performanceManager: BuildPerformanceManager | null = null;

export function createBuildPerformanceManager(config?: Partial<BuildPerformanceConfig>): BuildPerformanceManager {
  if (!performanceManager) {
    performanceManager = new BuildPerformanceManager(config);
  }
  return performanceManager;
}

/**
 * Get singleton build performance manager
 */
export function getBuildPerformanceManager(): BuildPerformanceManager {
  if (!performanceManager) {
    performanceManager = new BuildPerformanceManager();
  }
  return performanceManager;
}

/**
 * Initialize build performance optimization for the current environment
 */
export async function initializeBuildPerformance(): Promise<BuildPerformanceManager> {
  const manager = getBuildPerformanceManager();
  await manager.initialize();
  return manager;
}

/**
 * Shutdown build performance optimization
 */
export async function shutdownBuildPerformance(): Promise<void> {
  if (performanceManager) {
    await performanceManager.shutdown();
  }
}

/**
 * Utility function to wrap any build operation with performance optimization
 */
export async function withBuildPerformanceOptimization<T>(
  operationName: string,
  operation: () => Promise<T>
): Promise<T> {
  const manager = getBuildPerformanceManager();

  if (!manager) {
    return operation();
  }

  return manager.optimizePageBuild(operationName, operation);
}

// Auto-initialize in build environments
if (typeof process !== 'undefined' &&
    (process.env.NODE_ENV === 'production' || process.env.NEXT_PHASE === 'phase-production-build')) {

  initializeBuildPerformance().catch(error => {
    console.error('[BUILD PERFORMANCE] Auto-initialization failed:', error);
  });

  // Setup shutdown handler
  process.on('beforeExit', () => {
    shutdownBuildPerformance().catch(error => {
      console.error('[BUILD PERFORMANCE] Shutdown failed:', error);
    });
  });
}