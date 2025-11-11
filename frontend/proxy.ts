import createMiddleware from 'next-intl/middleware';
import {NextRequest} from 'next/server';
import {routing} from './i18n/routing';

const handleI18nRouting = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
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