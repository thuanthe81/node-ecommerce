import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'vi'],

  // Used when no locale matches
  defaultLocale: 'vi',

  // The locale prefix strategy
  localePrefix: 'as-needed', // Vietnamese (default) won't have prefix, English will have /en

  // Paths that should not be localized
  pathnames: {
    // Exclude sitemap-api routes from localization
    '/sitemap-api': '/sitemap-api',
  }
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
