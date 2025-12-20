import { Test, TestingModule } from '@nestjs/testing';
import { EmailQueueHealthController } from '../src/email-queue/controllers/email-queue-health.controller';
import { EmailQueueMonitoringService } from '../src/email-queue/services/email-queue-monitoring.service';
import { EmailQueueConfigService } from '../src/email-queue/services/email-queue-config.service';
import { Response } from 'express';

describe('EmailQueueHealthController', () => {
  let controller: EmailQueueHealthController;
  let mockMonitoringService: jest.Mocked<EmailQueueMonitoringService>;
  let mockResponse: jest.Mocked<Response>;

  beforeEach(async () => {
    // Create mock monitoring service
    mockMonitoringService = {
      performHealthCheck: jest.fn(),
      getQueueMetrics: jest.fn(),
    } as any;

    // Create mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailQueueHealthController],
      providers: [
        {
          provide: EmailQueueMonitoringService,
          useValue: mockMonitoringService,
        },
        {
          provide: EmailQueueConfigService,
          useValue: {
            getRedisConfig: jest.fn(() => ({
              host: 'localhost',
              port: 6379,
            })),
            getQueueConfig: jest.fn(() => ({
              maxAttempts: 5,
              initialDelay: 60000,
              completedRetentionAge: 86400,
              completedRetentionCount: 1000,
              failedRetentionAge: 604800,
              failedRetentionCount: 500,
            })),
            getResilienceConfig: jest.fn(() => ({
              maxReconnectAttempts: 10,
              reconnectBaseDelay: 1000,
              reconnectMaxDelay: 30000,
            })),
          },
        },
      ],
    }).compile();

    controller = module.get<EmailQueueHealthController>(EmailQueueHealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHealthStatus', () => {
    it('should return healthy status with 200', async () => {
      // Arrange
      const mockHealthResult = {
        status: 'healthy' as const,
        timestamp: new Date(),
        responseTime: 50,
        checks: [
          { name: 'queue', status: 'healthy' as const, message: 'OK', details: {} },
          { name: 'worker', status: 'healthy' as const, message: 'OK', details: {} },
        ],
        summary: { healthy: 2, warning: 0, error: 0, message: 'All healthy' },
      };

      mockMonitoringService.performHealthCheck.mockResolvedValue(mockHealthResult);

      // Act
      await controller.getHealthStatus(mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'healthy',
          service: 'email-queue',
          components: mockHealthResult.checks,
        })
      );
    });

    it('should return error status with 503', async () => {
      // Arrange
      const mockHealthResult = {
        status: 'error' as const,
        timestamp: new Date(),
        responseTime: 100,
        checks: [
          { name: 'queue', status: 'error' as const, message: 'Failed', details: {} },
        ],
        summary: { healthy: 0, warning: 0, error: 1, message: 'System error' },
      };

      mockMonitoringService.performHealthCheck.mockResolvedValue(mockHealthResult);

      // Act
      await controller.getHealthStatus(mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          service: 'email-queue',
        })
      );
    });

    it('should handle monitoring service errors', async () => {
      // Arrange
      mockMonitoringService.performHealthCheck.mockRejectedValue(new Error('Service error'));

      // Act
      await controller.getHealthStatus(mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: expect.stringContaining('Health check failed'),
          service: 'email-queue',
        })
      );
    });
  });

  describe('getQueueMetrics', () => {
    it('should return queue metrics with 200', async () => {
      // Arrange
      const mockMetrics = {
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3,
        delayed: 1,
        total: 111,
        timestamp: new Date(),
        worker: { status: 'healthy', isRunning: true, connection: 'connected' },
        processing: { rate: 0.5, avgProcessingTime: 1000, throughput: 2 },
        errors: { errorRate: 2.7, totalErrors: 3, recentErrors: [], commonErrors: [], deadLetterCount: 0 },
        system: {
          nodeVersion: 'v18.0.0',
          platform: 'linux',
          uptime: 3600,
          memory: { heapUsed: 50000000, heapTotal: 100000000 } as any,
          pid: 12345,
        },
      };

      mockMonitoringService.getQueueMetrics.mockResolvedValue(mockMetrics);

      // Act
      await controller.getQueueMetrics(mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockMetrics,
          service: 'email-queue',
          endpoint: 'metrics',
        })
      );
    });

    it('should handle metrics service errors', async () => {
      // Arrange
      mockMonitoringService.getQueueMetrics.mockRejectedValue(new Error('Metrics error'));

      // Act
      await controller.getQueueMetrics(mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Failed to retrieve queue metrics',
          message: 'Metrics error',
          service: 'email-queue',
        })
      );
    });
  });

  describe('ping', () => {
    it('should return simple OK response', async () => {
      // Act
      await controller.ping(mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'ok',
          service: 'email-queue',
          uptime: expect.any(Number),
        })
      );
    });
  });

  describe('getQueueStatus', () => {
    it('should return operational status for healthy queue', async () => {
      // Arrange
      const mockMetrics = {
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3,
        delayed: 1,
        total: 111,
        timestamp: new Date(),
        worker: { status: 'healthy', isRunning: true, connection: 'connected' },
        processing: { rate: 0.5, avgProcessingTime: 1000, throughput: 2 },
        errors: { errorRate: 2.7, totalErrors: 3, recentErrors: [], commonErrors: [], deadLetterCount: 0 },
        system: {
          nodeVersion: 'v18.0.0',
          platform: 'linux',
          uptime: 3600,
          memory: { heapUsed: 50000000, heapTotal: 100000000 } as any,
          pid: 12345,
        },
      };

      mockMonitoringService.getQueueMetrics.mockResolvedValue(mockMetrics);

      // Act
      await controller.getQueueStatus(mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'operational',
          service: 'email-queue',
          indicators: expect.objectContaining({
            healthy: true,
            backlog: false,
            errors: false,
          }),
        })
      );
    });

    it('should return degraded status for high error rate', async () => {
      // Arrange
      const mockMetrics = {
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3,
        delayed: 1,
        total: 111,
        timestamp: new Date(),
        worker: { status: 'healthy', isRunning: true, connection: 'connected' },
        processing: { rate: 0.5, avgProcessingTime: 1000, throughput: 2 },
        errors: { errorRate: 10, totalErrors: 10, recentErrors: [], commonErrors: [], deadLetterCount: 0 }, // High error rate
        system: {
          nodeVersion: 'v18.0.0',
          platform: 'linux',
          uptime: 3600,
          memory: { heapUsed: 50000000, heapTotal: 100000000 } as any,
          pid: 12345,
        },
      };

      mockMonitoringService.getQueueMetrics.mockResolvedValue(mockMetrics);

      // Act
      await controller.getQueueStatus(mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'degraded',
          service: 'email-queue',
          indicators: expect.objectContaining({
            errors: true,
          }),
        })
      );
    });
  });
});