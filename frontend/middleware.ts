import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match only internationalized pathnames
  matcher: [
    '/',
    '/(vi|en)/:path*',
    // Enable a redirect to a matching locale at the root
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
