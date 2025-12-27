import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  Res,
  Body,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CONSTANTS } from '@alacraft/shared';
import { EmailEventPublisher } from '../services/email-event-publisher.service';
import { EmailQueueMonitoringService } from '../services/email-queue-monitoring.service';

/**
 * Email Queue Admin Controller
 *
 * Provides REST endpoints for admin management of the email queue system,
 * including viewing failed jobs, retrying jobs, and managing the dead letter queue.
 *
 * Requirements: 5.5 - Admin interface for queue management
 */
@Controller('admin/email-queue')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(CONSTANTS.STATUS.USER_ROLES.ADMIN)
export class EmailQueueAdminController {
  constructor(
    private emailEventPublisher: EmailEventPublisher,
    private monitoringService: EmailQueueMonitoringService,
  ) {}

  /**
   * Get queue overview with metrics
   * Requirements: 5.5 - Queue status and metrics for admin
   *
   * @returns Comprehensive queue overview
   */
  @Get('overview')
  async getQueueOverview(@Res() res: Response): Promise<void> {
    try {
      const [metrics, queueStatus] = await Promise.all([
        this.monitoringService.getQueueMetrics(),
        this.emailEventPublisher.getQueueStatus(),
      ]);

      res.status(HttpStatus.OK).json({
        timestamp: new Date(),
        status: queueStatus,
        metrics: {
          waiting: metrics.waiting,
          active: metrics.active,
          completed: metrics.completed,
          failed: metrics.failed,
          delayed: metrics.delayed,
          total: metrics.total,
        },
        processing: metrics.processing,
        errors: metrics.errors,
        worker: metrics.worker,
        system: metrics.system,
        service: 'email-queue-admin',
        endpoint: 'overview',
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to retrieve queue overview',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        service: 'email-queue-admin',
      });
    }
  }

  /**
   * Get failed jobs with pagination
   * Requirements: 5.5 - Admin interface for viewing failed jobs
   *
   * @param start - Start index for pagination
   * @param end - End index for pagination
   * @returns List of failed jobs with details
   */
  @Get('jobs/failed')
  async getFailedJobs(
    @Query('start', new DefaultValuePipe(0), ParseIntPipe) start: number,
    @Query('end', new DefaultValuePipe(50), ParseIntPipe) end: number,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Validate pagination parameters
      if (start < 0 || end < start || (end - start) > 1000) {
        res.status(HttpStatus.BAD_REQUEST).json({
          error: 'Invalid pagination parameters',
          message: 'Start must be >= 0, end must be > start, and range must be <= 1000',
          timestamp: new Date(),
          service: 'email-queue-admin',
        });
        return;
      }

      const failedJobs = await this.emailEventPublisher.getFailedJobs(start, end);

      res.status(HttpStatus.OK).json({
        timestamp: new Date(),
        pagination: {
          start,
          end,
          count: failedJobs.length,
        },
        jobs: failedJobs,
        service: 'email-queue-admin',
        endpoint: 'failed-jobs',
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to retrieve failed jobs',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        service: 'email-queue-admin',
      });
    }
  }

  /**
   * Get completed jobs with pagination
   * Requirements: 5.5 - Admin interface for viewing job history
   *
   * @param start - Start index for pagination
   * @param end - End index for pagination
   * @returns List of completed jobs with details
   */
  @Get('jobs/completed')
  async getCompletedJobs(
    @Query('start', new DefaultValuePipe(0), ParseIntPipe) start: number,
    @Query('end', new DefaultValuePipe(50), ParseIntPipe) end: number,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Validate pagination parameters
      if (start < 0 || end < start || (end - start) > 1000) {
        res.status(HttpStatus.BAD_REQUEST).json({
          error: 'Invalid pagination parameters',
          message: 'Start must be >= 0, end must be > start, and range must be <= 1000',
          timestamp: new Date(),
          service: 'email-queue-admin',
        });
        return;
      }

      const completedJobs = await this.emailEventPublisher.getCompletedJobs(start, end);

      res.status(HttpStatus.OK).json({
        timestamp: new Date(),
        pagination: {
          start,
          end,
          count: completedJobs.length,
        },
        jobs: completedJobs,
        service: 'email-queue-admin',
        endpoint: 'completed-jobs',
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to retrieve completed jobs',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        service: 'email-queue-admin',
      });
    }
  }

  /**
   * Get waiting jobs with pagination
   * Requirements: 5.5 - Admin interface for viewing queue status
   *
   * @param start - Start index for pagination
   * @param end - End index for pagination
   * @returns List of waiting jobs with details
   */
  @Get('jobs/waiting')
  async getWaitingJobs(
    @Query('start', new DefaultValuePipe(0), ParseIntPipe) start: number,
    @Query('end', new DefaultValuePipe(50), ParseIntPipe) end: number,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Validate pagination parameters
      if (start < 0 || end < start || (end - start) > 1000) {
        res.status(HttpStatus.BAD_REQUEST).json({
          error: 'Invalid pagination parameters',
          message: 'Start must be >= 0, end must be > start, and range must be <= 1000',
          timestamp: new Date(),
          service: 'email-queue-admin',
        });
        return;
      }

      const waitingJobs = await this.emailEventPublisher.getWaitingJobs(start, end);

      res.status(HttpStatus.OK).json({
        timestamp: new Date(),
        pagination: {
          start,
          end,
          count: waitingJobs.length,
        },
        jobs: waitingJobs,
        service: 'email-queue-admin',
        endpoint: 'waiting-jobs',
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to retrieve waiting jobs',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        service: 'email-queue-admin',
      });
    }
  }

  /**
   * Get active jobs with pagination
   * Requirements: 5.5 - Admin interface for viewing current processing
   *
   * @param start - Start index for pagination
   * @param end - End index for pagination
   * @returns List of active jobs with details
   */
  @Get('jobs/active')
  async getActiveJobs(
    @Query('start', new DefaultValuePipe(0), ParseIntPipe) start: number,
    @Query('end', new DefaultValuePipe(50), ParseIntPipe) end: number,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Validate pagination parameters
      if (start < 0 || end < start || (end - start) > 1000) {
        res.status(HttpStatus.BAD_REQUEST).json({
          error: 'Invalid pagination parameters',
          message: 'Start must be >= 0, end must be > start, and range must be <= 1000',
          timestamp: new Date(),
          service: 'email-queue-admin',
        });
        return;
      }

      const activeJobs = await this.emailEventPublisher.getActiveJobs(start, end);

      res.status(HttpStatus.OK).json({
        timestamp: new Date(),
        pagination: {
          start,
          end,
          count: activeJobs.length,
        },
        jobs: activeJobs,
        service: 'email-queue-admin',
        endpoint: 'active-jobs',
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to retrieve active jobs',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        service: 'email-queue-admin',
      });
    }
  }

  /**
   * Get specific job details by ID
   * Requirements: 5.5 - Admin interface for job inspection
   *
   * @param jobId - Job ID to retrieve
   * @returns Detailed job information
   */
  @Get('jobs/:jobId')
  async getJobDetails(
    @Param('jobId') jobId: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const job = await this.emailEventPublisher.getJob(jobId);

      if (!job) {
        res.status(HttpStatus.NOT_FOUND).json({
          error: 'Job not found',
          message: `Job with ID ${jobId} was not found`,
          timestamp: new Date(),
          service: 'email-queue-admin',
        });
        return;
      }

      res.status(HttpStatus.OK).json({
        timestamp: new Date(),
        job,
        service: 'email-queue-admin',
        endpoint: 'job-details',
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to retrieve job details',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        service: 'email-queue-admin',
      });
    }
  }

  /**
   * Retry a failed job
   * Requirements: 5.5 - Manual job retry functionality
   *
   * @param jobId - Job ID to retry
   * @returns Retry operation result
   */
  @Post('jobs/:jobId/retry')
  async retryJob(
    @Param('jobId') jobId: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const result = await this.emailEventPublisher.retryJob(jobId);

      const statusCode = result.success ? HttpStatus.OK : HttpStatus.BAD_REQUEST;

      res.status(statusCode).json({
        timestamp: new Date(),
        success: result.success,
        message: result.message,
        jobId,
        service: 'email-queue-admin',
        endpoint: 'retry-job',
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to retry job',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        jobId,
        service: 'email-queue-admin',
      });
    }
  }

  /**
   * Remove a job from the queue
   * Requirements: 5.5 - Dead letter queue management
   *
   * @param jobId - Job ID to remove
   * @returns Remove operation result
   */
  @Delete('jobs/:jobId')
  async removeJob(
    @Param('jobId') jobId: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const result = await this.emailEventPublisher.removeJob(jobId);

      const statusCode = result.success ? HttpStatus.OK : HttpStatus.BAD_REQUEST;

      res.status(statusCode).json({
        timestamp: new Date(),
        success: result.success,
        message: result.message,
        jobId,
        service: 'email-queue-admin',
        endpoint: 'remove-job',
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to remove job',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        jobId,
        service: 'email-queue-admin',
      });
    }
  }

  /**
   * Clean old completed jobs
   * Requirements: 5.5 - Queue maintenance functionality
   *
   * @param body - Cleanup parameters
   * @returns Cleanup operation result
   */
  @Post('maintenance/clean-completed')
  async cleanCompletedJobs(
    @Body() body: { olderThan?: number; limit?: number },
    @Res() res: Response,
  ): Promise<void> {
    try {
      const olderThan = body.olderThan || 24 * 60 * 60 * 1000; // Default: 24 hours
      const limit = body.limit || 100; // Default: 100 jobs

      // Validate parameters
      if (olderThan < 60 * 60 * 1000) { // Minimum 1 hour
        res.status(HttpStatus.BAD_REQUEST).json({
          error: 'Invalid olderThan parameter',
          message: 'olderThan must be at least 1 hour (3600000 ms)',
          timestamp: new Date(),
          service: 'email-queue-admin',
        });
        return;
      }

      if (limit < 1 || limit > 10000) {
        res.status(HttpStatus.BAD_REQUEST).json({
          error: 'Invalid limit parameter',
          message: 'limit must be between 1 and 10000',
          timestamp: new Date(),
          service: 'email-queue-admin',
        });
        return;
      }

      const cleanedCount = await this.emailEventPublisher.cleanCompletedJobs(olderThan, limit);

      res.status(HttpStatus.OK).json({
        timestamp: new Date(),
        success: true,
        message: `Cleaned ${cleanedCount} completed jobs`,
        cleanedCount,
        parameters: {
          olderThan,
          limit,
        },
        service: 'email-queue-admin',
        endpoint: 'clean-completed',
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to clean completed jobs',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        service: 'email-queue-admin',
      });
    }
  }

  /**
   * Clean old failed jobs
   * Requirements: 5.5 - Dead letter queue management
   *
   * @param body - Cleanup parameters
   * @returns Cleanup operation result
   */
  @Post('maintenance/clean-failed')
  async cleanFailedJobs(
    @Body() body: { olderThan?: number; limit?: number },
    @Res() res: Response,
  ): Promise<void> {
    try {
      const olderThan = body.olderThan || 7 * 24 * 60 * 60 * 1000; // Default: 7 days
      const limit = body.limit || 100; // Default: 100 jobs

      // Validate parameters
      if (olderThan < 60 * 60 * 1000) { // Minimum 1 hour
        res.status(HttpStatus.BAD_REQUEST).json({
          error: 'Invalid olderThan parameter',
          message: 'olderThan must be at least 1 hour (3600000 ms)',
          timestamp: new Date(),
          service: 'email-queue-admin',
        });
        return;
      }

      if (limit < 1 || limit > 10000) {
        res.status(HttpStatus.BAD_REQUEST).json({
          error: 'Invalid limit parameter',
          message: 'limit must be between 1 and 10000',
          timestamp: new Date(),
          service: 'email-queue-admin',
        });
        return;
      }

      const cleanedCount = await this.emailEventPublisher.cleanFailedJobs(olderThan, limit);

      res.status(HttpStatus.OK).json({
        timestamp: new Date(),
        success: true,
        message: `Cleaned ${cleanedCount} failed jobs`,
        cleanedCount,
        parameters: {
          olderThan,
          limit,
        },
        service: 'email-queue-admin',
        endpoint: 'clean-failed',
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to clean failed jobs',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        service: 'email-queue-admin',
      });
    }
  }

  /**
   * Pause the email queue
   * Requirements: 5.5 - Queue control functionality
   *
   * @returns Pause operation result
   */
  @Post('control/pause')
  async pauseQueue(@Res() res: Response): Promise<void> {
    try {
      const result = await this.emailEventPublisher.pauseQueue();

      const statusCode = result.success ? HttpStatus.OK : HttpStatus.INTERNAL_SERVER_ERROR;

      res.status(statusCode).json({
        timestamp: new Date(),
        success: result.success,
        message: result.message,
        service: 'email-queue-admin',
        endpoint: 'pause-queue',
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to pause queue',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        service: 'email-queue-admin',
      });
    }
  }

  /**
   * Resume the email queue
   * Requirements: 5.5 - Queue control functionality
   *
   * @returns Resume operation result
   */
  @Post('control/resume')
  async resumeQueue(@Res() res: Response): Promise<void> {
    try {
      const result = await this.emailEventPublisher.resumeQueue();

      const statusCode = result.success ? HttpStatus.OK : HttpStatus.INTERNAL_SERVER_ERROR;

      res.status(statusCode).json({
        timestamp: new Date(),
        success: result.success,
        message: result.message,
        service: 'email-queue-admin',
        endpoint: 'resume-queue',
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to resume queue',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        service: 'email-queue-admin',
      });
    }
  }

  /**
   * Get queue control status
   * Requirements: 5.5 - Queue status monitoring
   *
   * @returns Queue control status
   */
  @Get('control/status')
  async getQueueControlStatus(@Res() res: Response): Promise<void> {
    try {
      const status = await this.emailEventPublisher.getQueueStatus();

      res.status(HttpStatus.OK).json({
        timestamp: new Date(),
        ...status,
        service: 'email-queue-admin',
        endpoint: 'control-status',
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to get queue control status',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        service: 'email-queue-admin',
      });
    }
  }

  /**
   * Bulk retry multiple failed jobs
   * Requirements: 5.5 - Bulk operations for admin efficiency
   *
   * @param body - Array of job IDs to retry
   * @returns Bulk retry operation results
   */
  @Post('jobs/bulk-retry')
  async bulkRetryJobs(
    @Body() body: { jobIds: string[] },
    @Res() res: Response,
  ): Promise<void> {
    try {
      if (!Array.isArray(body.jobIds) || body.jobIds.length === 0) {
        res.status(HttpStatus.BAD_REQUEST).json({
          error: 'Invalid request body',
          message: 'jobIds must be a non-empty array of job IDs',
          timestamp: new Date(),
          service: 'email-queue-admin',
        });
        return;
      }

      if (body.jobIds.length > 100) {
        res.status(HttpStatus.BAD_REQUEST).json({
          error: 'Too many jobs',
          message: 'Maximum 100 jobs can be retried at once',
          timestamp: new Date(),
          service: 'email-queue-admin',
        });
        return;
      }

      const results = await Promise.allSettled(
        body.jobIds.map(jobId => this.emailEventPublisher.retryJob(jobId))
      );

      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.length - successful;

      const detailedResults = results.map((result, index) => ({
        jobId: body.jobIds[index],
        success: result.status === 'fulfilled' ? result.value.success : false,
        message: result.status === 'fulfilled'
          ? result.value.message
          : `Error: ${result.reason instanceof Error ? result.reason.message : result.reason}`,
      }));

      res.status(HttpStatus.OK).json({
        timestamp: new Date(),
        summary: {
          total: body.jobIds.length,
          successful,
          failed,
        },
        results: detailedResults,
        service: 'email-queue-admin',
        endpoint: 'bulk-retry',
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to perform bulk retry',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        service: 'email-queue-admin',
      });
    }
  }

  /**
   * Bulk remove multiple jobs
   * Requirements: 5.5 - Bulk operations for admin efficiency
   *
   * @param body - Array of job IDs to remove
   * @returns Bulk remove operation results
   */
  @Delete('jobs/bulk-remove')
  async bulkRemoveJobs(
    @Body() body: { jobIds: string[] },
    @Res() res: Response,
  ): Promise<void> {
    try {
      if (!Array.isArray(body.jobIds) || body.jobIds.length === 0) {
        res.status(HttpStatus.BAD_REQUEST).json({
          error: 'Invalid request body',
          message: 'jobIds must be a non-empty array of job IDs',
          timestamp: new Date(),
          service: 'email-queue-admin',
        });
        return;
      }

      if (body.jobIds.length > 100) {
        res.status(HttpStatus.BAD_REQUEST).json({
          error: 'Too many jobs',
          message: 'Maximum 100 jobs can be removed at once',
          timestamp: new Date(),
          service: 'email-queue-admin',
        });
        return;
      }

      const results = await Promise.allSettled(
        body.jobIds.map(jobId => this.emailEventPublisher.removeJob(jobId))
      );

      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.length - successful;

      const detailedResults = results.map((result, index) => ({
        jobId: body.jobIds[index],
        success: result.status === 'fulfilled' ? result.value.success : false,
        message: result.status === 'fulfilled'
          ? result.value.message
          : `Error: ${result.reason instanceof Error ? result.reason.message : result.reason}`,
      }));

      res.status(HttpStatus.OK).json({
        timestamp: new Date(),
        summary: {
          total: body.jobIds.length,
          successful,
          failed,
        },
        results: detailedResults,
        service: 'email-queue-admin',
        endpoint: 'bulk-remove',
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to perform bulk remove',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        service: 'email-queue-admin',
      });
    }
  }
}