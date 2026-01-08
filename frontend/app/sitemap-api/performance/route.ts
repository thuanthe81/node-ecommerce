import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitor } from '@/lib/performance-monitoring';
import { ssrMonitoring } from '@/lib/ssr-monitoring';

/**
 * API endpoint for performance metrics and monitoring
 * Enhanced with SSR-specific monitoring capabilities
 */

/**
 * GET endpoint to retrieve performance metrics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeWindow = parseInt(searchParams.get('timeWindow') || '3600000'); // 1 hour default
    const type = searchParams.get('type') || 'summary';

    switch (type) {
      case 'summary':
        const summary = performanceMonitor.getPerformanceSummary(timeWindow);
        return NextResponse.json({
          success: true,
          data: summary,
          timestamp: new Date().toISOString()
        });

      case 'ssr-summary':
        const ssrSummary = ssrMonitoring.getMetricsSummary(timeWindow / 60000); // Convert to minutes
        return NextResponse.json({
          success: true,
          data: ssrSummary,
          timestamp: new Date().toISOString()
        });

      case 'ssr-alerts':
        const activeAlerts = ssrMonitoring.getActiveAlerts();
        return NextResponse.json({
          success: true,
          data: {
            alerts: activeAlerts,
            count: activeAlerts.length,
          },
          timestamp: new Date().toISOString()
        });

      case 'cache':
        const cacheMetrics = performanceMonitor.getCachePerformanceSummary();
        const cacheData = Object.fromEntries(cacheMetrics);
        return NextResponse.json({
          success: true,
          data: cacheData,
          timestamp: new Date().toISOString()
        });

      case 'health':
        const healthSummary = performanceMonitor.getPerformanceSummary(300000); // 5 minutes
        const ssrHealthSummary = ssrMonitoring.getMetricsSummary(5); // 5 minutes
        const activeAlertsCount = ssrMonitoring.getActiveAlerts().length;

        const isHealthy =
          healthSummary.averageResponseTime < 1000 && // < 1 second
          healthSummary.cacheHitRate > 0.7 && // > 70% cache hit rate
          healthSummary.errorRate < 0.05 && // < 5% error rate
          ssrHealthSummary.successRate > 0.95 && // > 95% SSR success rate
          ssrHealthSummary.averageDuration < 3000 && // < 3 seconds average SSR duration
          activeAlertsCount === 0; // No active alerts

        return NextResponse.json({
          success: true,
          healthy: isHealthy,
          data: {
            averageResponseTime: healthSummary.averageResponseTime,
            cacheHitRate: healthSummary.cacheHitRate,
            errorRate: healthSummary.errorRate,
            slowRequestCount: healthSummary.slowRequests.length,
            ssrSuccessRate: ssrHealthSummary.successRate,
            ssrAverageDuration: ssrHealthSummary.averageDuration,
            ssrErrorRate: ssrHealthSummary.errorRate,
            activeAlerts: activeAlertsCount,
          },
          timestamp: new Date().toISOString()
        });

      case 'dashboard':
        // Combined dashboard data for monitoring UI
        const dashboardSummary = performanceMonitor.getPerformanceSummary(timeWindow);
        const dashboardSSRSummary = ssrMonitoring.getMetricsSummary(timeWindow / 60000);
        const dashboardAlerts = ssrMonitoring.getActiveAlerts();

        return NextResponse.json({
          success: true,
          data: {
            performance: dashboardSummary,
            ssr: dashboardSSRSummary,
            alerts: dashboardAlerts,
            health: {
              overall: dashboardSummary.errorRate < 0.05 && dashboardSSRSummary.successRate > 0.95,
              performance: dashboardSummary.averageResponseTime < 1000,
              ssr: dashboardSSRSummary.averageDuration < 3000,
              errors: dashboardSSRSummary.errorRate < 0.05,
              alerts: dashboardAlerts.length === 0,
            },
          },
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid metrics type' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error retrieving performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve performance metrics' },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint to track client-side performance metrics
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, path, metrics, requestId, data } = body;

    switch (type) {
      case 'core-web-vitals':
        performanceMonitor.trackCoreWebVitals(path, metrics);
        break;

      case 'page-load':
        if (requestId) {
          performanceMonitor.endRequest(requestId, metrics.cacheHit, metrics.errorCount);
        }
        break;

      case 'api-call':
        if (requestId && metrics.duration) {
          performanceMonitor.trackAPICall(requestId, metrics.duration);
        }
        break;

      case 'ssr-render':
        if (requestId && metrics.duration) {
          performanceMonitor.trackSSRRender(requestId, metrics.duration);
        }
        break;

      case 'ssr_metric':
        // Handle SSR metrics from monitoring service
        if (data) {
          // Store the metric (in a real app, this would go to a database)
          console.log('SSR Metric:', data);
        }
        break;

      case 'ssr_error':
        // Handle SSR errors from monitoring service
        if (data) {
          console.error('SSR Error:', data);

          // In production, send to error tracking service
          if (process.env.NODE_ENV === 'production') {
            // TODO: Send to external error tracking service (Sentry, DataDog, etc.)
          }
        }
        break;

      case 'ssr_health_report':
        // Handle periodic health reports
        if (data) {
          // Check for critical issues and send alerts
          if (data.summary.errorRate > 0.1 || data.activeAlerts > 0) {
            await sendCriticalAlert(data);
          }
        }
        break;

      case 'ssr_alert':
        // Handle SSR alerts
        if (data?.alert) {
          console.warn('SSR Alert:', data.alert);
          await handleSSRAlert(data.alert);
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid metrics type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: 'Metrics tracked successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error tracking performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to track performance metrics' },
      { status: 500 }
    );
  }
}

/**
 * PUT endpoint to resolve alerts
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, alertId } = body;

    switch (action) {
      case 'resolve-alert':
        if (alertId) {
          ssrMonitoring.resolveAlert(alertId);
          return NextResponse.json({
            success: true,
            message: 'Alert resolved successfully',
            timestamp: new Date().toISOString()
          });
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

/**
 * DELETE endpoint to cleanup old metrics
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const maxAge = parseInt(searchParams.get('maxAge') || '86400000'); // 24 hours default

    performanceMonitor.cleanupOldMetrics(maxAge);

    return NextResponse.json({
      success: true,
      message: 'Old metrics cleaned up successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error cleaning up metrics:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup metrics' },
      { status: 500 }
    );
  }
}

/**
 * Handles critical alerts by sending notifications
 */
async function sendCriticalAlert(healthData: any): Promise<void> {
  try {
    const alertWebhookUrl = process.env.ALERT_WEBHOOK_URL;
    if (!alertWebhookUrl) {
      console.warn('ALERT_WEBHOOK_URL not configured, skipping critical alert');
      return;
    }

    const alertPayload = {
      type: 'critical_ssr_health',
      severity: 'high',
      message: `SSR health degradation detected: ${healthData.summary.errorRate * 100}% error rate, ${healthData.activeAlerts} active alerts`,
      details: healthData,
      timestamp: new Date().toISOString(),
    };

    await fetch(alertWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ALERT_API_KEY || ''}`,
      },
      body: JSON.stringify(alertPayload),
    });

    console.log('Critical alert sent successfully');
  } catch (error) {
    console.error('Failed to send critical alert:', error);
  }
}

/**
 * Handles individual SSR alerts
 */
async function handleSSRAlert(alert: any): Promise<void> {
  try {
    // Log alert for monitoring
    console.warn(`SSR Alert [${alert.severity}]: ${alert.message}`, alert.details);

    // Send to external monitoring service if configured
    const monitoringUrl = process.env.MONITORING_WEBHOOK_URL;
    if (monitoringUrl) {
      await fetch(monitoringUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MONITORING_API_KEY || ''}`,
        },
        body: JSON.stringify({
          type: 'ssr_alert',
          alert,
          timestamp: new Date().toISOString(),
        }),
      });
    }

    // For high severity alerts, send immediate notification
    if (alert.severity === 'high' || alert.severity === 'critical') {
      await sendCriticalAlert({
        summary: { errorRate: 0.1 }, // Placeholder
        activeAlerts: 1,
        alert,
      });
    }
  } catch (error) {
    console.error('Failed to handle SSR alert:', error);
  }
}