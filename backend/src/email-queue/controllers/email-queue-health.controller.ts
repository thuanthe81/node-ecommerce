import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '../../auth/decorators/public.decorator';
import { EmailQueueMonitoringService, QueueMetrics, HealthCheckResult } from '../services/email-queue-monitoring.service';
import { EmailQueueConfigService } from '../services/email-queue-config.service';

/**
 * Email Queue Health Controller
 *
 * Provides REST endpoints for monitoring email queue system health,
 * performance metrics, and operational status.
 *
 * Requirements: 5.4, 5.5 - Health check endpoints and queue metrics
 */
@Controller('email-queue/health')
@Public()
export class EmailQueueHealthController {
  constructor(
    private monitoringService: EmailQueueMonitoringService,
    private configService: EmailQueueConfigService,
  ) {}

  /**
   * Get comprehensive system health status
   * Requirements: 5.4 - Health check endpoints for monitoring
   *
   * @returns Detailed health check results with component status
   */
  @Get()
  async getHealthStatus(@Res() res: Response): Promise<void> {
    try {
      const healthResult: HealthCheckResult = await this.monitoringService.performHealthCheck();

      // Set HTTP status based on health result
      let httpStatus: number;
      switch (healthResult.status) {
        case 'healthy':
          httpStatus = HttpStatus.OK;
          break;
        case 'warning':
          httpStatus = HttpStatus.OK; // Still operational
          break;
        case 'error':
          httpStatus = HttpStatus.SERVICE_UNAVAILABLE;
          break;
        default:
          httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
      }

      res.status(httpStatus).json({
        status: healthResult.status,
        timestamp: healthResult.timestamp,
        responseTime: healthResult.responseTime,
        summary: healthResult.summary,
        components: healthResult.checks,
        service: 'email-queue',
        version: process.env.npm_package_version || '1.0.0',
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        timestamp: new Date(),
        message: `Health check failed: ${error instanceof Error ? error.message : error}`,
        service: 'email-queue',
      });
    }
  }

  /**
   * Get queue metrics and performance statistics
   * Requirements: 5.5 - Queue metrics availability
   *
   * @returns Comprehensive queue metrics including processing rates and error statistics
   */
  @Get('metrics')
  async getQueueMetrics(@Res() res: Response): Promise<void> {
    try {
      const metrics: QueueMetrics = await this.monitoringService.getQueueMetrics();

      res.status(HttpStatus.OK).json({
        ...metrics,
        service: 'email-queue',
        endpoint: 'metrics',
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to retrieve queue metrics',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        service: 'email-queue',
      });
    }
  }

  /**
   * Simple health ping endpoint (returns 200 OK if service is running)
   * Requirements: 5.4 - Basic health check for load balancers
   *
   * @returns Simple OK response for basic health checks
   */
  @Get('ping')
  async ping(@Res() res: Response): Promise<void> {
    res.status(HttpStatus.OK).json({
      status: 'ok',
      timestamp: new Date(),
      service: 'email-queue',
      uptime: process.uptime(),
    });
  }

  /**
   * Get queue status summary (lightweight metrics)
   * Requirements: 5.5 - Quick status overview
   *
   * @returns Basic queue status information
   */
  @Get('status')
  async getQueueStatus(@Res() res: Response): Promise<void> {
    try {
      const metrics = await this.monitoringService.getQueueMetrics();

      // Calculate simple status indicators
      const isHealthy = metrics.worker.isRunning && metrics.total >= 0;
      const hasBacklog = metrics.waiting > 100;
      const hasErrors = metrics.errors.errorRate > 5; // 5% error rate threshold

      let status: 'operational' | 'degraded' | 'down';
      if (!isHealthy) {
        status = 'down';
      } else if (hasBacklog || hasErrors) {
        status = 'degraded';
      } else {
        status = 'operational';
      }

      res.status(HttpStatus.OK).json({
        status,
        timestamp: new Date(),
        queue: {
          waiting: metrics.waiting,
          active: metrics.active,
          failed: metrics.failed,
          total: metrics.total,
        },
        worker: {
          running: metrics.worker.isRunning,
          status: metrics.worker.status,
        },
        processing: {
          rate: metrics.processing.rate,
          throughput: metrics.processing.throughput,
        },
        errors: {
          rate: metrics.errors.errorRate,
          total: metrics.errors.totalErrors,
        },
        indicators: {
          healthy: isHealthy,
          backlog: hasBacklog,
          errors: hasErrors,
        },
        service: 'email-queue',
      });
    } catch (error) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'down',
        timestamp: new Date(),
        error: 'Unable to retrieve queue status',
        message: error instanceof Error ? error.message : String(error),
        service: 'email-queue',
      });
    }
  }

  /**
   * Get recent error information
   * Requirements: 5.3 - Error logging and monitoring
   *
   * @returns Recent error statistics and patterns
   */
  @Get('errors')
  async getErrorInfo(@Res() res: Response): Promise<void> {
    try {
      const metrics = await this.monitoringService.getQueueMetrics();

      res.status(HttpStatus.OK).json({
        timestamp: new Date(),
        errorRate: metrics.errors.errorRate,
        totalErrors: metrics.errors.totalErrors,
        deadLetterCount: metrics.errors.deadLetterCount,
        recentErrors: metrics.errors.recentErrors,
        commonErrors: metrics.errors.commonErrors,
        service: 'email-queue',
        endpoint: 'errors',
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to retrieve error information',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        service: 'email-queue',
      });
    }
  }

  /**
   * Get system information and configuration
   * Requirements: 5.4 - System monitoring
   *
   * @returns System and configuration information
   */
  @Get('system')
  async getSystemInfo(@Res() res: Response): Promise<void> {
    try {
      const metrics = await this.monitoringService.getQueueMetrics();

      res.status(HttpStatus.OK).json({
        timestamp: new Date(),
        system: metrics.system,
        configuration: this.configService?.getConfigurationForMonitoring() || {
          error: 'Configuration service not available'
        },
        service: 'email-queue',
        endpoint: 'system',
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to retrieve system information',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        service: 'email-queue',
      });
    }
  }
}