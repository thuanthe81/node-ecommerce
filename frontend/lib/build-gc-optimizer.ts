/**
 * Build Garbage Collection Optimizer
 *
 * Implements periodic garbage collection triggers, memory cleanup between page generations,
 * and object lifecycle management for build-time operations.
 */

import { EventEmitter } from 'events';
import { getMemoryMonitor, MemoryStats } from './build-memory-monitor';

export interface GCOptimizationConfig {
  enabled: boolean;
  periodicGCInterval: number; // milliseconds
  memoryThreshold: number; // 0-1 (percentage)
  aggressiveGCThreshold: number; // 0-1 (percentage)
  pageGenerationCleanup: boolean;
  objectLifecycleTracking: boolean;
  maxObjectAge: number; // milliseconds
  gcStrategies: {
    incremental: boolean;
    concurrent: boolean;
    compacting: boolean;
  };
  enableDetailedLogging: boolean;
}

export interface GCEvent {
  type: 'periodic' | 'threshold' | 'manual' | 'page-cleanup' | 'emergency';
  timestamp: number;
  memoryBefore: MemoryStats;
  memoryAfter: MemoryStats;
  duration: number;
  memoryFreed: number;
  success: boolean;
  error?: Error;
}

export interface ObjectLifecycleInfo {
  id: string;
  type: string;
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
  size: number;
  references: string[];
  isEligibleForCleanup: boolean;
}

export interface GCStats {
  totalGCEvents: number;
  periodicGCEvents: number;
  thresholdGCEvents: number;
  manualGCEvents: number;
  totalMemoryFreed: number;
  averageGCDuration: number;
  gcEfficiency: number; // memory freed per ms
  objectsTracked: number;
  objectsCleaned: number;
  lastGCEvent: Date | null;
}

export interface CleanupResult {
  objectsCleaned: number;
  memoryFreed: number;
  duration: number;
  errors: Error[];
}

export class BuildGCOptimizer extends EventEmitter {
  private config: GCOptimizationConfig;
  private memoryMonitor = getMemoryMonitor();
  private gcEvents: GCEvent[] = [];
  private trackedObjects: Map<string, ObjectLifecycleInfo> = new Map();
  private periodicGCTimer: NodeJS.Timeout | null = null;
  private isOptimizing = false;
  private cleanupCallbacks: Map<string, () => Promise<void>> = new Map();

  constructor(config: Partial<GCOptimizationConfig> = {}) {
    super();

    this.config = {
      enabled: true,
      periodicGCInterval: 60000, // 1 minute
      memoryThreshold: 0.75, // 75%
      aggressiveGCThreshold: 0.9, // 90%
      pageGenerationCleanup: true,
      objectLifecycleTracking: true,
      maxObjectAge: 300000, // 5 minutes
      gcStrategies: {
        incremental: true,
        concurrent: false, // Not available in Node.js by default
        compacting: true,
      },
      enableDetailedLogging: false,
      ...config,
    };

    this.setupMemoryMonitoring();
  }

  /**
   * Start GC optimization
   */
  startOptimization(): void {
    if (!this.config.enabled || this.isOptimizing) {
      return;
    }

    console.log('[GC OPTIMIZER] Starting garbage collection optimization');
    this.isOptimizing = true;

    // Start periodic GC
    this.startPeriodicGC();

    // Setup memory threshold monitoring
    this.memoryMonitor.on('memory-alert', (alert) => {
      if (alert.level === 'critical' || alert.level === 'emergency') {
        this.triggerGarbageCollection('threshold');
      }
    });

    console.log('[GC OPTIMIZER] GC optimization started');
  }

  /**
   * Stop GC optimization
   */
  stopOptimization(): void {
    if (!this.isOptimizing) {
      return;
    }

    console.log('[GC OPTIMIZER] Stopping garbage collection optimization');
    this.isOptimizing = false;

    if (this.periodicGCTimer) {
      clearInterval(this.periodicGCTimer);
      this.periodicGCTimer = null;
    }

    console.log('[GC OPTIMIZER] GC optimization stopped');
  }

  /**
   * Trigger garbage collection manually
   */
  async triggerGarbageCollection(type: GCEvent['type'] = 'manual'): Promise<GCEvent> {
    if (!this.config.enabled) {
      throw new Error('GC optimization is disabled');
    }

    console.log(`[GC OPTIMIZER] Triggering ${type} garbage collection`);
    const startTime = Date.now();

    const memoryBefore = await this.memoryMonitor.monitorMemoryUsage();
    let memoryAfter: MemoryStats;
    let success = false;
    let error: Error | undefined;

    try {
      // Perform pre-GC cleanup
      await this.performPreGCCleanup();

      // Trigger actual garbage collection
      await this.performGarbageCollection();

      // Perform post-GC cleanup
      await this.performPostGCCleanup();

      memoryAfter = await this.memoryMonitor.monitorMemoryUsage();
      success = true;

    } catch (err) {
      error = err as Error;
      memoryAfter = await this.memoryMonitor.monitorMemoryUsage();
      console.error(`[GC OPTIMIZER] ${type} GC failed:`, error);
    }

    const duration = Date.now() - startTime;
    const memoryFreed = memoryBefore.heapUsed - memoryAfter.heapUsed;

    const gcEvent: GCEvent = {
      type,
      timestamp: startTime,
      memoryBefore,
      memoryAfter,
      duration,
      memoryFreed,
      success,
      error,
    };

    this.recordGCEvent(gcEvent);

    if (this.config.enableDetailedLogging) {
      console.log(`[GC OPTIMIZER] ${type} GC completed: ${this.formatBytes(memoryFreed)} freed in ${duration}ms`);
    }

    this.emit('gc-completed', gcEvent);
    return gcEvent;
  }

  /**
   * Add memory cleanup between page generations
   */
  async cleanupBetweenPages(pageId: string): Promise<CleanupResult> {
    if (!this.config.pageGenerationCleanup) {
      return {
        objectsCleaned: 0,
        memoryFreed: 0,
        duration: 0,
        errors: [],
      };
    }

    console.log(`[GC OPTIMIZER] Performing cleanup between page generations for ${pageId}`);
    const startTime = Date.now();
    const memoryBefore = await this.memoryMonitor.monitorMemoryUsage();

    const errors: Error[] = [];
    let objectsCleaned = 0;

    try {
      // Clean up tracked objects
      objectsCleaned += await this.cleanupTrackedObjects();

      // Run page-specific cleanup callbacks
      const pageCleanupKey = `page_${pageId}`;
      if (this.cleanupCallbacks.has(pageCleanupKey)) {
        try {
          await this.cleanupCallbacks.get(pageCleanupKey)!();
          this.cleanupCallbacks.delete(pageCleanupKey);
        } catch (error) {
          errors.push(error as Error);
        }
      }

      // Trigger GC if memory usage is high
      const currentMemory = await this.memoryMonitor.monitorMemoryUsage();
      if (currentMemory.percentage > this.config.memoryThreshold) {
        await this.triggerGarbageCollection('page-cleanup');
      }

    } catch (error) {
      errors.push(error as Error);
    }

    const memoryAfter = await this.memoryMonitor.monitorMemoryUsage();
    const duration = Date.now() - startTime;
    const memoryFreed = memoryBefore.heapUsed - memoryAfter.heapUsed;

    const result: CleanupResult = {
      objectsCleaned,
      memoryFreed,
      duration,
      errors,
    };

    if (this.config.enableDetailedLogging) {
      console.log(`[GC OPTIMIZER] Page cleanup completed: ${objectsCleaned} objects cleaned, ${this.formatBytes(memoryFreed)} freed`);
    }

    this.emit('page-cleanup-completed', { pageId, result });
    return result;
  }

  /**
   * Optimize object lifecycle management
   */
  trackObject(id: string, type: string, size: number = 0, references: string[] = []): void {
    if (!this.config.objectLifecycleTracking) {
      return;
    }

    const info: ObjectLifecycleInfo = {
      id,
      type,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 1,
      size,
      references,
      isEligibleForCleanup: false,
    };

    this.trackedObjects.set(id, info);

    if (this.config.enableDetailedLogging) {
      console.log(`[GC OPTIMIZER] Tracking object: ${id} (${type})`);
    }
  }

  /**
   * Update object access information
   */
  accessObject(id: string): void {
    if (!this.config.objectLifecycleTracking) {
      return;
    }

    const info = this.trackedObjects.get(id);
    if (info) {
      info.lastAccessed = Date.now();
      info.accessCount++;
      info.isEligibleForCleanup = false;
    }
  }

  /**
   * Mark object for cleanup
   */
  markObjectForCleanup(id: string): void {
    const info = this.trackedObjects.get(id);
    if (info) {
      info.isEligibleForCleanup = true;
    }
  }

  /**
   * Register cleanup callback for specific context
   */
  registerCleanupCallback(key: string, callback: () => Promise<void>): void {
    this.cleanupCallbacks.set(key, callback);
  }

  /**
   * Get GC statistics
   */
  getStats(): GCStats {
    const gcDurations = this.gcEvents.map(event => event.duration);
    const averageGCDuration = gcDurations.length > 0 ?
      gcDurations.reduce((sum, duration) => sum + duration, 0) / gcDurations.length : 0;

    const totalMemoryFreed = this.gcEvents.reduce((sum, event) => sum + event.memoryFreed, 0);
    const totalGCTime = this.gcEvents.reduce((sum, event) => sum + event.duration, 0);
    const gcEfficiency = totalGCTime > 0 ? totalMemoryFreed / totalGCTime : 0;

    return {
      totalGCEvents: this.gcEvents.length,
      periodicGCEvents: this.gcEvents.filter(e => e.type === 'periodic').length,
      thresholdGCEvents: this.gcEvents.filter(e => e.type === 'threshold').length,
      manualGCEvents: this.gcEvents.filter(e => e.type === 'manual').length,
      totalMemoryFreed,
      averageGCDuration,
      gcEfficiency,
      objectsTracked: this.trackedObjects.size,
      objectsCleaned: Array.from(this.trackedObjects.values()).filter(obj => obj.isEligibleForCleanup).length,
      lastGCEvent: this.gcEvents.length > 0 ? new Date(this.gcEvents[this.gcEvents.length - 1].timestamp) : null,
    };
  }

  /**
   * Force aggressive garbage collection
   */
  async forceAggressiveGC(): Promise<GCEvent> {
    console.log('[GC OPTIMIZER] Forcing aggressive garbage collection');

    // Clean up all eligible objects first
    await this.cleanupTrackedObjects();

    // Clear all cleanup callbacks
    this.cleanupCallbacks.clear();

    // Trigger multiple GC cycles
    let lastEvent: GCEvent;
    for (let i = 0; i < 3; i++) {
      lastEvent = await this.triggerGarbageCollection('emergency');
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return lastEvent!;
  }

  /**
   * Start periodic garbage collection
   */
  private startPeriodicGC(): void {
    this.periodicGCTimer = setInterval(async () => {
      try {
        const memoryStats = await this.memoryMonitor.monitorMemoryUsage();

        if (memoryStats.percentage > this.config.memoryThreshold) {
          await this.triggerGarbageCollection('periodic');
        }
      } catch (error) {
        console.error('[GC OPTIMIZER] Periodic GC failed:', error);
      }
    }, this.config.periodicGCInterval);
  }

  /**
   * Setup memory monitoring integration
   */
  private setupMemoryMonitoring(): void {
    this.memoryMonitor.on('stats-collected', (stats: MemoryStats) => {
      if (stats.percentage > this.config.aggressiveGCThreshold) {
        this.triggerGarbageCollection('threshold').catch(error => {
          console.error('[GC OPTIMIZER] Threshold GC failed:', error);
        });
      }
    });
  }

  /**
   * Perform pre-GC cleanup
   */
  private async performPreGCCleanup(): Promise<void> {
    // Clean up tracked objects that are eligible for cleanup
    await this.cleanupTrackedObjects();

    // Clear weak references and temporary caches
    await this.clearTemporaryCaches();
  }

  /**
   * Perform actual garbage collection
   */
  private async performGarbageCollection(): Promise<void> {
    if (global.gc) {
      // Force full garbage collection
      global.gc();

      // If incremental GC is enabled, trigger it multiple times
      if (this.config.gcStrategies.incremental) {
        for (let i = 0; i < 3; i++) {
          await new Promise(resolve => setTimeout(resolve, 10));
          global.gc();
        }
      }
    } else {
      console.warn('[GC OPTIMIZER] Global GC not available. Run with --expose-gc flag.');
    }
  }

  /**
   * Perform post-GC cleanup
   */
  private async performPostGCCleanup(): Promise<void> {
    // Update object lifecycle information
    this.updateObjectLifecycles();

    // Clean up GC event history (keep last 100 events)
    if (this.gcEvents.length > 100) {
      this.gcEvents = this.gcEvents.slice(-100);
    }
  }

  /**
   * Clean up tracked objects
   */
  private async cleanupTrackedObjects(): Promise<number> {
    let cleanedCount = 0;
    const now = Date.now();

    for (const [id, info] of this.trackedObjects.entries()) {
      const age = now - info.lastAccessed;

      if (info.isEligibleForCleanup || age > this.config.maxObjectAge) {
        this.trackedObjects.delete(id);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0 && this.config.enableDetailedLogging) {
      console.log(`[GC OPTIMIZER] Cleaned up ${cleanedCount} tracked objects`);
    }

    return cleanedCount;
  }

  /**
   * Clear temporary caches
   */
  private async clearTemporaryCaches(): Promise<void> {
    // This would clear any temporary caches or weak references
    // Implementation depends on specific cache implementations
  }

  /**
   * Update object lifecycles
   */
  private updateObjectLifecycles(): void {
    const now = Date.now();

    for (const info of this.trackedObjects.values()) {
      const age = now - info.lastAccessed;

      // Mark old objects as eligible for cleanup
      if (age > this.config.maxObjectAge * 0.8) {
        info.isEligibleForCleanup = true;
      }
    }
  }

  /**
   * Record GC event
   */
  private recordGCEvent(event: GCEvent): void {
    this.gcEvents.push(event);

    // Keep only last 100 events
    if (this.gcEvents.length > 100) {
      this.gcEvents = this.gcEvents.slice(-100);
    }
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
 * Create singleton GC optimizer instance
 */
let gcOptimizer: BuildGCOptimizer | null = null;

export function createGCOptimizer(config?: Partial<GCOptimizationConfig>): BuildGCOptimizer {
  if (!gcOptimizer) {
    gcOptimizer = new BuildGCOptimizer(config);
  }
  return gcOptimizer;
}

/**
 * Get singleton GC optimizer instance
 */
export function getGCOptimizer(): BuildGCOptimizer {
  if (!gcOptimizer) {
    gcOptimizer = new BuildGCOptimizer();
  }
  return gcOptimizer;
}

/**
 * Utility function to wrap page generation with cleanup
 */
export async function withPageCleanup<T>(
  pageId: string,
  pageGenerationFn: () => Promise<T>
): Promise<T> {
  const gcOptimizer = getGCOptimizer();

  try {
    const result = await pageGenerationFn();
    await gcOptimizer.cleanupBetweenPages(pageId);
    return result;
  } catch (error) {
    await gcOptimizer.cleanupBetweenPages(pageId);
    throw error;
  }
}

/**
 * Utility function to track object lifecycle
 */
export function trackBuildObject(id: string, type: string, size?: number, references?: string[]): void {
  const gcOptimizer = getGCOptimizer();
  gcOptimizer.trackObject(id, type, size, references);
}

/**
 * Utility function to mark object for cleanup
 */
export function markForCleanup(id: string): void {
  const gcOptimizer = getGCOptimizer();
  gcOptimizer.markObjectForCleanup(id);
}

/**
 * Default GC optimization configuration
 */
export function getDefaultGCConfig(): GCOptimizationConfig {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    enabled: !isDevelopment, // Disable in development for faster iteration
    periodicGCInterval: isDevelopment ? 120000 : 60000, // 2 min dev, 1 min prod
    memoryThreshold: 0.75,
    aggressiveGCThreshold: 0.9,
    pageGenerationCleanup: true,
    objectLifecycleTracking: !isDevelopment,
    maxObjectAge: isDevelopment ? 600000 : 300000, // 10 min dev, 5 min prod
    gcStrategies: {
      incremental: true,
      concurrent: false,
      compacting: !isDevelopment,
    },
    enableDetailedLogging: isDevelopment,
  };
}