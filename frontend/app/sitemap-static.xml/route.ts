import { NextRequest, NextResponse } from 'next/server';
import { getStaticUrls, getContentUrls } from '@/lib/sitemap-utils';

/**
 * Generate XML sitemap for static pages and content pages
 */
export async function GET(request: NextRequest) {
  try {
    const staticUrls = getStaticUrls();
    const contentUrls = await getContentUrls();
    const allUrls = [...staticUrls, ...contentUrls];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${allUrls.map(entry => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastModified instanceof Date ? entry.lastModified.toISOString() : entry.lastModified}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
    ${entry.alternates?.languages ? Object.entries(entry.alternates.languages).map(([lang, url]) =>
      `<xhtml:link rel="alternate" hreflang="${lang}" href="${url}" />`
    ).join('\n    ') : ''}
  </url>`).join('\n')}
</urlset>`;

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating static pages sitemap:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}