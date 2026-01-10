"use strict";
/**
 * Build Worker Script
 *
 * This script runs in worker threads to execute build tasks in parallel.
 * It handles different types of build operations including page generation,
 * asset optimization, cache operations, and data fetching.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
class BuildWorker {
    constructor(config) {
        this.tasksExecuted = 0;
        this.isShuttingDown = false;
        this.config = config;
        this.setupMessageHandlers();
        this.startHealthMonitoring();
        this.sendMessage({ type: 'worker-ready' });
    }
    /**
     * Set up message handlers for communication with main thread
     */
    setupMessageHandlers() {
        if (!worker_threads_1.parentPort) {
            throw new Error('Worker must be run in worker thread');
        }
        worker_threads_1.parentPort.on('message', async (message) => {
            try {
                await this.handleMessage(message);
            }
            catch (error) {
                console.error(`[WORKER ${this.config.workerId}] Error handling message:`, error);
                this.sendMessage({
                    type: 'task-failed',
                    taskId: message.task?.id || 'unknown',
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        });
        worker_threads_1.parentPort.on('error', (error) => {
            console.error(`[WORKER ${this.config.workerId}] Port error:`, error);
        });
    }
    /**
     * Handle messages from main thread
     */
    async handleMessage(message) {
        switch (message.type) {
            case 'execute-task':
                await this.executeTask(message.task);
                break;
            case 'health-check':
                this.handleHealthCheck();
                break;
            case 'shutdown':
                await this.shutdown();
                break;
            default:
                console.warn(`[WORKER ${this.config.workerId}] Unknown message type:`, message.type);
        }
    }
    /**
     * Execute a build task
     */
    async executeTask(task) {
        if (this.isShuttingDown) {
            throw new Error('Worker is shutting down');
        }
        this.currentTask = task;
        const startTime = Date.now();
        console.log(`[WORKER ${this.config.workerId}] Executing task ${task.id} (${task.type})`);
        try {
            let result;
            switch (task.type) {
                case 'page-build':
                    result = await this.executePageBuild(task);
                    break;
                case 'asset-optimization':
                    result = await this.executeAssetOptimization(task);
                    break;
                case 'cache-operation':
                    result = await this.executeCacheOperation(task);
                    break;
                case 'data-fetch':
                    result = await this.executeDataFetch(task);
                    break;
                default:
                    throw new Error(`Unknown task type: ${task.type}`);
            }
            const duration = Date.now() - startTime;
            this.tasksExecuted++;
            this.sendMessage({
                type: 'task-completed',
                taskId: task.id,
                result,
                duration,
            });
            console.log(`[WORKER ${this.config.workerId}] Completed task ${task.id} in ${duration}ms`);
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.sendMessage({
                type: 'task-failed',
                taskId: task.id,
                error: error instanceof Error ? error.message : 'Unknown error',
                duration,
            });
            console.error(`[WORKER ${this.config.workerId}] Task ${task.id} failed:`, error);
        }
        finally {
            this.currentTask = undefined;
            // Check if worker should be recycled
            if (this.tasksExecuted >= this.config.maxTasksPerWorker) {
                console.log(`[WORKER ${this.config.workerId}] Reached task limit, requesting replacement`);
                await this.shutdown();
            }
        }
    }
    /**
     * Execute page build task
     */
    async executePageBuild(task) {
        const { pageId, locale, route, buildData } = task.data;
        // Simulate page build process
        // In a real implementation, this would:
        // 1. Load page component and dependencies
        // 2. Fetch required data
        // 3. Render page to HTML
        // 4. Generate static assets
        // 5. Write output files
        console.log(`[WORKER ${this.config.workerId}] Building page ${pageId} for locale ${locale}`);
        // Simulate build time based on page complexity
        const buildTime = Math.random() * 2000 + 1000; // 1-3 seconds
        await this.sleep(buildTime);
        // Simulate memory usage for page build
        const tempData = new Array(1000).fill(0).map(() => ({
            id: Math.random(),
            content: 'x'.repeat(100),
        }));
        // Clean up temporary data
        tempData.length = 0;
        return {
            pageId,
            locale,
            route,
            success: true,
            buildTime,
            outputFiles: [
                `${pageId}.html`,
                `${pageId}.js`,
                `${pageId}.css`,
            ],
            metadata: {
                size: Math.floor(Math.random() * 100000) + 10000,
                dependencies: buildData?.dependencies || [],
            },
        };
    }
    /**
     * Execute asset optimization task
     */
    async executeAssetOptimization(task) {
        const { assets, optimizationLevel } = task.data;
        console.log(`[WORKER ${this.config.workerId}] Optimizing ${assets.length} assets`);
        const optimizedAssets = [];
        for (const asset of assets) {
            // Simulate asset optimization
            const optimizationTime = Math.random() * 500 + 200; // 200-700ms per asset
            await this.sleep(optimizationTime);
            const originalSize = asset.size || Math.floor(Math.random() * 50000) + 10000;
            const compressionRatio = optimizationLevel === 'high' ? 0.7 : 0.85;
            const optimizedSize = Math.floor(originalSize * compressionRatio);
            optimizedAssets.push({
                ...asset,
                originalSize,
                optimizedSize,
                compressionRatio: (originalSize - optimizedSize) / originalSize,
                optimizationTime,
            });
        }
        return {
            totalAssets: assets.length,
            optimizedAssets,
            totalOriginalSize: optimizedAssets.reduce((sum, asset) => sum + asset.originalSize, 0),
            totalOptimizedSize: optimizedAssets.reduce((sum, asset) => sum + asset.optimizedSize, 0),
            totalSavings: optimizedAssets.reduce((sum, asset) => sum + (asset.originalSize - asset.optimizedSize), 0),
        };
    }
    /**
     * Execute cache operation task
     */
    async executeCacheOperation(task) {
        const { operation, cacheKey, data, ttl } = task.data;
        console.log(`[WORKER ${this.config.workerId}] Executing cache operation: ${operation}`);
        switch (operation) {
            case 'set':
                // Simulate cache write
                await this.sleep(Math.random() * 100 + 50);
                return { success: true, operation: 'set', cacheKey, size: JSON.stringify(data).length };
            case 'get':
                // Simulate cache read
                await this.sleep(Math.random() * 50 + 25);
                return { success: true, operation: 'get', cacheKey, found: Math.random() > 0.3 };
            case 'delete':
                // Simulate cache delete
                await this.sleep(Math.random() * 75 + 25);
                return { success: true, operation: 'delete', cacheKey };
            case 'clear':
                // Simulate cache clear
                await this.sleep(Math.random() * 200 + 100);
                return { success: true, operation: 'clear', keysCleared: Math.floor(Math.random() * 100) + 10 };
            default:
                throw new Error(`Unknown cache operation: ${operation}`);
        }
    }
    /**
     * Execute data fetch task
     */
    async executeDataFetch(task) {
        const { url, options, retries = 3 } = task.data;
        console.log(`[WORKER ${this.config.workerId}] Fetching data from ${url}`);
        let lastError = null;
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                // Simulate network request
                const requestTime = Math.random() * 1000 + 500; // 500ms - 1.5s
                await this.sleep(requestTime);
                // Simulate occasional failures
                if (Math.random() < 0.1) { // 10% failure rate
                    throw new Error(`Network error (attempt ${attempt})`);
                }
                // Simulate response data
                const responseData = {
                    id: Math.random().toString(36),
                    timestamp: new Date().toISOString(),
                    data: new Array(Math.floor(Math.random() * 10) + 1).fill(0).map((_, i) => ({
                        id: i,
                        value: Math.random(),
                    })),
                };
                return {
                    url,
                    success: true,
                    attempt,
                    requestTime,
                    responseSize: JSON.stringify(responseData).length,
                    data: responseData,
                };
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');
                console.warn(`[WORKER ${this.config.workerId}] Fetch attempt ${attempt} failed:`, error);
                if (attempt < retries) {
                    // Exponential backoff
                    const backoffTime = Math.pow(2, attempt - 1) * 1000;
                    await this.sleep(backoffTime);
                }
            }
        }
        throw lastError || new Error('All fetch attempts failed');
    }
    /**
     * Handle health check request
     */
    handleHealthCheck() {
        const memoryUsage = process.memoryUsage();
        this.sendMessage({
            type: 'health-check',
            stats: {
                workerId: this.config.workerId,
                tasksExecuted: this.tasksExecuted,
                currentTask: this.currentTask?.id || null,
                memoryUsage: {
                    rss: memoryUsage.rss,
                    heapUsed: memoryUsage.heapUsed,
                    heapTotal: memoryUsage.heapTotal,
                    external: memoryUsage.external,
                },
                uptime: process.uptime(),
            },
        });
    }
    /**
     * Start health monitoring
     */
    startHealthMonitoring() {
        if (!this.config.enableHealthMonitoring) {
            return;
        }
        this.healthCheckInterval = setInterval(() => {
            // Perform internal health checks
            const memoryUsage = process.memoryUsage();
            const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
            // Warn if memory usage is high
            if (heapUsedMB > 100) { // 100MB threshold
                console.warn(`[WORKER ${this.config.workerId}] High memory usage: ${heapUsedMB.toFixed(1)}MB`);
            }
            // Force garbage collection if available and memory is high
            if (heapUsedMB > 150 && global.gc) {
                console.log(`[WORKER ${this.config.workerId}] Forcing garbage collection`);
                global.gc();
            }
        }, 30000); // Check every 30 seconds
    }
    /**
     * Shutdown the worker
     */
    async shutdown() {
        console.log(`[WORKER ${this.config.workerId}] Shutting down`);
        this.isShuttingDown = true;
        // Clear health check interval
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        // Wait for current task to complete if any
        if (this.currentTask) {
            console.log(`[WORKER ${this.config.workerId}] Waiting for current task to complete`);
            // In a real implementation, we might want to interrupt the task
            // For now, we'll let it complete naturally
        }
        // Send shutdown confirmation
        this.sendMessage({ type: 'worker-shutdown' });
        // Exit the worker
        process.exit(0);
    }
    /**
     * Send message to main thread
     */
    sendMessage(message) {
        if (worker_threads_1.parentPort) {
            worker_threads_1.parentPort.postMessage(message);
        }
    }
    /**
     * Sleep for specified milliseconds
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
// Initialize worker if running in worker thread
if (worker_threads_1.workerData && worker_threads_1.parentPort) {
    try {
        new BuildWorker(worker_threads_1.workerData.config);
    }
    catch (error) {
        console.error('Failed to initialize worker:', error);
        process.exit(1);
    }
}
else {
    console.error('Worker script must be run in worker thread with proper worker data');
    process.exit(1);
}
