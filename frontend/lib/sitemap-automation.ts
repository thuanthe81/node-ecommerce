/**
 * Sitemap automation utilities for triggering updates when content changes
 */

const FRONTEND_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const REVALIDATION_TOKEN = process.env.REVALIDATION_TOKEN;

export interface ContentChangeEvent {
  type: 'product' | 'category' | 'blog' | 'content' | 'page';
  action: 'create' | 'update' | 'delete';
  id: string;
  slug?: string;
}

/**
 * Trigger sitemap revalidation when content changes
 */
export async function triggerSitemapUpdate(event: ContentChangeEvent): Promise<boolean> {
  try {
    const response = await fetch(`${FRONTEND_URL}/sitemap-api/revalidate-sitemap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(REVALIDATION_TOKEN && { 'Authorization': `Bearer ${REVALIDATION_TOKEN}` })
      },
      body: JSON.stringify({
        type: event.type,
        action: event.action,
        id: event.id,
        slug: event.slug,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      console.error('Failed to trigger sitemap update:', response.status, response.statusText);
      return false;
    }

    const result = await response.json();
    console.log('Sitemap update triggered:', result);
    return true;

  } catch (error) {
    console.error('Error triggering sitemap update:', error);
    return false;
  }
}

/**
 * Batch trigger sitemap updates for multiple content changes
 */
export async function triggerBatchSitemapUpdate(events: ContentChangeEvent[]): Promise<boolean[]> {
  const promises = events.map(event => triggerSitemapUpdate(event));
  return Promise.all(promises);
}

/**
 * Submit sitemaps to search engines after content changes
 */
export async function submitSitemapsAfterUpdate(): Promise<boolean> {
  try {
    const response = await fetch(`${FRONTEND_URL}/sitemap-api/submit-sitemaps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(REVALIDATION_TOKEN && { 'Authorization': `Bearer ${REVALIDATION_TOKEN}` })
      },
      body: JSON.stringify({
        action: 'submit',
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      console.error('Failed to submit sitemaps:', response.status, response.statusText);
      return false;
    }

    const result = await response.json();
    console.log('Sitemaps submitted:', result);
    return true;

  } catch (error) {
    console.error('Error submitting sitemaps:', error);
    return false;
  }
}

/**
 * Complete sitemap automation workflow
 * 1. Trigger sitemap revalidation
 * 2. Submit updated sitemaps to search engines
 */
export async function automatedSitemapWorkflow(event: ContentChangeEvent): Promise<{
  revalidationSuccess: boolean;
  submissionSuccess: boolean;
}> {
  console.log('Starting automated sitemap workflow for:', event);

  // Step 1: Trigger sitemap revalidation
  const revalidationSuccess = await triggerSitemapUpdate(event);

  // Step 2: Submit sitemaps to search engines (with delay to allow revalidation)
  let submissionSuccess = false;
  if (revalidationSuccess) {
    // Wait a bit for revalidation to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    submissionSuccess = await submitSitemapsAfterUpdate();
  }

  console.log('Automated sitemap workflow completed:', {
    revalidationSuccess,
    submissionSuccess
  });

  return {
    revalidationSuccess,
    submissionSuccess
  };
}

/**
 * Webhook handler for content management system integration
 * This can be called by the backend when content changes
 */
export function createWebhookHandler() {
  return async (event: ContentChangeEvent) => {
    try {
      const result = await automatedSitemapWorkflow(event);

      if (!result.revalidationSuccess) {
        console.warn('Sitemap revalidation failed for event:', event);
      }

      if (!result.submissionSuccess) {
        console.warn('Sitemap submission failed for event:', event);
      }

      return result;
    } catch (error) {
      console.error('Webhook handler error:', error);
      return {
        revalidationSuccess: false,
        submissionSuccess: false
      };
    }
  };
}

/**
 * Schedule periodic sitemap updates (for use with cron jobs)
 */
export async function scheduledSitemapUpdate(): Promise<boolean> {
  try {
    console.log('Running scheduled sitemap update...');

    // Trigger full sitemap revalidation
    const revalidationSuccess = await triggerSitemapUpdate({
      type: 'product', // This will trigger 'all' type revalidation
      action: 'update',
      id: 'scheduled-update'
    });

    if (revalidationSuccess) {
      // Submit updated sitemaps
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for revalidation
      const submissionSuccess = await submitSitemapsAfterUpdate();

      console.log('Scheduled sitemap update completed:', {
        revalidationSuccess,
        submissionSuccess
      });

      return submissionSuccess;
    }

    return false;
  } catch (error) {
    console.error('Scheduled sitemap update error:', error);
    return false;
  }
}