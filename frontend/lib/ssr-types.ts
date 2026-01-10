/**
 * Enhanced TypeScript interfaces for SSR-optimized data models
 * Provides comprehensive type definitions for products, categories, SEO, and SSR operations
 */
import { EnhancedProduct, Product } from '@/lib/product-api';

// Base interfaces for multilingual content
export interface MultilingualText {
  en: string;
  vi: string;
}

export interface MultilingualOptionalText {
  en?: string;
  vi?: string;
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'inch';
}

export interface EnhancedProductImage {
  id: string;
  url: string;
  altTextEn?: string;
  altTextVi?: string;
  width: number;
  height: number;
  displayOrder: number;
  isPrimary: boolean;
}

export interface ProductReview {
  id: string;
  rating: number;
  comment: string;
  authorName: string;
  authorEmail?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Enhanced Category interfaces
export interface EnhancedCategory {
  id: string;
  slug: string;
  nameEn: string;
  nameVi: string;
  descriptionEn?: string;
  descriptionVi?: string;
  parentId?: string;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
  seoTitleEn?: string;
  seoTitleVi?: string;
  seoDescriptionEn?: string;
  seoDescriptionVi?: string;
  parent?: EnhancedCategory;
  children?: EnhancedCategory[];
  productCount: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
  };
}

// Blog and Content interfaces
export interface EnhancedBlogPost {
  id: string;
  slug: string;
  titleEn: string;
  titleVi: string;
  contentEn: string;
  contentVi: string;
  excerptEn?: string;
  excerptVi?: string;
  imageUrl?: string;
  publishedAt: string;
  updatedAt: string;
  isPublished: boolean;
  author: string;
  category?: BlogCategory;
  tags: string[];
  seoTitleEn?: string;
  seoTitleVi?: string;
  seoDescriptionEn?: string;
  seoDescriptionVi?: string;
  readingTime?: number;
}

export interface BlogCategory {
  id: string;
  slug: string;
  nameEn: string;
  nameVi: string;
  descriptionEn?: string;
  descriptionVi?: string;
  postCount: number;
}

// Homepage and Content Section interfaces
export interface HomepageSection {
  id: string;
  type: 'HERO' | 'FEATURED_PRODUCTS' | 'CATEGORIES' | 'TESTIMONIALS' | 'ABOUT';
  titleEn?: string;
  titleVi?: string;
  contentEn?: string;
  contentVi?: string;
  imageUrl?: string;
  linkUrl?: string;
  displayOrder: number;
  isActive: boolean;
  settings?: Record<string, any>;
}

export interface PromotionalBanner {
  id: string;
  titleEn: string;
  titleVi: string;
  descriptionEn?: string;
  descriptionVi?: string;
  imageUrl?: string;
  linkUrl?: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  displayOrder: number;
}

// SEO and Metadata interfaces
export interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl: string;
  ogImage?: string;
  ogType: 'website' | 'article' | 'product' | 'category';
  twitterCard: 'summary' | 'summary_large_image';
  structuredData: StructuredDataSchema[];
  breadcrumbs: BreadcrumbItem[];
  hreflangLinks: HreflangLink[];
  noindex?: boolean;
}

export interface BreadcrumbItem {
  name: string;
  path: string;
  position: number;
}

export interface HreflangLink {
  hreflang: string;
  href: string;
}

export interface StructuredDataSchema {
  '@context': string;
  '@type': string;
  [key: string]: any;
}

// SSR-specific interfaces
export interface SSRPageProps<T = any> {
  params: Promise<{ locale: string; [key: string]: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
  data?: T;
  error?: SSRError;
  fallbackToCSR?: boolean;
}

export interface SSRError {
  code: string;
  message: string;
  userMessage: string;
  isRetryable: boolean;
  shouldFallbackToCSR: boolean;
  timestamp: string;
}

export interface SSRDataResult<T> {
  data: T | null;
  error: SSRError | null;
  fallbackToCSR: boolean;
  cacheHit: boolean;
  renderTime: number;
}

// API Response interfaces
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ProductsResponse extends PaginatedResponse<EnhancedProduct> {}
export interface CategoriesResponse extends PaginatedResponse<EnhancedCategory> {}
export interface BlogPostsResponse extends PaginatedResponse<EnhancedBlogPost> {}

// Query parameter interfaces
export interface ProductQueryParams {
  search?: string;
  categoryId?: string;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isFeatured?: boolean;
  sortBy?: 'price' | 'name' | 'createdAt' | 'rating';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  tags?: string[];
}

export interface CategoryQueryParams {
  parentId?: string;
  includeProducts?: boolean;
  includeChildren?: boolean;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface BlogQueryParams {
  categoryId?: string;
  categorySlug?: string;
  search?: string;
  tags?: string[];
  isPublished?: boolean;
  sortBy?: 'publishedAt' | 'title' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Homepage data interface
export interface HomepageData {
  featuredProducts: EnhancedProduct[];
  categories: EnhancedCategory[];
  promotionalBanners: PromotionalBanner[];
  homepageSections: HomepageSection[];
  seoData: SEOMetadata;
}

// Category page data interface
export interface CategoryPageData {
  category: EnhancedCategory;
  products: EnhancedProduct[];
  breadcrumbs: BreadcrumbItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    priceRange: { min: number; max: number };
    availableTags: string[];
    inStockCount: number;
  };
  seoData: SEOMetadata;
}

// Product page data interface
export interface ProductPageData {
  product: EnhancedProduct;
  relatedProducts: EnhancedProduct[];
  breadcrumbs: BreadcrumbItem[];
  reviews: ProductReview[];
  seoData: SEOMetadata;
}

// Blog page data interface
export interface BlogPageData {
  posts: EnhancedBlogPost[];
  categories: BlogCategory[];
  featuredPosts: EnhancedBlogPost[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  seoData: SEOMetadata;
}

export interface BlogPostPageData {
  post: EnhancedBlogPost;
  relatedPosts: EnhancedBlogPost[];
  breadcrumbs: BreadcrumbItem[];
  seoData: SEOMetadata;
}

// Sitemap interfaces
export interface SitemapEntry {
  url: string;
  lastModified?: string | Date;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export interface SitemapData {
  products: SitemapEntry[];
  categories: SitemapEntry[];
  blogPosts: SitemapEntry[];
  staticPages: SitemapEntry[];
}

// Cache interfaces
export interface CacheConfig {
  revalidate?: number; // seconds
  tags?: string[];
}

export interface ISRConfig extends CacheConfig {
  fallback?: boolean | 'blocking';
}

// Performance monitoring interfaces
export interface PerformanceMetrics {
  renderTime: number;
  apiCallTime: number;
  cacheHitRate: number;
  errorRate: number;
  timestamp: string;
}

export interface CoreWebVitals {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
}

// Utility types for locale-specific content
export type LocalizedContent<T> = {
  [K in keyof T]: T[K] extends string
    ? { en: string; vi: string }
    : T[K] extends string | undefined
    ? { en?: string; vi?: string }
    : T[K];
};

export type LocaleSpecificContent<T> = {
  [K in keyof T]: T[K] extends { en: string; vi: string }
    ? string
    : T[K] extends { en?: string; vi?: string }
    ? string | undefined
    : T[K];
};

// Helper type for extracting locale-specific content
export type ExtractLocaleContent<T, L extends 'en' | 'vi'> = {
  [K in keyof T]: T[K] extends { en: infer E; vi: infer V }
    ? L extends 'en'
      ? E
      : V
    : T[K];
};

// Type guards
export function isEnhancedProduct(obj: any): obj is EnhancedProduct {
  return obj && typeof obj === 'object' && 'id' in obj && 'slug' in obj && 'nameEn' in obj && 'nameVi' in obj;
}

export function isEnhancedCategory(obj: any): obj is EnhancedCategory {
  return obj && typeof obj === 'object' && 'id' in obj && 'slug' in obj && 'nameEn' in obj && 'nameVi' in obj;
}

export function isSSRError(obj: any): obj is SSRError {
  return obj && typeof obj === 'object' && 'code' in obj && 'shouldFallbackToCSR' in obj;
}