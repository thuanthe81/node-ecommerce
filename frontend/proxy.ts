import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const handleI18nRouting = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect /register to /login (with locale support)
  if (pathname === '/register' || pathname.match(/^\/(en|vi)\/register$/)) {
    const locale = pathname.startsWith('/en') ? 'en' : 'vi';
    const loginPath = locale === 'en' ? '/en/login' : '/login';
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  return handleI18nRouting(request);
}

export const config = {
  // Match only internationalized pathnames
  matcher: [
    '/',
    '/(vi|en)/:path*',
    // Enable a redirect to a matching locale at the root
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
