import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { performanceMonitor } from '@/lib/performance-monitoring';

/**
 * Webhook endpoint for cache invalidation triggered by backend content updates
 * This endpoint is called by the backend when products, categories, or content changes
 */

interface CacheInvalidationPayload {
  event: 'product.created' | 'product.updated' | 'product.deleted' |
         'category.created' | 'category.updated' | 'category.deleted' |
         'blog.created' | 'blog.updated' | 'blog.deleted' |
         'content.updated' | 'homepage.updated';
  data: {
    id: string;
    slug?: string;
    type?: string;
    affectedPaths?: string[];
    affectedTags?: string[];
  };
  timestamp: string;
}

/**
 * POST endpoint for webhook-triggered cache invalidation
 */
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  performanceMonitor.startRequest(requestId, '/sitemap-api/webhook/cache-invalidation', 'POST');

  try {
    // Verify webhook signature/token
    const authHeader = request.headers.get('authorization');
    const webhookSecret = process.env.WEBHOOK_SECRET || process.env.REVALIDATION_TOKEN;

    if (!webhookSecret) {
      console.error('WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    if (token !== webhookSecret) {
      return NextResponse.json({ error: 'Invalid webhook token' }, { status: 401 });
    }

    const payload: CacheInvalidationPayload = await request.json();
    const { event, data, timestamp } = payload;

    console.log('Cache invalidation webhook received:', { event, data: data.id, timestamp });

    const revalidatedPaths: string[] = [];
    const revalidatedTags: string[] = [];

    // Handle different event types
    switch (event) {
      case 'product.created':
      case 'product.updated':
      case 'product.deleted':
        await handleProductInvalidation(data, revalidatedPaths, revalidatedTags);
        break;

      case 'category.created':
      case 'category.updated':
      case 'category.deleted':
        await handleCategoryInvalidation(data, revalidatedPaths, revalidatedTags);
        break;

      case 'blog.created':
      case 'blog.updated':
      case 'blog.deleted':
        await handleBlogInvalidation(data, revalidatedPaths, revalidatedTags);
        break;

      case 'content.updated':
        await handleContentInvalidation(data, revalidatedPaths, revalidatedTags);
        break;

      case 'homepage.updated':
        await handleHomepageInvalidation(revalidatedPaths, revalidatedTags);
        break;

      default:
        console.warn('Unknown webhook event:', event);
        return NextResponse.json({ error: 'Unknown event type' }, { status: 400 });
    }

    // Update cache performance metrics
    performanceMonitor.updateCacheMetrics('webhook-invalidation', false, Date.now() - parseInt(timestamp));

    performanceMonitor.endRequest(requestId, false, 0);

    return NextResponse.json({
      success: true,
      event,
      revalidatedPaths,
      revalidatedTags,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing cache invalidation webhook:', error);
    performanceMonitor.endRequest(requestId, false, 1);

    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

/**
 * Handle product-related cache invalidation
 */
async function handleProductInvalidation(
  data: CacheInvalidationPayload['data'],
  revalidatedPaths: string[],
  revalidatedTags: string[]
): Promise<void> {
  const { slug, affectedPaths, affectedTags } = data;

  // Revalidate specific product page
  if (slug) {
    const productPaths = [
      `/products/${slug}`,
      `/en/products/${slug}`
    ];

    for (const path of productPaths) {
      revalidatePath(path);
      revalidatedPaths.push(path);
    }
  }

  // Revalidate custom affected paths
  if (affectedPaths) {
    for (const path of affectedPaths) {
      revalidatePath(path);
      revalidatedPaths.push(path);
    }
  }

  // Revalidate product-related tags
  const productTags = ['products', 'featured-products', 'homepage', ...(affectedTags || [])];
  for (const tag of productTags) {
    revalidateTag(tag, { expire: 0 });
    revalidatedTags.push(tag);
  }

  // Revalidate category pages (products might appear in categories)
  revalidateTag('categories', { expire: 0 });
  revalidatedTags.push('categories');

  // Revalidate homepage (featured products might change)
  revalidatePath('/');
  revalidatePath('/en');
  revalidatedPaths.push('/', '/en');

  // Revalidate sitemaps
  revalidatePath('/sitemap.xml');
  revalidatePath('/sitemap-products.xml');
  revalidatedPaths.push('/sitemap.xml', '/sitemap-products.xml');
}

/**
 * Handle category-related cache invalidation
 */
async function handleCategoryInvalidation(
  data: CacheInvalidationPayload['data'],
  revalidatedPaths: string[],
  revalidatedTags: string[]
): Promise<void> {
  const { slug, affectedPaths, affectedTags } = data;

  // Revalidate specific category page
  if (slug) {
    const categoryPaths = [
      `/categories/${slug}`,
      `/en/categories/${slug}`
    ];

    for (const path of categoryPaths) {
      revalidatePath(path);
      revalidatedPaths.push(path);
    }
  }

  // Revalidate custom affected paths
  if (affectedPaths) {
    for (const path of affectedPaths) {
      revalidatePath(path);
      revalidatedPaths.push(path);
    }
  }

  // Revalidate category-related tags
  const categoryTags = ['categories', 'products', 'homepage', ...(affectedTags || [])];
  for (const tag of categoryTags) {
    revalidateTag(tag, { expire: 0 });
    revalidatedTags.push(tag);
  }

  // Revalidate homepage (category navigation might change)
  revalidatePath('/');
  revalidatePath('/en');
  revalidatedPaths.push('/', '/en');

  // Revalidate sitemaps
  revalidatePath('/sitemap.xml');
  revalidatePath('/sitemap-categories.xml');
  revalidatedPaths.push('/sitemap.xml', '/sitemap-categories.xml');
}

/**
 * Handle blog-related cache invalidation
 */
async function handleBlogInvalidation(
  data: CacheInvalidationPayload['data'],
  revalidatedPaths: string[],
  revalidatedTags: string[]
): Promise<void> {
  const { slug, affectedPaths, affectedTags } = data;

  // Revalidate specific blog post
  if (slug) {
    const blogPaths = [
      `/blog/${slug}`,
      `/en/blog/${slug}`
    ];

    for (const path of blogPaths) {
      revalidatePath(path);
      revalidatedPaths.push(path);
    }
  }

  // Revalidate blog listing pages
  const blogListingPaths = ['/blog', '/en/blog'];
  for (const path of blogListingPaths) {
    revalidatePath(path);
    revalidatedPaths.push(path);
  }

  // Revalidate custom affected paths
  if (affectedPaths) {
    for (const path of affectedPaths) {
      revalidatePath(path);
      revalidatedPaths.push(path);
    }
  }

  // Revalidate blog-related tags
  const blogTags = ['blog', 'blog-listings', ...(affectedTags || [])];
  for (const tag of blogTags) {
    revalidateTag(tag, { expire: 0 });
    revalidatedTags.push(tag);
  }

  // Revalidate sitemaps
  revalidatePath('/sitemap.xml');
  revalidatePath('/sitemap-blog.xml');
  revalidatedPaths.push('/sitemap.xml', '/sitemap-blog.xml');
}

/**
 * Handle general content invalidation
 */
async function handleContentInvalidation(
  data: CacheInvalidationPayload['data'],
  revalidatedPaths: string[],
  revalidatedTags: string[]
): Promise<void> {
  const { affectedPaths, affectedTags } = data;

  // Revalidate custom affected paths
  if (affectedPaths) {
    for (const path of affectedPaths) {
      revalidatePath(path);
      revalidatedPaths.push(path);
    }
  }

  // Revalidate custom affected tags
  if (affectedTags) {
    for (const tag of affectedTags) {
      revalidateTag(tag, { expire: 0 });
      revalidatedTags.push(tag);
    }
  }

  // Revalidate static content tag
  revalidateTag('static-content', { expire: 0 });
  revalidatedTags.push('static-content');

  // Revalidate static sitemap
  revalidatePath('/sitemap-static.xml');
  revalidatedPaths.push('/sitemap-static.xml');
}

/**
 * Handle homepage invalidation
 */
async function handleHomepageInvalidation(
  revalidatedPaths: string[],
  revalidatedTags: string[]
): Promise<void> {
  // Revalidate homepage paths
  const homepagePaths = ['/', '/en'];
  for (const path of homepagePaths) {
    revalidatePath(path);
    revalidatedPaths.push(path);
  }

  // Revalidate homepage-related tags
  const homepageTags = ['homepage', 'featured-products', 'banners'];
  for (const tag of homepageTags) {
    revalidateTag(tag, { expire: 0 });
    revalidatedTags.push(tag);
  }
}