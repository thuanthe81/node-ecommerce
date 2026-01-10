/**
 * Build Resource Allocator
 *
 * Implements dynamic worker scaling based on system load, CPU and memory
 * usage monitoring per worker, and resource contention detection.
 */

import { EventEmitter } from 'events';
import * as os from 'os';
import { BuildWorkerPool, WorkerPoolStats } from './build-worker-pool';

export interface ResourceAllocationConfig {
  enableDynamicScaling: boolean; // true
  scaleUpThreshold: number; // 0.8 (80% utilization)
  scaleDownThreshold: number; // 0.3 (30% utilization)
  maxCpuUsage: number; // 0.9 (90%)
  maxMemoryUsage: number; // 0.85 (85%)
  monitoringInterval: number; // 5000ms
  scalingCooldown: number; // 30000ms (30 seconds)
  contentionDetectionEnabled: boolean; // true
  resourceReservation: {
    cpuReserve: number; // 0.1 (10% reserved for system)
    memoryReserve: number; // 0.15 (15% reserved for system)
  };
}

export interface SystemResourceStats {
  cpu: {
    usage: number; // 0-1
    cores: number;
    loadAverage: number[];
    availableCores: number;
  };
  memory: {
    total: number; // bytes
    used: number; // bytes
    available: number; // bytes
    usage: number; // 0-1
  };
  workers: {
    count: number;
    cpuUsagePerWorker: number[];
    memoryUsagePerWorker: number[];
    averageCpuUsage: number;
    averageMemoryUsage: number;
  };
}

export interface ResourceContentionEvent {
  type: 'cpu' | 'memory' | 'io' | 'worker-pool';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metrics: Record<string, number>;
  timestamp: Date;
  suggestedActions: string[];
}

export interface ScalingDecision {
  action: 'scale-up' | 'scale-down' | 'no-change';
  currentWorkers: number;
  targetWorkers: number;
  reason: string;
  confidence: number; // 0-1
  expectedImpact: {
    cpuReduction?: number;
    memoryReduction?: number;
    throughputIncrease?: number;
  };
}

export class BuildResourceAllocator extends EventEmitter {
  private config: ResourceAllocationConfig;
  private workerPool: BuildWorkerPool;
  private monitoringInterval?: NodeJS.Timeout;
  private lastScalingTime = 0;
  private resourceHistory: SystemResourceStats[] = [];
  private contentionEvents: ResourceContentionEvent[] = [];
  private isMonitoring = false;

  constructor(workerPool: BuildWorkerPool, config?: Partial<ResourceAllocationConfig>) {
    super();

    this.workerPool = workerPool;
    this.config = {
      enableDynamicScaling: true,
      scaleUpThreshold: 0.8,
      scaleDownThreshold: 0.3,
      maxCpuUsage: 0.9,
      maxMemoryUsage: 0.85,
      monitoringInterval: 5000,
      scalingCooldown: 30000,
      contentionDetectionEnabled: true,
      resourceReservation: {
        cpuReserve: 0.1,
        memoryReserve: 0.15,
      },
      ...config,
    };
  }

  /**
   * Start resource monitoring and dynamic scaling
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      return;
    }

    console.log('[RESOURCE ALLOCATOR] Starting resource monitoring');
    this.isMonitoring = true;

    this.monitoringInterval = setInterval(() => {
      this.performResourceMonitoring();
    }, this.config.monitoringInterval);

    this.emit('monitoring-started');
  }

  /**
   * Stop resource monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    console.log('[RESOURCE ALLOCATOR] Stopping resource monitoring');
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    this.emit('monitoring-stopped');
  }

  /**
   * Get current system resource statistics
   */
  async getSystemResourceStats(): Promise<SystemResourceStats> {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const loadAverage = os.loadavg();

    // Calculate CPU usage (approximation based on load average)
    const cpuUsage = Math.min(1, loadAverage[0] / cpus.length);

    // Get worker pool stats
    const workerStats = this.workerPool.getStats();

    // Calculate available resources after reservation
    const availableCores = Math.floor(cpus.length * (1 - this.config.resourceReservation.cpuReserve));
    const availableMemory = totalMemory * (1 - this.config.resourceReservation.memoryReserve);

    return {
      cpu: {
        usage: cpuUsage,
        cores: cpus.length,
        loadAverage,
        availableCores,
      },
      memory: {
        total: totalMemory,
        used: usedMemory,
        available: freeMemory,
        usage: usedMemory / totalMemory,
      },
      workers: {
        count: workerStats.totalWorkers,
        cpuUsagePerWorker: [], // Would be populated from worker health checks
        memoryUsagePerWorker: [], // Would be populated from worker health checks
        averageCpuUsage: cpuUsage / Math.max(1, workerStats.activeWorkers),
        averageMemoryUsage: (usedMemory / totalMemory) / Math.max(1, workerStats.totalWorkers),
      },
    };
  }

  /**
   * Analyze current resource usage and make scaling decision
   */
  async analyzeScalingNeeds(): Promise<ScalingDecision> {
    const stats = await this.getSystemResourceStats();
    const workerStats = this.workerPool.getStats();

    // Check if we're in cooldown period
    const timeSinceLastScaling = Date.now() - this.lastScalingTime;
    if (timeSinceLastScaling < this.config.scalingCooldown) {
      return {
        action: 'no-change',
        currentWorkers: workerStats.totalWorkers,
        targetWorkers: workerStats.totalWorkers,
        reason: `Scaling cooldown active (${Math.ceil((this.config.scalingCooldown - timeSinceLastScaling) / 1000)}s remaining)`,
        confidence: 1,
        expectedImpact: {},
      };
    }

    // Calculate utilization metrics
    const workerUtilization = workerStats.activeWorkers / Math.max(1, workerStats.totalWorkers);
    const queuePressure = workerStats.queueLength / Math.max(1, workerStats.totalWorkers);

    // Check for resource constraints
    const cpuConstrained = stats.cpu.usage > this.config.maxCpuUsage;
    const memoryConstrained = stats.memory.usage > this.config.maxMemoryUsage;

    // Scaling decision logic
    if (cpuConstrained || memoryConstrained) {
      // System is resource constrained - scale down if possible
      if (workerStats.totalWorkers > 1) {
        return {
          action: 'scale-down',
          currentWorkers: workerStats.totalWorkers,
          targetWorkers: Math.max(1, Math.ceil(workerStats.totalWorkers * 0.8)),
          reason: `Resource constraint detected (CPU: ${(stats.cpu.usage * 100).toFixed(1)}%, Memory: ${(stats.memory.usage * 100).toFixed(1)}%)`,
          confidence: 0.9,
          expectedImpact: {
            cpuReduction: stats.cpu.usage * 0.2,
            memoryReduction: stats.memory.usage * 0.2,
          },
        };
      }
    } else if (workerUtilization > this.config.scaleUpThreshold || queuePressure > 2) {
      // High utilization or queue pressure - scale up if resources allow
      const maxPossibleWorkers = Math.min(
        stats.cpu.availableCores,
        Math.floor(stats.memory.available / (100 * 1024 * 1024)) // Assume 100MB per worker
      );

      if (workerStats.totalWorkers < maxPossibleWorkers) {
        const targetWorkers = Math.min(
          maxPossibleWorkers,
          workerStats.totalWorkers + Math.ceil(queuePressure)
        );

        return {
          action: 'scale-up',
          currentWorkers: workerStats.totalWorkers,
          targetWorkers,
          reason: `High utilization detected (Worker: ${(workerUtilization * 100).toFixed(1)}%, Queue pressure: ${queuePressure.toFixed(1)})`,
          confidence: 0.8,
          expectedImpact: {
            throughputIncrease: (targetWorkers - workerStats.totalWorkers) / workerStats.totalWorkers,
          },
        };
      }
    } else if (workerUtilization < this.config.scaleDownThreshold && workerStats.queueLength === 0) {
      // Low utilization and no queue - scale down
      if (workerStats.totalWorkers > 1) {
        return {
          action: 'scale-down',
          currentWorkers: workerStats.totalWorkers,
          targetWorkers: Math.max(1, Math.ceil(workerStats.totalWorkers * 0.7)),
          reason: `Low utilization detected (${(workerUtilization * 100).toFixed(1)}%)`,
          confidence: 0.7,
          expectedImpact: {
            cpuReduction: stats.cpu.usage * 0.3,
            memoryReduction: stats.memory.usage * 0.3,
          },
        };
      }
    }

    return {
      action: 'no-change',
      currentWorkers: workerStats.totalWorkers,
      targetWorkers: workerStats.totalWorkers,
      reason: 'Resource usage within acceptable ranges',
      confidence: 0.6,
      expectedImpact: {},
    };
  }

  /**
   * Execute scaling decision
   */
  async executeScaling(decision: ScalingDecision): Promise<void> {
    if (decision.action === 'no-change') {
      return;
    }

    console.log(`[RESOURCE ALLOCATOR] Executing scaling: ${decision.action} from ${decision.currentWorkers} to ${decision.targetWorkers} workers`);
    console.log(`[RESOURCE ALLOCATOR] Reason: ${decision.reason}`);

    try {
      await this.workerPool.scaleWorkers(decision.targetWorkers);
      this.lastScalingTime = Date.now();

      this.emit('scaling-executed', {
        decision,
        timestamp: new Date(),
      });

      console.log(`[RESOURCE ALLOCATOR] Scaling completed successfully`);

    } catch (error) {
      console.error('[RESOURCE ALLOCATOR] Scaling failed:', error);
      this.emit('scaling-failed', {
        decision,
        error,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Detect resource contention
   */
  async detectResourceContention(): Promise<ResourceContentionEvent[]> {
    if (!this.config.contentionDetectionEnabled) {
      return [];
    }

    const stats = await this.getSystemResourceStats();
    const events: ResourceContentionEvent[] = [];

    // CPU contention detection
    if (stats.cpu.usage > 0.95) {
      events.push({
        type: 'cpu',
        severity: 'critical',
        description: 'Critical CPU usage detected',
        metrics: {
          cpuUsage: stats.cpu.usage,
          loadAverage: stats.cpu.loadAverage[0],
          cores: stats.cpu.cores,
        },
        timestamp: new Date(),
        suggestedActions: [
          'Reduce worker pool size immediately',
          'Pause non-critical build operations',
          'Check for CPU-intensive tasks',
        ],
      });
    } else if (stats.cpu.usage > 0.85) {
      events.push({
        type: 'cpu',
        severity: 'high',
        description: 'High CPU usage detected',
        metrics: {
          cpuUsage: stats.cpu.usage,
          loadAverage: stats.cpu.loadAverage[0],
        },
        timestamp: new Date(),
        suggestedActions: [
          'Consider reducing worker pool size',
          'Monitor CPU usage trends',
        ],
      });
    }

    // Memory contention detection
    if (stats.memory.usage > 0.95) {
      events.push({
        type: 'memory',
        severity: 'critical',
        description: 'Critical memory usage detected',
        metrics: {
          memoryUsage: stats.memory.usage,
          totalMemory: stats.memory.total,
          availableMemory: stats.memory.available,
        },
        timestamp: new Date(),
        suggestedActions: [
          'Reduce worker pool size immediately',
          'Force garbage collection',
          'Clear non-essential caches',
        ],
      });
    } else if (stats.memory.usage > 0.9) {
      events.push({
        type: 'memory',
        severity: 'high',
        description: 'High memory usage detected',
        metrics: {
          memoryUsage: stats.memory.usage,
          availableMemory: stats.memory.available,
        },
        timestamp: new Date(),
        suggestedActions: [
          'Consider reducing worker pool size',
          'Monitor memory usage trends',
          'Optimize memory-intensive operations',
        ],
      });
    }

    // Worker pool contention detection
    const workerStats = this.workerPool.getStats();
    const queueRatio = workerStats.queueLength / Math.max(1, workerStats.totalWorkers);

    if (queueRatio > 5) {
      events.push({
        type: 'worker-pool',
        severity: 'high',
        description: 'High task queue backlog detected',
        metrics: {
          queueLength: workerStats.queueLength,
          totalWorkers: workerStats.totalWorkers,
          queueRatio,
        },
        timestamp: new Date(),
        suggestedActions: [
          'Increase worker pool size if resources allow',
          'Optimize task processing time',
          'Consider task prioritization',
        ],
      });
    }

    // Store contention events
    this.contentionEvents.push(...events);

    // Keep only recent events (last 100)
    if (this.contentionEvents.length > 100) {
      this.contentionEvents = this.contentionEvents.slice(-100);
    }

    return events;
  }

  /**
   * Get resource allocation recommendations
   */
  async getResourceRecommendations(): Promise<{
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  }> {
    const stats = await this.getSystemResourceStats();
    const workerStats = this.workerPool.getStats();
    const recentContentions = this.contentionEvents.filter(
      event => Date.now() - event.timestamp.getTime() < 300000 // Last 5 minutes
    );

    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];

    // Immediate recommendations (critical issues)
    if (stats.cpu.usage > 0.95) {
      immediate.push('Reduce worker pool size immediately to prevent system overload');
    }
    if (stats.memory.usage > 0.95) {
      immediate.push('Force garbage collection and clear caches to free memory');
    }

    // Short-term recommendations (optimization opportunities)
    if (workerStats.averageTaskTime > 30000) { // 30 seconds
      shortTerm.push('Optimize slow build tasks to improve throughput');
    }
    if (workerStats.queueLength > workerStats.totalWorkers * 3) {
      shortTerm.push('Consider increasing worker pool size during peak load');
    }
    if (recentContentions.length > 5) {
      shortTerm.push('Investigate recurring resource contention patterns');
    }

    // Long-term recommendations (capacity planning)
    const avgCpuUsage = this.resourceHistory.length > 0
      ? this.resourceHistory.reduce((sum, stat) => sum + stat.cpu.usage, 0) / this.resourceHistory.length
      : stats.cpu.usage;

    if (avgCpuUsage > 0.7) {
      longTerm.push('Consider upgrading to higher CPU capacity for better performance');
    }

    const avgMemoryUsage = this.resourceHistory.length > 0
      ? this.resourceHistory.reduce((sum, stat) => sum + stat.memory.usage, 0) / this.resourceHistory.length
      : stats.memory.usage;

    if (avgMemoryUsage > 0.8) {
      longTerm.push('Consider increasing system memory for better build performance');
    }

    if (workerStats.throughput < 0.5) { // Less than 0.5 tasks per second
      longTerm.push('Analyze build process bottlenecks and optimize critical paths');
    }

    return { immediate, shortTerm, longTerm };
  }

  /**
   * Get resource allocation statistics
   */
  getResourceStats(): {
    currentStats: SystemResourceStats | null;
    historicalAverage: Partial<SystemResourceStats> | null;
    contentionEvents: ResourceContentionEvent[];
    scalingHistory: number;
  } {
    const currentStats = this.resourceHistory.length > 0
      ? this.resourceHistory[this.resourceHistory.length - 1]
      : null;

    const historicalAverage = this.resourceHistory.length > 0 ? {
      cpu: {
        usage: this.resourceHistory.reduce((sum, stat) => sum + stat.cpu.usage, 0) / this.resourceHistory.length,
        cores: this.resourceHistory.reduce((sum, stat) => sum + stat.cpu.cores, 0) / this.resourceHistory.length,
        loadAverage: this.resourceHistory[this.resourceHistory.length - 1].cpu.loadAverage, // Use latest load average
        availableCores: this.resourceHistory.reduce((sum, stat) => sum + stat.cpu.availableCores, 0) / this.resourceHistory.length,
      },
      memory: {
        usage: this.resourceHistory.reduce((sum, stat) => sum + stat.memory.usage, 0) / this.resourceHistory.length,
        total: this.resourceHistory.reduce((sum, stat) => sum + stat.memory.total, 0) / this.resourceHistory.length,
        used: this.resourceHistory.reduce((sum, stat) => sum + stat.memory.used, 0) / this.resourceHistory.length,
        available: this.resourceHistory.reduce((sum, stat) => sum + stat.memory.available, 0) / this.resourceHistory.length,
      },
      workers: {
        count: this.resourceHistory.reduce((sum, stat) => sum + stat.workers.count, 0) / this.resourceHistory.length,
        cpuUsagePerWorker: this.resourceHistory[this.resourceHistory.length - 1].workers.cpuUsagePerWorker, // Use latest
        memoryUsagePerWorker: this.resourceHistory[this.resourceHistory.length - 1].workers.memoryUsagePerWorker, // Use latest
        averageCpuUsage: this.resourceHistory.reduce((sum, stat) => sum + stat.workers.averageCpuUsage, 0) / this.resourceHistory.length,
        averageMemoryUsage: this.resourceHistory.reduce((sum, stat) => sum + stat.workers.averageMemoryUsage, 0) / this.resourceHistory.length,
      },
    } : null;

    return {
      currentStats,
      historicalAverage,
      contentionEvents: this.contentionEvents.slice(-20), // Last 20 events
      scalingHistory: this.lastScalingTime,
    };
  }

  /**
   * Perform resource monitoring cycle
   */
  private async performResourceMonitoring(): Promise<void> {
    try {
      // Get current resource stats
      const stats = await this.getSystemResourceStats();

      // Store in history
      this.resourceHistory.push(stats);
      if (this.resourceHistory.length > 100) {
        this.resourceHistory = this.resourceHistory.slice(-100);
      }

      // Detect contention
      const contentionEvents = await this.detectResourceContention();

      // Emit contention events
      for (const event of contentionEvents) {
        this.emit('resource-contention', event);
      }

      // Analyze scaling needs
      if (this.config.enableDynamicScaling) {
        const scalingDecision = await this.analyzeScalingNeeds();

        if (scalingDecision.action !== 'no-change') {
          this.emit('scaling-recommended', scalingDecision);

          // Auto-execute scaling if confidence is high
          if (scalingDecision.confidence > 0.8) {
            await this.executeScaling(scalingDecision);
          }
        }
      }

      // Emit resource update
      this.emit('resource-stats-updated', stats);

    } catch (error) {
      console.error('[RESOURCE ALLOCATOR] Monitoring cycle failed:', error);
      this.emit('monitoring-error', error);
    }
  }
}

/**
 * Get default resource allocation configuration
 */
export function getDefaultResourceAllocationConfig(): ResourceAllocationConfig {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    enableDynamicScaling: !isDevelopment, // Disable in development
    scaleUpThreshold: 0.8,
    scaleDownThreshold: 0.3,
    maxCpuUsage: 0.9,
    maxMemoryUsage: 0.85,
    monitoringInterval: isDevelopment ? 10000 : 5000, // 10s dev, 5s prod
    scalingCooldown: 30000,
    contentionDetectionEnabled: true,
    resourceReservation: {
      cpuReserve: isDevelopment ? 0.2 : 0.1, // More reserve in development
      memoryReserve: isDevelopment ? 0.25 : 0.15,
    },
  };
}

/**
 * Create resource allocator with default configuration
 */
export function createResourceAllocator(
  workerPool: BuildWorkerPool,
  config?: Partial<ResourceAllocationConfig>
): BuildResourceAllocator {
  return new BuildResourceAllocator(workerPool, {
    ...getDefaultResourceAllocationConfig(),
    ...config,
  });
}