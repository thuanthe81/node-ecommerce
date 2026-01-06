import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { getCacheHeaders } from './lib/cache-config';
import { normalizePath, validateSEOURL } from './lib/url-utils';
import {
  processRedirectRules,
  handleLocaleRedirect,
  logRedirectActivity,
  COMMON_REDIRECT_RULES
} from './lib/redirect-utils';

const handleI18nRouting = createMiddleware(routing);

/**
 * Proxy function to handle internationalization, caching headers, performance monitoring,
 * URL normalization, redirects, and request optimization
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Handle specific redirects first (before i18n processing)
  // Redirect /register to /login (with locale support)
  if (pathname === '/register' || pathname.match(/^\/(en|vi)\/register$/)) {
    const locale = pathname.startsWith('/en') ? 'en' : 'vi';
    const loginPath = locale === 'en' ? '/en/login' : '/login';
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  // Handle locale-based redirects
  const localeRedirect = handleLocaleRedirect(request);
  if (localeRedirect) {
    return localeRedirect;
  }

  // Process common redirect rules
  const redirectResponse = processRedirectRules(request, COMMON_REDIRECT_RULES);
  if (redirectResponse) {
    return redirectResponse;
  }

  // Handle URL normalization and redirects
  const normalizedPath = normalizePath(pathname);

  // Redirect if path needs normalization (trailing slash removal, etc.)
  if (pathname !== normalizedPath && !pathname.startsWith('/api/') && !pathname.startsWith('/_next/')) {
    const redirectUrl = new URL(normalizedPath + search, request.url);
    return NextResponse.redirect(redirectUrl, 301);
  }

  // Process i18n routing
  const i18nResponse = handleI18nRouting(request);

  // If i18n middleware returns a redirect, apply our headers and return it
  if (i18nResponse && i18nResponse.status >= 300 && i18nResponse.status < 400) {
    // Add basic security headers to redirects
    i18nResponse.headers.set('X-Content-Type-Options', 'nosniff');
    i18nResponse.headers.set('X-Frame-Options', 'DENY');
    return i18nResponse;
  }

  // Use i18n response if available, otherwise create new response
  const response = i18nResponse || NextResponse.next();

  // Validate SEO URL structure and log issues in development
  if (process.env.NODE_ENV === 'development') {
    const fullUrl = request.url;
    const validation = validateSEOURL(fullUrl);
    if (!validation.isValid) {
      console.warn(`SEO URL Issues for ${fullUrl}:`, validation.issues);
    }
  }

  // Add performance monitoring headers
  const startTime = Date.now();
  response.headers.set('X-Request-Start', startTime.toString());

  // Determine content type and apply appropriate cache headers
  if (pathname.startsWith('/api/')) {
    // API routes
    const apiHeaders = getCacheHeaders('apiResponses');
    Object.entries(apiHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  } else if (pathname.endsWith('.xml')) {
    // Sitemap files
    const sitemapHeaders = getCacheHeaders('sitemaps');
    Object.entries(sitemapHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  } else if (pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
    // Static assets
    const staticHeaders = getCacheHeaders('staticAssets');
    Object.entries(staticHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  } else if (pathname.includes('/products/') || pathname.includes('/categories/') || pathname.includes('/blog/')) {
    // Dynamic pages with ISR
    const isrHeaders = getCacheHeaders('isrPages');
    Object.entries(isrHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  } else if (pathname === '/' || pathname.startsWith('/en') || pathname.includes('/about') || pathname.includes('/contact')) {
    // Homepage and static pages
    const staticHeaders = getCacheHeaders('staticPages');
    Object.entries(staticHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  } else {
    // Dynamic user-specific pages
    const dynamicHeaders = getCacheHeaders('dynamicPages');
    Object.entries(dynamicHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Add performance hints
  response.headers.set('X-DNS-Prefetch-Control', 'on');

  // Add request ID for tracking
  const requestId = crypto.randomUUID();
  response.headers.set('X-Request-ID', requestId);

  // Add canonical URL header for debugging
  if (process.env.NODE_ENV === 'development') {
    response.headers.set('X-Canonical-Path', normalizedPath);
  }

  return response;
}

/**
 * Configure which paths the middleware should run on
 * Combines i18n routing patterns with general middleware patterns
 */
export const config = {
  matcher: [
    // Enable a redirect to a matching locale at the root
    '/',
    // Match internationalized pathnames
    '/(vi|en)/:path*',
    // Match all request paths except for the ones starting with:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - _vercel (Vercel internals)
    // - favicon.ico (favicon file)
    // - files with extensions (static assets)
    '/((?!api|_next/static|_next/image|_vercel|favicon.ico|.*\\..*).*)',
  ],
};