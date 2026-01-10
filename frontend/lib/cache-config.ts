/**
 * Centralized cache configuration for SSR and ISR strategies
 * This file defines caching strategies for different page types based on content update frequency
 */

export interface CacheStrategy {
  type: 'static' | 'isr' | 'ssr';
  revalidate?: number; // seconds
  tags?: readonly string[];
  description: string;
}

/**
 * Cache strategies for different page types
 * Based on content update frequency and user interaction patterns
 */
export const CACHE_STRATEGIES = {
  // Homepage - frequently updated with featured products and promotions
  homepage: {
    type: 'isr' as const,
    revalidate: 300, // 5 minutes
    tags: ['homepage', 'featured-products', 'banners'],
    description: 'Homepage with featured products and promotions'
  },

  // Product pages - moderate update frequency
  productDetail: {
    type: 'isr' as const,
    revalidate: 600, // 10 minutes
    tags: ['products'],
    description: 'Individual product pages with pricing and availability'
  },

  // Category pages - regular updates as products are added/removed
  categoryPages: {
    type: 'isr' as const,
    revalidate: 900, // 15 minutes
    tags: ['categories', 'products'],
    description: 'Category listing pages with product collections'
  },

  // Blog posts - rarely change after publication
  blogPosts: {
    type: 'isr' as const,
    revalidate: 3600, // 1 hour
    tags: ['blog'],
    description: 'Individual blog post pages'
  },

  // Blog listings - updated when new posts are published
  blogListings: {
    type: 'isr' as const,
    revalidate: 1800, // 30 minutes
    tags: ['blog', 'blog-listings'],
    description: 'Blog listing and archive pages'
  },

  // Static pages - rarely change
  staticPages: {
    type: 'static' as const,
    revalidate: undefined,
    tags: ['static-content'],
    description: 'About, contact, and other static pages'
  },

  // Search results - dynamic, user-specific
  searchResults: {
    type: 'ssr' as const,
    revalidate: undefined,
    tags: [],
    description: 'Search results pages (dynamic, no caching)'
  },

  // User-specific pages - always dynamic
  userPages: {
    type: 'ssr' as const,
    revalidate: undefined,
    tags: [],
    description: 'User dashboard, orders, profile pages'
  },

  // Sitemaps - updated when content changes
  sitemaps: {
    type: 'isr' as const,
    revalidate: 3600, // 1 hour
    tags: ['sitemap', 'products', 'categories', 'blog'],
    description: 'XML sitemaps for search engines'
  }
} as const;

/**
 * Get cache configuration for a specific page type
 */
export function getCacheStrategy(pageType: keyof typeof CACHE_STRATEGIES): CacheStrategy {
  return CACHE_STRATEGIES[pageType];
}

/**
 * Generate Next.js fetch options with appropriate caching
 */
export function getFetchOptions(pageType: keyof typeof CACHE_STRATEGIES): RequestInit {
  const strategy = getCacheStrategy(pageType);

  const options: RequestInit = {};

  if (strategy.type === 'isr' && strategy.revalidate) {
    options.next = {
      revalidate: strategy.revalidate,
      ...(strategy.tags && { tags: [...strategy.tags] })
    };
  } else if (strategy.type === 'static') {
    // Static generation - cache indefinitely until build
    options.cache = 'force-cache';
  } else if (strategy.type === 'ssr') {
    // Server-side rendering - no cache
    options.cache = 'no-store';
  }

  return options;
}

/**
 * Cache headers for different content types
 */
export const CACHE_HEADERS = {
  // Static assets (images, CSS, JS)
  staticAssets: {
    'Cache-Control': 'public, max-age=31536000, immutable', // 1 year
    'Vary': 'Accept-Encoding'
  },

  // HTML pages with ISR
  isrPages: {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400', // 5 min cache, 1 day stale
    'Vary': 'Accept-Encoding, Accept-Language'
  },

  // Static HTML pages
  staticPages: {
    'Cache-Control': 'public, max-age=3600, s-maxage=86400', // 1 hour browser, 1 day CDN
    'Vary': 'Accept-Encoding, Accept-Language'
  },

  // Dynamic pages (no cache)
  dynamicPages: {
    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  },

  // API responses
  apiResponses: {
    'Cache-Control': 'public, max-age=300, s-maxage=600', // 5 min browser, 10 min CDN
    'Vary': 'Accept-Encoding, Authorization'
  },

  // Sitemaps
  sitemaps: {
    'Cache-Control': 'public, max-age=3600, s-maxage=7200', // 1 hour browser, 2 hours CDN
    'Content-Type': 'application/xml'
  }
} as const;

/**
 * Get appropriate cache headers for content type
 */
export function getCacheHeaders(contentType: keyof typeof CACHE_HEADERS): Record<string, string> {
  return CACHE_HEADERS[contentType];
}

/**
 * Performance monitoring configuration
 */
export const PERFORMANCE_CONFIG = {
  // Core Web Vitals thresholds
  coreWebVitals: {
    lcp: 2500, // Largest Contentful Paint (ms)
    fid: 100,  // First Input Delay (ms)
    cls: 0.1   // Cumulative Layout Shift
  },

  // Server-side rendering timeouts
  ssrTimeouts: {
    apiCall: 5000,     // 5 seconds for API calls
    pageRender: 5000,  // 5 seconds for complete page render (aligned with test expectations)
    fallback: 2000,    // 2 seconds before fallback to CSR
    dataFetch: 8000    // 8 seconds for data fetching operations
  },

  // Cache performance metrics
  cacheMetrics: {
    hitRateThreshold: 0.8, // 80% cache hit rate target
    responseTimeThreshold: 200, // 200ms response time target
    revalidationFrequency: 300 // 5 minutes between revalidation checks
  }
} as const;

/**
 * Environment-specific cache configurations
 */
export function getEnvironmentCacheConfig() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    // Shorter cache times in development for faster iteration
    revalidateMultiplier: isDevelopment ? 0.1 : 1,

    // Enable/disable caching features
    enableISR: !isDevelopment || process.env.ENABLE_ISR === 'true',
    enableStaticGeneration: isProduction,
    enableCacheHeaders: isProduction,

    // Logging and monitoring
    enableCacheLogging: isDevelopment || process.env.ENABLE_CACHE_LOGGING === 'true',
    enablePerformanceMonitoring: isProduction || process.env.ENABLE_PERF_MONITORING === 'true'
  };
}