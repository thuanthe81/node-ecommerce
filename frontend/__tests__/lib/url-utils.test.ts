/**
 * Tests for URL utilities
 * Validates URL normalization, canonical URL generation, and SEO-friendly slug creation
 */

import {
  normalizePath,
  generateCanonicalURL,
  generateSEOFriendlySlug,
  generateMultilingualURLs,
  validateSEOURL,
  generateBreadcrumbURLs,
  generatePaginationURLs,
  generateProductURL,
  generateCategoryURL,
  DEFAULT_URL_CONFIG,
} from '@/lib/url-utils';

describe('URL Utils', () => {
  describe('normalizePath', () => {
    test('removes trailing slashes', () => {
      expect(normalizePath('/products/')).toBe('/products');
      expect(normalizePath('/categories/electronics/')).toBe('/categories/electronics');
    });

    test('preserves root path', () => {
      expect(normalizePath('/')).toBe('/');
    });

    test('adds leading slash if missing', () => {
      expect(normalizePath('products')).toBe('/products');
      expect(normalizePath('categories/electronics')).toBe('/categories/electronics');
    });

    test('handles empty path', () => {
      expect(normalizePath('')).toBe('/');
    });
  });

  describe('generateCanonicalURL', () => {
    test('generates canonical URL for Vietnamese (default) locale', () => {
      const result = generateCanonicalURL({
        path: '/products/test-product',
        locale: 'vi',
      });
      expect(result).toBe('http://localhost:3000/products/test-product');
    });

    test('generates canonical URL for English locale', () => {
      const result = generateCanonicalURL({
        path: '/products/test-product',
        locale: 'en',
      });
      expect(result).toBe('http://localhost:3000/en/products/test-product');
    });

    test('includes query parameters', () => {
      const result = generateCanonicalURL({
        path: '/categories/electronics',
        locale: 'vi',
        params: { page: '2', sort: 'price' },
      });
      expect(result).toBe('http://localhost:3000/categories/electronics?page=2&sort=price');
    });
  });

  describe('generateSEOFriendlySlug', () => {
    test('converts title to lowercase slug', () => {
      const result = generateSEOFriendlySlug({ title: 'Test Product Name' });
      expect(result).toBe('test-product-name');
    });

    test('handles Vietnamese characters', () => {
      const result = generateSEOFriendlySlug({ title: 'Sản phẩm thủ công đẹp' });
      expect(result).toBe('san-pham-thu-cong-dep');
    });

    test('removes special characters', () => {
      const result = generateSEOFriendlySlug({ title: 'Product @ 50% Off!' });
      expect(result).toBe('product-50-off');
    });

    test('truncates long titles', () => {
      const longTitle = 'This is a very long product title that should be truncated to fit within the maximum length limit';
      const result = generateSEOFriendlySlug({ title: longTitle, maxLength: 30 });
      expect(result.length).toBeLessThanOrEqual(30);
      expect(result).not.toMatch(/-$/);
    });

    test('preserves case when specified', () => {
      const result = generateSEOFriendlySlug({
        title: 'iPhone 15 Pro Max',
        preserveCase: true
      });
      expect(result).toBe('iPhone-15-Pro-Max');
    });
  });

  describe('generateMultilingualURLs', () => {
    test('generates multilingual URLs', () => {
      const result = generateMultilingualURLs('/products/test-product');
      expect(result).toEqual({
        'vi': 'http://localhost:3000/products/test-product',
        'en': 'http://localhost:3000/en/products/test-product',
        'x-default': 'http://localhost:3000/products/test-product',
      });
    });
  });

  describe('validateSEOURL', () => {
    test('validates good SEO URLs', () => {
      const result = validateSEOURL('https://example.com/products/test-product');
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    test('detects trailing slash issues', () => {
      const result = validateSEOURL('https://example.com/products/test-product/');
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('URL has trailing slash');
    });

    test('detects uppercase characters', () => {
      const result = validateSEOURL('https://example.com/Products/Test-Product');
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('URL contains uppercase characters');
    });

    test('detects underscores', () => {
      const result = validateSEOURL('https://example.com/products/test_product');
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('URL contains underscores');
    });

    test('detects excessive length', () => {
      const longPath = '/products/' + 'a'.repeat(100);
      const result = validateSEOURL(`https://example.com${longPath}`);
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('URL path is too long');
    });
  });

  describe('generateBreadcrumbURLs', () => {
    test('generates breadcrumb URLs for Vietnamese', () => {
      const result = generateBreadcrumbURLs(['categories', 'electronics', 'phones'], 'vi');
      expect(result).toHaveLength(4); // Home + 3 segments
      expect(result[0]).toEqual({
        name: 'Trang chủ',
        url: 'http://localhost:3000/',
        isLast: false,
      });
      expect(result[3]).toEqual({
        name: 'Phones',
        url: 'http://localhost:3000/categories/electronics/phones',
        isLast: true,
      });
    });

    test('generates breadcrumb URLs for English', () => {
      const result = generateBreadcrumbURLs(['categories', 'electronics'], 'en');
      expect(result[0]).toEqual({
        name: 'Home',
        url: 'http://localhost:3000/en/',
        isLast: false,
      });
    });
  });

  describe('generatePaginationURLs', () => {
    test('generates pagination URLs', () => {
      const result = generatePaginationURLs({
        basePath: '/categories/electronics',
        currentPage: 2,
        totalPages: 5,
        locale: 'vi',
      });

      expect(result.canonical).toBe('http://localhost:3000/categories/electronics?page=2');
      expect(result.prev).toBe('http://localhost:3000/categories/electronics');
      expect(result.next).toBe('http://localhost:3000/categories/electronics?page=3');
      expect(result.first).toBe('http://localhost:3000/categories/electronics');
      expect(result.last).toBe('http://localhost:3000/categories/electronics?page=5');
    });

    test('handles first page correctly', () => {
      const result = generatePaginationURLs({
        basePath: '/categories/electronics',
        currentPage: 1,
        totalPages: 5,
        locale: 'vi',
      });

      expect(result.canonical).toBe('http://localhost:3000/categories/electronics');
      expect(result.prev).toBeUndefined();
      expect(result.next).toBe('http://localhost:3000/categories/electronics?page=2');
    });

    test('handles last page correctly', () => {
      const result = generatePaginationURLs({
        basePath: '/categories/electronics',
        currentPage: 5,
        totalPages: 5,
        locale: 'vi',
      });

      expect(result.prev).toBe('http://localhost:3000/categories/electronics?page=4');
      expect(result.next).toBeUndefined();
    });

    test('preserves search parameters', () => {
      const result = generatePaginationURLs({
        basePath: '/categories/electronics',
        currentPage: 2,
        totalPages: 5,
        locale: 'vi',
        searchParams: { sort: 'price', filter: 'available' },
      });

      expect(result.canonical).toContain('sort=price');
      expect(result.canonical).toContain('filter=available');
      expect(result.canonical).toContain('page=2');
    });
  });

  describe('generateProductURL', () => {
    test('generates product URL for Vietnamese', () => {
      const product = {
        nameEn: 'Handmade Ceramic Vase',
        nameVi: 'Bình gốm thủ công',
        id: '123',
      };
      const result = generateProductURL(product, 'vi');
      expect(result).toBe('binh-gom-thu-cong-123');
    });

    test('generates product URL for English', () => {
      const product = {
        nameEn: 'Handmade Ceramic Vase',
        nameVi: 'Bình gốm thủ công',
        id: '123',
      };
      const result = generateProductURL(product, 'en');
      expect(result).toBe('handmade-ceramic-vase-123');
    });
  });

  describe('generateCategoryURL', () => {
    test('generates category URL for Vietnamese', () => {
      const category = {
        nameEn: 'Home Decor',
        nameVi: 'Đồ trang trí nhà',
        id: '456',
      };
      const result = generateCategoryURL(category, 'vi');
      expect(result).toBe('do-trang-tri-nha');
    });

    test('generates category URL for English', () => {
      const category = {
        nameEn: 'Home Decor',
        nameVi: 'Đồ trang trí nhà',
        id: '456',
      };
      const result = generateCategoryURL(category, 'en');
      expect(result).toBe('home-decor');
    });
  });
});