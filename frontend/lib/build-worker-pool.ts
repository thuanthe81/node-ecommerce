/**
 * Build Worker Pool System
 *
 * Implements configurable worker pool for parallel build processing
 * with task distribution, load balancing, and worker health monitoring.
 */

import { EventEmitter } from 'events';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import * as os from 'os';
import * as path from 'path';

export interface WorkerPoolConfig {
  maxWorkers: number; // CPU cores - 1
  minWorkers: number; // 1
  taskTimeout: number; // 30 seconds
  workerTimeout: number; // 60 seconds
  maxTasksPerWorker: number; // 100
  enableHealthMonitoring: boolean;
  enableLoadBalancing: boolean;
  workerScript?: string;
}

export interface WorkerTask {
  id: string;
  type: 'page-build' | 'asset-optimization' | 'cache-operation' | 'data-fetch';
  data: any;
  priority: 'high' | 'medium' | 'low';
  timeout?: number;
  retries?: number;
}

export interface WorkerResult {
  taskId: string;
  success: boolean;
  result?: any;
  error?: Error;
  duration: number;
  workerId: string;
}

export interface WorkerStats {
  id: string;
  status: 'idle' | 'busy' | 'error' | 'terminated';
  tasksCompleted: number;
  tasksInProgress: number;
  averageTaskTime: number;
  memoryUsage: number;
  cpuUsage: number;
  lastActivity: Date;
  errors: number;
}

export interface WorkerPoolStats {
  totalWorkers: number;
  activeWorkers: number;
  idleWorkers: number;
  totalTasksCompleted: number;
  totalTasksFailed: number;
  averageTaskTime: number;
  queueLength: number;
  throughput: number; // tasks per second
  workers: WorkerStats[];
}

interface WorkerInstance {
  id: string;
  worker: Worker;
  status: 'idle' | 'busy' | 'error' | 'terminated';
  currentTask?: WorkerTask;
  tasksCompleted: number;
  startTime: Date;
  lastActivity: Date;
  errors: number;
  taskTimes: number[];
}

export class BuildWorkerPool extends EventEmitter {
  private config: WorkerPoolConfig;
  private workers: Map<string, WorkerInstance> = new Map();
  private taskQueue: WorkerTask[] = [];
  private pendingTasks: Map<string, {
    task: WorkerTask;
    resolve: (result: WorkerResult) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }> = new Map();
  private isShuttingDown = false;
  private healthCheckInterval?: NodeJS.Timeout;
  private statsInterval?: NodeJS.Timeout;
  private startTime = Date.now();
  private totalTasksCompleted = 0;
  private totalTasksFailed = 0;

  constructor(config?: Partial<WorkerPoolConfig>) {
    super();

    this.config = {
      maxWorkers: Math.max(1, os.cpus().length - 1),
      minWorkers: 1,
      taskTimeout: 30000, // 30 seconds
      workerTimeout: 60000, // 60 seconds
      maxTasksPerWorker: 100,
      enableHealthMonitoring: true,
      enableLoadBalancing: true,
      workerScript: path.join(__dirname, 'build-worker-script.js'),
      ...config,
    };

    // Ensure we don't exceed system capabilities
    this.config.maxWorkers = Math.min(this.config.maxWorkers, os.cpus().length);
    this.config.minWorkers = Math.min(this.config.minWorkers, this.config.maxWorkers);
  }

  /**
   * Initialize the worker pool
   */
  async initialize(): Promise<void> {
    if (!isMainThread) {
      throw new Error('Worker pool can only be initialized in the main thread');
    }

    console.log(`[WORKER POOL] Initializing with ${this.config.maxWorkers} max workers`);

    try {
      // Create initial workers
      for (let i = 0; i < this.config.minWorkers; i++) {
        await this.createWorker();
      }

      // Start health monitoring
      if (this.config.enableHealthMonitoring) {
        this.startHealthMonitoring();
      }

      // Start stats collection
      this.startStatsCollection();

      console.log(`[WORKER POOL] Initialized with ${this.workers.size} workers`);
      this.emit('initialized', { workerCount: this.workers.size });

    } catch (error) {
      console.error('[WORKER POOL] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Submit a task to the worker pool
   */
  async submitTask(task: WorkerTask): Promise<WorkerResult> {
    if (this.isShuttingDown) {
      throw new Error('Worker pool is shutting down');
    }

    return new Promise((resolve, reject) => {
      // Set up timeout
      const timeout = setTimeout(() => {
        this.pendingTasks.delete(task.id);
        reject(new Error(`Task ${task.id} timed out after ${task.timeout || this.config.taskTimeout}ms`));
      }, task.timeout || this.config.taskTimeout);

      // Store pending task
      this.pendingTasks.set(task.id, {
        task,
        resolve,
        reject,
        timeout,
      });

      // Add to queue
      this.taskQueue.push(task);

      // Sort queue by priority
      this.sortTaskQueue();

      // Process queue
      this.processTaskQueue();
    });
  }

  /**
   * Submit multiple tasks in batch
   */
  async submitBatch(tasks: WorkerTask[]): Promise<WorkerResult[]> {
    const promises = tasks.map(task => this.submitTask(task));
    return Promise.all(promises);
  }

  /**
   * Get current worker pool statistics
   */
  getStats(): WorkerPoolStats {
    const workers = Array.from(this.workers.values());
    const activeWorkers = workers.filter(w => w.status === 'busy').length;
    const idleWorkers = workers.filter(w => w.status === 'idle').length;

    // Calculate average task time
    const allTaskTimes = workers.flatMap(w => w.taskTimes);
    const averageTaskTime = allTaskTimes.length > 0
      ? allTaskTimes.reduce((sum, time) => sum + time, 0) / allTaskTimes.length
      : 0;

    // Calculate throughput (tasks per second)
    const uptime = (Date.now() - this.startTime) / 1000;
    const throughput = uptime > 0 ? this.totalTasksCompleted / uptime : 0;

    return {
      totalWorkers: this.workers.size,
      activeWorkers,
      idleWorkers,
      totalTasksCompleted: this.totalTasksCompleted,
      totalTasksFailed: this.totalTasksFailed,
      averageTaskTime,
      queueLength: this.taskQueue.length,
      throughput,
      workers: workers.map(w => this.getWorkerStats(w)),
    };
  }

  /**
   * Scale worker pool up or down
   */
  async scaleWorkers(targetCount: number): Promise<void> {
    targetCount = Math.max(this.config.minWorkers, Math.min(targetCount, this.config.maxWorkers));
    const currentCount = this.workers.size;

    if (targetCount > currentCount) {
      // Scale up
      const workersToAdd = targetCount - currentCount;
      console.log(`[WORKER POOL] Scaling up by ${workersToAdd} workers`);

      for (let i = 0; i < workersToAdd; i++) {
        await this.createWorker();
      }
    } else if (targetCount < currentCount) {
      // Scale down
      const workersToRemove = currentCount - targetCount;
      console.log(`[WORKER POOL] Scaling down by ${workersToRemove} workers`);

      const idleWorkers = Array.from(this.workers.values())
        .filter(w => w.status === 'idle')
        .slice(0, workersToRemove);

      for (const worker of idleWorkers) {
        await this.terminateWorker(worker.id);
      }
    }

    this.emit('scaled', {
      previousCount: currentCount,
      newCount: this.workers.size,
      targetCount
    });
  }

  /**
   * Shutdown the worker pool
   */
  async shutdown(): Promise<void> {
    console.log('[WORKER POOL] Shutting down worker pool');
    this.isShuttingDown = true;

    // Clear intervals
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }

    // Reject all pending tasks
    for (const [taskId, pending] of this.pendingTasks) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Worker pool shutting down'));
    }
    this.pendingTasks.clear();

    // Terminate all workers
    const terminationPromises = Array.from(this.workers.keys()).map(workerId =>
      this.terminateWorker(workerId)
    );

    await Promise.all(terminationPromises);

    console.log('[WORKER POOL] Shutdown complete');
    this.emit('shutdown');
  }

  /**
   * Create a new worker
   */
  private async createWorker(): Promise<string> {
    const workerId = `worker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const worker = new Worker(this.config.workerScript!, {
        workerData: {
          workerId,
          config: this.config,
        },
      });

      const workerInstance: WorkerInstance = {
        id: workerId,
        worker,
        status: 'idle',
        tasksCompleted: 0,
        startTime: new Date(),
        lastActivity: new Date(),
        errors: 0,
        taskTimes: [],
      };

      // Set up worker event handlers
      this.setupWorkerEventHandlers(workerInstance);

      this.workers.set(workerId, workerInstance);

      console.log(`[WORKER POOL] Created worker ${workerId}`);
      this.emit('worker-created', { workerId });

      return workerId;

    } catch (error) {
      console.error(`[WORKER POOL] Failed to create worker ${workerId}:`, error);
      throw error;
    }
  }

  /**
   * Set up event handlers for a worker
   */
  private setupWorkerEventHandlers(workerInstance: WorkerInstance): void {
    const { worker, id: workerId } = workerInstance;

    worker.on('message', (message) => {
      this.handleWorkerMessage(workerId, message);
    });

    worker.on('error', (error) => {
      console.error(`[WORKER POOL] Worker ${workerId} error:`, error);
      workerInstance.status = 'error';
      workerInstance.errors++;
      this.emit('worker-error', { workerId, error });

      // Restart worker if it's not shutting down
      if (!this.isShuttingDown) {
        this.restartWorker(workerId);
      }
    });

    worker.on('exit', (code) => {
      console.log(`[WORKER POOL] Worker ${workerId} exited with code ${code}`);
      this.workers.delete(workerId);
      this.emit('worker-exited', { workerId, code });

      // Create replacement worker if needed
      if (!this.isShuttingDown && this.workers.size < this.config.minWorkers) {
        this.createWorker().catch(error => {
          console.error('[WORKER POOL] Failed to create replacement worker:', error);
        });
      }
    });
  }

  /**
   * Handle message from worker
   */
  private handleWorkerMessage(workerId: string, message: any): void {
    const workerInstance = this.workers.get(workerId);
    if (!workerInstance) {
      return;
    }

    workerInstance.lastActivity = new Date();

    switch (message.type) {
      case 'task-completed':
        this.handleTaskCompleted(workerId, message);
        break;

      case 'task-failed':
        this.handleTaskFailed(workerId, message);
        break;

      case 'worker-ready':
        workerInstance.status = 'idle';
        this.processTaskQueue();
        break;

      case 'health-check':
        // Update worker health stats
        if (message.stats) {
          // Store health stats for monitoring
        }
        break;

      default:
        console.warn(`[WORKER POOL] Unknown message type from worker ${workerId}:`, message.type);
    }
  }

  /**
   * Handle task completion
   */
  private handleTaskCompleted(workerId: string, message: any): void {
    const workerInstance = this.workers.get(workerId);
    const pending = this.pendingTasks.get(message.taskId);

    if (!workerInstance || !pending) {
      return;
    }

    // Update worker stats
    workerInstance.status = 'idle';
    workerInstance.tasksCompleted++;
    workerInstance.currentTask = undefined;

    const taskTime = message.duration || 0;
    workerInstance.taskTimes.push(taskTime);

    // Keep only last 100 task times for average calculation
    if (workerInstance.taskTimes.length > 100) {
      workerInstance.taskTimes = workerInstance.taskTimes.slice(-100);
    }

    // Update global stats
    this.totalTasksCompleted++;

    // Clear timeout and resolve promise
    clearTimeout(pending.timeout);
    this.pendingTasks.delete(message.taskId);

    const result: WorkerResult = {
      taskId: message.taskId,
      success: true,
      result: message.result,
      duration: taskTime,
      workerId,
    };

    pending.resolve(result);

    // Process next task
    this.processTaskQueue();

    this.emit('task-completed', result);
  }

  /**
   * Handle task failure
   */
  private handleTaskFailed(workerId: string, message: any): void {
    const workerInstance = this.workers.get(workerId);
    const pending = this.pendingTasks.get(message.taskId);

    if (!workerInstance || !pending) {
      return;
    }

    // Update worker stats
    workerInstance.status = 'idle';
    workerInstance.errors++;
    workerInstance.currentTask = undefined;

    // Update global stats
    this.totalTasksFailed++;

    // Clear timeout and reject promise
    clearTimeout(pending.timeout);
    this.pendingTasks.delete(message.taskId);

    const error = new Error(message.error || 'Task failed');
    const result: WorkerResult = {
      taskId: message.taskId,
      success: false,
      error,
      duration: message.duration || 0,
      workerId,
    };

    pending.reject(error);

    // Process next task
    this.processTaskQueue();

    this.emit('task-failed', result);
  }

  /**
   * Process the task queue
   */
  private processTaskQueue(): void {
    if (this.taskQueue.length === 0 || this.isShuttingDown) {
      return;
    }

    // Find available workers
    const availableWorkers = Array.from(this.workers.values())
      .filter(w => w.status === 'idle');

    if (availableWorkers.length === 0) {
      // Try to scale up if possible
      if (this.workers.size < this.config.maxWorkers) {
        this.createWorker().catch(error => {
          console.error('[WORKER POOL] Failed to create worker for queue processing:', error);
        });
      }
      return;
    }

    // Assign tasks to workers
    const tasksToAssign = Math.min(this.taskQueue.length, availableWorkers.length);

    for (let i = 0; i < tasksToAssign; i++) {
      const task = this.taskQueue.shift()!;
      const worker = this.selectWorkerForTask(availableWorkers, task);

      if (worker) {
        this.assignTaskToWorker(worker, task);
        // Remove assigned worker from available list
        const index = availableWorkers.indexOf(worker);
        if (index > -1) {
          availableWorkers.splice(index, 1);
        }
      } else {
        // Put task back in queue
        this.taskQueue.unshift(task);
        break;
      }
    }
  }

  /**
   * Select the best worker for a task (load balancing)
   */
  private selectWorkerForTask(availableWorkers: WorkerInstance[], task: WorkerTask): WorkerInstance | null {
    if (availableWorkers.length === 0) {
      return null;
    }

    if (!this.config.enableLoadBalancing) {
      return availableWorkers[0];
    }

    // Load balancing strategy: select worker with least completed tasks
    return availableWorkers.reduce((best, current) => {
      if (current.tasksCompleted < best.tasksCompleted) {
        return current;
      }
      if (current.tasksCompleted === best.tasksCompleted) {
        // If equal, prefer worker with better average time
        const currentAvg = current.taskTimes.length > 0
          ? current.taskTimes.reduce((sum, time) => sum + time, 0) / current.taskTimes.length
          : 0;
        const bestAvg = best.taskTimes.length > 0
          ? best.taskTimes.reduce((sum, time) => sum + time, 0) / best.taskTimes.length
          : 0;
        return currentAvg < bestAvg ? current : best;
      }
      return best;
    });
  }

  /**
   * Assign a task to a worker
   */
  private assignTaskToWorker(workerInstance: WorkerInstance, task: WorkerTask): void {
    workerInstance.status = 'busy';
    workerInstance.currentTask = task;
    workerInstance.lastActivity = new Date();

    // Send task to worker
    workerInstance.worker.postMessage({
      type: 'execute-task',
      task,
    });

    console.log(`[WORKER POOL] Assigned task ${task.id} to worker ${workerInstance.id}`);
  }

  /**
   * Sort task queue by priority
   */
  private sortTaskQueue(): void {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    this.taskQueue.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }

  /**
   * Terminate a worker
   */
  private async terminateWorker(workerId: string): Promise<void> {
    const workerInstance = this.workers.get(workerId);
    if (!workerInstance) {
      return;
    }

    console.log(`[WORKER POOL] Terminating worker ${workerId}`);

    try {
      // If worker has a current task, fail it
      if (workerInstance.currentTask) {
        const pending = this.pendingTasks.get(workerInstance.currentTask.id);
        if (pending) {
          clearTimeout(pending.timeout);
          this.pendingTasks.delete(workerInstance.currentTask.id);
          pending.reject(new Error('Worker terminated'));
        }
      }

      workerInstance.status = 'terminated';
      await workerInstance.worker.terminate();
      this.workers.delete(workerId);

      this.emit('worker-terminated', { workerId });

    } catch (error) {
      console.error(`[WORKER POOL] Error terminating worker ${workerId}:`, error);
    }
  }

  /**
   * Restart a worker
   */
  private async restartWorker(workerId: string): Promise<void> {
    console.log(`[WORKER POOL] Restarting worker ${workerId}`);

    await this.terminateWorker(workerId);

    // Create replacement worker
    try {
      await this.createWorker();
    } catch (error) {
      console.error('[WORKER POOL] Failed to restart worker:', error);
    }
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Perform health check on all workers
   */
  private performHealthCheck(): void {
    const now = new Date();

    for (const [workerId, workerInstance] of this.workers) {
      // Check for stuck workers
      const timeSinceLastActivity = now.getTime() - workerInstance.lastActivity.getTime();

      if (timeSinceLastActivity > this.config.workerTimeout) {
        console.warn(`[WORKER POOL] Worker ${workerId} appears stuck, restarting`);
        this.restartWorker(workerId);
        continue;
      }

      // Check if worker needs replacement due to too many tasks
      if (workerInstance.tasksCompleted >= this.config.maxTasksPerWorker) {
        console.log(`[WORKER POOL] Worker ${workerId} reached task limit, replacing`);
        this.restartWorker(workerId);
        continue;
      }

      // Send health check message
      try {
        workerInstance.worker.postMessage({ type: 'health-check' });
      } catch (error) {
        console.error(`[WORKER POOL] Failed to send health check to worker ${workerId}:`, error);
        this.restartWorker(workerId);
      }
    }
  }

  /**
   * Start stats collection
   */
  private startStatsCollection(): void {
    this.statsInterval = setInterval(() => {
      const stats = this.getStats();
      this.emit('stats-updated', stats);

      // Auto-scaling based on queue length and worker utilization
      if (this.config.enableLoadBalancing) {
        this.performAutoScaling(stats);
      }
    }, 10000); // Update every 10 seconds
  }

  /**
   * Perform auto-scaling based on current stats
   */
  private performAutoScaling(stats: WorkerPoolStats): void {
    const queueRatio = stats.queueLength / Math.max(1, stats.totalWorkers);
    const utilizationRatio = stats.activeWorkers / Math.max(1, stats.totalWorkers);

    // Scale up if queue is backing up or utilization is high
    if ((queueRatio > 2 || utilizationRatio > 0.8) && stats.totalWorkers < this.config.maxWorkers) {
      const targetWorkers = Math.min(
        this.config.maxWorkers,
        stats.totalWorkers + Math.ceil(queueRatio / 2)
      );
      this.scaleWorkers(targetWorkers).catch(error => {
        console.error('[WORKER POOL] Auto-scaling up failed:', error);
      });
    }
    // Scale down if utilization is low and we have more than minimum workers
    else if (utilizationRatio < 0.3 && stats.totalWorkers > this.config.minWorkers && stats.queueLength === 0) {
      const targetWorkers = Math.max(
        this.config.minWorkers,
        Math.ceil(stats.totalWorkers * 0.7)
      );
      this.scaleWorkers(targetWorkers).catch(error => {
        console.error('[WORKER POOL] Auto-scaling down failed:', error);
      });
    }
  }

  /**
   * Get stats for a specific worker
   */
  private getWorkerStats(workerInstance: WorkerInstance): WorkerStats {
    const averageTaskTime = workerInstance.taskTimes.length > 0
      ? workerInstance.taskTimes.reduce((sum, time) => sum + time, 0) / workerInstance.taskTimes.length
      : 0;

    return {
      id: workerInstance.id,
      status: workerInstance.status,
      tasksCompleted: workerInstance.tasksCompleted,
      tasksInProgress: workerInstance.currentTask ? 1 : 0,
      averageTaskTime,
      memoryUsage: 0, // Would be populated from worker health checks
      cpuUsage: 0, // Would be populated from worker health checks
      lastActivity: workerInstance.lastActivity,
      errors: workerInstance.errors,
    };
  }
}

/**
 * Get default worker pool configuration
 */
export function getDefaultWorkerPoolConfig(): WorkerPoolConfig {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    maxWorkers: Math.max(1, os.cpus().length - 1),
    minWorkers: 1,
    taskTimeout: isDevelopment ? 60000 : 30000, // 60s dev, 30s prod
    workerTimeout: isDevelopment ? 120000 : 60000, // 2min dev, 1min prod
    maxTasksPerWorker: 100,
    enableHealthMonitoring: true,
    enableLoadBalancing: true,
    workerScript: path.join(__dirname, 'build-worker-script.js'),
  };
}

/**
 * Create worker pool with default configuration
 */
export function createWorkerPool(config?: Partial<WorkerPoolConfig>): BuildWorkerPool {
  return new BuildWorkerPool({
    ...getDefaultWorkerPoolConfig(),
    ...config,
  });
}