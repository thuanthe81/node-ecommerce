import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { EmailQueueAdminController } from '../src/email-queue/controllers/email-queue-admin.controller';
import { EmailEventPublisher } from '../src/email-queue/services/email-event-publisher.service';
import { EmailQueueMonitoringService } from '../src/email-queue/services/email-queue-monitoring.service';

describe('EmailQueueAdminController', () => {
  let controller: EmailQueueAdminController;
  let emailEventPublisher: jest.Mocked<EmailEventPublisher>;
  let monitoringService: jest.Mocked<EmailQueueMonitoringService>;
  let mockResponse: jest.Mocked<Response>;

  beforeEach(async () => {
    const mockEmailEventPublisher = {
      getQueueStatus: jest.fn(),
      getFailedJobs: jest.fn(),
      getCompletedJobs: jest.fn(),
      getWaitingJobs: jest.fn(),
      getActiveJobs: jest.fn(),
      getJob: jest.fn(),
      retryJob: jest.fn(),
      removeJob: jest.fn(),
      cleanCompletedJobs: jest.fn(),
      cleanFailedJobs: jest.fn(),
      pauseQueue: jest.fn(),
      resumeQueue: jest.fn(),
    };

    const mockMonitoringService = {
      getQueueMetrics: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailQueueAdminController],
      providers: [
        {
          provide: EmailEventPublisher,
          useValue: mockEmailEventPublisher,
        },
        {
          provide: EmailQueueMonitoringService,
          useValue: mockMonitoringService,
        },
      ],
    }).compile();

    controller = module.get<EmailQueueAdminController>(EmailQueueAdminController);
    emailEventPublisher = module.get(EmailEventPublisher);
    monitoringService = module.get(EmailQueueMonitoringService);

    // Mock response object
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getQueueOverview', () => {
    it('should return queue overview with metrics and status', async () => {
      const mockMetrics = {
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3,
        delayed: 1,
        total: 111,
        timestamp: new Date(),
        worker: { status: 'healthy', isRunning: true },
        processing: { rate: 10, avgProcessingTime: 500, throughput: 8 },
        errors: { errorRate: 2.7, totalErrors: 3 },
        system: { nodeVersion: 'v18.0.0', platform: 'linux', uptime: 3600 },
      };

      const mockQueueStatus = {
        isPaused: false,
        status: 'active',
      };

      monitoringService.getQueueMetrics.mockResolvedValue(mockMetrics as any);
      emailEventPublisher.getQueueStatus.mockResolvedValue(mockQueueStatus);

      await controller.getQueueOverview(mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: mockQueueStatus,
          metrics: {
            waiting: 5,
            active: 2,
            completed: 100,
            failed: 3,
            delayed: 1,
            total: 111,
          },
          processing: mockMetrics.processing,
          errors: mockMetrics.errors,
          worker: mockMetrics.worker,
          system: mockMetrics.system,
          service: 'email-queue-admin',
          endpoint: 'overview',
        })
      );
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Metrics unavailable');
      monitoringService.getQueueMetrics.mockRejectedValue(error);

      await controller.getQueueOverview(mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Failed to retrieve queue overview',
          message: 'Metrics unavailable',
          service: 'email-queue-admin',
        })
      );
    });
  });

  describe('getFailedJobs', () => {
    it('should return failed jobs with pagination', async () => {
      const mockFailedJobs = [
        {
          id: 'job1',
          name: 'ORDER_CONFIRMATION',
          data: { orderId: '123' },
          failedReason: 'SMTP error',
          attemptsMade: 3,
        },
        {
          id: 'job2',
          name: 'WELCOME_EMAIL',
          data: { userId: '456' },
          failedReason: 'Invalid email',
          attemptsMade: 1,
        },
      ];

      emailEventPublisher.getFailedJobs.mockResolvedValue(mockFailedJobs as any);

      await controller.getFailedJobs(0, 50, mockResponse);

      expect(emailEventPublisher.getFailedJobs).toHaveBeenCalledWith(0, 50);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: {
            start: 0,
            end: 50,
            count: 2,
          },
          jobs: mockFailedJobs,
          service: 'email-queue-admin',
          endpoint: 'failed-jobs',
        })
      );
    });

    it('should validate pagination parameters', async () => {
      await controller.getFailedJobs(-1, 50, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid pagination parameters',
          message: 'Start must be >= 0, end must be > start, and range must be <= 1000',
        })
      );
    });

    it('should reject large pagination ranges', async () => {
      await controller.getFailedJobs(0, 2000, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(emailEventPublisher.getFailedJobs).not.toHaveBeenCalled();
    });
  });

  describe('getJobDetails', () => {
    it('should return job details when job exists', async () => {
      const mockJob = {
        id: 'job123',
        name: 'ORDER_CONFIRMATION',
        data: { orderId: '123', customerEmail: 'test@example.com' },
        opts: { attempts: 5, priority: 2 },
        progress: 0,
        failedReason: 'SMTP timeout',
        attemptsMade: 2,
      };

      emailEventPublisher.getJob.mockResolvedValue(mockJob as any);

      await controller.getJobDetails('job123', mockResponse);

      expect(emailEventPublisher.getJob).toHaveBeenCalledWith('job123');
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          job: mockJob,
          service: 'email-queue-admin',
          endpoint: 'job-details',
        })
      );
    });

    it('should return 404 when job does not exist', async () => {
      emailEventPublisher.getJob.mockResolvedValue(null);

      await controller.getJobDetails('nonexistent', mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Job not found',
          message: 'Job with ID nonexistent was not found',
        })
      );
    });
  });

  describe('retryJob', () => {
    it('should retry job successfully', async () => {
      const mockResult = {
        success: true,
        message: 'Job job123 has been queued for retry',
      };

      emailEventPublisher.retryJob.mockResolvedValue(mockResult);

      await controller.retryJob('job123', mockResponse);

      expect(emailEventPublisher.retryJob).toHaveBeenCalledWith('job123');
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Job job123 has been queued for retry',
          jobId: 'job123',
          service: 'email-queue-admin',
          endpoint: 'retry-job',
        })
      );
    });

    it('should handle retry failure', async () => {
      const mockResult = {
        success: false,
        message: 'Job job123 not found',
      };

      emailEventPublisher.retryJob.mockResolvedValue(mockResult);

      await controller.retryJob('job123', mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Job job123 not found',
          jobId: 'job123',
        })
      );
    });
  });

  describe('removeJob', () => {
    it('should remove job successfully', async () => {
      const mockResult = {
        success: true,
        message: 'Job job123 has been removed from the queue',
      };

      emailEventPublisher.removeJob.mockResolvedValue(mockResult);

      await controller.removeJob('job123', mockResponse);

      expect(emailEventPublisher.removeJob).toHaveBeenCalledWith('job123');
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Job job123 has been removed from the queue',
          jobId: 'job123',
        })
      );
    });
  });

  describe('cleanCompletedJobs', () => {
    it('should clean completed jobs with default parameters', async () => {
      emailEventPublisher.cleanCompletedJobs.mockResolvedValue(25);

      await controller.cleanCompletedJobs({}, mockResponse);

      expect(emailEventPublisher.cleanCompletedJobs).toHaveBeenCalledWith(
        24 * 60 * 60 * 1000, // 24 hours
        100 // default limit
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Cleaned 25 completed jobs',
          cleanedCount: 25,
        })
      );
    });

    it('should validate olderThan parameter', async () => {
      await controller.cleanCompletedJobs({ olderThan: 30 * 60 * 1000 }, mockResponse); // 30 minutes

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid olderThan parameter',
          message: 'olderThan must be at least 1 hour (3600000 ms)',
        })
      );
    });

    it('should validate limit parameter', async () => {
      await controller.cleanCompletedJobs({ limit: 20000 }, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid limit parameter',
          message: 'limit must be between 1 and 10000',
        })
      );
    });
  });

  describe('pauseQueue', () => {
    it('should pause queue successfully', async () => {
      const mockResult = {
        success: true,
        message: 'Email queue has been paused',
      };

      emailEventPublisher.pauseQueue.mockResolvedValue(mockResult);

      await controller.pauseQueue(mockResponse);

      expect(emailEventPublisher.pauseQueue).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Email queue has been paused',
          service: 'email-queue-admin',
          endpoint: 'pause-queue',
        })
      );
    });
  });

  describe('resumeQueue', () => {
    it('should resume queue successfully', async () => {
      const mockResult = {
        success: true,
        message: 'Email queue has been resumed',
      };

      emailEventPublisher.resumeQueue.mockResolvedValue(mockResult);

      await controller.resumeQueue(mockResponse);

      expect(emailEventPublisher.resumeQueue).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Email queue has been resumed',
        })
      );
    });
  });

  describe('bulkRetryJobs', () => {
    it('should retry multiple jobs successfully', async () => {
      const jobIds = ['job1', 'job2', 'job3'];

      emailEventPublisher.retryJob
        .mockResolvedValueOnce({ success: true, message: 'Job job1 queued for retry' })
        .mockResolvedValueOnce({ success: true, message: 'Job job2 queued for retry' })
        .mockResolvedValueOnce({ success: false, message: 'Job job3 not found' });

      await controller.bulkRetryJobs({ jobIds }, mockResponse);

      expect(emailEventPublisher.retryJob).toHaveBeenCalledTimes(3);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: {
            total: 3,
            successful: 2,
            failed: 1,
          },
          results: expect.arrayContaining([
            expect.objectContaining({ jobId: 'job1', success: true }),
            expect.objectContaining({ jobId: 'job2', success: true }),
            expect.objectContaining({ jobId: 'job3', success: false }),
          ]),
        })
      );
    });

    it('should validate job IDs array', async () => {
      await controller.bulkRetryJobs({ jobIds: [] }, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid request body',
          message: 'jobIds must be a non-empty array of job IDs',
        })
      );
    });

    it('should limit bulk operations to 100 jobs', async () => {
      const jobIds = Array.from({ length: 101 }, (_, i) => `job${i}`);

      await controller.bulkRetryJobs({ jobIds }, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Too many jobs',
          message: 'Maximum 100 jobs can be retried at once',
        })
      );
    });
  });

  describe('bulkRemoveJobs', () => {
    it('should remove multiple jobs successfully', async () => {
      const jobIds = ['job1', 'job2'];

      emailEventPublisher.removeJob
        .mockResolvedValueOnce({ success: true, message: 'Job job1 removed' })
        .mockResolvedValueOnce({ success: true, message: 'Job job2 removed' });

      await controller.bulkRemoveJobs({ jobIds }, mockResponse);

      expect(emailEventPublisher.removeJob).toHaveBeenCalledTimes(2);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: {
            total: 2,
            successful: 2,
            failed: 0,
          },
        })
      );
    });
  });

  describe('getQueueControlStatus', () => {
    it('should return queue control status', async () => {
      const mockStatus = {
        isPaused: false,
        status: 'active',
      };

      emailEventPublisher.getQueueStatus.mockResolvedValue(mockStatus);

      await controller.getQueueControlStatus(mockResponse);

      expect(emailEventPublisher.getQueueStatus).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          isPaused: false,
          status: 'active',
          service: 'email-queue-admin',
          endpoint: 'control-status',
        })
      );
    });
  });
});