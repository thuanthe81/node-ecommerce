/**
 * Comprehensive SSR utilities for data fetching, caching, and error handling
 * Provides high-level functions for common SSR operations
 */

import { Metadata } from 'next';
import {
  safeSSRFetch,
  SSRFallbackData,
  SSRTimeoutConfig,
  monitorSSRPerformance,
  getSSREnvVar
} from './ssr-error-handling';
import {
  generateEnhancedSEOMetadata,
  generateProductSEOMetadata,
  generateCategorySEOMetadata,
  generateHomepageSEOMetadata,
  generateBlogPostSEOMetadata,
  generatePaginationMetadata,
  EnhancedSEOOptions
} from './seo-enhanced';
import {
  generateProductSchema,
  generateCategorySchema,
  generateBreadcrumbSchema,
  generateArticleSchema,
  generateOrganizationSchema,
  generateWebsiteSchema,
  combineStructuredData,
  ProductData,
  CategoryData,
  BlogPostData,
  BreadcrumbItem
} from './structured-data';
import { getFetchOptions, getCacheStrategy } from './cache-config';
import {
  EnhancedCategory,
  EnhancedBlogPost,
  HomepageData,
  CategoryPageData,
  ProductPageData,
  BlogPageData,
  BlogPostPageData,
  SSRDataResult,
  ProductQueryParams,
  CategoryQueryParams,
  BlogQueryParams
} from './ssr-types';
import { productApi, EnhancedProduct } from '@/lib/product-api';

// Configuration
const API_BASE_URL = getSSREnvVar('NEXT_PUBLIC_API_URL', 'http://localhost:3001');
const SITE_URL = getSSREnvVar('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000');

const DEFAULT_SSR_CONFIG: SSRTimeoutConfig = {
  apiTimeout: 5000, // 5 seconds
  totalTimeout: 10000, // 10 seconds
  retryAttempts: 2,
  retryDelay: 1000,
};

/**
 * Fetches product data with SSR error handling and fallbacks
 */
export async function fetchProductSSR(
  slug: string,
  config: Partial<SSRTimeoutConfig> = {}
): Promise<SSRDataResult<EnhancedProduct>> {
  const fetchOperation = async (): Promise<EnhancedProduct> => {
    return await productApi.getProductBySlug(`${API_BASE_URL}/products/${slug}`);
  };

  return monitorSSRPerformance(
    () => safeSSRFetch(fetchOperation, null, { ...DEFAULT_SSR_CONFIG, ...config }, `Product fetch: ${slug}`),
    `fetchProductSSR:${slug}`
  );
}

/**
 * Fetches category data with products for SSR
 */
export async function fetchCategorySSR(
  slug: string,
  params: ProductQueryParams = {},
  config: Partial<SSRTimeoutConfig> = {}
): Promise<SSRDataResult<CategoryPageData>> {
  const fetchOperation = async (): Promise<CategoryPageData> => {
    // First fetch the category data
    const categoryResponse = await fetch(`${API_BASE_URL}/categories/slug/${slug}`, {
      ...getFetchOptions('categoryPages'),
    });

    if (!categoryResponse.ok) {
      if (categoryResponse.status === 404) {
        throw new Error(`Category not found: ${slug}`, { cause: { code: 'NOT_FOUND' } });
      }
      throw new Error(`Failed to fetch category: ${categoryResponse.status} ${categoryResponse.statusText}`);
    }

    const category: EnhancedCategory = await categoryResponse.json();

    // Then fetch products for this category
    const queryParams = new URLSearchParams();
    queryParams.append('categoryId', category.id);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && key !== 'categoryId') {
        queryParams.append(key, value.toString());
      }
    });

    const productsResponse = await fetch(`${API_BASE_URL}/products?${queryParams}`, {
      ...getFetchOptions('categoryPages'),
    });

    if (!productsResponse.ok) {
      throw new Error(`Failed to fetch category products: ${productsResponse.status}`);
    }

    const productsData = await productsResponse.json();

    // Generate breadcrumbs
    const breadcrumbs: BreadcrumbItem[] = [
      { name: 'Home', path: '/', position: 1 },
      { name: 'Categories', path: '/categories', position: 2 },
    ];

    if (category.parent) {
      breadcrumbs.push({
        name: category.parent.nameEn, // Will be localized in component
        path: `/categories/${category.parent.slug}`,
        position: 3,
      });
    }

    breadcrumbs.push({
      name: category.nameEn, // Will be localized in component
      path: `/categories/${category.slug}`,
      position: breadcrumbs.length + 1,
    });

    return {
      category,
      products: productsData.data || productsData, // Handle both paginated and non-paginated responses
      breadcrumbs,
      pagination: productsData.meta ? {
        currentPage: productsData.meta.page,
        totalPages: productsData.meta.totalPages,
        totalItems: productsData.meta.total,
        hasNext: productsData.meta.page < productsData.meta.totalPages,
        hasPrev: productsData.meta.page > 1,
      } : {
        currentPage: 1,
        totalPages: 1,
        totalItems: productsData.length || 0,
        hasNext: false,
        hasPrev: false,
      },
      filters: {
        priceRange: { min: 0, max: 1000000 }, // TODO: Calculate from actual data
        availableTags: [], // TODO: Extract from products
        inStockCount: (productsData.data || productsData).filter((p: EnhancedProduct) => p.stockQuantity > 0).length,
      },
      seoData: {
        title: category.nameEn, // Will be localized
        description: category.descriptionEn || '',
        keywords: [],
        canonicalUrl: `${SITE_URL}/categories/${slug}`,
        ogType: 'website',
        twitterCard: 'summary_large_image',
        structuredData: [],
        breadcrumbs,
        hreflangLinks: [],
      },
    };
  };

  return monitorSSRPerformance(
    () => safeSSRFetch(fetchOperation, null, { ...DEFAULT_SSR_CONFIG, ...config }, `Category fetch: ${slug}`),
    `fetchCategorySSR:${slug}`
  );
}

/**
 * Fetches homepage data for SSR
 */
export async function fetchHomepageSSR(
  config: Partial<SSRTimeoutConfig> = {}
): Promise<SSRDataResult<HomepageData>> {
  const fetchOperation = async (): Promise<HomepageData> => {
    const [featuredProducts, categories, banners, sections] = await Promise.all([
      fetch(`${API_BASE_URL}/products/featured`, {
        ...getFetchOptions('homepage'),
      }).then(res => res.ok ? res.json() : []),

      fetch(`${API_BASE_URL}/categories`, {
        ...getFetchOptions('homepage'),
      }).then(res => res.ok ? res.json() : []),

      fetch(`${API_BASE_URL}/banners/active`, {
        ...getFetchOptions('homepage'),
      }).then(res => res.ok ? res.json() : []),

      fetch(`${API_BASE_URL}/homepage-sections`, {
        ...getFetchOptions('homepage'),
      }).then(res => res.ok ? res.json() : []),
    ]);

    return {
      featuredProducts,
      categories,
      promotionalBanners: banners,
      homepageSections: sections,
      seoData: {
        title: 'Handmade Ecommerce',
        description: 'High quality handmade products',
        keywords: ['handmade', 'artisan', 'quality'],
        canonicalUrl: SITE_URL,
        ogType: 'website',
        twitterCard: 'summary_large_image',
        structuredData: [],
        breadcrumbs: [],
        hreflangLinks: [],
      },
    };
  };

  return monitorSSRPerformance(
    () => safeSSRFetch(fetchOperation, null, { ...DEFAULT_SSR_CONFIG, ...config }, 'Homepage fetch'),
    'fetchHomepageSSR'
  );
}

/**
 * Fetches blog post data for SSR
 */
export async function fetchBlogPostSSR(
  slug: string,
  config: Partial<SSRTimeoutConfig> = {}
): Promise<SSRDataResult<BlogPostPageData>> {
  const fetchOperation = async (): Promise<BlogPostPageData> => {
    const [postResponse, relatedResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/blog/slug/${slug}`, {
        ...getFetchOptions('blogPosts'),
      }),
      fetch(`${API_BASE_URL}/blog/related/${slug}?limit=3`, {
        ...getFetchOptions('blogPosts'),
      }),
    ]);

    if (!postResponse.ok) {
      throw new Error(`Failed to fetch blog post: ${postResponse.status}`);
    }

    const post: EnhancedBlogPost = await postResponse.json();
    const relatedPosts: EnhancedBlogPost[] = relatedResponse.ok ? await relatedResponse.json() : [];

    const breadcrumbs: BreadcrumbItem[] = [
      { name: 'Home', path: '/', position: 1 },
      { name: 'Blog', path: '/blog', position: 2 },
      { name: post.titleEn, path: `/blog/${post.slug}`, position: 3 },
    ];

    return {
      post,
      relatedPosts,
      breadcrumbs,
      seoData: {
        title: post.titleEn,
        description: post.excerptEn || '',
        keywords: post.tags,
        canonicalUrl: `${SITE_URL}/blog/${slug}`,
        ogType: 'article',
        twitterCard: 'summary_large_image',
        structuredData: [],
        breadcrumbs,
        hreflangLinks: [],
      },
    };
  };

  return monitorSSRPerformance(
    () => safeSSRFetch(fetchOperation, null, { ...DEFAULT_SSR_CONFIG, ...config }, `Blog post fetch: ${slug}`),
    `fetchBlogPostSSR:${slug}`
  );
}

/**
 * Generates comprehensive metadata for product pages
 */
export async function generateProductMetadata(
  slug: string,
  locale: string
): Promise<Metadata> {
  const result = await fetchProductSSR(slug);

  if (!result.data) {
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be found.',
    };
  }

  return generateProductSEOMetadata({
    product: result.data,
    locale,
    path: `/products/${slug}`,
  });
}

/**
 * Generates comprehensive metadata for category pages
 */
export async function generateCategoryMetadata(
  slug: string,
  locale: string,
  searchParams: { page?: string } = {}
): Promise<Metadata> {
  const page = parseInt(searchParams.page || '1', 10);
  const result = await fetchCategorySSR(slug, { page });

  if (!result.data) {
    return {
      title: 'Category Not Found',
      description: 'The requested category could not be found.',
    };
  }

  const baseMetadata = generateCategorySEOMetadata({
    category: result.data.category,
    locale,
    path: `/categories/${slug}`,
    page,
  });

  // Add pagination metadata if needed
  if (result.data.pagination.totalPages > 1) {
    const paginationMetadata = generatePaginationMetadata({
      currentPage: page,
      totalPages: result.data.pagination.totalPages,
      basePath: `/categories/${slug}`,
      locale,
    });

    return {
      ...baseMetadata,
      ...paginationMetadata,
    };
  }

  return baseMetadata;
}

/**
 * Generates comprehensive metadata for blog post pages
 */
export async function generateBlogPostMetadata(
  slug: string,
  locale: string
): Promise<Metadata> {
  const result = await fetchBlogPostSSR(slug);

  if (!result.data) {
    return {
      title: 'Blog Post Not Found',
      description: 'The requested blog post could not be found.',
    };
  }

  return generateBlogPostSEOMetadata({
    post: result.data.post,
    locale,
  });
}

/**
 * Generates structured data for product pages
 */
export function generateProductStructuredData(
  product: EnhancedProduct,
  locale: string,
  reviews?: any[]
): string {
  const productSchema = generateProductSchema(product, locale, reviews);
  const breadcrumbs = [
    { name: 'Home', path: '/', position: 1 },
    { name: 'Products', path: '/products', position: 2 },
    { name: product.category.nameEn, path: `/categories/${product.category.slug}`, position: 3 },
    { name: product.nameEn, path: `/products/${product.slug}`, position: 4 },
  ];
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs, locale);

  return combineStructuredData([productSchema, breadcrumbSchema]);
}

/**
 * Generates structured data for category pages
 */
export function generateCategoryStructuredData(
  category: EnhancedCategory,
  products: EnhancedProduct[],
  locale: string,
  pagination?: any
): string {
  const categorySchema = generateCategorySchema(category, products, locale, pagination);
  const breadcrumbs = [
    { name: 'Home', path: '/', position: 1 },
    { name: 'Categories', path: '/categories', position: 2 },
    { name: category.nameEn, path: `/categories/${category.slug}`, position: 3 },
  ];
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs, locale);

  return combineStructuredData([categorySchema, breadcrumbSchema]);
}

/**
 * Generates structured data for homepage
 */
export function generateHomepageStructuredData(locale: string): string {
  const organizationSchema = generateOrganizationSchema(locale);
  const websiteSchema = generateWebsiteSchema(locale);

  return combineStructuredData([organizationSchema, websiteSchema]);
}

/**
 * Generates structured data for blog posts
 */
export function generateBlogPostStructuredData(
  post: EnhancedBlogPost,
  locale: string,
  author?: string
): string {
  const articleSchema = generateArticleSchema(post, locale, author);
  const breadcrumbs = [
    { name: 'Home', path: '/', position: 1 },
    { name: 'Blog', path: '/blog', position: 2 },
    { name: post.titleEn, path: `/blog/${post.slug}`, position: 3 },
  ];
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs, locale);

  return combineStructuredData([articleSchema, breadcrumbSchema]);
}

/**
 * Utility to check if SSR data should fallback to CSR
 */
export function shouldFallbackToCSR<T>(result: SSRDataResult<T>): boolean {
  return result.fallbackToCSR || (!result.data && result.error?.shouldFallbackToCSR === true);
}

/**
 * Utility to extract error message for user display
 */
export function getSSRErrorMessage<T>(result: SSRDataResult<T>, locale: string = 'en'): string {
  if (!result.error) return '';

  return result.error.userMessage || (locale === 'vi'
    ? 'Đã xảy ra lỗi khi tải trang. Vui lòng thử lại.'
    : 'An error occurred while loading the page. Please try again.');
}

/**
 * Utility to generate cache tags for ISR invalidation
 */
export function generateCacheTags(type: string, identifiers: string[]): string[] {
  return identifiers.map(id => `${type}:${id}`);
}

/**
 * Utility to revalidate cached pages
 */
export async function revalidateSSRCache(tags: string[]): Promise<void> {
  try {
    // Use the new revalidation API endpoint
    const revalidationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/sitemap-api/revalidate`;
    const token = process.env.REVALIDATION_TOKEN;

    if (!token) {
      console.warn('REVALIDATION_TOKEN not set, skipping cache revalidation');
      return;
    }

    const response = await fetch(revalidationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        type: 'all',
        action: 'revalidate',
        tags
      })
    });

    if (!response.ok) {
      throw new Error(`Revalidation failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Cache revalidation successful:', result);

  } catch (error) {
    console.error('Error revalidating cache:', error);

    // Fallback for development
    if (process.env.NODE_ENV === 'development') {
      console.log('Would revalidate cache tags:', tags);
    }
  }
}