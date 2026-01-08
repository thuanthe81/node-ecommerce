/**
 * URL redirect utilities for multilingual support and SEO optimization
 * Handles 301 redirects, locale-based routing, and URL migrations
 */

import { NextRequest, NextResponse } from 'next/server';
import { normalizePath } from './url-utils';

export interface RedirectRule {
  source: string;
  destination: string;
  permanent: boolean;
  locale?: string;
  conditions?: RedirectCondition[];
}

export interface RedirectCondition {
  type: 'header' | 'query' | 'cookie';
  key: string;
  value?: string;
  operator?: 'equals' | 'contains' | 'startsWith' | 'endsWith';
}

export interface LocaleRedirectOptions {
  defaultLocale: string;
  supportedLocales: string[];
  detectFromHeader: boolean;
  detectFromCookie: boolean;
}

/**
 * Default locale configuration
 */
export const DEFAULT_LOCALE_CONFIG: LocaleRedirectOptions = {
  defaultLocale: 'vi',
  supportedLocales: ['vi', 'en'],
  detectFromHeader: true,
  detectFromCookie: true,
};

/**
 * Common redirect rules for the ecommerce site
 */
export const COMMON_REDIRECT_RULES: RedirectRule[] = [
  // Legacy product URLs
  {
    source: '/product/:slug',
    destination: '/products/:slug',
    permanent: true,
  },
  {
    source: '/product/:slug/',
    destination: '/products/:slug',
    permanent: true,
  },

  // Legacy category URLs
  {
    source: '/category/:slug',
    destination: '/categories/:slug',
    permanent: true,
  },
  {
    source: '/category/:slug/',
    destination: '/categories/:slug',
    permanent: true,
  },

  // Legacy blog URLs
  {
    source: '/post/:slug',
    destination: '/blog/:slug',
    permanent: true,
  },
  {
    source: '/posts/:slug',
    destination: '/blog/:slug',
    permanent: true,
  },

  // Legacy admin URLs
  {
    source: '/admin/product/:slug',
    destination: '/admin/products/:slug',
    permanent: true,
  },
  {
    source: '/admin/category/:slug',
    destination: '/admin/categories/:slug',
    permanent: true,
  },

  // Redirect old search URLs
  {
    source: '/search',
    destination: '/products',
    permanent: false,
    conditions: [
      {
        type: 'query',
        key: 'q',
        operator: 'equals',
        value: '',
      },
    ],
  },
];

/**
 * Checks if a redirect rule matches the current request
 */
export function matchesRedirectRule(
  rule: RedirectRule,
  pathname: string,
  request: NextRequest
): { matches: boolean; destination?: string; params?: Record<string, string> } {
  // Convert rule source pattern to regex
  const sourcePattern = rule.source
    .replace(/\*/g, '(.*)')
    .replace(/:([^/]+)/g, '([^/]+)');

  const regex = new RegExp(`^${sourcePattern}$`);
  const match = pathname.match(regex);

  if (!match) {
    return { matches: false };
  }

  // Check conditions if present
  if (rule.conditions) {
    for (const condition of rule.conditions) {
      if (!checkRedirectCondition(condition, request)) {
        return { matches: false };
      }
    }
  }

  // Extract parameters and build destination
  let destination = rule.destination;
  const params: Record<string, string> = {};

  // Handle regex groups (for patterns like /(.*?)/ -> /$1)
  if (match.length > 1) {
    for (let i = 1; i < match.length; i++) {
      destination = destination.replace(`$${i}`, match[i]);
    }
  }

  // Extract named parameters
  const sourceSegments = rule.source.split('/');
  const matchSegments = pathname.split('/');

  sourceSegments.forEach((segment, index) => {
    if (segment.startsWith(':')) {
      const paramName = segment.slice(1);
      const paramValue = matchSegments[index] || '';
      params[paramName] = paramValue;
      destination = destination.replace(`:${paramName}`, paramValue);
    }
  });

  return {
    matches: true,
    destination: normalizePath(destination),
    params,
  };
}

/**
 * Checks if a redirect condition is met
 */
function checkRedirectCondition(condition: RedirectCondition, request: NextRequest): boolean {
  let value: string | undefined;

  switch (condition.type) {
    case 'header':
      value = request.headers.get(condition.key) || undefined;
      break;
    case 'query':
      value = request.nextUrl.searchParams.get(condition.key) || undefined;
      break;
    case 'cookie':
      value = request.cookies.get(condition.key)?.value;
      break;
    default:
      return false;
  }

  if (!value && condition.value) {
    return false;
  }

  if (!condition.value) {
    return !!value;
  }

  switch (condition.operator || 'equals') {
    case 'equals':
      return value === condition.value;
    case 'contains':
      return value?.includes(condition.value) || false;
    case 'startsWith':
      return value?.startsWith(condition.value) || false;
    case 'endsWith':
      return value?.endsWith(condition.value) || false;
    default:
      return false;
  }
}

/**
 * Processes redirect rules and returns appropriate redirect response
 */
export function processRedirectRules(
  request: NextRequest,
  rules: RedirectRule[] = COMMON_REDIRECT_RULES
): NextResponse | null {
  const { pathname } = request.nextUrl;

  for (const rule of rules) {
    const result = matchesRedirectRule(rule, pathname, request);

    if (result.matches && result.destination) {
      const redirectUrl = new URL(result.destination, request.url);

      // Preserve query parameters
      request.nextUrl.searchParams.forEach((value, key) => {
        redirectUrl.searchParams.set(key, value);
      });

      return NextResponse.redirect(
        redirectUrl,
        rule.permanent ? 301 : 302
      );
    }
  }

  return null;
}

/**
 * Detects user's preferred locale from various sources
 */
export function detectUserLocale(
  request: NextRequest,
  config: LocaleRedirectOptions = DEFAULT_LOCALE_CONFIG
): string {
  // Check URL path for explicit locale
  const pathname = request.nextUrl.pathname;
  const pathLocale = pathname.split('/')[1];

  if (config.supportedLocales.includes(pathLocale)) {
    return pathLocale;
  }

  // Check cookie for saved preference
  if (config.detectFromCookie) {
    const cookieLocale = request.cookies.get('locale')?.value;
    if (cookieLocale && config.supportedLocales.includes(cookieLocale)) {
      return cookieLocale;
    }
  }

  // Check Accept-Language header
  if (config.detectFromHeader) {
    const acceptLanguage = request.headers.get('accept-language');
    if (acceptLanguage) {
      const preferredLocales = acceptLanguage
        .split(',')
        .map(lang => lang.split(';')[0].trim().toLowerCase())
        .map(lang => lang.split('-')[0]); // Extract language code only

      for (const locale of preferredLocales) {
        if (config.supportedLocales.includes(locale)) {
          return locale;
        }
      }
    }
  }

  return config.defaultLocale;
}

/**
 * Handles locale-based redirects for multilingual support
 */
export function handleLocaleRedirect(
  request: NextRequest,
  config: LocaleRedirectOptions = DEFAULT_LOCALE_CONFIG
): NextResponse | null {
  const { pathname } = request.nextUrl;

  // Skip API routes and static files
  if (
    pathname.startsWith('/sitemap-api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.')
  ) {
    return null;
  }

  const detectedLocale = detectUserLocale(request, config);
  const pathLocale = pathname.split('/')[1];

  // If path already has a supported locale, continue
  if (config.supportedLocales.includes(pathLocale)) {
    return null;
  }

  // If detected locale is not default, redirect to localized path
  if (detectedLocale !== config.defaultLocale) {
    const localizedPath = `/${detectedLocale}${pathname}`;
    const redirectUrl = new URL(localizedPath, request.url);

    // Preserve query parameters
    request.nextUrl.searchParams.forEach((value, key) => {
      redirectUrl.searchParams.set(key, value);
    });

    const response = NextResponse.redirect(redirectUrl, 302);

    // Set locale cookie for future visits
    response.cookies.set('locale', detectedLocale, {
      maxAge: 365 * 24 * 60 * 60, // 1 year
      path: '/',
      sameSite: 'lax',
    });

    return response;
  }

  return null;
}

/**
 * Generates redirect rules for moved or renamed URLs
 */
export function generateMigrationRedirects(migrations: Array<{
  from: string;
  to: string;
  permanent?: boolean;
}>): RedirectRule[] {
  return migrations.map(migration => ({
    source: migration.from,
    destination: migration.to,
    permanent: migration.permanent !== false,
  }));
}

/**
 * Validates redirect configuration
 */
export function validateRedirectRules(rules: RedirectRule[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  const sourcePatterns = new Set<string>();

  rules.forEach((rule, index) => {
    // Check for duplicate source patterns
    if (sourcePatterns.has(rule.source)) {
      errors.push(`Duplicate source pattern at index ${index}: ${rule.source}`);
    }
    sourcePatterns.add(rule.source);

    // Check for circular redirects
    if (rule.source === rule.destination) {
      errors.push(`Circular redirect at index ${index}: ${rule.source} -> ${rule.destination}`);
    }

    // Check for potentially problematic patterns
    if (rule.source.includes('*') && !rule.destination.includes('*')) {
      warnings.push(`Wildcard source without wildcard destination at index ${index}: ${rule.source} -> ${rule.destination}`);
    }

    // Validate regex patterns
    try {
      const pattern = rule.source
        .replace(/\*/g, '(.*)')
        .replace(/:([^/]+)/g, '([^/]+)');
      new RegExp(`^${pattern}$`);
    } catch (error) {
      errors.push(`Invalid regex pattern at index ${index}: ${rule.source}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Logs redirect activity for monitoring and debugging
 */
export function logRedirectActivity(
  request: NextRequest,
  rule: RedirectRule,
  destination: string
): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[REDIRECT] ${request.nextUrl.pathname} -> ${destination} (${rule.permanent ? '301' : '302'})`);
  }

  // In production, you might want to send this to an analytics service
  if (process.env.NODE_ENV === 'production' && process.env.ANALYTICS_ENDPOINT) {
    // Send redirect data to analytics
    fetch(process.env.ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'redirect',
        source: request.nextUrl.pathname,
        destination,
        permanent: rule.permanent,
        userAgent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString(),
      }),
    }).catch(error => {
      console.error('Failed to log redirect activity:', error);
    });
  }
}