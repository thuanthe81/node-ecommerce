/**
 * Build Parallel Processing Integration
 *
 * Integrates worker pool, parallel page generation, and resource allocation
 * to provide a comprehensive parallel build processing system.
 */

import { EventEmitter } from 'events';
import {
  BuildWorkerPool,
  WorkerPoolConfig,
  createWorkerPool,
  getDefaultWorkerPoolConfig
} from './build-worker-pool';
import {
  BuildParallelPageGenerator,
  PageGenerationConfig,
  PageBuildRequest,
  PageBuildResult,
  createParallelPageGenerator,
  getDefaultPageGenerationConfig
} from './build-parallel-page-generator';
import {
  BuildResourceAllocator,
  ResourceAllocationConfig,
  SystemResourceStats,
  ResourceContentionEvent,
  ScalingDecision,
  createResourceAllocator,
  getDefaultResourceAllocationConfig
} from './build-resource-allocator';

export interface ParallelBuildConfig {
  workerPool: WorkerPoolConfig;
  pageGeneration: PageGenerationConfig;
  resourceAllocation: ResourceAllocationConfig;
  enableIntegration: boolean;
  enablePerformanceLogging: boolean;
}

export interface ParallelBuildStats {
  workerPool: ReturnType<BuildWorkerPool['getStats']>;
  pageGeneration: ReturnType<BuildParallelPageGenerator['getGenerationStats']>;
  resourceAllocation: ReturnType<BuildResourceAllocator['getResourceStats']>;
  integration: {
    totalBuildTime: number;
    parallelEfficiency: number;
    resourceUtilization: number;
    scalingEvents: number;
    contentionEvents: number;
  };
}

export interface ParallelBuildResult {
  success: boolean;
  totalPages: number;
  completedPages: number;
  failedPages: number;
  totalDuration: number;
  averagePageTime: number;
  parallelEfficiency: number;
  pageResults: PageBuildResult[];
  stats: ParallelBuildStats;
  errors: Error[];
}

export class BuildParallelProcessor extends EventEmitter {
  private config: ParallelBuildConfig;
  private workerPool: BuildWorkerPool;
  private pageGenerator: BuildParallelPageGenerator;
  private resourceAllocator: BuildResourceAllocator;
  private isInitialized = false;
  private buildStartTime = 0;
  private scalingEvents = 0;
  private contentionEvents = 0;

  constructor(config?: Partial<ParallelBuildConfig>) {
    super();

    this.config = {
      workerPool: getDefaultWorkerPoolConfig(),
      pageGeneration: getDefaultPageGenerationConfig(),
      resourceAllocation: getDefaultResourceAllocationConfig(),
      enableIntegration: true,
      enablePerformanceLogging: process.env.NODE_ENV !== 'production',
      ...config,
    };

    // Initialize components
    this.workerPool = createWorkerPool(this.config.workerPool);
    this.pageGenerator = createParallelPageGenerator(this.config.pageGeneration);
    this.resourceAllocator = createResourceAllocator(this.workerPool, this.config.resourceAllocation);

    // Set up integration if enabled
    if (this.config.enableIntegration) {
      this.setupComponentIntegration();
    }
  }

  /**
   * Initialize the parallel build processor
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('[PARALLEL BUILD] Initializing parallel build processor');

    try {
      // Initialize components in order
      await this.workerPool.initialize();
      await this.pageGenerator.initialize();

      // Start resource monitoring
      this.resourceAllocator.startMonitoring();

      this.isInitialized = true;
      console.log('[PARALLEL BUILD] Parallel build processor initialized');
      this.emit('initialized');

    } catch (error) {
      console.error('[PARALLEL BUILD] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Process multiple pages in parallel with full optimization
   */
  async processPages(pages: PageBuildRequest[]): Promise<ParallelBuildResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log(`[PARALLEL BUILD] Starting parallel processing of ${pages.length} pages`);
    this.buildStartTime = Date.now();
    this.scalingEvents = 0;
    this.contentionEvents = 0;

    const errors: Error[] = [];

    try {
      // Pre-build optimization
      await this.optimizeForBuild(pages);

      // Execute parallel page generation
      const pageResults = await this.pageGenerator.generatePages(pages);

      // Calculate results
      const totalDuration = Date.now() - this.buildStartTime;
      const completedPages = pageResults.filter(r => r.success).length;
      const failedPages = pageResults.filter(r => !r.success).length;

      // Collect errors
      pageResults.forEach(result => {
        if (!result.success && result.error) {
          errors.push(result.error);
        }
      });

      // Calculate performance metrics
      const averagePageTime = pageResults.length > 0
        ? pageResults.reduce((sum, r) => sum + r.duration, 0) / pageResults.length
        : 0;

      const stats = await this.getParallelBuildStats();
      const parallelEfficiency = stats.pageGeneration.parallelEfficiency;

      const result: ParallelBuildResult = {
        success: failedPages === 0,
        totalPages: pages.length,
        completedPages,
        failedPages,
        totalDuration,
        averagePageTime,
        parallelEfficiency,
        pageResults,
        stats,
        errors,
      };

      // Log performance report
      if (this.config.enablePerformanceLogging) {
        this.logBuildReport(result);
      }

      this.emit('build-completed', result);
      return result;

    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Unknown error');
      errors.push(errorObj);

      const result: ParallelBuildResult = {
        success: false,
        totalPages: pages.length,
        completedPages: 0,
        failedPages: pages.length,
        totalDuration: Date.now() - this.buildStartTime,
        averagePageTime: 0,
        parallelEfficiency: 0,
        pageResults: [],
        stats: await this.getParallelBuildStats(),
        errors,
      };

      this.emit('build-failed', result);
      throw error;
    }
  }

  /**
   * Get comprehensive parallel build statistics
   */
  async getParallelBuildStats(): Promise<ParallelBuildStats> {
    const workerPoolStats = this.workerPool.getStats();
    const pageGenerationStats = this.pageGenerator.getGenerationStats();
    const resourceStats = this.resourceAllocator.getResourceStats();

    // Calculate integration metrics
    const totalBuildTime = Date.now() - this.buildStartTime;
    const parallelEfficiency = pageGenerationStats.parallelEfficiency;

    // Calculate resource utilization
    const resourceUtilization = resourceStats.currentStats
      ? (resourceStats.currentStats.cpu.usage + resourceStats.currentStats.memory.usage) / 2
      : 0;

    return {
      workerPool: workerPoolStats,
      pageGeneration: pageGenerationStats,
      resourceAllocation: resourceStats,
      integration: {
        totalBuildTime,
        parallelEfficiency,
        resourceUtilization,
        scalingEvents: this.scalingEvents,
        contentionEvents: this.contentionEvents,
      },
    };
  }

  /**
   * Optimize system for upcoming build
   */
  async optimizeForBuild(pages: PageBuildRequest[]): Promise<void> {
    console.log('[PARALLEL BUILD] Optimizing system for build');

    try {
      // Analyze build requirements
      const buildComplexity = this.analyzeBuildComplexity(pages);

      // Get current resource stats
      const resourceStats = await this.resourceAllocator.getSystemResourceStats();

      // Optimize worker pool size based on build complexity and resources
      const optimalWorkers = this.calculateOptimalWorkerCount(buildComplexity, resourceStats);

      if (optimalWorkers !== this.workerPool.getStats().totalWorkers) {
        console.log(`[PARALLEL BUILD] Scaling worker pool to ${optimalWorkers} workers for optimal performance`);
        await this.workerPool.scaleWorkers(optimalWorkers);
      }

      // Pre-warm any necessary resources
      await this.prewarmResources(pages);

      console.log('[PARALLEL BUILD] System optimization completed');

    } catch (error) {
      console.warn('[PARALLEL BUILD] Build optimization failed, continuing with current settings:', error);
    }
  }

  /**
   * Shutdown the parallel build processor
   */
  async shutdown(): Promise<void> {
    console.log('[PARALLEL BUILD] Shutting down parallel build processor');

    try {
      // Stop resource monitoring
      this.resourceAllocator.stopMonitoring();

      // Shutdown components
      await this.pageGenerator.shutdown();
      await this.workerPool.shutdown();

      this.isInitialized = false;
      console.log('[PARALLEL BUILD] Shutdown completed');
      this.emit('shutdown');

    } catch (error) {
      console.error('[PARALLEL BUILD] Shutdown failed:', error);
      throw error;
    }
  }

  /**
   * Force optimization (emergency cleanup)
   */
  async forceOptimization(): Promise<void> {
    console.log('[PARALLEL BUILD] Forcing aggressive optimization');

    try {
      // Get resource recommendations
      const recommendations = await this.resourceAllocator.getResourceRecommendations();

      // Execute immediate recommendations
      for (const action of recommendations.immediate) {
        console.log(`[PARALLEL BUILD] Executing immediate action: ${action}`);

        if (action.includes('Reduce worker pool size')) {
          const currentWorkers = this.workerPool.getStats().totalWorkers;
          const targetWorkers = Math.max(1, Math.ceil(currentWorkers * 0.5));
          await this.workerPool.scaleWorkers(targetWorkers);
        }
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      console.log('[PARALLEL BUILD] Aggressive optimization completed');

    } catch (error) {
      console.error('[PARALLEL BUILD] Aggressive optimization failed:', error);
      throw error;
    }
  }

  /**
   * Set up integration between components
   */
  private setupComponentIntegration(): void {
    console.log('[PARALLEL BUILD] Setting up component integration');

    // Resource allocator events
    this.resourceAllocator.on('scaling-executed', (event) => {
      this.scalingEvents++;
      this.emit('scaling-executed', event);

      if (this.config.enablePerformanceLogging) {
        console.log(`[PARALLEL BUILD] Scaling executed: ${event.decision.action} to ${event.decision.targetWorkers} workers`);
      }
    });

    this.resourceAllocator.on('resource-contention', (event: ResourceContentionEvent) => {
      this.contentionEvents++;
      this.emit('resource-contention', event);

      if (event.severity === 'critical') {
        console.warn(`[PARALLEL BUILD] Critical resource contention: ${event.description}`);
        // Could trigger emergency optimization here
      }
    });

    this.resourceAllocator.on('scaling-recommended', (decision: ScalingDecision) => {
      this.emit('scaling-recommended', decision);

      if (this.config.enablePerformanceLogging) {
        console.log(`[PARALLEL BUILD] Scaling recommended: ${decision.action} (confidence: ${(decision.confidence * 100).toFixed(1)}%)`);
      }
    });

    // Page generator events
    this.pageGenerator.on('progress-update', (stats) => {
      this.emit('progress-update', stats);
    });

    this.pageGenerator.on('generation-completed', (event) => {
      this.emit('generation-completed', event);
    });

    // Worker pool events
    this.workerPool.on('stats-updated', (stats) => {
      this.emit('worker-stats-updated', stats);
    });

    this.workerPool.on('worker-error', (event) => {
      this.emit('worker-error', event);
    });

    console.log('[PARALLEL BUILD] Component integration setup completed');
  }

  /**
   * Analyze build complexity to optimize resource allocation
   */
  private analyzeBuildComplexity(pages: PageBuildRequest[]): {
    totalPages: number;
    highPriorityPages: number;
    dependencyComplexity: number;
    sharedResourceCount: number;
    estimatedComplexity: 'low' | 'medium' | 'high';
  } {
    const totalPages = pages.length;
    const highPriorityPages = pages.filter(p => p.priority === 'high').length;

    // Calculate dependency complexity
    const totalDependencies = pages.reduce((sum, p) => sum + p.dependencies.length, 0);
    const dependencyComplexity = totalDependencies / Math.max(1, totalPages);

    // Count unique shared resources
    const allSharedResources = new Set(pages.flatMap(p => p.sharedResources));
    const sharedResourceCount = allSharedResources.size;

    // Estimate overall complexity
    let estimatedComplexity: 'low' | 'medium' | 'high' = 'low';

    if (totalPages > 50 || dependencyComplexity > 3 || sharedResourceCount > 10) {
      estimatedComplexity = 'high';
    } else if (totalPages > 20 || dependencyComplexity > 1 || sharedResourceCount > 5) {
      estimatedComplexity = 'medium';
    }

    return {
      totalPages,
      highPriorityPages,
      dependencyComplexity,
      sharedResourceCount,
      estimatedComplexity,
    };
  }

  /**
   * Calculate optimal worker count based on build complexity and resources
   */
  private calculateOptimalWorkerCount(
    complexity: ReturnType<typeof this.analyzeBuildComplexity>,
    resourceStats: SystemResourceStats
  ): number {
    // Base worker count on available CPU cores
    let optimalWorkers = resourceStats.cpu.availableCores;

    // Adjust based on build complexity
    if (complexity.estimatedComplexity === 'high') {
      // High complexity builds benefit from more workers
      optimalWorkers = Math.min(optimalWorkers, resourceStats.cpu.cores);
    } else if (complexity.estimatedComplexity === 'low') {
      // Low complexity builds don't need many workers
      optimalWorkers = Math.min(optimalWorkers, Math.ceil(resourceStats.cpu.cores / 2));
    }

    // Adjust based on memory availability (assume 100MB per worker)
    const memoryBasedLimit = Math.floor(resourceStats.memory.available / (100 * 1024 * 1024));
    optimalWorkers = Math.min(optimalWorkers, memoryBasedLimit);

    // Adjust based on shared resource contention
    if (complexity.sharedResourceCount > optimalWorkers) {
      // Reduce workers if there are many shared resources to reduce contention
      optimalWorkers = Math.max(1, Math.ceil(optimalWorkers * 0.8));
    }

    // Ensure minimum and maximum bounds
    optimalWorkers = Math.max(1, Math.min(optimalWorkers, this.config.workerPool.maxWorkers));

    return optimalWorkers;
  }

  /**
   * Pre-warm resources for build
   */
  private async prewarmResources(pages: PageBuildRequest[]): Promise<void> {
    // This would pre-warm caches, load shared dependencies, etc.
    // For now, just a placeholder
    console.log(`[PARALLEL BUILD] Pre-warming resources for ${pages.length} pages`);

    // Simulate pre-warming time
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Log build performance report
   */
  private logBuildReport(result: ParallelBuildResult): void {
    console.log('\n=== PARALLEL BUILD REPORT ===');
    console.log(`Total Pages: ${result.totalPages}`);
    console.log(`Completed: ${result.completedPages}`);
    console.log(`Failed: ${result.failedPages}`);
    console.log(`Success Rate: ${((result.completedPages / result.totalPages) * 100).toFixed(1)}%`);
    console.log(`Total Duration: ${this.formatDuration(result.totalDuration)}`);
    console.log(`Average Page Time: ${this.formatDuration(result.averagePageTime)}`);
    console.log(`Parallel Efficiency: ${(result.parallelEfficiency * 100).toFixed(1)}%`);

    console.log('\n--- Resource Utilization ---');
    const resourceUtil = result.stats.integration.resourceUtilization;
    console.log(`Resource Utilization: ${(resourceUtil * 100).toFixed(1)}%`);
    console.log(`Scaling Events: ${result.stats.integration.scalingEvents}`);
    console.log(`Contention Events: ${result.stats.integration.contentionEvents}`);

    console.log('\n--- Worker Pool Stats ---');
    const workerStats = result.stats.workerPool;
    console.log(`Workers: ${workerStats.totalWorkers} (${workerStats.activeWorkers} active)`);
    console.log(`Throughput: ${workerStats.throughput.toFixed(2)} tasks/sec`);
    console.log(`Queue Length: ${workerStats.queueLength}`);

    if (result.errors.length > 0) {
      console.log('\n--- Errors ---');
      result.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.message}`);
      });
    }

    console.log('==============================\n');
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
}

/**
 * Get default parallel build configuration
 */
export function getDefaultParallelBuildConfig(): ParallelBuildConfig {
  return {
    workerPool: getDefaultWorkerPoolConfig(),
    pageGeneration: getDefaultPageGenerationConfig(),
    resourceAllocation: getDefaultResourceAllocationConfig(),
    enableIntegration: true,
    enablePerformanceLogging: process.env.NODE_ENV !== 'production',
  };
}

/**
 * Create parallel build processor with default configuration
 */
export function createParallelBuildProcessor(config?: Partial<ParallelBuildConfig>): BuildParallelProcessor {
  return new BuildParallelProcessor({
    ...getDefaultParallelBuildConfig(),
    ...config,
  });
}

/**
 * Singleton parallel build processor
 */
let parallelProcessor: BuildParallelProcessor | null = null;

/**
 * Get singleton parallel build processor
 */
export function getParallelBuildProcessor(): BuildParallelProcessor {
  if (!parallelProcessor) {
    parallelProcessor = createParallelBuildProcessor();
  }
  return parallelProcessor;
}

/**
 * Initialize parallel build processing for the current environment
 */
export async function initializeParallelBuildProcessing(): Promise<BuildParallelProcessor> {
  const processor = getParallelBuildProcessor();
  await processor.initialize();
  return processor;
}

/**
 * Shutdown parallel build processing
 */
export async function shutdownParallelBuildProcessing(): Promise<void> {
  if (parallelProcessor) {
    await parallelProcessor.shutdown();
    parallelProcessor = null;
  }
}