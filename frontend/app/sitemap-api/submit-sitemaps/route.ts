import { NextRequest, NextResponse } from 'next/server';
import {
  submitAllSitemaps,
  generateSubmissionInstructions,
  logSitemapStatus
} from '@/lib/sitemap-submission';

/**
 * API endpoint to submit sitemaps to search engines
 */
export async function POST(request: NextRequest) {
  try {
    // Verify the request is authorized
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.REVALIDATION_TOKEN;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action = 'submit' } = body;

    if (action === 'submit') {
      // Submit all sitemaps to search engines
      const results = await submitAllSitemaps();

      logSitemapStatus();

      return NextResponse.json({
        success: true,
        message: 'Sitemap submission completed',
        results,
        timestamp: new Date().toISOString()
      });
    } else if (action === 'instructions') {
      // Return manual submission instructions
      const instructions = generateSubmissionInstructions();

      return NextResponse.json({
        success: true,
        instructions,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "submit" or "instructions"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error in sitemap submission:', error);
    return NextResponse.json(
      { error: 'Failed to process sitemap submission' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to get submission instructions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    // Verify token for GET requests
    const expectedToken = process.env.REVALIDATION_TOKEN;
    if (expectedToken && token !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const instructions = generateSubmissionInstructions();

    return NextResponse.json({
      success: true,
      instructions,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting submission instructions:', error);
    return NextResponse.json(
      { error: 'Failed to get instructions' },
      { status: 500 }
    );
  }
}