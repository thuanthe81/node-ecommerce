import { MetadataRoute } from 'next';
import { generateSitemapData, convertToMetadataRoute } from '@/lib/sitemap-utils';

/**
 * Main sitemap that includes all content types
 * This serves as the primary sitemap.xml file
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const sitemapData = await generateSitemapData();

    // Combine all sitemap entries
    const allEntries = [
      ...sitemapData.staticPages,
      ...sitemapData.products,
      ...sitemapData.categories,
      ...sitemapData.blogPosts,
    ];

    return convertToMetadataRoute(allEntries);
  } catch (error) {
    console.error('Error generating main sitemap:', error);

    // Return minimal sitemap on error
    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    return [
      {
        url: SITE_URL,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
        alternates: {
          languages: {
            vi: SITE_URL,
            en: `${SITE_URL}/en`,
          },
        },
      },
    ];
  }
}
