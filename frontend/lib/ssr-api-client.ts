/**
 * Enhanced API client for SSR with comprehensive error handling, timeouts, and fallbacks
 */

import {
  safeSSRFetchWithCircuitBreaker,
  safeSSRFetch,
  SSRFallbackData,
  SSRTimeoutConfig,
  getSSREnvVar,
  monitorSSRPerformance,
} from './ssr-error-handling';
import { getCacheStrategy, CACHE_STRATEGIES } from './cache-config';

export interface SSRApiClientConfig {
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  enableCircuitBreaker?: boolean;
  defaultHeaders?: Record<string, string>;
}

export interface SSRApiResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
  cached: boolean;
}

export interface SSRApiErrorData {
  status: number;
  message: string;
  data?: any;
}

/**
 * Enhanced SSR API client with error handling and monitoring
 */
export class SSRApiClient {
  private config: Required<SSRApiClientConfig>;

  constructor(config: SSRApiClientConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || getSSREnvVar('NEXT_PUBLIC_API_URL', 'http://localhost:3001'),
      timeout: config.timeout || 5000,
      retryAttempts: config.retryAttempts || 2,
      retryDelay: config.retryDelay || 1000,
      enableCircuitBreaker: config.enableCircuitBreaker ?? true,
      defaultHeaders: {
        'Content-Type': 'application/json',
        'User-Agent': 'SSR-Client/1.0',
        ...config.defaultHeaders,
      },
    };
  }

  /**
   * Performs a GET request with SSR error handling
   */
  async get<T>(
    endpoint: string,
    options: {
      params?: Record<string, string | number | boolean>;
      headers?: Record<string, string>;
      cacheStrategy?: keyof typeof CACHE_STRATEGIES;
      fallbackData?: T;
      timeout?: number;
    } = {}
  ): Promise<SSRFallbackData<T>> {
    const url = this.buildUrl(endpoint, options.params);
    const cacheKey = `GET:${url}`;

    const fetchOperation = async (): Promise<T> => {
      const fetchOptions = this.buildFetchOptions('GET', {
        headers: options.headers,
        cacheStrategy: options.cacheStrategy,
        timeout: options.timeout,
      });

      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        throw new SSRApiError({
          status: response.status,
          message: `HTTP ${response.status}: ${response.statusText}`,
          data: await this.safeParseResponse(response),
        });
      }

      return response.json();
    };

    const ssrConfig: Partial<SSRTimeoutConfig> = {
      apiTimeout: options.timeout || this.config.timeout,
      retryAttempts: this.config.retryAttempts,
      retryDelay: this.config.retryDelay,
    };

    if (this.config.enableCircuitBreaker) {
      return monitorSSRPerformance(
        () => safeSSRFetchWithCircuitBreaker(
          fetchOperation,
          cacheKey,
          options.fallbackData || null,
          ssrConfig,
          `API GET ${endpoint}`
        ),
        `api-get:${endpoint}`
      );
    } else {
      return monitorSSRPerformance(
        () => safeSSRFetch(
          fetchOperation,
          options.fallbackData || null,
          ssrConfig,
          `API GET ${endpoint}`
        ),
        `api-get:${endpoint}`
      );
    }
  }

  /**
   * Performs a POST request with SSR error handling
   */
  async post<T, D = any>(
    endpoint: string,
    data?: D,
    options: {
      headers?: Record<string, string>;
      timeout?: number;
      fallbackData?: T;
    } = {}
  ): Promise<SSRFallbackData<T>> {
    const url = this.buildUrl(endpoint);
    const cacheKey = `POST:${url}`;

    const fetchOperation = async (): Promise<T> => {
      const fetchOptions = this.buildFetchOptions('POST', {
        headers: options.headers,
        body: data ? JSON.stringify(data) : undefined,
        timeout: options.timeout,
      });

      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        throw new SSRApiError({
          status: response.status,
          message: `HTTP ${response.status}: ${response.statusText}`,
          data: await this.safeParseResponse(response),
        });
      }

      return response.json();
    };

    const ssrConfig: Partial<SSRTimeoutConfig> = {
      apiTimeout: options.timeout || this.config.timeout,
      retryAttempts: this.config.retryAttempts,
      retryDelay: this.config.retryDelay,
    };

    if (this.config.enableCircuitBreaker) {
      return monitorSSRPerformance(
        () => safeSSRFetchWithCircuitBreaker(
          fetchOperation,
          cacheKey,
          options.fallbackData || null,
          ssrConfig,
          `API POST ${endpoint}`
        ),
        `api-post:${endpoint}`
      );
    } else {
      return monitorSSRPerformance(
        () => safeSSRFetch(
          fetchOperation,
          options.fallbackData || null,
          ssrConfig,
          `API POST ${endpoint}`
        ),
        `api-post:${endpoint}`
      );
    }
  }

  /**
   * Builds the complete URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
    const baseUrl = this.config.baseUrl.endsWith('/')
      ? this.config.baseUrl.slice(0, -1)
      : this.config.baseUrl;

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    let url = `${baseUrl}${cleanEndpoint}`;

    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, value.toString());
      });
      url += `?${searchParams.toString()}`;
    }

    return url;
  }

  /**
   * Builds fetch options with proper headers and caching
   */
  private buildFetchOptions(
    method: string,
    options: {
      headers?: Record<string, string>;
      body?: string;
      cacheStrategy?: keyof typeof CACHE_STRATEGIES;
      timeout?: number;
    } = {}
  ): RequestInit {
    const headers = {
      ...this.config.defaultHeaders,
      ...options.headers,
    };

    // Add SSR-specific headers
    if (typeof window === 'undefined') {
      headers['X-SSR-Request'] = 'true';
      headers['X-Request-ID'] = `ssr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    // Add body for POST/PUT/PATCH requests
    if (options.body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      fetchOptions.body = options.body;
    }

    // Add caching strategy
    if (options.cacheStrategy) {
      const cacheConfig = getCacheStrategy(options.cacheStrategy);
      if (cacheConfig) {
        fetchOptions.next = {
          revalidate: cacheConfig.revalidate,
          ...(cacheConfig.tags && { tags: [...cacheConfig.tags] })
        };
      }
    }

    return fetchOptions;
  }

  /**
   * Safely parses response body, handling various content types
   */
  private async safeParseResponse(response: Response): Promise<any> {
    try {
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        return await response.json();
      } else if (contentType?.includes('text/')) {
        return await response.text();
      } else {
        return null;
      }
    } catch (error) {
      console.warn('Failed to parse response body:', error);
      return null;
    }
  }
}

/**
 * Default SSR API client instance
 */
export const ssrApiClient = new SSRApiClient();

/**
 * Convenience functions for common API operations
 */
export const ssrApi = {
  /**
   * Fetch product data with SSR error handling
   */
  getProduct: (slug: string, fallbackData?: any) =>
    ssrApiClient.get(`/products/slug/${slug}`, {
      cacheStrategy: 'productDetail',
      fallbackData,
    }),

  /**
   * Fetch category data with SSR error handling
   */
  getCategory: (slug: string, params?: Record<string, any>, fallbackData?: any) =>
    ssrApiClient.get(`/categories/slug/${slug}`, {
      params,
      cacheStrategy: 'categoryPages',
      fallbackData,
    }),

  /**
   * Fetch category products with SSR error handling
   */
  getCategoryProducts: (categoryId: string, params?: Record<string, any>, fallbackData?: any) =>
    ssrApiClient.get('/products', {
      params: { categoryId, ...params },
      cacheStrategy: 'categoryPages',
      fallbackData,
    }),

  /**
   * Fetch featured products with SSR error handling
   */
  getFeaturedProducts: (fallbackData?: any) =>
    ssrApiClient.get('/products/featured', {
      cacheStrategy: 'homepage',
      fallbackData,
    }),

  /**
   * Fetch homepage data with SSR error handling
   */
  getHomepageData: async (fallbackData?: any) => {
    const [featuredProducts, categories, banners, sections] = await Promise.allSettled([
      ssrApiClient.get('/products/featured', { cacheStrategy: 'homepage' }),
      ssrApiClient.get('/categories', { cacheStrategy: 'homepage' }),
      ssrApiClient.get('/banners/active', { cacheStrategy: 'homepage' }),
      ssrApiClient.get('/homepage-sections', { cacheStrategy: 'homepage' }),
    ]);

    return {
      data: {
        featuredProducts: featuredProducts.status === 'fulfilled' ? featuredProducts.value.data : [],
        categories: categories.status === 'fulfilled' ? categories.value.data : [],
        banners: banners.status === 'fulfilled' ? banners.value.data : [],
        sections: sections.status === 'fulfilled' ? sections.value.data : [],
      },
      error: null,
      fallbackToCSR: false,
      cacheHit: false,
      renderTime: 0,
    };
  },

  /**
   * Fetch blog post data with SSR error handling
   */
  getBlogPost: (slug: string, fallbackData?: any) =>
    ssrApiClient.get(`/blog/slug/${slug}`, {
      cacheStrategy: 'blogPosts',
      fallbackData,
    }),

  /**
   * Fetch blog posts with SSR error handling
   */
  getBlogPosts: (params?: Record<string, any>, fallbackData?: any) =>
    ssrApiClient.get('/blog', {
      params,
      cacheStrategy: 'blogPosts',
      fallbackData,
    }),

  /**
   * Fetch related blog posts with SSR error handling
   */
  getRelatedBlogPosts: (slug: string, limit: number = 3, fallbackData?: any) =>
    ssrApiClient.get(`/blog/related/${slug}`, {
      params: { limit },
      cacheStrategy: 'blogPosts',
      fallbackData,
    }),
};

/**
 * Error class for SSR API errors
 */
class SSRApiError extends Error {
  public readonly status: number;
  public readonly data?: any;

  constructor({ status, message, data }: SSRApiErrorData) {
    super(message);
    this.name = 'SSRApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Type guard for SSR API errors
 */
export function isSSRApiError(error: any): error is SSRApiError {
  return error instanceof SSRApiError;
}

/**
 * Utility to create a custom SSR API client with specific configuration
 */
export function createSSRApiClient(config: SSRApiClientConfig): SSRApiClient {
  return new SSRApiClient(config);
}

export default ssrApiClient;