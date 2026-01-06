/**
 * URL structure and SEO optimization utilities
 * Handles canonical URLs, trailing slashes, and SEO-friendly URL generation
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export interface URLConfig {
  trailingSlash: boolean;
  forceHttps: boolean;
  canonicalDomain: string;
}

export interface CanonicalURLOptions {
  path: string;
  locale: string;
  params?: Record<string, string | number>;
  removeTrailingSlash?: boolean;
}

export interface SEOFriendlyURLOptions {
  title: string;
  maxLength?: number;
  preserveCase?: boolean;
}

/**
 * Default URL configuration for the site
 */
export const DEFAULT_URL_CONFIG: URLConfig = {
  trailingSlash: false, // Consistent no trailing slash policy
  forceHttps: process.env.NODE_ENV === 'production',
  canonicalDomain: SITE_URL.replace(/^https?:\/\//, ''),
};

/**
 * Normalizes a URL path by handling trailing slashes consistently
 */
export function normalizePath(path: string, config: URLConfig = DEFAULT_URL_CONFIG): string {
  // Remove leading slash if present
  let normalizedPath = path.startsWith('/') ? path.slice(1) : path;

  // Remove trailing slash if present
  if (normalizedPath.endsWith('/') && normalizedPath.length > 1) {
    normalizedPath = normalizedPath.slice(0, -1);
  }

  // Add leading slash back
  normalizedPath = '/' + normalizedPath;

  // Handle root path
  if (normalizedPath === '/') {
    return config.trailingSlash ? '/' : '/';
  }

  // Apply trailing slash policy
  if (config.trailingSlash && !normalizedPath.endsWith('/')) {
    normalizedPath += '/';
  } else if (!config.trailingSlash && normalizedPath.endsWith('/')) {
    normalizedPath = normalizedPath.slice(0, -1);
  }

  return normalizedPath;
}

/**
 * Generates a canonical URL for a given path and locale
 */
export function generateCanonicalURL(options: CanonicalURLOptions): string {
  const { path, locale, params, removeTrailingSlash = true } = options;

  let canonicalPath = path;

  // Add locale prefix for non-default locale
  const localePrefix = locale === 'vi' ? '' : `/${locale}`;

  // Normalize the path
  canonicalPath = normalizePath(canonicalPath, {
    ...DEFAULT_URL_CONFIG,
    trailingSlash: !removeTrailingSlash,
  });

  // Build the full URL
  let canonicalURL = `${SITE_URL}${localePrefix}${canonicalPath}`;

  // Add query parameters if provided
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.set(key, value.toString());
    });
    canonicalURL += `?${searchParams.toString()}`;
  }

  return canonicalURL;
}

/**
 * Generates SEO-friendly URL slugs from titles
 */
export function generateSEOFriendlySlug(options: SEOFriendlyURLOptions): string {
  const { title, maxLength = 60, preserveCase = false } = options;

  let slug = title;

  // Convert to lowercase unless preserveCase is true
  if (!preserveCase) {
    slug = slug.toLowerCase();
  }

  // Replace Vietnamese characters with ASCII equivalents
  const vietnameseMap: Record<string, string> = {
    'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a', 'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a',
    'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
    'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
    'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
    'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o', 'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o',
    'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
    'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u', 'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
    'đ': 'd',
  };

  // Replace Vietnamese characters
  Object.entries(vietnameseMap).forEach(([vietnamese, ascii]) => {
    slug = slug.replace(new RegExp(vietnamese, 'g'), ascii);
  });

  // Replace spaces and special characters with hyphens
  slug = slug
    .replace(/[^a-z0-9\s-]/gi, '') // Remove special characters except spaces and hyphens (case insensitive)
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

  // Apply case conversion after character replacement
  if (!preserveCase) {
    slug = slug.toLowerCase();
  }

  // Truncate to max length
  if (slug.length > maxLength) {
    slug = slug.substring(0, maxLength);
    // Ensure we don't cut off in the middle of a word
    const lastHyphen = slug.lastIndexOf('-');
    if (lastHyphen > maxLength * 0.8) {
      slug = slug.substring(0, lastHyphen);
    }
  }

  return slug;
}

/**
 * Generates multilingual URL alternatives for hreflang
 */
export function generateMultilingualURLs(path: string): Record<string, string> {
  const normalizedPath = normalizePath(path);

  return {
    'vi': `${SITE_URL}${normalizedPath}`,
    'en': `${SITE_URL}/en${normalizedPath}`,
    'x-default': `${SITE_URL}${normalizedPath}`,
  };
}

/**
 * Validates if a URL follows SEO best practices
 */
export function validateSEOURL(url: string): {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;

    // Check for trailing slash consistency
    if (path !== '/' && path.endsWith('/')) {
      issues.push('URL has trailing slash');
      suggestions.push('Remove trailing slash for consistency');
    }

    // Check for uppercase characters
    if (path !== path.toLowerCase()) {
      issues.push('URL contains uppercase characters');
      suggestions.push('Convert to lowercase for SEO consistency');
    }

    // Check for underscores (hyphens are preferred)
    if (path.includes('_')) {
      issues.push('URL contains underscores');
      suggestions.push('Replace underscores with hyphens');
    }

    // Check for excessive length
    if (path.length > 100) {
      issues.push('URL path is too long');
      suggestions.push('Shorten URL path to under 100 characters');
    }

    // Check for special characters
    const specialChars = /[^a-z0-9\-\/]/g;
    if (specialChars.test(path)) {
      issues.push('URL contains special characters');
      suggestions.push('Remove or replace special characters');
    }

    // Check for multiple consecutive hyphens
    if (path.includes('--')) {
      issues.push('URL contains multiple consecutive hyphens');
      suggestions.push('Replace multiple hyphens with single hyphens');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions,
    };
  } catch (error) {
    return {
      isValid: false,
      issues: ['Invalid URL format'],
      suggestions: ['Ensure URL is properly formatted'],
    };
  }
}

/**
 * Generates breadcrumb URLs for navigation hierarchy
 */
export function generateBreadcrumbURLs(segments: string[], locale: string): Array<{
  name: string;
  url: string;
  isLast: boolean;
}> {
  const localePrefix = locale === 'vi' ? '' : `/${locale}`;
  const breadcrumbs: Array<{ name: string; url: string; isLast: boolean }> = [];

  // Add home breadcrumb
  breadcrumbs.push({
    name: locale === 'vi' ? 'Trang chủ' : 'Home',
    url: `${SITE_URL}${localePrefix}/`,
    isLast: false,
  });

  // Add intermediate breadcrumbs
  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;

    breadcrumbs.push({
      name: segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      url: `${SITE_URL}${localePrefix}${normalizePath(currentPath)}`,
      isLast,
    });
  });

  return breadcrumbs;
}

/**
 * Generates pagination URLs for category and blog listing pages
 */
export function generatePaginationURLs(options: {
  basePath: string;
  currentPage: number;
  totalPages: number;
  locale: string;
  searchParams?: Record<string, string>;
}): {
  canonical: string;
  prev?: string;
  next?: string;
  first: string;
  last: string;
} {
  const { basePath, currentPage, totalPages, locale, searchParams = {} } = options;
  const localePrefix = locale === 'vi' ? '' : `/${locale}`;
  const normalizedBasePath = normalizePath(basePath);

  const buildURL = (page: number) => {
    const params = new URLSearchParams(searchParams);
    if (page > 1) {
      params.set('page', page.toString());
    } else {
      params.delete('page');
    }

    const queryString = params.toString();
    const baseURL = `${SITE_URL}${localePrefix}${normalizedBasePath}`;

    return queryString ? `${baseURL}?${queryString}` : baseURL;
  };

  const urls: {
    canonical: string;
    first: string;
    last: string;
    prev?: string;
    next?: string;
  } = {
    canonical: buildURL(currentPage),
    first: buildURL(1),
    last: buildURL(totalPages),
  };

  if (currentPage > 1) {
    urls.prev = buildURL(currentPage - 1);
  }

  if (currentPage < totalPages) {
    urls.next = buildURL(currentPage + 1);
  }

  return urls;
}

/**
 * Extracts and validates URL parameters
 */
export function extractURLParams(url: string): {
  path: string;
  params: Record<string, string>;
  isValid: boolean;
} {
  try {
    const urlObj = new URL(url);
    const params: Record<string, string> = {};

    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    return {
      path: urlObj.pathname,
      params,
      isValid: true,
    };
  } catch (error) {
    return {
      path: '',
      params: {},
      isValid: false,
    };
  }
}

/**
 * Generates URL-safe product identifiers
 */
export function generateProductURL(product: {
  nameEn: string;
  nameVi: string;
  id: string;
  category?: { nameEn: string; nameVi: string };
}, locale: string): string {
  const name = locale === 'vi' ? product.nameVi : product.nameEn;
  const slug = generateSEOFriendlySlug({ title: name });

  // Include product ID to ensure uniqueness
  return `${slug}-${product.id}`;
}

/**
 * Generates URL-safe category identifiers
 */
export function generateCategoryURL(category: {
  nameEn: string;
  nameVi: string;
  id: string;
}, locale: string): string {
  const name = locale === 'vi' ? category.nameVi : category.nameEn;
  const slug = generateSEOFriendlySlug({ title: name });

  return slug;
}