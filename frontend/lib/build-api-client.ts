/**
 * Build-time API client with comprehensive optimizations
 *
 * This module provides a wrapper around the standard API client
 * with enhanced timeout handling, connection pooling, request deduplication,
 * and retry logic specifically for build-time operations.
 */

import apiClient from './api-client';
import { withTimeoutAndRetry, fetchWithBuildTimeout, getTimeoutConfig } from './build-timeout-wrapper';
import { optimizedFetch, getOptimizedDataFetcher, OptimizedDataFetcherConfig } from './build-optimized-data-fetcher';
import { AxiosRequestConfig, AxiosResponse } from 'axios';

// Get timeout configuration
const timeoutConfig = getTimeoutConfig();

/**
 * Enhanced API client for build-time operations with full optimization suite
 */
export class BuildApiClient {
  private static optimizedFetcher = getOptimizedDataFetcher();

  /**
   * Makes a GET request with build-time optimizations (pooling, deduplication, retry)
   */
  static async get<T>(
    url: string,
    config: AxiosRequestConfig = {},
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<AxiosResponse<T>> {
    const timeoutConfig = getTimeoutConfig();

    // Use optimized fetch for better performance
    try {
      // Convert Axios headers to standard Headers format
      const axiosHeaders = apiClient.defaults.headers;
      const standardHeaders: Record<string, string> = {};

      // Extract common headers from Axios format
      if (axiosHeaders.common) {
        Object.entries(axiosHeaders.common).forEach(([key, value]) => {
          if (typeof value === 'string') {
            standardHeaders[key] = value;
          }
        });
      }

      // Add any additional headers from config
      if (config.headers) {
        Object.entries(config.headers).forEach(([key, value]) => {
          if (typeof value === 'string') {
            standardHeaders[key] = value;
          }
        });
      }

      const data = await optimizedFetch<T>(
        `${apiClient.defaults.baseURL}${url}`,
        {
          method: 'GET',
          headers: standardHeaders,
        },
        priority
      );

      // Return axios-compatible response
      return {
        data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: config as any,
      } as AxiosResponse<T>;
    } catch (error) {
      // Fallback to original axios implementation for compatibility
      return withTimeoutAndRetry(
        () => apiClient.get<T>(url, {
          ...config,
          timeout: timeoutConfig.apiTimeout,
        }),
        timeoutConfig,
        `GET ${url}`
      );
    }
  }

  /**
   * Makes a POST request with build-time timeout handling
   */
  static async post<T>(
    url: string,
    data?: any,
    config: AxiosRequestConfig = {}
  ): Promise<AxiosResponse<T>> {
    return withTimeoutAndRetry(
      () => apiClient.post<T>(url, data, {
        ...config,
        timeout: timeoutConfig.apiTimeout,
      }),
      timeoutConfig,
      `POST ${url}`
    );
  }

  /**
   * Makes a PUT request with build-time timeout handling
   */
  static async put<T>(
    url: string,
    data?: any,
    config: AxiosRequestConfig = {}
  ): Promise<AxiosResponse<T>> {
    return withTimeoutAndRetry(
      () => apiClient.put<T>(url, data, {
        ...config,
        timeout: timeoutConfig.apiTimeout,
      }),
      timeoutConfig,
      `PUT ${url}`
    );
  }

  /**
   * Makes a DELETE request with build-time timeout handling
   */
  static async delete<T>(
    url: string,
    config: AxiosRequestConfig = {}
  ): Promise<AxiosResponse<T>> {
    return withTimeoutAndRetry(
      () => apiClient.delete<T>(url, {
        ...config,
        timeout: timeoutConfig.apiTimeout,
      }),
      timeoutConfig,
      `DELETE ${url}`
    );
  }

  /**
   * Makes a PATCH request with build-time timeout handling
   */
  static async patch<T>(
    url: string,
    data?: any,
    config: AxiosRequestConfig = {}
  ): Promise<AxiosResponse<T>> {
    return withTimeoutAndRetry(
      () => apiClient.patch<T>(url, data, {
        ...config,
        timeout: timeoutConfig.apiTimeout,
      }),
      timeoutConfig,
      `PATCH ${url}`
    );
  }

  /**
   * Makes a raw fetch request with build-time optimizations
   */
  static async fetch<T>(
    url: string,
    options: RequestInit = {},
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<T> {
    // Use optimized fetch with all optimizations enabled
    return optimizedFetch<T>(url, options, priority);
  }
}

/**
 * Wrapper function for existing API calls to add timeout handling
 */
export function withBuildTimeout<T>(
  apiCall: () => Promise<T>,
  operation: string = 'API call'
): Promise<T> {
  return withTimeoutAndRetry(apiCall, timeoutConfig, operation);
}

/**
 * Creates a build-safe version of an API function
 */
export function makeBuildSafe<TArgs extends any[], TReturn>(
  apiFunction: (...args: TArgs) => Promise<TReturn>,
  operationName: string
): (...args: TArgs) => Promise<TReturn> {
  return (...args: TArgs) => {
    return withBuildTimeout(
      () => apiFunction(...args),
      `${operationName}(${args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg).substring(0, 50) + '...' : String(arg)
      ).join(', ')})`
    );
  };
}

/**
 * Utility to check if we're in a build context
 */
export function isBuildContext(): boolean {
  return process.env.NODE_ENV === 'production' &&
         (process.env.NEXT_PHASE === 'phase-production-build' ||
          process.env.BUILD_CONTEXT === 'true');
}

/**
 * Conditionally applies build timeout handling based on context
 */
export function conditionalBuildTimeout<T>(
  apiCall: () => Promise<T>,
  operation: string = 'API call'
): Promise<T> {
  if (isBuildContext()) {
    return withBuildTimeout(apiCall, operation);
  }
  return apiCall();
}

// Export the standard API client for non-build contexts
export { default as standardApiClient } from './api-client';

// Export timeout configuration for reference
export { timeoutConfig };

// Default export is the build-safe API client
export default BuildApiClient;