/**
 * Enhanced error handling utilities for Server-Side Rendering (SSR)
 * Provides comprehensive error classification, timeout handling, and fallback mechanisms
 */

// Global type declaration for SSR metrics
declare global {
  var __ssrMetrics: any[] | undefined;
}

export interface SSRErrorDetails {
  code: string;
  message: string;
  isRetryable: boolean;
  shouldFallbackToCSR: boolean;
  retryAfter?: number; // seconds
  userMessage: string;
  technicalDetails?: any;
  timestamp: string;
}

export interface SSRTimeoutConfig {
  apiTimeout: number; // milliseconds
  totalTimeout: number; // milliseconds
  retryAttempts: number;
  retryDelay: number; // milliseconds
}

export interface SSRFallbackData<T = any> {
  data: T | null;
  error: SSRErrorDetails | null;
  fallbackToCSR: boolean;
  cacheHit: boolean;
  renderTime: number;
}

export class SSRError extends Error {
  public readonly code: string;
  public readonly isRetryable: boolean;
  public readonly shouldFallbackToCSR: boolean;
  public readonly retryAfter?: number;
  public readonly userMessage: string;
  public readonly technicalDetails?: any;
  public readonly timestamp: string;

  constructor(details: SSRErrorDetails) {
    super(details.message);
    this.name = 'SSRError';
    this.code = details.code;
    this.isRetryable = details.isRetryable;
    this.shouldFallbackToCSR = details.shouldFallbackToCSR;
    this.retryAfter = details.retryAfter;
    this.userMessage = details.userMessage;
    this.technicalDetails = details.technicalDetails;
    this.timestamp = details.timestamp;
  }
}

const DEFAULT_TIMEOUT_CONFIG: SSRTimeoutConfig = {
  apiTimeout: 5000, // 5 seconds for individual API calls
  totalTimeout: 10000, // 10 seconds total for SSR
  retryAttempts: 2,
  retryDelay: 1000, // 1 second between retries
};

/**
 * Classifies SSR errors and provides appropriate handling strategies
 */
export function classifySSRError(error: any, context: string = 'SSR'): SSRErrorDetails {
  const timestamp = new Date().toISOString();

  // Timeout errors
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return {
      code: 'SSR_TIMEOUT',
      message: `${context} timeout: ${error.message}`,
      isRetryable: true,
      shouldFallbackToCSR: true,
      userMessage: 'Page is taking longer to load. Switching to client-side rendering.',
      technicalDetails: { context, originalError: error.message },
      timestamp,
    };
  }

  // Network connectivity errors
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return {
      code: 'SSR_NETWORK_ERROR',
      message: `${context} network error: ${error.message}`,
      isRetryable: true,
      shouldFallbackToCSR: true,
      userMessage: 'Unable to connect to server. Loading page with cached data.',
      technicalDetails: { context, code: error.code, originalError: error.message },
      timestamp,
    };
  }

  // HTTP errors from API calls
  if (error.response?.status) {
    const status = error.response.status;
    const serverMessage = error.response.data?.message;

    switch (status) {
      case 400:
        return {
          code: 'SSR_BAD_REQUEST',
          message: `${context} bad request: ${serverMessage || 'Invalid request'}`,
          isRetryable: false,
          shouldFallbackToCSR: false,
          userMessage: 'Invalid request parameters. Please check the URL.',
          technicalDetails: { context, status, data: error.response.data },
          timestamp,
        };

      case 401:
        return {
          code: 'SSR_UNAUTHORIZED',
          message: `${context} unauthorized: Session expired`,
          isRetryable: false,
          shouldFallbackToCSR: true,
          userMessage: 'Authentication required. Redirecting to login.',
          technicalDetails: { context, status },
          timestamp,
        };

      case 403:
        return {
          code: 'SSR_FORBIDDEN',
          message: `${context} forbidden: Access denied`,
          isRetryable: false,
          shouldFallbackToCSR: false,
          userMessage: 'Access denied to this resource.',
          technicalDetails: { context, status },
          timestamp,
        };

      case 404:
        return {
          code: 'SSR_NOT_FOUND',
          message: `${context} not found: Resource not found`,
          isRetryable: false,
          shouldFallbackToCSR: false,
          userMessage: 'The requested page or resource was not found.',
          technicalDetails: { context, status },
          timestamp,
        };

      case 429:
        const retryAfter = parseInt(error.response.headers?.['retry-after']) || 60;
        return {
          code: 'SSR_RATE_LIMITED',
          message: `${context} rate limited: Too many requests`,
          isRetryable: true,
          shouldFallbackToCSR: true,
          retryAfter,
          userMessage: `Server is busy. Please wait ${retryAfter} seconds.`,
          technicalDetails: { context, status, retryAfter },
          timestamp,
        };

      case 500:
      case 502:
      case 503:
      case 504:
        return {
          code: 'SSR_SERVER_ERROR',
          message: `${context} server error: ${serverMessage || `HTTP ${status}`}`,
          isRetryable: true,
          shouldFallbackToCSR: true,
          userMessage: 'Server error occurred. Falling back to cached content.',
          technicalDetails: { context, status, data: error.response.data },
          timestamp,
        };

      default:
        return {
          code: 'SSR_HTTP_ERROR',
          message: `${context} HTTP error: ${serverMessage || `HTTP ${status}`}`,
          isRetryable: status >= 500,
          shouldFallbackToCSR: true,
          userMessage: 'An error occurred while loading the page.',
          technicalDetails: { context, status, data: error.response.data },
          timestamp,
        };
    }
  }

  // Memory or resource errors
  if (error.message?.includes('out of memory') || error.code === 'ENOMEM') {
    return {
      code: 'SSR_MEMORY_ERROR',
      message: `${context} memory error: ${error.message}`,
      isRetryable: false,
      shouldFallbackToCSR: true,
      userMessage: 'Server resources exhausted. Using client-side rendering.',
      technicalDetails: { context, originalError: error.message },
      timestamp,
    };
  }

  // Generic errors
  return {
    code: 'SSR_UNKNOWN_ERROR',
    message: `${context} unknown error: ${error.message || 'Unknown error'}`,
    isRetryable: true,
    shouldFallbackToCSR: true,
    userMessage: 'An unexpected error occurred. Loading page with fallback data.',
    technicalDetails: { context, originalError: error },
    timestamp,
  };
}

/**
 * Creates a timeout wrapper for API calls during SSR
 */
export function withSSRTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = DEFAULT_TIMEOUT_CONFIG.apiTimeout,
  context: string = 'API call'
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`${context} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then(result => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * Implements retry mechanism with exponential backoff for SSR operations
 */
export async function retrySSROperation<T>(
  operation: () => Promise<T>,
  config: Partial<SSRTimeoutConfig> = {},
  context: string = 'SSR operation'
): Promise<T> {
  const finalConfig = { ...DEFAULT_TIMEOUT_CONFIG, ...config };
  let lastError: any;

  for (let attempt = 1; attempt <= finalConfig.retryAttempts; attempt++) {
    try {
      return await withSSRTimeout(operation(), finalConfig.apiTimeout, context);
    } catch (error) {
      lastError = error;

      const errorDetails = classifySSRError(error, context);

      // Don't retry if error is not retryable
      if (!errorDetails.isRetryable) {
        throw new SSRError(errorDetails);
      }

      // Don't retry on last attempt
      if (attempt === finalConfig.retryAttempts) {
        break;
      }

      // Wait before retry with exponential backoff
      const delay = finalConfig.retryDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // All attempts failed
  const errorDetails = classifySSRError(lastError, context);
  throw new SSRError(errorDetails);
}

/**
 * Safe wrapper for SSR data fetching with fallback mechanisms
 */
export async function safeSSRFetch<T>(
  fetchOperation: () => Promise<T>,
  fallbackData: T | null = null,
  config: Partial<SSRTimeoutConfig> = {},
  context: string = 'SSR fetch'
): Promise<SSRFallbackData<T>> {
  const startTime = Date.now();

  try {
    const data = await retrySSROperation(fetchOperation, config, context);
    const renderTime = Date.now() - startTime;

    return {
      data,
      error: null,
      fallbackToCSR: false,
      cacheHit: false, // Could be enhanced to detect cache hits
      renderTime,
    };
  } catch (error) {
    const renderTime = Date.now() - startTime;

    if (error instanceof SSRError) {
      // Log error for monitoring
      logSSRError(error, context);

      return {
        data: fallbackData,
        error,
        fallbackToCSR: error.shouldFallbackToCSR,
        cacheHit: false,
        renderTime,
      };
    }

    // Unexpected error - classify and handle
    const errorDetails = classifySSRError(error, context);
    const ssrError = new SSRError(errorDetails);

    logSSRError(ssrError, context);

    return {
      data: fallbackData,
      error: ssrError,
      fallbackToCSR: ssrError.shouldFallbackToCSR,
      cacheHit: false,
      renderTime,
    };
  }
}

/**
 * Logs SSR errors for monitoring and debugging
 */
export function logSSRError(error: SSRError, context: string): void {
  const logData = {
    timestamp: error.timestamp,
    context,
    code: error.code,
    message: error.message,
    isRetryable: error.isRetryable,
    shouldFallbackToCSR: error.shouldFallbackToCSR,
    technicalDetails: error.technicalDetails,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
    url: typeof window !== 'undefined' ? window.location.href : 'SSR',
    sessionId: getSessionId(),
    buildId: process.env.NEXT_BUILD_ID || 'unknown',
    environment: process.env.NODE_ENV || 'unknown',
  };

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('SSR Error:', logData);
  }

  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    sendToMonitoringService(logData);
  }

  // Also send to performance monitoring endpoint
  sendToPerformanceMonitoring({
    type: 'ssr_error',
    data: logData,
  });
}

/**
 * Creates a performance monitoring wrapper for SSR operations
 */
export function monitorSSRPerformance<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  const startTime = Date.now();

  return operation()
    .then(result => {
      const duration = Date.now() - startTime;
      logSSRPerformance(operationName, duration, true);
      return result;
    })
    .catch(error => {
      const duration = Date.now() - startTime;
      logSSRPerformance(operationName, duration, false, error);
      throw error;
    });
}

/**
 * Logs SSR performance metrics
 */
function logSSRPerformance(
  operationName: string,
  duration: number,
  success: boolean,
  error?: any
): void {
  const logData = {
    timestamp: new Date().toISOString(),
    operation: operationName,
    duration,
    success,
    error: error ? {
      message: error.message,
      code: error.code,
    } : undefined,
    sessionId: getSessionId(),
    buildId: process.env.NEXT_BUILD_ID || 'unknown',
    environment: process.env.NODE_ENV || 'unknown',
  };

  // In development, log slow operations
  if (process.env.NODE_ENV === 'development' && duration > 2000) {
    console.warn('Slow SSR operation:', logData);
  }

  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    sendToPerformanceMonitoring({
      type: 'ssr_performance',
      data: logData,
    });
  }

  // Track performance metrics
  trackSSRMetrics(operationName, duration, success);
}

/**
 * Utility to check if we're in a server-side rendering context
 */
export function isSSRContext(): boolean {
  return typeof window === 'undefined';
}

/**
 * Utility to safely access environment variables during SSR
 */
export function getSSREnvVar(key: string, defaultValue: string = ''): string {
  if (isSSRContext()) {
    return process.env[key] || defaultValue;
  }

  // Client-side - only access NEXT_PUBLIC_ variables
  if (key.startsWith('NEXT_PUBLIC_')) {
    return process.env[key] || defaultValue;
  }

  return defaultValue;
}

/**
 * Generates or retrieves session ID for error tracking
 */
function getSessionId(): string {
  if (isSSRContext()) {
    // Server-side: generate a unique ID for this request
    return `ssr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Client-side: use sessionStorage or generate new ID
  try {
    let sessionId = sessionStorage.getItem('ssr-session-id');
    if (!sessionId) {
      sessionId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('ssr-session-id', sessionId);
    }
    return sessionId;
  } catch {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Sends error data to monitoring service
 */
async function sendToMonitoringService(errorData: any): Promise<void> {
  try {
    const monitoringUrl = getSSREnvVar('NEXT_PUBLIC_MONITORING_URL');
    if (!monitoringUrl) {
      console.warn('NEXT_PUBLIC_MONITORING_URL not configured, skipping error reporting');
      return;
    }

    await fetch(monitoringUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getSSREnvVar('MONITORING_API_KEY', '')}`,
      },
      body: JSON.stringify({
        type: 'ssr_error',
        data: errorData,
      }),
    });
  } catch (error) {
    console.error('Failed to send error to monitoring service:', error);
  }
}

/**
 * Sends performance data to monitoring service
 */
async function sendToPerformanceMonitoring(performanceData: any): Promise<void> {
  try {
    // Use the existing performance API endpoint
    const performanceUrl = `${getSSREnvVar('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000')}/sitemap-api/performance`;

    await fetch(performanceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(performanceData),
    });
  } catch (error) {
    console.error('Failed to send performance data:', error);
  }
}

/**
 * Tracks SSR metrics for monitoring
 */
function trackSSRMetrics(operationName: string, duration: number, success: boolean): void {
  // Track metrics in memory for aggregation
  if (typeof window !== 'undefined') {
    // Client-side metrics tracking
    if ('performance' in window && 'mark' in window.performance) {
      window.performance.mark(`ssr-${operationName}-${success ? 'success' : 'error'}`);
    }
  }

  // Server-side metrics can be tracked with process metrics
  if (isSSRContext()) {
    // Track server-side metrics
    const metrics = {
      operation: operationName,
      duration,
      success,
      timestamp: Date.now(),
    };

    // Store in global for aggregation (in a real app, use proper metrics collection)
    if (!global.__ssrMetrics) {
      global.__ssrMetrics = [];
    }
    global.__ssrMetrics.push(metrics);

    // Keep only last 1000 metrics to prevent memory leaks
    if (global.__ssrMetrics.length > 1000) {
      global.__ssrMetrics = global.__ssrMetrics.slice(-1000);
    }
  }
}

/**
 * Gets aggregated SSR metrics for monitoring
 */
export function getSSRMetrics(): any[] {
  if (isSSRContext() && global.__ssrMetrics) {
    return [...global.__ssrMetrics];
  }
  return [];
}

/**
 * Clears SSR metrics (useful for testing)
 */
export function clearSSRMetrics(): void {
  if (isSSRContext()) {
    global.__ssrMetrics = [];
  }
}

/**
 * Enhanced timeout wrapper with circuit breaker pattern
 */
export function withCircuitBreaker<T>(
  promise: Promise<T>,
  circuitBreakerKey: string,
  timeoutMs: number = DEFAULT_TIMEOUT_CONFIG.apiTimeout,
  context: string = 'API call'
): Promise<T> {
  const circuitState = getCircuitBreakerState(circuitBreakerKey);

  if (circuitState.isOpen) {
    const timeSinceOpen = Date.now() - circuitState.openedAt;
    const cooldownPeriod = 30000; // 30 seconds

    if (timeSinceOpen < cooldownPeriod) {
      return Promise.reject(new Error(`Circuit breaker is open for ${circuitBreakerKey}. Cooldown: ${Math.ceil((cooldownPeriod - timeSinceOpen) / 1000)}s`));
    } else {
      // Try to close the circuit breaker
      setCircuitBreakerState(circuitBreakerKey, { isOpen: false, failureCount: 0, openedAt: 0 });
    }
  }

  return withSSRTimeout(promise, timeoutMs, context)
    .then(result => {
      // Success - reset failure count
      setCircuitBreakerState(circuitBreakerKey, { isOpen: false, failureCount: 0, openedAt: 0 });
      return result;
    })
    .catch(error => {
      // Failure - increment failure count
      const newFailureCount = circuitState.failureCount + 1;
      const failureThreshold = 5; // Open circuit after 5 failures

      if (newFailureCount >= failureThreshold) {
        setCircuitBreakerState(circuitBreakerKey, {
          isOpen: true,
          failureCount: newFailureCount,
          openedAt: Date.now(),
        });
      } else {
        setCircuitBreakerState(circuitBreakerKey, {
          isOpen: false,
          failureCount: newFailureCount,
          openedAt: 0,
        });
      }

      throw error;
    });
}

interface CircuitBreakerState {
  isOpen: boolean;
  failureCount: number;
  openedAt: number;
}

const circuitBreakerStates = new Map<string, CircuitBreakerState>();

function getCircuitBreakerState(key: string): CircuitBreakerState {
  return circuitBreakerStates.get(key) || { isOpen: false, failureCount: 0, openedAt: 0 };
}

function setCircuitBreakerState(key: string, state: CircuitBreakerState): void {
  circuitBreakerStates.set(key, state);
}

/**
 * Enhanced safe SSR fetch with circuit breaker
 */
export async function safeSSRFetchWithCircuitBreaker<T>(
  fetchOperation: () => Promise<T>,
  circuitBreakerKey: string,
  fallbackData: T | null = null,
  config: Partial<SSRTimeoutConfig> = {},
  context: string = 'SSR fetch'
): Promise<SSRFallbackData<T>> {
  const startTime = Date.now();

  try {
    const data = await retrySSROperation(
      () => withCircuitBreaker(fetchOperation(), circuitBreakerKey, config.apiTimeout, context),
      config,
      context
    );
    const renderTime = Date.now() - startTime;

    return {
      data,
      error: null,
      fallbackToCSR: false,
      cacheHit: false,
      renderTime,
    };
  } catch (error) {
    const renderTime = Date.now() - startTime;

    if (error instanceof SSRError) {
      logSSRError(error, context);

      return {
        data: fallbackData,
        error,
        fallbackToCSR: error.shouldFallbackToCSR,
        cacheHit: false,
        renderTime,
      };
    }

    const errorDetails = classifySSRError(error, context);
    const ssrError = new SSRError(errorDetails);

    logSSRError(ssrError, context);

    return {
      data: fallbackData,
      error: ssrError,
      fallbackToCSR: ssrError.shouldFallbackToCSR,
      cacheHit: false,
      renderTime,
    };
  }
}