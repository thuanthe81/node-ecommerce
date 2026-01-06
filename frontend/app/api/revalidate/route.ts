import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * Comprehensive cache invalidation API endpoint
 * Handles cache invalidation for different content types and update scenarios
 */

interface RevalidationRequest {
  type: 'product' | 'category' | 'blog' | 'homepage' | 'static' | 'all';
  action: 'create' | 'update' | 'delete' | 'revalidate';
  id?: string;
  slug?: string;
  paths?: string[];
  tags?: string[];
}

/**
 * POST endpoint for webhook-triggered cache invalidation
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.REVALIDATION_TOKEN;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: RevalidationRequest = await request.json();
    const { type, action, id, slug, paths, tags } = body;

    const revalidatedPaths: string[] = [];
    const revalidatedTags: string[] = [];

    // Handle different content types
    switch (type) {
      case 'product':
        await handleProductRevalidation(action, { id, slug, paths, tags }, revalidatedPaths, revalidatedTags);
        break;

      case 'category':
        await handleCategoryRevalidation(action, { id, slug, paths, tags }, revalidatedPaths, revalidatedTags);
        break;

      case 'blog':
        await handleBlogRevalidation(action, { id, slug, paths, tags }, revalidatedPaths, revalidatedTags);
        break;

      case 'homepage':
        await handleHomepageRevalidation(action, revalidatedPaths, revalidatedTags);
        break;

      case 'static':
        await handleStaticRevalidation(paths || [], revalidatedPaths, revalidatedTags);
        break;

      case 'all':
        await handleFullRevalidation(revalidatedPaths, revalidatedTags);
        break;

      default:
        return NextResponse.json({ error: 'Invalid revalidation type' }, { status: 400 });
    }

    // Log revalidation activity
    console.log('Cache revalidation completed:', {
      type,
      action,
      revalidatedPaths,
      revalidatedTags,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: `Cache revalidated for ${type}`,
      revalidatedPaths,
      revalidatedTags,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error during cache revalidation:', error);
    return NextResponse.json(
      { error: 'Failed to revalidate cache' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for manual cache invalidation
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as RevalidationRequest['type'] || 'all';
    const action = searchParams.get('action') as RevalidationRequest['action'] || 'revalidate';
    const token = searchParams.get('token');
    const paths = searchParams.get('paths')?.split(',');
    const tags = searchParams.get('tags')?.split(',');

    // Verify token for GET requests
    const expectedToken = process.env.REVALIDATION_TOKEN;
    if (expectedToken && token !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create request body and delegate to POST handler
    const mockRequest = new NextRequest(request.url, {
      method: 'POST',
      headers: { 'authorization': `Bearer ${token}` },
      body: JSON.stringify({ type, action, paths, tags })
    });

    return POST(mockRequest);

  } catch (error) {
    console.error('Error in GET revalidation:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

/**
 * Handle product-related cache invalidation
 */
async function handleProductRevalidation(
  action: string,
  data: { id?: string; slug?: string; paths?: string[]; tags?: string[] },
  revalidatedPaths: string[],
  revalidatedTags: string[]
) {
  const { slug, paths, tags } = data;

  // Revalidate specific product page if slug provided
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

  // Revalidate custom paths
  if (paths) {
    for (const path of paths) {
      revalidatePath(path);
      revalidatedPaths.push(path);
    }
  }

  // Revalidate product-related tags
  const productTags = ['products', 'featured-products', 'homepage', ...(tags || [])];
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
async function handleCategoryRevalidation(
  action: string,
  data: { id?: string; slug?: string; paths?: string[]; tags?: string[] },
  revalidatedPaths: string[],
  revalidatedTags: string[]
) {
  const { slug, paths, tags } = data;

  // Revalidate specific category page if slug provided
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

  // Revalidate custom paths
  if (paths) {
    for (const path of paths) {
      revalidatePath(path);
      revalidatedPaths.push(path);
    }
  }

  // Revalidate category-related tags
  const categoryTags = ['categories', 'products', 'homepage', ...(tags || [])];
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
async function handleBlogRevalidation(
  action: string,
  data: { id?: string; slug?: string; paths?: string[]; tags?: string[] },
  revalidatedPaths: string[],
  revalidatedTags: string[]
) {
  const { slug, paths, tags } = data;

  // Revalidate specific blog post if slug provided
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
  const blogListingPaths = [
    '/blog',
    '/en/blog'
  ];

  for (const path of blogListingPaths) {
    revalidatePath(path);
    revalidatedPaths.push(path);
  }

  // Revalidate custom paths
  if (paths) {
    for (const path of paths) {
      revalidatePath(path);
      revalidatedPaths.push(path);
    }
  }

  // Revalidate blog-related tags
  const blogTags = ['blog', 'blog-listings', ...(tags || [])];
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
 * Handle homepage cache invalidation
 */
async function handleHomepageRevalidation(
  action: string,
  revalidatedPaths: string[],
  revalidatedTags: string[]
) {
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

/**
 * Handle static page cache invalidation
 */
async function handleStaticRevalidation(
  paths: string[],
  revalidatedPaths: string[],
  revalidatedTags: string[]
) {
  // Revalidate specified paths
  for (const path of paths) {
    revalidatePath(path);
    revalidatedPaths.push(path);
  }

  // Revalidate static content tag
  revalidateTag('static-content', { expire: 0 });
  revalidatedTags.push('static-content');

  // Revalidate static sitemap
  revalidatePath('/sitemap-static.xml');
  revalidatedPaths.push('/sitemap-static.xml');
}

/**
 * Handle full cache invalidation
 */
async function handleFullRevalidation(
  revalidatedPaths: string[],
  revalidatedTags: string[]
) {
  // Revalidate all main paths
  const allPaths = [
    '/',
    '/en',
    '/products',
    '/en/products',
    '/categories',
    '/en/categories',
    '/blog',
    '/en/blog',
    '/sitemap.xml',
    '/sitemap-products.xml',
    '/sitemap-categories.xml',
    '/sitemap-blog.xml',
    '/sitemap-static.xml',
    '/sitemap-index.xml'
  ];

  for (const path of allPaths) {
    revalidatePath(path);
    revalidatedPaths.push(path);
  }

  // Revalidate all tags
  const allTags = [
    'homepage',
    'products',
    'categories',
    'blog',
    'blog-listings',
    'featured-products',
    'banners',
    'static-content',
    'sitemap'
  ];

  for (const tag of allTags) {
    revalidateTag(tag, { expire: 0 });
    revalidatedTags.push(tag);
  }
}