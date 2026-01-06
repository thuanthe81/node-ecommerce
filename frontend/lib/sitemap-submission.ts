/**
 * Utility functions for submitting sitemaps to search engines
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export interface SitemapSubmissionResult {
  success: boolean;
  message: string;
  searchEngine: string;
}

/**
 * Submit sitemap to Google Search Console
 */
export async function submitToGoogle(sitemapUrl?: string): Promise<SitemapSubmissionResult> {
  const sitemap = sitemapUrl || `${SITE_URL}/sitemap.xml`;

  try {
    // Google Search Console API submission would require authentication
    // For now, we'll return the URL that should be submitted manually
    const submissionUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemap)}`;

    // In production, you would make an authenticated request to Google Search Console API
    // For manual submission, users can visit: https://search.google.com/search-console

    console.log(`Google sitemap submission URL: ${submissionUrl}`);

    return {
      success: true,
      message: `Sitemap ready for Google submission: ${submissionUrl}`,
      searchEngine: 'Google'
    };
  } catch (error) {
    console.error('Error submitting to Google:', error);
    return {
      success: false,
      message: `Failed to submit to Google: ${error}`,
      searchEngine: 'Google'
    };
  }
}

/**
 * Submit sitemap to Bing Webmaster Tools
 */
export async function submitToBing(sitemapUrl?: string): Promise<SitemapSubmissionResult> {
  const sitemap = sitemapUrl || `${SITE_URL}/sitemap.xml`;

  try {
    // Bing Webmaster Tools API submission would require authentication
    const submissionUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemap)}`;

    console.log(`Bing sitemap submission URL: ${submissionUrl}`);

    return {
      success: true,
      message: `Sitemap ready for Bing submission: ${submissionUrl}`,
      searchEngine: 'Bing'
    };
  } catch (error) {
    console.error('Error submitting to Bing:', error);
    return {
      success: false,
      message: `Failed to submit to Bing: ${error}`,
      searchEngine: 'Bing'
    };
  }
}

/**
 * Submit all sitemaps to major search engines
 */
export async function submitAllSitemaps(): Promise<SitemapSubmissionResult[]> {
  const sitemaps = [
    `${SITE_URL}/sitemap.xml`,
    `${SITE_URL}/sitemap-index.xml`,
    `${SITE_URL}/sitemap-products.xml`,
    `${SITE_URL}/sitemap-categories.xml`,
    `${SITE_URL}/sitemap-blog.xml`,
    `${SITE_URL}/sitemap-static.xml`,
  ];

  const results: SitemapSubmissionResult[] = [];

  for (const sitemap of sitemaps) {
    try {
      const [googleResult, bingResult] = await Promise.all([
        submitToGoogle(sitemap),
        submitToBing(sitemap)
      ]);

      results.push(googleResult, bingResult);
    } catch (error) {
      console.error(`Error submitting sitemap ${sitemap}:`, error);
      results.push({
        success: false,
        message: `Failed to submit ${sitemap}: ${error}`,
        searchEngine: 'Multiple'
      });
    }
  }

  return results;
}

/**
 * Generate sitemap submission instructions for manual submission
 */
export function generateSubmissionInstructions(): string {
  const sitemaps = [
    `${SITE_URL}/sitemap.xml`,
    `${SITE_URL}/sitemap-index.xml`,
  ];

  return `
# Sitemap Submission Instructions

## Automatic Submission URLs

### Google Search Console
${sitemaps.map(sitemap => `- https://www.google.com/ping?sitemap=${encodeURIComponent(sitemap)}`).join('\n')}

### Bing Webmaster Tools
${sitemaps.map(sitemap => `- https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemap)}`).join('\n')}

## Manual Submission

### Google Search Console
1. Visit: https://search.google.com/search-console
2. Select your property
3. Go to "Sitemaps" in the left sidebar
4. Add the following sitemaps:
${sitemaps.map(sitemap => `   - ${sitemap}`).join('\n')}

### Bing Webmaster Tools
1. Visit: https://www.bing.com/webmasters
2. Select your site
3. Go to "Sitemaps" section
4. Submit the following sitemaps:
${sitemaps.map(sitemap => `   - ${sitemap}`).join('\n')}

## Available Sitemaps

- Main sitemap: ${SITE_URL}/sitemap.xml
- Sitemap index: ${SITE_URL}/sitemap-index.xml
- Products: ${SITE_URL}/sitemap-products.xml
- Categories: ${SITE_URL}/sitemap-categories.xml
- Blog posts: ${SITE_URL}/sitemap-blog.xml
- Static pages: ${SITE_URL}/sitemap-static.xml
`;
}

/**
 * Log sitemap submission status
 */
export function logSitemapStatus(): void {
  const sitemaps = [
    `${SITE_URL}/sitemap.xml`,
    `${SITE_URL}/sitemap-index.xml`,
    `${SITE_URL}/sitemap-products.xml`,
    `${SITE_URL}/sitemap-categories.xml`,
    `${SITE_URL}/sitemap-blog.xml`,
    `${SITE_URL}/sitemap-static.xml`,
  ];

  console.log('=== Sitemap Status ===');
  console.log(`Site URL: ${SITE_URL}`);
  console.log('Available sitemaps:');
  sitemaps.forEach(sitemap => {
    console.log(`  - ${sitemap}`);
  });
  console.log('======================');
}