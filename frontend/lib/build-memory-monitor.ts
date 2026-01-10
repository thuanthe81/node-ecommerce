/**
 * Build Memory Monitor
 *
 * Implements memory usage tracking during build, memory threshold alerts (80% usage),
 * and memory cleanup triggers for build-time operations.
 */

import { EventEmitter } from 'events';

export interface MemoryConfig {
  maxMemoryPerWorker: number; // 512MB in bytes
  gcThreshold: number; // 0.8 (80% memory usage)
  cleanupInterval: number; // 30 seconds in milliseconds
  workerPoolSize: number; // CPU cores - 1
  alertThresholds: {
    warning: number; // 0.7 (70%)
    critical: number; // 0.85 (85%)
    emergency: number; // 0.95 (95%)
  };
  enableGCOptimization: boolean;
  enableDetailedLogging: boolean;
}

export interface MemoryStats {
  used: number; // bytes
  available: number; // bytes
  total: number; // bytes
  percentage: number; // 0-1
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
  rss: number; // Resident Set Size
  workers: WorkerMemoryStats[];
  timestamp: number;
}

export interface WorkerMemoryStats {
  workerId: string;
  memoryUsage: number;
  percentage: number;
  status: 'idle' | 'busy' | 'cleanup' | 'terminated';
  lastActivity: number;
  tasksCompleted: number;
}

export interface MemoryReport {
  currentStats: MemoryStats;
  peakUsage: number;
  averageUsage: number;
  gcEvents: number;
  cleanupEvents: number;
  alertsTriggered: number;
  memoryLeaks: MemoryLeak[];
  recommendations: string[];
}

export interface MemoryLeak {
  type: 'heap-growth' | 'external-growth' | 'worker-leak';
  severity: 'low' | 'medium' | 'high';
  description: string;
  detectedAt: number;
  growthRate: number; // bytes per second
}

export interface MemoryAlert {
  level: 'warning' | 'critical' | 'emergency';
  message: string;
  currentUsage: number;
  threshold: number;
  timestamp: number;
  recommendations: string[];
}

export class BuildMemoryMonitor extends EventEmitter {
  private config: MemoryConfig;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private memoryHistory: MemoryStats[] = [];
  private workerStats: Map<string, WorkerMemoryStats> = new Map();
  private alerts: MemoryAlert[] = [];
  private gcEvents = 0;
  private cleanupEvents = 0;
  private isMonitoring = false;

  constructor(config: Partial<MemoryConfig> = {}) {
    super();

    this.config = {
      maxMemoryPerWorker: 512 * 1024 * 1024, // 512MB
      gcThreshold: 0.8, // 80%
      cleanupInterval: 30000, // 30 seconds
      workerPoolSize: Math.max(1, require('os').cpus().length - 1),
      alertThresholds: {
        warning: 0.7, // 70%
        critical: 0.85, // 85%
        emergency: 0.95, // 95%
      },
      enableGCOptimization: true,
      enableDetailedLogging: false,
      ...config,
    };

    this.setupGlobalErrorHandlers();
  }

  /**
   * Start memory monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      console.warn('[MEMORY MONITOR] Already monitoring');
      return;
    }

    console.log('[MEMORY MONITOR] Starting memory monitoring');
    this.isMonitoring = true;

    // Monitor memory usage every 5 seconds
    this.monitoringInterval = setInterval(() => {
      this.collectMemoryStats();
    }, 5000);

    // Cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.performScheduledCleanup();
    }, this.config.cleanupInterval);

    // Initial stats collection
    this.collectMemoryStats();
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    console.log('[MEMORY MONITOR] Stopping memory monitoring');
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get current memory statistics
   */
  async monitorMemoryUsage(): Promise<MemoryStats> {
    const memUsage = process.memoryUsage();
    const totalMemory = require('os').totalmem();
    const freeMemory = require('os').freemem();
    const usedMemory = totalMemory - freeMemory;

    const stats: MemoryStats = {
      used: usedMemory,
      available: freeMemory,
      total: totalMemory,
      percentage: usedMemory / totalMemory,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers,
      rss: memUsage.rss,
      workers: Array.from(this.workerStats.values()),
      timestamp: Date.now(),
    };

    return stats;
  }

  /**
   * Trigger garbage collection
   */
  async triggerGarbageCollection(): Promise<void> {
    if (!this.config.enableGCOptimization) {
      console.log('[MEMORY MONITOR] GC optimization disabled');
      return;
    }

    console.log('[MEMORY MONITOR] Triggering garbage collection');

    const beforeStats = await this.monitorMemoryUsage();

    try {
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        this.gcEvents++;
      } else {
        console.warn('[MEMORY MONITOR] Global GC not available. Run with --expose-gc flag.');
      }

      // Wait a moment for GC to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const afterStats = await this.monitorMemoryUsage();
      const memoryFreed = beforeStats.heapUsed - afterStats.heapUsed;

      console.log(`[MEMORY MONITOR] GC completed: freed ${this.formatBytes(memoryFreed)}`);

      this.emit('gc-completed', {
        memoryFreed,
        beforeStats,
        afterStats,
      });

    } catch (error) {
      console.error('[MEMORY MONITOR] GC failed:', error);
    }
  }

  /**
   * Clean up worker memory
   */
  async cleanupWorker(workerId: string): Promise<void> {
    const workerStats = this.workerStats.get(workerId);
    if (!workerStats) {
      console.warn(`[MEMORY MONITOR] Worker ${workerId} not found`);
      return;
    }

    console.log(`[MEMORY MONITOR] Cleaning up worker ${workerId}`);

    try {
      // Mark worker as in cleanup
      workerStats.status = 'cleanup';
      workerStats.lastActivity = Date.now();

      // Perform worker-specific cleanup
      await this.performWorkerCleanup(workerId);

      // Update worker status
      workerStats.status = 'idle';
      workerStats.memoryUsage = 0;

      this.cleanupEvents++;
      console.log(`[MEMORY MONITOR] Worker ${workerId} cleanup completed`);

    } catch (error) {
      console.error(`[MEMORY MONITOR] Worker ${workerId} cleanup failed:`, error);
      workerStats.status = 'terminated';
    }
  }

  /**
   * Register worker for monitoring
   */
  registerWorker(workerId: string): void {
    this.workerStats.set(workerId, {
      workerId,
      memoryUsage: 0,
      percentage: 0,
      status: 'idle',
      lastActivity: Date.now(),
      tasksCompleted: 0,
    });

    console.log(`[MEMORY MONITOR] Registered worker: ${workerId}`);
  }

  /**
   * Update worker memory usage
   */
  updateWorkerStats(workerId: string, memoryUsage: number, status?: WorkerMemoryStats['status']): void {
    const workerStats = this.workerStats.get(workerId);
    if (!workerStats) {
      console.warn(`[MEMORY MONITOR] Worker ${workerId} not registered`);
      return;
    }

    workerStats.memoryUsage = memoryUsage;
    workerStats.percentage = memoryUsage / this.config.maxMemoryPerWorker;
    workerStats.lastActivity = Date.now();

    if (status) {
      workerStats.status = status;
    }

    if (status === 'idle') {
      workerStats.tasksCompleted++;
    }

    // Check if worker exceeds memory limit
    if (workerStats.percentage > 1.0) {
      this.handleWorkerMemoryExceeded(workerId, workerStats);
    }
  }

  /**
   * Get memory report
   */
  async getMemoryReport(): Promise<MemoryReport> {
    const currentStats = await this.monitorMemoryUsage();
    const memoryLeaks = this.detectMemoryLeaks();
    const recommendations = this.generateRecommendations(currentStats, memoryLeaks);

    const usageHistory = this.memoryHistory.map(stats => stats.percentage);
    const averageUsage = usageHistory.length > 0 ?
      usageHistory.reduce((sum, usage) => sum + usage, 0) / usageHistory.length : 0;

    const peakUsage = usageHistory.length > 0 ? Math.max(...usageHistory) : 0;

    return {
      currentStats,
      peakUsage,
      averageUsage,
      gcEvents: this.gcEvents,
      cleanupEvents: this.cleanupEvents,
      alertsTriggered: this.alerts.length,
      memoryLeaks,
      recommendations,
    };
  }

  /**
   * Get memory usage trend
   */
  getMemoryTrend(minutes: number = 10): {
    trend: 'increasing' | 'decreasing' | 'stable';
    rate: number; // percentage change per minute
    confidence: number; // 0-1
  } {
    const cutoffTime = Date.now() - (minutes * 60 * 1000);
    const recentStats = this.memoryHistory.filter(stats => stats.timestamp > cutoffTime);

    if (recentStats.length < 2) {
      return { trend: 'stable', rate: 0, confidence: 0 };
    }

    const firstUsage = recentStats[0].percentage;
    const lastUsage = recentStats[recentStats.length - 1].percentage;
    const timeSpan = (recentStats[recentStats.length - 1].timestamp - recentStats[0].timestamp) / (60 * 1000);

    const rate = ((lastUsage - firstUsage) / timeSpan) * 100; // percentage per minute
    const confidence = Math.min(recentStats.length / 10, 1); // More data = higher confidence

    let trend: 'increasing' | 'decreasing' | 'stable';
    if (Math.abs(rate) < 0.1) {
      trend = 'stable';
    } else if (rate > 0) {
      trend = 'increasing';
    } else {
      trend = 'decreasing';
    }

    return { trend, rate, confidence };
  }

  /**
   * Collect memory statistics
   */
  private async collectMemoryStats(): Promise<void> {
    try {
      const stats = await this.monitorMemoryUsage();

      // Add to history (keep last 100 entries)
      this.memoryHistory.push(stats);
      if (this.memoryHistory.length > 100) {
        this.memoryHistory = this.memoryHistory.slice(-100);
      }

      // Check thresholds and trigger alerts
      this.checkMemoryThresholds(stats);

      // Log detailed stats if enabled
      if (this.config.enableDetailedLogging) {
        console.log(`[MEMORY MONITOR] Memory usage: ${(stats.percentage * 100).toFixed(1)}% (${this.formatBytes(stats.used)}/${this.formatBytes(stats.total)})`);
      }

      this.emit('stats-collected', stats);

    } catch (error) {
      console.error('[MEMORY MONITOR] Failed to collect memory stats:', error);
    }
  }

  /**
   * Check memory thresholds and trigger alerts
   */
  private checkMemoryThresholds(stats: MemoryStats): void {
    const { warning, critical, emergency } = this.config.alertThresholds;

    if (stats.percentage >= emergency) {
      this.triggerAlert('emergency', 'Emergency memory usage detected', stats.percentage, emergency);
      this.performEmergencyCleanup();
    } else if (stats.percentage >= critical) {
      this.triggerAlert('critical', 'Critical memory usage detected', stats.percentage, critical);
      this.performCriticalCleanup();
    } else if (stats.percentage >= warning) {
      this.triggerAlert('warning', 'High memory usage detected', stats.percentage, warning);
    }

    // Check if we should trigger GC
    if (stats.percentage >= this.config.gcThreshold && this.config.enableGCOptimization) {
      this.triggerGarbageCollection();
    }
  }

  /**
   * Trigger memory alert
   */
  private triggerAlert(level: MemoryAlert['level'], message: string, currentUsage: number, threshold: number): void {
    const alert: MemoryAlert = {
      level,
      message,
      currentUsage,
      threshold,
      timestamp: Date.now(),
      recommendations: this.getAlertRecommendations(level, currentUsage),
    };

    this.alerts.push(alert);

    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50);
    }

    console.warn(`[MEMORY MONITOR] ${level.toUpperCase()}: ${message} (${(currentUsage * 100).toFixed(1)}%)`);

    this.emit('memory-alert', alert);
  }

  /**
   * Get recommendations for memory alerts
   */
  private getAlertRecommendations(level: MemoryAlert['level'], usage: number): string[] {
    const recommendations: string[] = [];

    if (level === 'warning') {
      recommendations.push('Consider reducing concurrent operations');
      recommendations.push('Clear unnecessary caches');
    } else if (level === 'critical') {
      recommendations.push('Trigger garbage collection immediately');
      recommendations.push('Reduce worker pool size');
      recommendations.push('Clear all non-essential caches');
    } else if (level === 'emergency') {
      recommendations.push('Emergency cleanup required');
      recommendations.push('Terminate non-critical workers');
      recommendations.push('Clear all caches');
      recommendations.push('Consider restarting build process');
    }

    return recommendations;
  }

  /**
   * Perform scheduled cleanup
   */
  private async performScheduledCleanup(): Promise<void> {
    const stats = await this.monitorMemoryUsage();

    if (stats.percentage > this.config.gcThreshold) {
      console.log('[MEMORY MONITOR] Performing scheduled cleanup');

      // Clean up idle workers
      for (const [workerId, workerStats] of this.workerStats.entries()) {
        const idleTime = Date.now() - workerStats.lastActivity;
        if (workerStats.status === 'idle' && idleTime > 60000) { // 1 minute idle
          await this.cleanupWorker(workerId);
        }
      }

      // Trigger GC if needed
      if (this.config.enableGCOptimization) {
        await this.triggerGarbageCollection();
      }
    }
  }

  /**
   * Perform critical cleanup
   */
  private async performCriticalCleanup(): Promise<void> {
    console.warn('[MEMORY MONITOR] Performing critical cleanup');

    // Force GC
    if (this.config.enableGCOptimization) {
      await this.triggerGarbageCollection();
    }

    // Clean up all idle workers
    for (const [workerId, workerStats] of this.workerStats.entries()) {
      if (workerStats.status === 'idle') {
        await this.cleanupWorker(workerId);
      }
    }

    this.emit('critical-cleanup-completed');
  }

  /**
   * Perform emergency cleanup
   */
  private async performEmergencyCleanup(): Promise<void> {
    console.error('[MEMORY MONITOR] Performing emergency cleanup');

    // Force GC multiple times
    if (this.config.enableGCOptimization) {
      for (let i = 0; i < 3; i++) {
        await this.triggerGarbageCollection();
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Terminate all non-essential workers
    for (const [workerId, workerStats] of this.workerStats.entries()) {
      if (workerStats.status !== 'busy') {
        workerStats.status = 'terminated';
        await this.cleanupWorker(workerId);
      }
    }

    this.emit('emergency-cleanup-completed');
  }

  /**
   * Handle worker memory exceeded
   */
  private async handleWorkerMemoryExceeded(workerId: string, workerStats: WorkerMemoryStats): Promise<void> {
    console.warn(`[MEMORY MONITOR] Worker ${workerId} exceeded memory limit: ${this.formatBytes(workerStats.memoryUsage)}`);

    this.triggerAlert('critical', `Worker ${workerId} exceeded memory limit`, workerStats.percentage, 1.0);

    // Force cleanup of the worker
    await this.cleanupWorker(workerId);
  }

  /**
   * Perform worker-specific cleanup
   */
  private async performWorkerCleanup(workerId: string): Promise<void> {
    // This would be implemented based on the specific worker implementation
    // For now, just simulate cleanup
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Detect memory leaks
   */
  private detectMemoryLeaks(): MemoryLeak[] {
    const leaks: MemoryLeak[] = [];

    if (this.memoryHistory.length < 10) {
      return leaks;
    }

    // Check for consistent heap growth
    const recentStats = this.memoryHistory.slice(-10);
    const heapGrowth = recentStats[recentStats.length - 1].heapUsed - recentStats[0].heapUsed;
    const timeSpan = (recentStats[recentStats.length - 1].timestamp - recentStats[0].timestamp) / 1000;
    const growthRate = heapGrowth / timeSpan;

    if (growthRate > 1024 * 1024) { // 1MB per second
      leaks.push({
        type: 'heap-growth',
        severity: growthRate > 10 * 1024 * 1024 ? 'high' : 'medium',
        description: `Heap growing at ${this.formatBytes(growthRate)}/second`,
        detectedAt: Date.now(),
        growthRate,
      });
    }

    return leaks;
  }

  /**
   * Generate recommendations based on current state
   */
  private generateRecommendations(stats: MemoryStats, leaks: MemoryLeak[]): string[] {
    const recommendations: string[] = [];

    if (stats.percentage > 0.8) {
      recommendations.push('Memory usage is high - consider reducing concurrent operations');
    }

    if (leaks.length > 0) {
      recommendations.push('Memory leaks detected - investigate and fix memory management');
    }

    if (stats.workers.some(w => w.percentage > 0.9)) {
      recommendations.push('Some workers are using excessive memory - consider worker cleanup');
    }

    if (this.gcEvents < this.memoryHistory.length / 10) {
      recommendations.push('Consider more frequent garbage collection');
    }

    return recommendations;
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    if (typeof process !== 'undefined') {
      process.on('warning', (warning) => {
        if (warning.name === 'MaxListenersExceededWarning') {
          console.warn('[MEMORY MONITOR] Memory event listeners exceeded - possible memory leak');
        }
      });
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
 * Create singleton memory monitor instance
 */
let memoryMonitor: BuildMemoryMonitor | null = null;

export function createMemoryMonitor(config?: Partial<MemoryConfig>): BuildMemoryMonitor {
  if (!memoryMonitor) {
    memoryMonitor = new BuildMemoryMonitor(config);
  }
  return memoryMonitor;
}

/**
 * Get singleton memory monitor instance
 */
export function getMemoryMonitor(): BuildMemoryMonitor {
  if (!memoryMonitor) {
    memoryMonitor = new BuildMemoryMonitor();
  }
  return memoryMonitor;
}

/**
 * Default memory configuration for different environments
 */
export function getDefaultMemoryConfig(): MemoryConfig {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const totalMemory = require('os').totalmem();

  return {
    maxMemoryPerWorker: isDevelopment ? 256 * 1024 * 1024 : 512 * 1024 * 1024, // 256MB dev, 512MB prod
    gcThreshold: 0.8,
    cleanupInterval: isDevelopment ? 60000 : 30000, // 1 min dev, 30s prod
    workerPoolSize: Math.max(1, require('os').cpus().length - 1),
    alertThresholds: {
      warning: 0.7,
      critical: 0.85,
      emergency: 0.95,
    },
    enableGCOptimization: !isDevelopment,
    enableDetailedLogging: isDevelopment,
  };
}