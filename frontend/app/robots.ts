import { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/account/',
          '/cart',
          '/checkout',
          '/sitemap-api/',
          '/_next/',
          '/login',
        ],
      },
    ],
    sitemap: [
      `${SITE_URL}/sitemap.xml`,
      `${SITE_URL}/sitemap-index.xml`,
      `${SITE_URL}/sitemap-products.xml`,
      `${SITE_URL}/sitemap-categories.xml`,
      `${SITE_URL}/sitemap-blog.xml`,
      `${SITE_URL}/sitemap-static.xml`,
    ],
  };
}
