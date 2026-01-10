/**
 * Retry Logic with Exponential Backoff for Build-time Operations
 *
 * This module provides sophisticated retry logic with exponential backoff,
 * jitter, and circuit breaker patterns to handle transient failures
 * during build-time API operations.
 */

export interface RetryConfig {
  maxAttempts: number; // Maximum number of retry attempts
  baseDelay: number; // Base delay in milliseconds
  maxDelay: number; // Maximum delay in milliseconds
  backoffMultiplier: number; // Multiplier for exponential backoff
  jitterEnabled: boolean; // Enable jitter to avoid thundering herd
  jitterRange: number; // Jitter range (0-1)
  retryableStatusCodes: number[]; // HTTP status codes that should trigger retries
  retryableErrors: string[]; // Error types that should trigger retries
}

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening circuit
  recoveryTimeout: number; // Time to wait before attempting recovery (ms)
  monitoringWindow: number; // Time window for failure monitoring (ms)
  minimumRequests: number; // Minimum requests before circuit can open
}

export interface RetryMetrics {
  totalAttempts: number;
  successfulRetries: number;
  failedRetries: number;
  averageRetryCount: number;
  averageDelay: number;
  circuitBreakerTrips: number;
  lastRetryTimestamp: Date | null;
}

export interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureTime: Date | null;
  nextAttemptTime: Date | null;
  requestCount: number;
  windowStartTime: Date;
}

export interface RetryAttempt {
  attemptNumber: number;
  delay: number;
  error: Error | null;
  timestamp: Date;
  success: boolean;
}

// Default configurations
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: parseInt(process.env.BUILD_MAX_RETRY_ATTEMPTS || '3', 10),
  baseDelay: parseInt(process.env.BUILD_BASE_DELAY || '1000', 10),
  maxDelay: parseInt(process.env.BUILD_MAX_DELAY || '30000', 10),
  backoffMultiplier: parseFloat(process.env.BUILD_BACKOFF_MULTIPLIER || '2'),
  jitterEnabled: process.env.BUILD_JITTER_ENABLED !== 'false',
  jitterRange: parseFloat(process.env.BUILD_JITTER_RANGE || '0.1'),
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryableErrors: ['ECONNRESET', 'ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT'],
};

const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: parseInt(process.env.BUILD_CIRCUIT_FAILURE_THRESHOLD || '5', 10),
  recoveryTimeout: parseInt(process.env.BUILD_CIRCUIT_RECOVERY_TIMEOUT || '60000', 10),
  monitoringWindow: parseInt(process.env.BUILD_CIRCUIT_MONITORING_WINDOW || '300000', 10),
  minimumRequests: parseInt(process.env.BUILD_CIRCUIT_MIN_REQUESTS || '10', 10),
};

/**
 * Circuit Breaker for preventing cascading failures
 */
export class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private state: CircuitBreakerState;
  private endpoint: string;

  constructor(endpoint: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.endpoint = endpoint;
    this.config = { ...DEFAULT_CIRCUIT_BREAKER_CONFIG, ...config };
    this.state = {
      state: 'closed',
      failureCount: 0,
      lastFailureTime: null,
      nextAttemptTime: null,
      requestCount: 0,
      windowStartTime: new Date(),
    };
  }

  /**
   * Checks if a request can be made through the circuit breaker
   */
  canExecute(): boolean {
    const now = new Date();

    // Reset monitoring window if needed
    if (now.getTime() - this.state.windowStartTime.getTime() > this.config.monitoringWindow) {
      this.resetWindow();
    }

    switch (this.state.state) {
      case 'closed':
        return true;

      case 'open':
        if (this.state.nextAttemptTime && now >= this.state.nextAttemptTime) {
          this.state.state = 'half-open';
          console.log(`[CIRCUIT BREAKER] ${this.endpoint}: Transitioning to half-open state`);
          return true;
        }
        return false;

      case 'half-open':
        return true;

      default:
        return false;
    }
  }

  /**
   * Records a successful request
   */
  recordSuccess(): void {
    this.state.requestCount++;

    if (this.state.state === 'half-open') {
      this.state.state = 'closed';
      this.state.failureCount = 0;
      console.log(`[CIRCUIT BREAKER] ${this.endpoint}: Recovered, transitioning to closed state`);
    }
  }

  /**
   * Records a failed request
   */
  recordFailure(): void {
    this.state.requestCount++;
    this.state.failureCount++;
    this.state.lastFailureTime = new Date();

    if (this.state.state === 'half-open') {
      this.openCircuit();
    } else if (
      this.state.state === 'closed' &&
      this.state.requestCount >= this.config.minimumRequests &&
      this.state.failureCount >= this.config.failureThreshold
    ) {
      this.openCircuit();
    }
  }

  /**
   * Opens the circuit breaker
   */
  private openCircuit(): void {
    this.state.state = 'open';
    this.state.nextAttemptTime = new Date(Date.now() + this.config.recoveryTimeout);

    console.warn(`[CIRCUIT BREAKER] ${this.endpoint}: Circuit opened due to ${this.state.failureCount} failures`);
  }

  /**
   * Resets the monitoring window
   */
  private resetWindow(): void {
    this.state.windowStartTime = new Date();
    this.state.requestCount = 0;
    this.state.failureCount = 0;
  }

  /**
   * Gets current circuit breaker state
   */
  getState(): CircuitBreakerState {
    return { ...this.state };
  }
}

/**
 * Retry Manager with Exponential Backoff
 */
export class RetryManager {
  private config: RetryConfig;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private metrics: RetryMetrics;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
    this.metrics = {
      totalAttempts: 0,
      successfulRetries: 0,
      failedRetries: 0,
      averageRetryCount: 0,
      averageDelay: 0,
      circuitBreakerTrips: 0,
      lastRetryTimestamp: null,
    };
  }

  /**
   * Executes a function with retry logic and circuit breaker protection
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    endpoint: string,
    operationName: string = 'API call'
  ): Promise<T> {
    const circuitBreaker = this.getCircuitBreaker(endpoint);
    const attempts: RetryAttempt[] = [];

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      // Check circuit breaker
      if (!circuitBreaker.canExecute()) {
        const error = new Error(`Circuit breaker is open for ${endpoint}`);
        this.metrics.circuitBreakerTrips++;
        throw error;
      }

      const attemptStart = Date.now();

      try {
        console.log(`[RETRY] ${operationName} attempt ${attempt}/${this.config.maxAttempts} for ${endpoint}`);

        const result = await operation();

        // Record success
        const attemptData: RetryAttempt = {
          attemptNumber: attempt,
          delay: 0,
          error: null,
          timestamp: new Date(),
          success: true,
        };
        attempts.push(attemptData);

        circuitBreaker.recordSuccess();

        if (attempt > 1) {
          this.metrics.successfulRetries++;
          console.log(`[RETRY] ${operationName} succeeded on attempt ${attempt} for ${endpoint}`);
        }

        this.updateMetrics(attempts);
        return result;

      } catch (error) {
        const attemptDuration = Date.now() - attemptStart;
        const attemptData: RetryAttempt = {
          attemptNumber: attempt,
          delay: attemptDuration,
          error: error as Error,
          timestamp: new Date(),
          success: false,
        };
        attempts.push(attemptData);

        console.warn(`[RETRY] ${operationName} failed on attempt ${attempt} for ${endpoint}:`, error);

        // Check if error is retryable
        if (!this.isRetryableError(error as Error)) {
          console.log(`[RETRY] Non-retryable error for ${endpoint}, not retrying`);
          circuitBreaker.recordFailure();
          throw error;
        }

        // Record failure in circuit breaker
        circuitBreaker.recordFailure();

        // If this was the last attempt, throw the error
        if (attempt === this.config.maxAttempts) {
          this.metrics.failedRetries++;
          this.updateMetrics(attempts);
          throw error;
        }

        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt);

        console.log(`[RETRY] Waiting ${delay}ms before retry ${attempt + 1} for ${endpoint}`);
        await this.sleep(delay);
      }
    }

    // This should never be reached, but TypeScript requires it
    throw new Error(`Retry logic exhausted for ${endpoint}`);
  }

  /**
   * Calculates delay with exponential backoff and jitter
   */
  private calculateDelay(attempt: number): number {
    // Calculate exponential backoff
    let delay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt - 1);

    // Apply maximum delay limit
    delay = Math.min(delay, this.config.maxDelay);

    // Apply jitter if enabled
    if (this.config.jitterEnabled) {
      const jitterAmount = delay * this.config.jitterRange;
      const jitter = (Math.random() - 0.5) * 2 * jitterAmount;
      delay = Math.max(0, delay + jitter);
    }

    return Math.round(delay);
  }

  /**
   * Checks if an error is retryable
   */
  private isRetryableError(error: Error): boolean {
    // Check for HTTP status codes
    if ('status' in error) {
      const status = (error as any).status;
      if (this.config.retryableStatusCodes.includes(status)) {
        return true;
      }
    }

    // Check for network errors
    const errorMessage = error.message.toLowerCase();
    const errorCode = (error as any).code;

    if (errorCode && this.config.retryableErrors.includes(errorCode)) {
      return true;
    }

    // Check for common retryable error patterns
    const retryablePatterns = [
      'timeout',
      'network error',
      'connection reset',
      'connection refused',
      'temporary failure',
      'service unavailable',
      'too many requests',
    ];

    return retryablePatterns.some(pattern => errorMessage.includes(pattern));
  }

  /**
   * Gets or creates a circuit breaker for an endpoint
   */
  private getCircuitBreaker(endpoint: string): CircuitBreaker {
    if (!this.circuitBreakers.has(endpoint)) {
      this.circuitBreakers.set(endpoint, new CircuitBreaker(endpoint));
    }
    return this.circuitBreakers.get(endpoint)!;
  }

  /**
   * Updates retry metrics
   */
  private updateMetrics(attempts: RetryAttempt[]): void {
    this.metrics.totalAttempts += attempts.length;
    this.metrics.lastRetryTimestamp = new Date();

    // Update average retry count
    const totalOperations = this.metrics.successfulRetries + this.metrics.failedRetries + 1;
    const totalRetries = attempts.length - 1; // Subtract 1 for the initial attempt

    this.metrics.averageRetryCount =
      ((this.metrics.averageRetryCount * (totalOperations - 1)) + totalRetries) / totalOperations;

    // Update average delay
    const totalDelay = attempts.reduce((sum, attempt) => sum + attempt.delay, 0);
    if (totalDelay > 0) {
      this.metrics.averageDelay =
        ((this.metrics.averageDelay * (this.metrics.totalAttempts - attempts.length)) + totalDelay) / this.metrics.totalAttempts;
    }
  }

  /**
   * Sleep utility function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Gets current retry metrics
   */
  getMetrics(): RetryMetrics {
    return { ...this.metrics };
  }

  /**
   * Gets circuit breaker states for all endpoints
   */
  getCircuitBreakerStates(): Map<string, CircuitBreakerState> {
    const states = new Map<string, CircuitBreakerState>();
    for (const [endpoint, breaker] of this.circuitBreakers) {
      states.set(endpoint, breaker.getState());
    }
    return states;
  }

  /**
   * Resets all circuit breakers (useful for testing)
   */
  resetCircuitBreakers(): void {
    this.circuitBreakers.clear();
    console.log('[RETRY] All circuit breakers reset');
  }

  /**
   * Resets retry metrics (useful for testing)
   */
  resetMetrics(): void {
    this.metrics = {
      totalAttempts: 0,
      successfulRetries: 0,
      failedRetries: 0,
      averageRetryCount: 0,
      averageDelay: 0,
      circuitBreakerTrips: 0,
      lastRetryTimestamp: null,
    };
  }
}

// Global retry manager instance for build operations
let globalRetryManager: RetryManager | null = null;

/**
 * Gets or creates the global retry manager
 */
export function getRetryManager(config?: Partial<RetryConfig>): RetryManager {
  if (!globalRetryManager) {
    globalRetryManager = new RetryManager(config);
  }
  return globalRetryManager;
}

/**
 * Resets the global retry manager (useful for testing)
 */
export function resetRetryManager(): void {
  globalRetryManager = null;
}

/**
 * Convenience function for executing operations with retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  endpoint: string,
  operationName?: string,
  config?: Partial<RetryConfig>
): Promise<T> {
  const retryManager = getRetryManager(config);
  return retryManager.executeWithRetry(operation, endpoint, operationName);
}

/**
 * Convenience function for fetch requests with retry logic
 */
export async function retryableFetch<T>(
  url: string,
  options: RequestInit = {},
  config?: Partial<RetryConfig>
): Promise<T> {
  return withRetry(
    async () => {
      const response = await fetch(url, options);

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as any;
        error.status = response.status;
        throw error;
      }

      return response.json();
    },
    url,
    `fetch ${url}`,
    config
  );
}