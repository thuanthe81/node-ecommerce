/**
 * Cache Key Constants and Generators
 *
 * Centralized cache key definitions and generator functions to ensure
 * consistent cache key naming and prevent key collisions.
 */

/**
 * Category Cache Keys Interface
 */
export interface CategoryCacheKeys {
  /** Cache key for category tree structure */
  TREE: string;
  /** Generate cache key for category by slug */
  BY_SLUG: (slug: string) => string;
  /** Generate cache key for category by ID */
  BY_ID: (id: string) => string;
}

/**
 * Product Cache Keys Interface
 */
export interface ProductCacheKeys {
  /** Cache key for product list */
  LIST: string;
  /** Generate cache key for product by ID */
  BY_ID: (id: string) => string;
  /** Generate cache key for product by slug */
  BY_SLUG: (slug: string) => string;
  /** Cache key for featured products */
  FEATURED: string;
  /** Generate cache key for products by category */
  BY_CATEGORY: (categoryId: string) => string;
}

/**
 * Shipping Cache Keys Interface
 */
export interface ShippingCacheKeys {
  /** Cache key for active shipping methods */
  METHODS: string;
  /** Generate cache key for shipping rates calculation */
  RATES: (params: string) => string;
  /** Cache key for shipping method list */
  METHOD_LIST: string;
  /** Generate cache key for shipping method by ID */
  METHOD_BY_ID: (id: string) => string;
  /** Generate cache key for shipping method by method ID */
  METHOD_BY_METHOD_ID: (methodId: string) => string;
}

/**
 * Cart Cache Keys Interface
 */
export interface CartCacheKeys {
  /** Generate cache key for user cart */
  BY_USER: (userId: string) => string;
}

/**
 * Content Cache Keys Interface
 */
export interface ContentCacheKeys {
  /** Cache key for homepage sections */
  HOMEPAGE_SECTIONS: string;
  /** Generate cache key for blog post list */
  BLOG_LIST: (page: number, limit: number, published?: boolean, categorySlug?: string) => string;
  /** Generate cache key for blog post by slug */
  BLOG_POST: (slug: string) => string;
  /** Generate cache key for related blog posts */
  BLOG_RELATED: (postId: string) => string;
}

/**
 * Settings Cache Keys Interface
 */
export interface SettingsCacheKeys {
  /** Cache key for footer settings */
  FOOTER: string;
}

/**
 * Session Cache Keys Interface
 */
export interface SessionCacheKeys {
  /** Generate cache key for user session */
  BY_ID: (sessionId: string) => string;
}

/**
 * Cache Keys Object
 *
 * Consolidated cache key constants and generator functions.
 */
export const CACHE_KEYS = {
  /**
   * Category Cache Keys
   *
   * Cache keys for category-related data including tree structure and individual categories.
   */
  CATEGORIES: {
    /** Cache key for category tree structure */
    TREE: 'categories:tree',
    /** Generate cache key for category by slug */
    BY_SLUG: (slug: string) => `category:slug:${slug}`,
    /** Generate cache key for category by ID */
    BY_ID: (id: string) => `category:id:${id}`,
  } as const,

  /**
   * Product Cache Keys
   *
   * Cache keys for product-related data including lists, individual products, and filtered results.
   */
  PRODUCTS: {
    /** Cache key for product list */
    LIST: 'products:list',
    /** Generate cache key for product by ID */
    BY_ID: (id: string) => `product:id:${id}`,
    /** Generate cache key for product by slug */
    BY_SLUG: (slug: string) => `product:slug:${slug}`,
    /** Cache key for featured products */
    FEATURED: 'products:featured',
    /** Generate cache key for products by category */
    BY_CATEGORY: (categoryId: string) => `products:category:${categoryId}`,
  } as const,

  /**
   * Shipping Cache Keys
   *
   * Cache keys for shipping-related data including methods and rate calculations.
   */
  SHIPPING: {
    /** Cache key for active shipping methods */
    METHODS: 'shipping:methods:active',
    /** Generate cache key for shipping rates calculation */
    RATES: (params: string) => `shipping:rates:${params}`,
    /** Cache key for shipping method list */
    METHOD_LIST: 'shipping:methods:list',
    /** Generate cache key for shipping method by ID */
    METHOD_BY_ID: (id: string) => `shipping:method:id:${id}`,
    /** Generate cache key for shipping method by method ID */
    METHOD_BY_METHOD_ID: (methodId: string) =>
      `shipping:method:methodId:${methodId}`,
  } as const,

  /**
   * Cart Cache Keys
   *
   * Cache keys for cart-related data including user-specific carts.
   */
  CART: {
    /** Generate cache key for user cart */
    BY_USER: (userId: string) => `cart:user:${userId}`,
  } as const,

  /**
   * Content Cache Keys
   *
   * Cache keys for content-related data including homepage sections and blog posts.
   */
  CONTENT: {
    /** Cache key for homepage sections */
    HOMEPAGE_SECTIONS: 'homepage:sections',
    /** Generate cache key for blog post list */
    BLOG_LIST: (page: number, limit: number, published?: boolean, categorySlug?: string) =>
      `blog:list:${page}:${limit}:${published !== undefined ? published : 'all'}:${categorySlug || 'all'}`,
    /** Generate cache key for blog post by slug */
    BLOG_POST: (slug: string) => `blog:post:${slug}`,
    /** Generate cache key for related blog posts */
    BLOG_RELATED: (postId: string) => `blog:related:${postId}`,
  } as const,

  /**
   * Settings Cache Keys
   *
   * Cache keys for application settings including footer configuration.
   */
  SETTINGS: {
    /** Cache key for footer settings */
    FOOTER: 'footer:settings',
  } as const,

  /**
   * Session Cache Keys
   *
   * Cache keys for user session management.
   */
  SESSION: {
    /** Generate cache key for user session */
    BY_ID: (sessionId: string) => `session:${sessionId}`,
  } as const,
} as const;

/**
 * Type Exports for Cache Keys
 */
export type CacheKeyGenerator<T extends readonly unknown[]> = (
  ...args: T
) => string;
export type CategoryCacheKeyType = keyof typeof CACHE_KEYS.CATEGORIES;
export type ProductCacheKeyType = keyof typeof CACHE_KEYS.PRODUCTS;
export type ShippingCacheKeyType = keyof typeof CACHE_KEYS.SHIPPING;
export type CartCacheKeyType = keyof typeof CACHE_KEYS.CART;
export type ContentCacheKeyType = keyof typeof CACHE_KEYS.CONTENT;
export type SettingsCacheKeyType = keyof typeof CACHE_KEYS.SETTINGS;
export type SessionCacheKeyType = keyof typeof CACHE_KEYS.SESSION;