/**
 * Connection Pool for Build-time API Calls
 *
 * This module provides connection pooling functionality to optimize
 * multiple API requests during build time by reusing connections
 * and implementing request queuing with load balancing.
 */

export interface ConnectionPoolConfig {
  maxConnections: number; // Maximum number of concurrent connections
  maxQueueSize: number; // Maximum number of queued requests
  connectionTimeout: number; // Timeout for individual connections (ms)
  idleTimeout: number; // Timeout for idle connections (ms)
  healthCheckInterval: number; // Health check interval (ms)
  retryAttempts: number; // Number of retry attempts for failed connections
}

export interface ConnectionMetrics {
  activeConnections: number;
  queuedRequests: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  connectionErrors: number;
  lastHealthCheck: Date;
}

export interface QueuedRequest<T> {
  id: string;
  url: string;
  options: RequestInit;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  timestamp: Date;
  priority: 'high' | 'medium' | 'low';
  retryCount: number;
}

export interface ConnectionHealth {
  isHealthy: boolean;
  lastUsed: Date;
  responseTime: number;
  errorCount: number;
}

// Default configuration
const DEFAULT_CONFIG: ConnectionPoolConfig = {
  maxConnections: parseInt(process.env.BUILD_MAX_CONNECTIONS || '5', 10),
  maxQueueSize: parseInt(process.env.BUILD_MAX_QUEUE_SIZE || '50', 10),
  connectionTimeout: parseInt(process.env.BUILD_CONNECTION_TIMEOUT || '10000', 10),
  idleTimeout: parseInt(process.env.BUILD_IDLE_TIMEOUT || '30000', 10),
  healthCheckInterval: parseInt(process.env.BUILD_HEALTH_CHECK_INTERVAL || '60000', 10),
  retryAttempts: parseInt(process.env.BUILD_RETRY_ATTEMPTS || '3', 10),
};

/**
 * Connection Pool Manager for Build-time Operations
 */
export class BuildConnectionPool {
  private config: ConnectionPoolConfig;
  private activeConnections: Set<string> = new Set();
  private requestQueue: QueuedRequest<any>[] = [];
  private connectionHealth: Map<string, ConnectionHealth> = new Map();
  private metrics: ConnectionMetrics;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private requestIdCounter = 0;

  constructor(config: Partial<ConnectionPoolConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.metrics = {
      activeConnections: 0,
      queuedRequests: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      connectionErrors: 0,
      lastHealthCheck: new Date(),
    };

    this.startHealthChecking();
  }

  /**
   * Makes a request through the connection pool
   */
  async request<T>(
    url: string,
    options: RequestInit = {},
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const requestId = this.generateRequestId();
      const queuedRequest: QueuedRequest<T> = {
        id: requestId,
        url,
        options,
        resolve,
        reject,
        timestamp: new Date(),
        priority,
        retryCount: 0,
      };

      this.metrics.totalRequests++;

      // Check if we can process immediately
      if (this.activeConnections.size < this.config.maxConnections) {
        this.processRequest(queuedRequest);
      } else {
        // Add to queue
        this.enqueueRequest(queuedRequest);
      }
    });
  }

  /**
   * Processes a request immediately
   */
  private async processRequest<T>(request: QueuedRequest<T>): Promise<void> {
    const connectionId = this.generateConnectionId();
    this.activeConnections.add(connectionId);
    this.metrics.activeConnections = this.activeConnections.size;

    const startTime = Date.now();

    try {
      console.log(`[CONNECTION POOL] Processing request ${request.id} on connection ${connectionId}`);

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, this.config.connectionTimeout);

      try {
        const response = await fetch(request.url, {
          ...request.options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        const responseTime = Date.now() - startTime;

        // Update connection health
        this.updateConnectionHealth(connectionId, true, responseTime);

        // Update metrics
        this.metrics.successfulRequests++;
        this.updateAverageResponseTime(responseTime);

        console.log(`[CONNECTION POOL] Request ${request.id} completed in ${responseTime}ms`);
        request.resolve(result);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateConnectionHealth(connectionId, false, responseTime);
      this.metrics.failedRequests++;
      this.metrics.connectionErrors++;

      console.error(`[CONNECTION POOL] Request ${request.id} failed:`, error);

      // Retry logic
      if (request.retryCount < this.config.retryAttempts) {
        request.retryCount++;
        console.log(`[CONNECTION POOL] Retrying request ${request.id} (attempt ${request.retryCount})`);

        // Add back to queue with higher priority
        request.priority = 'high';
        this.enqueueRequest(request);
      } else {
        request.reject(error as Error);
      }
    } finally {
      // Release connection
      this.activeConnections.delete(connectionId);
      this.metrics.activeConnections = this.activeConnections.size;

      // Process next queued request
      this.processNextInQueue();
    }
  }

  /**
   * Adds a request to the queue with priority ordering
   */
  private enqueueRequest<T>(request: QueuedRequest<T>): void {
    if (this.requestQueue.length >= this.config.maxQueueSize) {
      const error = new Error(`Request queue is full (${this.config.maxQueueSize} requests)`);
      console.error(`[CONNECTION POOL] Queue full, rejecting request ${request.id}`);
      request.reject(error);
      return;
    }

    // Insert request based on priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const insertIndex = this.requestQueue.findIndex(
      queuedReq => priorityOrder[queuedReq.priority] > priorityOrder[request.priority]
    );

    if (insertIndex === -1) {
      this.requestQueue.push(request);
    } else {
      this.requestQueue.splice(insertIndex, 0, request);
    }

    this.metrics.queuedRequests = this.requestQueue.length;
    console.log(`[CONNECTION POOL] Queued request ${request.id} (priority: ${request.priority}, queue size: ${this.requestQueue.length})`);
  }

  /**
   * Processes the next request in the queue
   */
  private processNextInQueue(): void {
    if (this.requestQueue.length > 0 && this.activeConnections.size < this.config.maxConnections) {
      const nextRequest = this.requestQueue.shift();
      if (nextRequest) {
        this.metrics.queuedRequests = this.requestQueue.length;
        this.processRequest(nextRequest);
      }
    }
  }

  /**
   * Updates connection health metrics
   */
  private updateConnectionHealth(connectionId: string, success: boolean, responseTime: number): void {
    const health = this.connectionHealth.get(connectionId) || {
      isHealthy: true,
      lastUsed: new Date(),
      responseTime: 0,
      errorCount: 0,
    };

    health.lastUsed = new Date();
    health.responseTime = responseTime;

    if (success) {
      health.errorCount = Math.max(0, health.errorCount - 1); // Reduce error count on success
      health.isHealthy = health.errorCount < 3; // Healthy if less than 3 consecutive errors
    } else {
      health.errorCount++;
      health.isHealthy = health.errorCount < 3;
    }

    this.connectionHealth.set(connectionId, health);
  }

  /**
   * Updates average response time metric
   */
  private updateAverageResponseTime(responseTime: number): void {
    const totalSuccessful = this.metrics.successfulRequests;
    const currentAverage = this.metrics.averageResponseTime;

    // Calculate running average
    this.metrics.averageResponseTime =
      ((currentAverage * (totalSuccessful - 1)) + responseTime) / totalSuccessful;
  }

  /**
   * Starts periodic health checking
   */
  private startHealthChecking(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  /**
   * Performs health check on connections
   */
  private performHealthCheck(): void {
    const now = new Date();
    const idleThreshold = now.getTime() - this.config.idleTimeout;

    // Clean up idle connections
    for (const [connectionId, health] of this.connectionHealth.entries()) {
      if (health.lastUsed.getTime() < idleThreshold) {
        this.connectionHealth.delete(connectionId);
        console.log(`[CONNECTION POOL] Cleaned up idle connection ${connectionId}`);
      }
    }

    this.metrics.lastHealthCheck = now;

    // Log health status
    const healthyConnections = Array.from(this.connectionHealth.values()).filter(h => h.isHealthy).length;
    const totalConnections = this.connectionHealth.size;

    console.log(`[CONNECTION POOL] Health check: ${healthyConnections}/${totalConnections} healthy connections, ${this.requestQueue.length} queued requests`);
  }

  /**
   * Gets current pool metrics
   */
  getMetrics(): ConnectionMetrics {
    return { ...this.metrics };
  }

  /**
   * Gets detailed connection health information
   */
  getConnectionHealth(): Map<string, ConnectionHealth> {
    return new Map(this.connectionHealth);
  }

  /**
   * Clears the request queue (useful for testing or emergency situations)
   */
  clearQueue(): void {
    const queuedCount = this.requestQueue.length;

    // Reject all queued requests
    this.requestQueue.forEach(request => {
      request.reject(new Error('Request queue cleared'));
    });

    this.requestQueue = [];
    this.metrics.queuedRequests = 0;

    console.log(`[CONNECTION POOL] Cleared ${queuedCount} queued requests`);
  }

  /**
   * Shuts down the connection pool
   */
  shutdown(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    this.clearQueue();
    this.connectionHealth.clear();
    this.activeConnections.clear();

    console.log('[CONNECTION POOL] Connection pool shut down');
  }

  /**
   * Generates unique request ID
   */
  private generateRequestId(): string {
    return `req_${++this.requestIdCounter}_${Date.now()}`;
  }

  /**
   * Generates unique connection ID
   */
  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Global connection pool instance for build operations
let globalBuildConnectionPool: BuildConnectionPool | null = null;

/**
 * Gets or creates the global build connection pool
 */
export function getBuildConnectionPool(config?: Partial<ConnectionPoolConfig>): BuildConnectionPool {
  if (!globalBuildConnectionPool) {
    globalBuildConnectionPool = new BuildConnectionPool(config);
  }
  return globalBuildConnectionPool;
}

/**
 * Resets the global connection pool (useful for testing)
 */
export function resetBuildConnectionPool(): void {
  if (globalBuildConnectionPool) {
    globalBuildConnectionPool.shutdown();
    globalBuildConnectionPool = null;
  }
}

/**
 * Convenience function for making pooled requests
 */
export async function pooledFetch<T>(
  url: string,
  options: RequestInit = {},
  priority: 'high' | 'medium' | 'low' = 'medium'
): Promise<T> {
  const pool = getBuildConnectionPool();
  return pool.request<T>(url, options, priority);
}