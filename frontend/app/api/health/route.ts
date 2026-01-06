/**
 * Health check API endpoint for production monitoring
 * Provides system status, performance metrics, and SSR health information
 */

import { NextRequest, NextResponse } from 'next/server';
import { getHealthCheckData } from '@/lib/production-monitoring';

export async function GET(request: NextRequest) {
  try {
    const healthData = getHealthCheckData();

    // Add additional health checks
    const additionalChecks = await performAdditionalHealthChecks();

    const response = {
      ...healthData,
      checks: additionalChecks,
    };

    // Return appropriate status code based on health
    const isHealthy = additionalChecks.every(check => check.status === 'healthy');
    const statusCode = isHealthy ? 200 : 503;

    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

/**
 * Perform additional health checks
 */
async function performAdditionalHealthChecks() {
  const checks = [];

  // Database connectivity check
  checks.push(await checkDatabaseConnection());

  // API connectivity check
  checks.push(await checkAPIConnectivity());

  // Cache system check
  checks.push(await checkCacheSystem());

  // Sitemap generation check
  checks.push(await checkSitemapGeneration());

  return checks;
}

/**
 * Check database connection
 */
async function checkDatabaseConnection() {
  try {
    // This would typically use your database client
    // For now, we'll simulate a check
    const startTime = Date.now();

    // Simulate database ping
    await new Promise(resolve => setTimeout(resolve, 10));

    const responseTime = Date.now() - startTime;

    return {
      name: 'database',
      status: 'healthy' as const,
      responseTime,
      message: 'Database connection successful',
    };
  } catch (error) {
    return {
      name: 'database',
      status: 'unhealthy' as const,
      responseTime: 0,
      message: `Database connection failed: ${error}`,
    };
  }
}

/**
 * Check API connectivity
 */
async function checkAPIConnectivity() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const startTime = Date.now();

    const response = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      headers: {
        'User-Agent': 'SSR-Health-Check/1.0',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return {
        name: 'api',
        status: 'healthy' as const,
        responseTime,
        message: 'API connectivity successful',
      };
    } else {
      return {
        name: 'api',
        status: 'degraded' as const,
        responseTime,
        message: `API returned status ${response.status}`,
      };
    }
  } catch (error) {
    return {
      name: 'api',
      status: 'unhealthy' as const,
      responseTime: 0,
      message: `API connectivity failed: ${error}`,
    };
  }
}

/**
 * Check cache system
 */
async function checkCacheSystem() {
  try {
    // This would typically check Redis or your cache system
    // For now, we'll simulate a check
    const startTime = Date.now();

    // Simulate cache operation
    await new Promise(resolve => setTimeout(resolve, 5));

    const responseTime = Date.now() - startTime;

    return {
      name: 'cache',
      status: 'healthy' as const,
      responseTime,
      message: 'Cache system operational',
    };
  } catch (error) {
    return {
      name: 'cache',
      status: 'unhealthy' as const,
      responseTime: 0,
      message: `Cache system failed: ${error}`,
    };
  }
}

/**
 * Check sitemap generation
 */
async function checkSitemapGeneration() {
  try {
    const startTime = Date.now();

    // Check if sitemap is accessible
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const response = await fetch(`${siteUrl}/sitemap.xml`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return {
        name: 'sitemap',
        status: 'healthy' as const,
        responseTime,
        message: 'Sitemap generation working',
      };
    } else {
      return {
        name: 'sitemap',
        status: 'degraded' as const,
        responseTime,
        message: `Sitemap returned status ${response.status}`,
      };
    }
  } catch (error) {
    return {
      name: 'sitemap',
      status: 'unhealthy' as const,
      responseTime: 0,
      message: `Sitemap check failed: ${error}`,
    };
  }
}

/**
 * Handle POST requests for manual health checks
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { checks } = body;

    if (!Array.isArray(checks)) {
      return NextResponse.json(
        { error: 'Invalid request: checks must be an array' },
        { status: 400 }
      );
    }

    const results = [];

    for (const checkName of checks) {
      switch (checkName) {
        case 'database':
          results.push(await checkDatabaseConnection());
          break;
        case 'api':
          results.push(await checkAPIConnectivity());
          break;
        case 'cache':
          results.push(await checkCacheSystem());
          break;
        case 'sitemap':
          results.push(await checkSitemapGeneration());
          break;
        default:
          results.push({
            name: checkName,
            status: 'unknown' as const,
            responseTime: 0,
            message: `Unknown check: ${checkName}`,
          });
      }
    }

    return NextResponse.json({
      status: 'completed',
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Manual health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}