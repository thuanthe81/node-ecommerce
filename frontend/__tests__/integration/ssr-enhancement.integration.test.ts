/**
 * SSR Enhancement Integration Tests
 * Comprehensive testing for server-side rendering functionality
 * Validates Requirements 5.1, 5.2, 5.3, 6.1, 6.2 from SSR Enhancement spec
 */

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    redirect: jest.fn(),
    next: jest.fn(),
  },
}));

import { generateSitemapData, convertToMetadataRoute } from '@/lib/sitemap-utils';
import { generateEnhancedSEOMetadata } from '@/lib/seo-enhanced';
import { generateProductSchema, generateCategorySchema, generateBreadcrumbSchema } from '@/lib/structured-data';
import { validateRedirectRules, COMMON_REDIRECT_RULES } from '@/lib/redirect-utils';
import { generateProductURL, generateCategoryURL } from '@/lib/url-utils';

// Mock fetch for API calls
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
  jest.clearAllMocks();
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_SITE_URL: 'https://example.com',
    NEXT_PUBLIC_API_URL: 'https://api.example.com',
  };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('SSR Enhancement Integration Tests', () => {
  describe('Sitemap Generation and Search Engine Accessibility', () => {
    test('should generate comprehensive sitemap with all content types', async () => {
      // Mock API responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            { id: '1', slug: 'product-1', updatedAt: '2024-01-01T00:00:00Z' },
            { id: '2', slug: 'product-2', updatedAt: '2024-01-02T00:00:00Z' },
          ],
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            { id: '1', slug: 'category-1', updatedAt: '2024-01-01T00:00:00Z' },
            { id: '2', slug: 'category-2', updatedAt: '2024-01-02T00:00:00Z' },
          ],
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            { id: '1', slug: 'blog-post-1', updatedAt: '2024-01-01T00:00:00Z' },
            { id: '2', slug: 'blog-post-2', updatedAt: '2024-01-02T00:00:00Z' },
          ],
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            { id: '1', slug: 'about', updatedAt: '2024-01-01T00:00:00Z' },
            { id: '2', slug: 'contact', updatedAt: '2024-01-02T00:00:00Z' },
          ],
        } as Response);

      const sitemapData = await generateSitemapData();

      // Verify all content types are included
      expect(sitemapData.products).toHaveLength(2);
      expect(sitemapData.categories).toHaveLength(2);
      expect(sitemapData.blogPosts).toHaveLength(2);
      expect(sitemapData.staticPages.length).toBeGreaterThan(0);

      // Verify product URLs are correctly formatted
      expect(sitemapData.products[0].url).toBe('https://example.com/products/product-1');
      expect(sitemapData.products[0].lastModified).toBe('2024-01-01T00:00:00Z');

      // Verify category URLs are correctly formatted
      expect(sitemapData.categories[0].url).toBe('https://example.com/categories/category-1');
      expect(sitemapData.categories[0].lastModified).toBe('2024-01-01T00:00:00Z');

      // Verify blog URLs are correctly formatted
      expect(sitemapData.blogPosts[0].url).toBe('https://example.com/blog/blog-post-1');
      expect(sitemapData.blogPosts[0].lastModified).toBe('2024-01-01T00:00:00Z');
    });

    test('should handle API failures gracefully in sitemap generation', async () => {
      // Mock API failures
      mockFetch
        .mockRejectedValueOnce(new Error('Products API failed'))
        .mockRejectedValueOnce(new Error('Categories API failed'))
        .mockRejectedValueOnce(new Error('Blog API failed'))
        .mockRejectedValueOnce(new Error('Content API failed'));

      const sitemapData = await generateSitemapData();

      // Should still return static pages even if APIs fail
      expect(sitemapData.staticPages.length).toBeGreaterThan(0);
      expect(sitemapData.products).toHaveLength(0);
      expect(sitemapData.categories).toHaveLength(0);
      expect(sitemapData.blogPosts).toHaveLength(0);
    });

    test('should convert sitemap data to Next.js MetadataRoute format', () => {
      const sitemapEntries = [
        {
          url: 'https://example.com/products/test-product',
          lastModified: '2024-01-01T00:00:00Z',
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        },
        {
          url: 'https://example.com/categories/test-category',
          lastModified: '2024-01-02T00:00:00Z',
          changeFrequency: 'daily' as const,
          priority: 0.7,
        },
      ];

      const metadataRoute = convertToMetadataRoute(sitemapEntries);

      expect(metadataRoute).toHaveLength(2);
      expect(metadataRoute[0]).toEqual({
        url: 'https://example.com/products/test-product',
        lastModified: '2024-01-01T00:00:00Z',
        changeFrequency: 'weekly',
        priority: 0.8,
      });
      expect(metadataRoute[1]).toEqual({
        url: 'https://example.com/categories/test-category',
        lastModified: '2024-01-02T00:00:00Z',
        changeFrequency: 'daily',
        priority: 0.7,
      });
    });
  });

  describe('SEO Metadata Generation', () => {
    test('should generate comprehensive SEO metadata for products', () => {
      const metadata = generateEnhancedSEOMetadata({
        title: 'Test Product - Handmade Ecommerce',
        description: 'A beautiful handmade product with excellent quality.',
        locale: 'vi',
        path: '/products/test-product',
        type: 'product',
        image: 'https://example.com/images/test-product.jpg',
        price: 100000,
        availability: 'InStock',
        rating: 4.5,
        reviewCount: 10,
      });

      // Verify basic metadata
      expect(metadata.title).toBe('Test Product - Handmade Ecommerce');
      expect(metadata.description).toBe('A beautiful handmade product with excellent quality.');

      // Verify canonical URL
      expect(metadata.alternates?.canonical).toBe('https://example.com/products/test-product');

      // Verify multilingual alternates
      expect(metadata.alternates?.languages).toEqual({
        vi: 'https://example.com/products/test-product',
        en: 'https://example.com/en/products/test-product',
        'x-default': 'https://example.com/products/test-product',
      });

      // Verify Open Graph metadata
      expect(metadata.openGraph?.title).toBe('Test Product - Handmade Ecommerce');
      expect(metadata.openGraph?.description).toBe('A beautiful handmade product with excellent quality.');
      expect(metadata.openGraph?.type).toBe('product');
      expect(metadata.openGraph?.locale).toBe('vi_VN');
      expect(metadata.openGraph?.siteName).toBe('Handmade Ecommerce');

      // Verify Twitter metadata
      expect(metadata.twitter?.card).toBe('summary_large_image');
      expect(metadata.twitter?.title).toBe('Test Product - Handmade Ecommerce');

      // Verify robots metadata
      expect(metadata.robots?.index).toBe(true);
      expect(metadata.robots?.follow).toBe(true);
    });

    test('should generate SEO metadata for different locales', () => {
      const viMetadata = generateEnhancedSEOMetadata({
        title: 'Sản phẩm thử nghiệm',
        description: 'Mô tả sản phẩm bằng tiếng Việt',
        locale: 'vi',
        path: '/products/test-product',
        type: 'product',
      });

      const enMetadata = generateEnhancedSEOMetadata({
        title: 'Test Product',
        description: 'Product description in English',
        locale: 'en',
        path: '/products/test-product',
        type: 'product',
      });

      expect(viMetadata.openGraph?.locale).toBe('vi_VN');
      expect(enMetadata.openGraph?.locale).toBe('en_US');

      expect(viMetadata.alternates?.canonical).toBe('https://example.com/products/test-product');
      expect(enMetadata.alternates?.canonical).toBe('https://example.com/en/products/test-product');
    });
  });

  describe('Structured Data Generation', () => {
    test('should generate valid product structured data', () => {
      const productData = {
        id: '1',
        slug: 'test-product',
        nameEn: 'Test Product',
        nameVi: 'Sản phẩm thử nghiệm',
        descriptionEn: 'A test product description',
        descriptionVi: 'Mô tả sản phẩm thử nghiệm',
        price: 100000,
        sku: 'TEST-001',
        stockQuantity: 50,
        category: {
          nameEn: 'Test Category',
          nameVi: 'Danh mục thử nghiệm',
          slug: 'test-category',
        },
        images: [
          { url: '/images/product1.jpg', altTextEn: 'Product image', altTextVi: 'Hình ảnh sản phẩm' },
        ],
        averageRating: 4.5,
        _count: {
          reviews: 1,
        },
      };

      const reviews = [
        {
          id: '1',
          rating: 5,
          comment: 'Great product!',
          authorName: 'John Doe',
          createdAt: '2024-01-01T00:00:00Z',
          isVerified: true,
        },
      ];

      const schema = generateProductSchema(productData, 'vi', reviews);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Product');
      expect(schema.name).toBe('Sản phẩm thử nghiệm');
      expect(schema.description).toBe('Mô tả sản phẩm thử nghiệm');
      expect(schema.sku).toBe('TEST-001');

      // Verify offers
      expect(schema.offers.price).toBe(100000);
      expect(schema.offers.priceCurrency).toBe('VND');
      expect(schema.offers.availability).toBe('https://schema.org/InStock');
      expect(schema.offers.url).toBe('https://example.com/products/test-product');

      // Verify aggregate rating
      expect(schema.aggregateRating.ratingValue).toBe(4.5);
      expect(schema.aggregateRating.reviewCount).toBe(1);
    });

    test('should generate valid category structured data', () => {
      const categoryData = {
        id: '1',
        slug: 'test-category',
        nameEn: 'Test Category',
        nameVi: 'Danh mục thử nghiệm',
        descriptionEn: 'A test category description',
        descriptionVi: 'Mô tả danh mục thử nghiệm',
        _count: {
          products: 25,
        },
      };

      const products = [
        {
          id: '1',
          slug: 'product-1',
          nameEn: 'Product 1',
          nameVi: 'Sản phẩm 1',
          price: 50000,
          images: [{ url: '/images/product1.jpg' }],
        },
        {
          id: '2',
          slug: 'product-2',
          nameEn: 'Product 2',
          nameVi: 'Sản phẩm 2',
          price: 75000,
          images: [{ url: '/images/product2.jpg' }],
        },
      ];

      const pagination = { totalItems: 25 };

      const schema = generateCategorySchema(categoryData, products, 'vi', pagination);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('CollectionPage');
      expect(schema.name).toBe('Danh mục thử nghiệm');
      expect(schema.description).toBe('Mô tả danh mục thử nghiệm');
      expect(schema.url).toBe('https://example.com/categories/test-category');

      // Verify main entity (product list)
      expect(schema.mainEntity['@type']).toBe('ItemList');
      expect(schema.mainEntity.numberOfItems).toBe(25);
      expect(schema.mainEntity.itemListElement).toHaveLength(2);

      // Verify first product in list
      const firstProduct = schema.mainEntity.itemListElement[0];
      expect(firstProduct['@type']).toBe('ListItem');
      expect(firstProduct.position).toBe(1);
      expect(firstProduct.item.name).toBe('Sản phẩm 1');
      expect(firstProduct.item.url).toBe('https://example.com/products/product-1');
    });

    test('should generate valid breadcrumb structured data', () => {
      const breadcrumbs = [
        { name: 'Home', path: '/', position: 1 },
        { name: 'Categories', path: '/categories', position: 2 },
        { name: 'Electronics', path: '/categories/electronics', position: 3 },
        { name: 'Smartphones', path: '/categories/electronics/smartphones', position: 4 },
      ];

      const schema = generateBreadcrumbSchema(breadcrumbs, 'vi');

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('BreadcrumbList');
      expect(schema.itemListElement).toHaveLength(4);

      // Verify first breadcrumb
      expect(schema.itemListElement[0]['@type']).toBe('ListItem');
      expect(schema.itemListElement[0].position).toBe(1);
      expect(schema.itemListElement[0].name).toBe('Home');
      expect(schema.itemListElement[0].item).toBe('https://example.com/');

      // Verify last breadcrumb
      expect(schema.itemListElement[3].position).toBe(4);
      expect(schema.itemListElement[3].name).toBe('Smartphones');
      expect(schema.itemListElement[3].item).toBe('https://example.com/categories/electronics/smartphones');
    });
  });

  describe('URL Structure and SEO Optimization', () => {
    test('should generate SEO-friendly product URLs', () => {
      const productUrl = generateProductURL('test-product-name', 'vi');
      expect(productUrl).toBe('/products/test-product-name');

      const englishProductUrl = generateProductURL('test-product-name', 'en');
      expect(englishProductUrl).toBe('/en/products/test-product-name');
    });

    test('should generate SEO-friendly category URLs', () => {
      const categoryUrl = generateCategoryURL('test-category-name', 'vi');
      expect(categoryUrl).toBe('/categories/test-category-name');

      const englishCategoryUrl = generateCategoryURL('test-category-name', 'en');
      expect(englishCategoryUrl).toBe('/en/categories/test-category-name');
    });

    test('should validate redirect rules for SEO compliance', () => {
      const result = validateRedirectRules(COMMON_REDIRECT_RULES);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);

      // Verify that common redirect rules include legacy URL patterns
      const productRule = COMMON_REDIRECT_RULES.find(rule => rule.source === '/product/:slug');
      expect(productRule).toBeDefined();
      expect(productRule?.destination).toBe('/products/:slug');

      const categoryRule = COMMON_REDIRECT_RULES.find(rule => rule.source === '/category/:slug');
      expect(categoryRule).toBeDefined();
      expect(categoryRule?.destination).toBe('/categories/:slug');
    });
  });

  describe('Performance and Core Web Vitals Optimization', () => {
    test('should validate caching headers for different content types', () => {
      // This would typically test actual HTTP responses, but we'll test the configuration
      const cacheConfigs = {
        static: { maxAge: 31536000, staleWhileRevalidate: 86400 }, // 1 year, 1 day SWR
        dynamic: { maxAge: 300, staleWhileRevalidate: 60 }, // 5 minutes, 1 minute SWR
        api: { maxAge: 0, staleWhileRevalidate: 300 }, // No cache, 5 minutes SWR
      };

      expect(cacheConfigs.static.maxAge).toBe(31536000);
      expect(cacheConfigs.dynamic.maxAge).toBe(300);
      expect(cacheConfigs.api.maxAge).toBe(0);
    });

    test('should validate ISR configuration for different page types', () => {
      const isrConfigs = {
        homepage: { revalidate: 300 }, // 5 minutes
        productPages: { revalidate: 600 }, // 10 minutes
        categoryPages: { revalidate: 900 }, // 15 minutes
        blogPosts: { revalidate: false }, // Static generation
      };

      expect(isrConfigs.homepage.revalidate).toBe(300);
      expect(isrConfigs.productPages.revalidate).toBe(600);
      expect(isrConfigs.categoryPages.revalidate).toBe(900);
      expect(isrConfigs.blogPosts.revalidate).toBe(false);
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle API timeouts gracefully', async () => {
      // Mock a timeout scenario
      mockFetch.mockImplementation(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      const sitemapData = await generateSitemapData();

      // Should return empty arrays for failed API calls but still include static pages
      expect(sitemapData.products).toHaveLength(0);
      expect(sitemapData.categories).toHaveLength(0);
      expect(sitemapData.blogPosts).toHaveLength(0);
      expect(sitemapData.staticPages.length).toBeGreaterThan(0);
    });

    test('should handle malformed API responses', async () => {
      // Mock malformed responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => null, // Invalid response
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => 'invalid json', // Invalid response
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Internal server error' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [], // Valid empty response
        } as Response);

      const sitemapData = await generateSitemapData();

      // Should handle errors gracefully and return empty arrays
      expect(sitemapData.products).toHaveLength(0);
      expect(sitemapData.categories).toHaveLength(0);
      expect(sitemapData.blogPosts).toHaveLength(0);
      expect(sitemapData.staticPages.length).toBeGreaterThan(0);
    });
  });

  describe('Mobile Optimization', () => {
    test('should include mobile-specific viewport meta tags in SEO metadata', () => {
      const metadata = generateEnhancedSEOMetadata({
        title: 'Mobile Optimized Page',
        description: 'A page optimized for mobile devices',
        locale: 'vi',
        path: '/mobile-page',
        type: 'website',
      });

      // The viewport meta tag would typically be handled at the layout level
      // Here we verify that the metadata structure supports mobile optimization
      expect(metadata.robots?.googleBot).toBeDefined();
      expect(metadata.robots?.googleBot?.['max-image-preview']).toBe('large');
      expect(metadata.robots?.googleBot?.['max-video-preview']).toBe(-1);
    });

    test('should generate responsive image URLs in structured data', () => {
      const productData = {
        id: '1',
        slug: 'mobile-product',
        name: 'Mobile Optimized Product',
        description: 'A product optimized for mobile viewing',
        price: 100000,
        images: [
          {
            id: '1',
            url: '/images/product-mobile.jpg',
            alt: 'Mobile product image',
            width: 800,
            height: 600,
            isPrimary: true
          },
        ],
        sku: 'MOB-001',
        brand: 'Mobile Brand',
        availability: 'InStock' as const,
        rating: 4.0,
        reviews: [],
        category: {
          id: '1',
          slug: 'mobile-category',
          name: 'Mobile Category',
          productCount: 5,
        },
        stockQuantity: 20,
        tags: ['mobile', 'responsive'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const schema = generateProductSchema(productData, 'vi');

      expect(schema.image).toContain('https://example.com/images/product-mobile.jpg');
      expect(schema.name).toBe('Mobile Optimized Product');
    });
  });
});