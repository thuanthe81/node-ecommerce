/**
 * Build Parallel Page Generator
 *
 * Implements parallel static generation for independent pages with
 * dependency resolution, synchronization mechanisms, and resource management.
 */

import { EventEmitter } from 'events';
import { BuildWorkerPool, WorkerTask, WorkerResult, createWorkerPool } from './build-worker-pool';

export interface PageGenerationConfig {
  maxConcurrentPages: number; // 4
  dependencyResolutionEnabled: boolean; // true
  enableResourceSynchronization: boolean; // true
  pageTimeout: number; // 45 seconds
  retryAttempts: number; // 3
  enableProgressTracking: boolean; // true
}

export interface PageBuildRequest {
  pageId: string;
  locale: string;
  route: string;
  priority: 'high' | 'medium' | 'low';
  dependencies: string[]; // Other pages this page depends on
  sharedResources: string[]; // Shared resources that need synchronization
  buildData: any;
  timeout?: number;
}

export interface PageBuildResult {
  pageId: string;
  locale: string;
  route: string;
  success: boolean;
  duration: number;
  outputFiles: string[];
  metadata: {
    size: number;
    dependencies: string[];
    cacheHit: boolean;
  };
  error?: Error;
}

export interface PageGenerationStats {
  totalPages: number;
  completedPages: number;
  failedPages: number;
  averageBuildTime: number;
  parallelEfficiency: number; // Actual vs theoretical speedup
  dependencyResolutionTime: number;
  resourceContentionCount: number;
}

interface PageDependencyGraph {
  nodes: Map<string, PageBuildRequest>;
  edges: Map<string, Set<string>>; // pageId -> dependencies
  resolved: Set<string>;
  inProgress: Set<string>;
  failed: Set<string>;
}

interface ResourceLock {
  resource: string;
  holder: string;
  waiters: string[];
  acquiredAt: Date;
}

export class BuildParallelPageGenerator extends EventEmitter {
  private config: PageGenerationConfig;
  private workerPool: BuildWorkerPool;
  private dependencyGraph: PageDependencyGraph;
  private resourceLocks: Map<string, ResourceLock> = new Map();
  private buildResults: Map<string, PageBuildResult> = new Map();
  private buildTimes: number[] = [];
  private startTime = 0;
  private isGenerating = false;

  constructor(config?: Partial<PageGenerationConfig>) {
    super();

    this.config = {
      maxConcurrentPages: 4,
      dependencyResolutionEnabled: true,
      enableResourceSynchronization: true,
      pageTimeout: 45000, // 45 seconds
      retryAttempts: 3,
      enableProgressTracking: true,
      ...config,
    };

    // Initialize worker pool
    this.workerPool = createWorkerPool({
      maxWorkers: this.config.maxConcurrentPages,
      minWorkers: Math.min(2, this.config.maxConcurrentPages),
      taskTimeout: this.config.pageTimeout,
    });

    // Initialize dependency graph
    this.dependencyGraph = {
      nodes: new Map(),
      edges: new Map(),
      resolved: new Set(),
      inProgress: new Set(),
      failed: new Set(),
    };
  }

  /**
   * Initialize the parallel page generator
   */
  async initialize(): Promise<void> {
    console.log('[PARALLEL GENERATOR] Initializing parallel page generator');

    try {
      await this.workerPool.initialize();
      console.log('[PARALLEL GENERATOR] Parallel page generator initialized');
      this.emit('initialized');

    } catch (error) {
      console.error('[PARALLEL GENERATOR] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Generate multiple pages in parallel
   */
  async generatePages(pages: PageBuildRequest[]): Promise<PageBuildResult[]> {
    if (this.isGenerating) {
      throw new Error('Page generation already in progress');
    }

    console.log(`[PARALLEL GENERATOR] Starting parallel generation of ${pages.length} pages`);
    this.isGenerating = true;
    this.startTime = Date.now();

    try {
      // Build dependency graph
      this.buildDependencyGraph(pages);

      // Validate dependencies
      this.validateDependencies();

      // Generate pages with dependency resolution
      const results = await this.executeParallelGeneration();

      // Calculate final stats
      const stats = this.getGenerationStats();
      this.emit('generation-completed', { results, stats });

      console.log(`[PARALLEL GENERATOR] Completed generation in ${Date.now() - this.startTime}ms`);
      return results;

    } catch (error) {
      console.error('[PARALLEL GENERATOR] Generation failed:', error);
      this.emit('generation-failed', { error });
      throw error;

    } finally {
      this.isGenerating = false;
      this.cleanup();
    }
  }

  /**
   * Generate a single page (used internally by parallel generation)
   */
  async generateSinglePage(pageRequest: PageBuildRequest): Promise<PageBuildResult> {
    const { pageId, locale, route } = pageRequest;

    console.log(`[PARALLEL GENERATOR] Generating page ${pageId} (${locale})`);

    try {
      // Check dependencies
      if (this.config.dependencyResolutionEnabled) {
        await this.waitForDependencies(pageId);
      }

      // Acquire shared resources
      if (this.config.enableResourceSynchronization) {
        await this.acquireSharedResources(pageId, pageRequest.sharedResources);
      }

      // Mark as in progress
      this.dependencyGraph.inProgress.add(pageId);

      // Create worker task
      const task: WorkerTask = {
        id: `page_${pageId}_${Date.now()}`,
        type: 'page-build',
        data: {
          pageId,
          locale,
          route,
          buildData: pageRequest.buildData,
        },
        priority: pageRequest.priority,
        timeout: pageRequest.timeout || this.config.pageTimeout,
      };

      // Execute task
      const startTime = Date.now();
      const workerResult = await this.workerPool.submitTask(task);
      const duration = Date.now() - startTime;

      // Build result
      const result: PageBuildResult = {
        pageId,
        locale,
        route,
        success: workerResult.success,
        duration,
        outputFiles: workerResult.result?.outputFiles || [],
        metadata: {
          size: workerResult.result?.metadata?.size || 0,
          dependencies: pageRequest.dependencies,
          cacheHit: false, // Would be determined by actual build process
        },
        error: workerResult.error,
      };

      // Update tracking
      this.buildResults.set(pageId, result);
      this.buildTimes.push(duration);

      if (result.success) {
        this.dependencyGraph.resolved.add(pageId);
        console.log(`[PARALLEL GENERATOR] Successfully generated page ${pageId} in ${duration}ms`);
      } else {
        this.dependencyGraph.failed.add(pageId);
        console.error(`[PARALLEL GENERATOR] Failed to generate page ${pageId}:`, result.error);
      }

      // Release shared resources
      if (this.config.enableResourceSynchronization) {
        this.releaseSharedResources(pageId, pageRequest.sharedResources);
      }

      // Remove from in progress
      this.dependencyGraph.inProgress.delete(pageId);

      // Emit progress update
      if (this.config.enableProgressTracking) {
        this.emitProgressUpdate();
      }

      return result;

    } catch (error) {
      // Handle failure
      this.dependencyGraph.failed.add(pageId);
      this.dependencyGraph.inProgress.delete(pageId);

      const result: PageBuildResult = {
        pageId,
        locale,
        route,
        success: false,
        duration: Date.now() - Date.now(), // Will be overridden
        outputFiles: [],
        metadata: {
          size: 0,
          dependencies: pageRequest.dependencies,
          cacheHit: false,
        },
        error: error instanceof Error ? error : new Error('Unknown error'),
      };

      this.buildResults.set(pageId, result);

      // Release resources on error
      if (this.config.enableResourceSynchronization) {
        this.releaseSharedResources(pageId, pageRequest.sharedResources);
      }

      throw error;
    }
  }

  /**
   * Get current generation statistics
   */
  getGenerationStats(): PageGenerationStats {
    const totalPages = this.dependencyGraph.nodes.size;
    const completedPages = this.dependencyGraph.resolved.size;
    const failedPages = this.dependencyGraph.failed.size;

    const averageBuildTime = this.buildTimes.length > 0
      ? this.buildTimes.reduce((sum, time) => sum + time, 0) / this.buildTimes.length
      : 0;

    // Calculate parallel efficiency (actual vs theoretical speedup)
    const totalBuildTime = this.buildTimes.reduce((sum, time) => sum + time, 0);
    const actualTime = Date.now() - this.startTime;
    const theoreticalSequentialTime = totalBuildTime;
    const parallelEfficiency = theoreticalSequentialTime > 0
      ? Math.min(1, theoreticalSequentialTime / (actualTime * this.config.maxConcurrentPages))
      : 0;

    return {
      totalPages,
      completedPages,
      failedPages,
      averageBuildTime,
      parallelEfficiency,
      dependencyResolutionTime: 0, // Would be tracked in real implementation
      resourceContentionCount: this.resourceLocks.size,
    };
  }

  /**
   * Shutdown the parallel page generator
   */
  async shutdown(): Promise<void> {
    console.log('[PARALLEL GENERATOR] Shutting down parallel page generator');

    this.isGenerating = false;

    // Release all resource locks
    this.resourceLocks.clear();

    // Shutdown worker pool
    await this.workerPool.shutdown();

    console.log('[PARALLEL GENERATOR] Shutdown complete');
    this.emit('shutdown');
  }

  /**
   * Build dependency graph from page requests
   */
  private buildDependencyGraph(pages: PageBuildRequest[]): void {
    console.log('[PARALLEL GENERATOR] Building dependency graph');

    // Clear existing graph
    this.dependencyGraph.nodes.clear();
    this.dependencyGraph.edges.clear();
    this.dependencyGraph.resolved.clear();
    this.dependencyGraph.inProgress.clear();
    this.dependencyGraph.failed.clear();

    // Add nodes
    for (const page of pages) {
      this.dependencyGraph.nodes.set(page.pageId, page);
      this.dependencyGraph.edges.set(page.pageId, new Set(page.dependencies));
    }

    console.log(`[PARALLEL GENERATOR] Built dependency graph with ${pages.length} nodes`);
  }

  /**
   * Validate dependency graph for cycles and missing dependencies
   */
  private validateDependencies(): void {
    console.log('[PARALLEL GENERATOR] Validating dependencies');

    // Check for missing dependencies
    for (const [pageId, dependencies] of this.dependencyGraph.edges) {
      for (const dep of dependencies) {
        if (!this.dependencyGraph.nodes.has(dep)) {
          throw new Error(`Page ${pageId} depends on missing page ${dep}`);
        }
      }
    }

    // Check for circular dependencies using DFS
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const dependencies = this.dependencyGraph.edges.get(nodeId) || new Set();
      for (const dep of dependencies) {
        if (!visited.has(dep)) {
          if (hasCycle(dep)) {
            return true;
          }
        } else if (recursionStack.has(dep)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const nodeId of this.dependencyGraph.nodes.keys()) {
      if (!visited.has(nodeId)) {
        if (hasCycle(nodeId)) {
          throw new Error(`Circular dependency detected involving page ${nodeId}`);
        }
      }
    }

    console.log('[PARALLEL GENERATOR] Dependencies validated successfully');
  }

  /**
   * Execute parallel generation with dependency resolution
   */
  private async executeParallelGeneration(): Promise<PageBuildResult[]> {
    const results: PageBuildResult[] = [];
    const activeTasks = new Map<string, Promise<PageBuildResult>>();

    while (this.dependencyGraph.resolved.size + this.dependencyGraph.failed.size < this.dependencyGraph.nodes.size) {
      // Find pages ready to build (dependencies resolved)
      const readyPages = this.findReadyPages();

      // Start new tasks up to concurrency limit
      const availableSlots = this.config.maxConcurrentPages - activeTasks.size;
      const pagesToStart = readyPages.slice(0, availableSlots);

      for (const pageId of pagesToStart) {
        const pageRequest = this.dependencyGraph.nodes.get(pageId)!;
        const task = this.generateSinglePage(pageRequest);
        activeTasks.set(pageId, task);

        console.log(`[PARALLEL GENERATOR] Started generation of page ${pageId}`);
      }

      // Wait for at least one task to complete
      if (activeTasks.size > 0) {
        const completedPageId = await this.waitForAnyTask(activeTasks);
        const result = await activeTasks.get(completedPageId)!;
        results.push(result);
        activeTasks.delete(completedPageId);
      }

      // Prevent infinite loop if no progress can be made
      if (readyPages.length === 0 && activeTasks.size === 0) {
        const remainingPages = Array.from(this.dependencyGraph.nodes.keys())
          .filter(id => !this.dependencyGraph.resolved.has(id) && !this.dependencyGraph.failed.has(id));

        if (remainingPages.length > 0) {
          throw new Error(`Cannot make progress on remaining pages: ${remainingPages.join(', ')}`);
        }
        break;
      }
    }

    // Wait for all remaining tasks to complete
    const remainingResults = await Promise.allSettled(Array.from(activeTasks.values()));
    for (const result of remainingResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      }
    }

    return results;
  }

  /**
   * Find pages that are ready to build (all dependencies resolved)
   */
  private findReadyPages(): string[] {
    const readyPages: string[] = [];

    for (const [pageId, dependencies] of this.dependencyGraph.edges) {
      // Skip if already processed or in progress
      if (this.dependencyGraph.resolved.has(pageId) ||
          this.dependencyGraph.failed.has(pageId) ||
          this.dependencyGraph.inProgress.has(pageId)) {
        continue;
      }

      // Check if all dependencies are resolved
      const allDependenciesResolved = Array.from(dependencies).every(dep =>
        this.dependencyGraph.resolved.has(dep)
      );

      if (allDependenciesResolved) {
        readyPages.push(pageId);
      }
    }

    // Sort by priority
    readyPages.sort((a, b) => {
      const pageA = this.dependencyGraph.nodes.get(a)!;
      const pageB = this.dependencyGraph.nodes.get(b)!;
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[pageA.priority] - priorityOrder[pageB.priority];
    });

    return readyPages;
  }

  /**
   * Wait for any task to complete
   */
  private async waitForAnyTask(activeTasks: Map<string, Promise<PageBuildResult>>): Promise<string> {
    const taskEntries = Array.from(activeTasks.entries());
    const promises = taskEntries.map(([pageId, promise]) =>
      promise.then(() => pageId).catch(() => pageId)
    );

    return Promise.race(promises);
  }

  /**
   * Wait for page dependencies to be resolved
   */
  private async waitForDependencies(pageId: string): Promise<void> {
    const dependencies = this.dependencyGraph.edges.get(pageId) || new Set();

    if (dependencies.size === 0) {
      return;
    }

    console.log(`[PARALLEL GENERATOR] Waiting for dependencies of page ${pageId}: ${Array.from(dependencies).join(', ')}`);

    // Poll for dependency resolution
    while (true) {
      const unresolvedDeps = Array.from(dependencies).filter(dep =>
        !this.dependencyGraph.resolved.has(dep)
      );

      if (unresolvedDeps.length === 0) {
        break;
      }

      // Check for failed dependencies
      const failedDeps = Array.from(dependencies).filter(dep =>
        this.dependencyGraph.failed.has(dep)
      );

      if (failedDeps.length > 0) {
        throw new Error(`Dependencies failed for page ${pageId}: ${failedDeps.join(', ')}`);
      }

      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`[PARALLEL GENERATOR] All dependencies resolved for page ${pageId}`);
  }

  /**
   * Acquire shared resources with locking
   */
  private async acquireSharedResources(pageId: string, resources: string[]): Promise<void> {
    if (resources.length === 0) {
      return;
    }

    console.log(`[PARALLEL GENERATOR] Acquiring shared resources for page ${pageId}: ${resources.join(', ')}`);

    for (const resource of resources) {
      await this.acquireResourceLock(pageId, resource);
    }
  }

  /**
   * Acquire a single resource lock
   */
  private async acquireResourceLock(pageId: string, resource: string): Promise<void> {
    while (true) {
      const existingLock = this.resourceLocks.get(resource);

      if (!existingLock) {
        // Resource is available, acquire it
        this.resourceLocks.set(resource, {
          resource,
          holder: pageId,
          waiters: [],
          acquiredAt: new Date(),
        });
        console.log(`[PARALLEL GENERATOR] Acquired resource lock ${resource} for page ${pageId}`);
        return;
      }

      if (existingLock.holder === pageId) {
        // Already own this lock
        return;
      }

      // Add to waiters if not already waiting
      if (!existingLock.waiters.includes(pageId)) {
        existingLock.waiters.push(pageId);
      }

      // Wait for resource to become available
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  /**
   * Release shared resources
   */
  private releaseSharedResources(pageId: string, resources: string[]): void {
    if (resources.length === 0) {
      return;
    }

    console.log(`[PARALLEL GENERATOR] Releasing shared resources for page ${pageId}: ${resources.join(', ')}`);

    for (const resource of resources) {
      this.releaseResourceLock(pageId, resource);
    }
  }

  /**
   * Release a single resource lock
   */
  private releaseResourceLock(pageId: string, resource: string): void {
    const lock = this.resourceLocks.get(resource);

    if (!lock || lock.holder !== pageId) {
      return;
    }

    if (lock.waiters.length > 0) {
      // Transfer lock to next waiter
      const nextHolder = lock.waiters.shift()!;
      lock.holder = nextHolder;
      lock.acquiredAt = new Date();
      console.log(`[PARALLEL GENERATOR] Transferred resource lock ${resource} from ${pageId} to ${nextHolder}`);
    } else {
      // No waiters, release the lock
      this.resourceLocks.delete(resource);
      console.log(`[PARALLEL GENERATOR] Released resource lock ${resource} from page ${pageId}`);
    }
  }

  /**
   * Emit progress update
   */
  private emitProgressUpdate(): void {
    const stats = this.getGenerationStats();
    this.emit('progress-update', stats);
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    this.buildResults.clear();
    this.buildTimes.length = 0;
    this.resourceLocks.clear();
  }
}

/**
 * Get default page generation configuration
 */
export function getDefaultPageGenerationConfig(): PageGenerationConfig {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    maxConcurrentPages: 4,
    dependencyResolutionEnabled: true,
    enableResourceSynchronization: true,
    pageTimeout: isDevelopment ? 60000 : 45000, // 60s dev, 45s prod
    retryAttempts: 3,
    enableProgressTracking: true,
  };
}

/**
 * Create parallel page generator with default configuration
 */
export function createParallelPageGenerator(config?: Partial<PageGenerationConfig>): BuildParallelPageGenerator {
  return new BuildParallelPageGenerator({
    ...getDefaultPageGenerationConfig(),
    ...config,
  });
}