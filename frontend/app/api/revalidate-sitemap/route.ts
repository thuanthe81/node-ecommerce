import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * API endpoint to trigger sitemap regeneration
 * This can be called by webhooks when content changes
 */
export async function POST(request: NextRequest) {
  try {
    // Verify the request is authorized (you may want to add authentication)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.REVALIDATION_TOKEN;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, action } = body;

    // Revalidate specific sitemap based on content type
    switch (type) {
      case 'product':
        revalidatePath('/sitemap-products.xml');
        revalidatePath('/sitemap.xml');
        console.log('Revalidated product sitemaps');
        break;

      case 'category':
        revalidatePath('/sitemap-categories.xml');
        revalidatePath('/sitemap.xml');
        console.log('Revalidated category sitemaps');
        break;

      case 'blog':
      case 'content':
        revalidatePath('/sitemap-blog.xml');
        revalidatePath('/sitemap.xml');
        console.log('Revalidated blog sitemaps');
        break;

      case 'page':
        revalidatePath('/sitemap-static.xml');
        revalidatePath('/sitemap.xml');
        console.log('Revalidated static page sitemaps');
        break;

      case 'all':
      default:
        // Revalidate all sitemaps
        revalidatePath('/sitemap.xml');
        revalidatePath('/sitemap-products.xml');
        revalidatePath('/sitemap-categories.xml');
        revalidatePath('/sitemap-blog.xml');
        revalidatePath('/sitemap-static.xml');
        revalidatePath('/sitemap-index.xml');
        console.log('Revalidated all sitemaps');
        break;
    }

    // Also revalidate the sitemap index
    revalidatePath('/sitemap-index.xml');

    return NextResponse.json({
      success: true,
      message: `Sitemap revalidated for type: ${type}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error revalidating sitemap:', error);
    return NextResponse.json(
      { error: 'Failed to revalidate sitemap' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to manually trigger sitemap regeneration
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const token = searchParams.get('token');

    // Verify token for GET requests
    const expectedToken = process.env.REVALIDATION_TOKEN;
    if (expectedToken && token !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Trigger the same revalidation logic as POST
    const mockBody = { type, action: 'revalidate' };
    return POST(new NextRequest(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify(mockBody)
    }));

  } catch (error) {
    console.error('Error in GET revalidation:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}