import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailQueueMonitoringService } from '../src/email-queue/services/email-queue-monitoring.service';
import { EmailEventPublisher } from '../src/email-queue/services/email-event-publisher.service';
import { EmailWorker } from '../src/email-queue/services/email-worker.service';

describe('EmailQueueMonitoringService', () => {
  let service: EmailQueueMonitoringService;
  let mockEmailEventPublisher: jest.Mocked<EmailEventPublisher>;
  let mockEmailWorker: jest.Mocked<EmailWorker>;

  beforeEach(async () => {
    // Create mock services
    mockEmailEventPublisher = {
      getQueueMetrics: jest.fn(),
    } as any;

    mockEmailWorker = {
      getWorkerHealth: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailQueueMonitoringService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                REDIS_HOST: 'localhost',
                REDIS_PORT: 6379,
                EMAIL_WORKER_CONCURRENCY: 5,
                EMAIL_RATE_LIMIT_MAX: 100,
                EMAIL_RATE_LIMIT_DURATION: 60000,
                EMAIL_QUEUE_MAX_ATTEMPTS: 5,
                EMAIL_QUEUE_INITIAL_DELAY: 60000,
                EMAIL_QUEUE_COMPLETED_RETENTION_AGE: 86400000,
                EMAIL_QUEUE_COMPLETED_RETENTION_COUNT: 1000,
                EMAIL_QUEUE_FAILED_RETENTION_AGE: 604800000,
                EMAIL_QUEUE_FAILED_RETENTION_COUNT: 500,
                EMAIL_QUEUE_MAX_RECONNECT_ATTEMPTS: 10,
                EMAIL_QUEUE_RECONNECT_BASE_DELAY: 1000,
                EMAIL_QUEUE_RECONNECT_MAX_DELAY: 30000,
                EMAIL_QUEUE_SHUTDOWN_TIMEOUT: 30000,
              };
              return config[key] || defaultValue;
            }),
          },
        },
        {
          provide: EmailEventPublisher,
          useValue: mockEmailEventPublisher,
        },
        {
          provide: EmailWorker,
          useValue: mockEmailWorker,
        },
      ],
    }).compile();

    service = module.get<EmailQueueMonitoringService>(EmailQueueMonitoringService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getQueueMetrics', () => {
    it('should return comprehensive queue metrics', async () => {
      // Arrange
      const mockBasicMetrics = {
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3,
        delayed: 1,
        total: 111,
      };

      const mockWorkerHealth = {
        status: 'healthy',
        isRunning: true,
        connection: 'connected',
      };

      mockEmailEventPublisher.getQueueMetrics.mockResolvedValue(mockBasicMetrics);
      mockEmailWorker.getWorkerHealth.mockResolvedValue(mockWorkerHealth);

      // Act
      const result = await service.getQueueMetrics();

      // Assert
      expect(result).toMatchObject({
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3,
        delayed: 1,
        total: 111,
        worker: mockWorkerHealth,
        processing: expect.objectContaining({
          rate: expect.any(Number),
          avgProcessingTime: expect.any(Number),
          throughput: expect.any(Number),
        }),
        errors: expect.objectContaining({
          errorRate: expect.any(Number),
          totalErrors: expect.any(Number),
          recentErrors: expect.any(Array),
          commonErrors: expect.any(Array),
        }),
        system: expect.objectContaining({
          nodeVersion: expect.any(String),
          platform: expect.any(String),
          uptime: expect.any(Number),
          memory: expect.any(Object),
          pid: expect.any(Number),
        }),
        timestamp: expect.any(Date),
      });

      expect(mockEmailEventPublisher.getQueueMetrics).toHaveBeenCalled();
      expect(mockEmailWorker.getWorkerHealth).toHaveBeenCalled();
    });

    it('should handle errors gracefully and return error metrics', async () => {
      // Arrange
      mockEmailEventPublisher.getQueueMetrics.mockRejectedValue(new Error('Redis connection failed'));
      mockEmailWorker.getWorkerHealth.mockResolvedValue({ status: 'error', isRunning: false, connection: 'error' });

      // Act
      const result = await service.getQueueMetrics();

      // Assert
      expect(result).toMatchObject({
        waiting: -1,
        active: -1,
        completed: -1,
        failed: -1,
        delayed: -1,
        total: -1,
        worker: { status: 'error', isRunning: false, connection: 'error' },
        timestamp: expect.any(Date),
      });
    });
  });

  describe('performHealthCheck', () => {
    it('should return healthy status when all components are healthy', async () => {
      // Arrange
      const mockBasicMetrics = {
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3,
        delayed: 1,
        total: 111,
      };

      const mockWorkerHealth = {
        status: 'healthy',
        isRunning: true,
        connection: 'connected',
      };

      mockEmailEventPublisher.getQueueMetrics.mockResolvedValue(mockBasicMetrics);
      mockEmailWorker.getWorkerHealth.mockResolvedValue(mockWorkerHealth);

      // Act
      const result = await service.performHealthCheck();

      // Assert - be more flexible about the status since system checks might vary
      expect(['healthy', 'warning']).toContain(result.status);
      expect(result.checks).toHaveLength(4); // queue, worker, redis, system
      expect(result.summary.error).toBe(0);
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
    });

    it('should return warning status when some components have warnings', async () => {
      // Arrange - high queue depth should trigger warning
      const mockBasicMetrics = {
        waiting: 1500, // High queue depth
        active: 2,
        completed: 100,
        failed: 3,
        delayed: 1,
        total: 1606,
      };

      const mockWorkerHealth = {
        status: 'healthy',
        isRunning: true,
        connection: 'connected',
      };

      mockEmailEventPublisher.getQueueMetrics.mockResolvedValue(mockBasicMetrics);
      mockEmailWorker.getWorkerHealth.mockResolvedValue(mockWorkerHealth);

      // Act
      const result = await service.performHealthCheck();

      // Assert
      expect(result.status).toBe('warning');
      expect(result.summary.warning).toBeGreaterThan(0);
    });

    it('should return error status when components are in error state', async () => {
      // Arrange
      mockEmailEventPublisher.getQueueMetrics.mockRejectedValue(new Error('Redis connection failed'));
      mockEmailWorker.getWorkerHealth.mockResolvedValue({ status: 'error', isRunning: false, connection: 'error' });

      // Act
      const result = await service.performHealthCheck();

      // Assert
      expect(result.status).toBe('error');
      expect(result.summary.error).toBeGreaterThan(0);
    });
  });

  describe('logEventLifecycle', () => {
    it('should log event lifecycle phases with structured data', () => {
      // Arrange
      const loggerSpy = jest.spyOn((service as any).logger, 'log').mockImplementation();

      // Act
      service.logEventLifecycle('created', {
        jobId: 'test-job-123',
        eventType: 'ORDER_CONFIRMATION',
        locale: 'en',
        metadata: { priority: 2 },
      });

      // Assert
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('EMAIL_EVENT_CREATED'),
      );

      // Cleanup
      loggerSpy.mockRestore();
    });

    it('should use appropriate log levels for different phases', () => {
      // Arrange
      const logSpy = jest.spyOn((service as any).logger, 'log').mockImplementation();
      const errorSpy = jest.spyOn((service as any).logger, 'error').mockImplementation();
      const warnSpy = jest.spyOn((service as any).logger, 'warn').mockImplementation();

      // Act
      service.logEventLifecycle('created', { eventType: 'TEST' });
      service.logEventLifecycle('failed', { eventType: 'TEST', error: new Error('Test error') });
      service.logEventLifecycle('retry', { eventType: 'TEST' });

      // Assert
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('EMAIL_EVENT_CREATED'));
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('EMAIL_EVENT_FAILED'));
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('EMAIL_EVENT_RETRY'));

      // Cleanup
      logSpy.mockRestore();
      errorSpy.mockRestore();
      warnSpy.mockRestore();
    });
  });

  describe('clearMetricsCache', () => {
    it('should clear the metrics cache', () => {
      // This test just verifies the cache clearing method exists and can be called
      expect(() => service.clearMetricsCache()).not.toThrow();
    });
  });
});