/**
 * Tests for redirect utilities
 * Validates redirect rules, locale detection, and multilingual URL handling
 */

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextResponse: {
    redirect: jest.fn((url: URL, status: number) => ({
      status,
      headers: new Map([['location', url.toString()]]),
      cookies: new Map(),
    })),
    next: jest.fn(() => ({
      headers: new Map(),
      cookies: new Map(),
    })),
  },
}));

import {
  matchesRedirectRule,
  detectUserLocale,
  generateMigrationRedirects,
  validateRedirectRules,
  COMMON_REDIRECT_RULES,
  DEFAULT_LOCALE_CONFIG,
} from '@/lib/redirect-utils';

// Mock NextRequest for testing
function createMockRequest(url: string, headers: Record<string, string> = {}, cookies: Record<string, string> = {}): any {
  const urlObj = new URL(url);
  const mockCookies = new Map();
  Object.entries(cookies).forEach(([key, value]) => {
    mockCookies.set(key, { value });
  });

  return {
    url,
    nextUrl: urlObj,
    headers: new Map(Object.entries(headers)),
    cookies: mockCookies,
  };
}

describe('Redirect Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('matchesRedirectRule', () => {
    test('matches simple redirect rule', () => {
      const rule = {
        source: '/product/:slug',
        destination: '/products/:slug',
        permanent: true,
      };

      const request = createMockRequest('http://localhost:3000/product/test-item');
      const result = matchesRedirectRule(rule, '/product/test-item', request);

      expect(result.matches).toBe(true);
      expect(result.destination).toBe('/products/test-item');
      expect(result.params).toEqual({ slug: 'test-item' });
    });

    test('does not match different pattern', () => {
      const rule = {
        source: '/product/:slug',
        destination: '/products/:slug',
        permanent: true,
      };

      const request = createMockRequest('http://localhost:3000/category/electronics');
      const result = matchesRedirectRule(rule, '/category/electronics', request);

      expect(result.matches).toBe(false);
    });

    test('handles product URL redirects', () => {
      const rule = {
        source: '/product/:slug',
        destination: '/products/:slug',
        permanent: true,
      };

      const request = createMockRequest('http://localhost:3000/product/test-product');
      const result = matchesRedirectRule(rule, '/product/test-product', request);

      expect(result.matches).toBe(true);
      expect(result.destination).toBe('/products/test-product');
    });
  });

  describe('detectUserLocale', () => {
    test('detects locale from URL path', () => {
      const request = createMockRequest('http://localhost:3000/en/products');
      const locale = detectUserLocale(request);

      expect(locale).toBe('en');
    });

    test('detects locale from cookie', () => {
      const request = createMockRequest(
        'http://localhost:3000/products',
        {},
        { locale: 'en' }
      );
      const locale = detectUserLocale(request);

      expect(locale).toBe('en');
    });

    test('detects locale from Accept-Language header', () => {
      const request = createMockRequest(
        'http://localhost:3000/products',
        { 'accept-language': 'en-US,en;q=0.9,vi;q=0.8' }
      );
      const locale = detectUserLocale(request);

      expect(locale).toBe('en');
    });

    test('falls back to default locale', () => {
      const request = createMockRequest('http://localhost:3000/products');
      const locale = detectUserLocale(request);

      expect(locale).toBe('vi'); // Default locale
    });

    test('prioritizes URL over cookie and header', () => {
      const request = createMockRequest(
        'http://localhost:3000/en/products',
        { 'accept-language': 'vi-VN,vi;q=0.9' },
        { locale: 'vi' }
      );
      const locale = detectUserLocale(request);

      expect(locale).toBe('en');
    });
  });

  describe('generateMigrationRedirects', () => {
    test('generates redirect rules from migrations', () => {
      const migrations = [
        { from: '/old-products', to: '/products' },
        { from: '/old-categories', to: '/categories', permanent: false },
      ];

      const rules = generateMigrationRedirects(migrations);

      expect(rules).toHaveLength(2);
      expect(rules[0]).toEqual({
        source: '/old-products',
        destination: '/products',
        permanent: true, // Default to permanent
      });
      expect(rules[1]).toEqual({
        source: '/old-categories',
        destination: '/categories',
        permanent: false,
      });
    });
  });

  describe('validateRedirectRules', () => {
    test('validates good redirect rules', () => {
      const rules = [
        {
          source: '/product/:slug',
          destination: '/products/:slug',
          permanent: true,
        },
        {
          source: '/category/:slug',
          destination: '/categories/:slug',
          permanent: true,
        },
      ];

      const result = validateRedirectRules(rules);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('detects duplicate source patterns', () => {
      const rules = [
        {
          source: '/product/:slug',
          destination: '/products/:slug',
          permanent: true,
        },
        {
          source: '/product/:slug',
          destination: '/items/:slug',
          permanent: true,
        },
      ];

      const result = validateRedirectRules(rules);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Duplicate source pattern at index 1: /product/:slug');
    });

    test('detects circular redirects', () => {
      const rules = [
        {
          source: '/products',
          destination: '/products',
          permanent: true,
        },
      ];

      const result = validateRedirectRules(rules);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Circular redirect at index 0: /products -> /products');
    });

    test('warns about wildcard mismatches', () => {
      const rules = [
        {
          source: '/old-site/*',
          destination: '/new-site',
          permanent: true,
        },
      ];

      const result = validateRedirectRules(rules);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Wildcard source without wildcard destination at index 0: /old-site/* -> /new-site');
    });
  });

  describe('COMMON_REDIRECT_RULES', () => {
    test('includes legacy product URL redirects', () => {
      const productRule = COMMON_REDIRECT_RULES.find(rule => rule.source === '/product/:slug');
      expect(productRule).toBeDefined();
      expect(productRule?.destination).toBe('/products/:slug');
      expect(productRule?.permanent).toBe(true);
    });

    test('includes legacy category URL redirects', () => {
      const categoryRule = COMMON_REDIRECT_RULES.find(rule => rule.source === '/category/:slug');
      expect(categoryRule).toBeDefined();
      expect(categoryRule?.destination).toBe('/categories/:slug');
      expect(categoryRule?.permanent).toBe(true);
    });

    test('includes product redirect rules', () => {
      const productRule = COMMON_REDIRECT_RULES.find(rule => rule.source === '/product/:slug');
      expect(productRule).toBeDefined();
      expect(productRule?.destination).toBe('/products/:slug');
      expect(productRule?.permanent).toBe(true);
    });
  });
});