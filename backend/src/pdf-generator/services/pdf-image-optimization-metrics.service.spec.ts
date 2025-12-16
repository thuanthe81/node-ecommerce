import { Test, TestingModule } from '@nestjs/testing';
import { PDFImageOptimizationMetricsService } from './pdf-image-optimization-metrics.service';
import { OptimizedImageResult, BatchOptimizationResult, PerformanceMonitoringData } from '../types/image-optimization.types';

describe('PDFImageOptimizationMetricsService', () => {
  let service: PDFImageOptimizationMetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PDFImageOptimizationMetricsService],
    }).compile();

    service = module.get<PDFImageOptimizationMetricsService>(PDFImageOptimizationMetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordImageOptimization', () => {
    it('should record successful image optimization metrics', () => {
      const mockResult: OptimizedImageResult = {
        optimizedBuffer: Buffer.from('optimized'),
        originalSize: 1000,
        optimizedSize: 500,
        compressionRatio: 0.5,
        dimensions: {
          original: { width: 100, height: 100 },
          optimized: { width: 50, height: 50 }
        },
        format: 'jpeg',
        processingTime: 100,
        metadata: {
          contentType: 'photo',
          qualityUsed: 80,
          formatConverted: false,
          originalFormat: 'jpeg',
          technique: 'aggressive'
        }
      };

      service.recordImageOptimization(mockResult, 'test-operation-1');

      const metrics = service.getCurrentMetrics();
      expect(metrics.totalImagesProcessed).toBe(1);
      expect(metrics.successfulOptimizations).toBe(1);
      expect(metrics.failedOptimizations).toBe(0);
      expect(metrics.totalOriginalSize).toBe(1000);
      expect(metrics.totalOptimizedSize).toBe(500);
      expect(metrics.overallCompressionRatio).toBe(0.5);
      expect(metrics.averageProcessingTime).toBe(100);
    });

    it('should record failed image optimization metrics', () => {
      const mockResult: OptimizedImageResult = {
        originalSize: 1000,
        optimizedSize: 0,
        compressionRatio: 0,
        dimensions: {
          original: { width: 100, height: 100 },
          optimized: { width: 0, height: 0 }
        },
        format: 'jpeg',
        processingTime: 50,
        error: 'File not found',
        metadata: {
          contentType: 'photo',
          qualityUsed: 0,
          formatConverted: false,
          originalFormat: 'unknown',
          technique: 'aggressive'
        }
      };

      service.recordImageOptimization(mockResult, 'test-operation-2');

      const metrics = service.getCurrentMetrics();
      expect(metrics.totalImagesProcessed).toBe(1);
      expect(metrics.successfulOptimizations).toBe(0);
      expect(metrics.failedOptimizations).toBe(1);
      expect(metrics.errorBreakdown['file_not_found']).toBe(1);
    });

    it('should track format breakdown correctly', () => {
      const jpegResult: OptimizedImageResult = {
        optimizedBuffer: Buffer.from('jpeg'),
        originalSize: 1000,
        optimizedSize: 600,
        compressionRatio: 0.4,
        dimensions: {
          original: { width: 100, height: 100 },
          optimized: { width: 80, height: 80 }
        },
        format: 'jpeg',
        processingTime: 100,
        metadata: {
          contentType: 'photo',
          qualityUsed: 80,
          formatConverted: false,
          originalFormat: 'jpeg',
          technique: 'aggressive'
        }
      };

      const pngResult: OptimizedImageResult = {
        optimizedBuffer: Buffer.from('png'),
        originalSize: 800,
        optimizedSize: 400,
        compressionRatio: 0.5,
        dimensions: {
          original: { width: 50, height: 50 },
          optimized: { width: 40, height: 40 }
        },
        format: 'png',
        processingTime: 150,
        metadata: {
          contentType: 'logo',
          qualityUsed: 90,
          formatConverted: true,
          originalFormat: 'png',
          technique: 'aggressive'
        }
      };

      service.recordImageOptimization(jpegResult, 'jpeg-test');
      service.recordImageOptimization(pngResult, 'png-test');

      const metrics = service.getCurrentMetrics();
      expect(metrics.formatBreakdown['jpeg']).toBeDefined();
      expect(metrics.formatBreakdown['jpeg'].count).toBe(1);
      expect(metrics.formatBreakdown['jpeg'].originalSize).toBe(1000);
      expect(metrics.formatBreakdown['jpeg'].optimizedSize).toBe(600);

      expect(metrics.formatBreakdown['png']).toBeDefined();
      expect(metrics.formatBreakdown['png'].count).toBe(1);
      expect(metrics.formatBreakdown['png'].originalSize).toBe(800);
      expect(metrics.formatBreakdown['png'].optimizedSize).toBe(400);
    });
  });

  describe('recordBatchOptimization', () => {
    it('should record batch optimization metrics', () => {
      const mockResults: OptimizedImageResult[] = [
        {
          optimizedBuffer: Buffer.from('opt1'),
          originalSize: 1000,
          optimizedSize: 500,
          compressionRatio: 0.5,
          dimensions: {
            original: { width: 100, height: 100 },
            optimized: { width: 50, height: 50 }
          },
          format: 'jpeg',
          processingTime: 100,
          metadata: {
            contentType: 'photo',
            qualityUsed: 80,
            formatConverted: false,
            originalFormat: 'jpeg',
            technique: 'comprehensive'
          }
        },
        {
          optimizedBuffer: Buffer.from('opt2'),
          originalSize: 800,
          optimizedSize: 400,
          compressionRatio: 0.5,
          dimensions: {
            original: { width: 80, height: 80 },
            optimized: { width: 40, height: 40 }
          },
          format: 'png',
          processingTime: 150,
          metadata: {
            contentType: 'logo',
            qualityUsed: 90,
            formatConverted: true,
            originalFormat: 'png',
            technique: 'comprehensive'
          }
        }
      ];

      const batchResult: BatchOptimizationResult = {
        results: mockResults,
        batchMetrics: {
          totalImagesProcessed: 2,
          successfulOptimizations: 2,
          failedOptimizations: 0,
          totalOriginalSize: 1800,
          totalOptimizedSize: 900,
          overallCompressionRatio: 0.5,
          averageProcessingTime: 125,
          totalProcessingTime: 250,
          formatBreakdown: {},
          contentTypeBreakdown: {},
          errorBreakdown: {},
          timestamp: new Date()
        },
        summary: {
          totalImages: 2,
          successfulImages: 2,
          failedImages: 0,
          totalSizeReduction: 900,
          averageCompressionRatio: 0.5,
          totalProcessingTime: 250
        },
        configurationSnapshot: {} as any
      };

      service.recordBatchOptimization(batchResult, 'batch-test');

      const metrics = service.getCurrentMetrics();
      expect(metrics.totalImagesProcessed).toBe(2);
      expect(metrics.successfulOptimizations).toBe(2);
      expect(metrics.totalOriginalSize).toBe(1800);
      expect(metrics.totalOptimizedSize).toBe(900);
    });
  });

  describe('recordPerformanceData', () => {
    it('should record performance monitoring data', () => {
      const now = new Date();
      const performanceData: PerformanceMonitoringData = {
        operationId: 'perf-test-1',
        operationType: 'single_image',
        startTime: new Date(now.getTime() - 1000), // 1 second ago
        endTime: now,
        duration: 1000,
        memoryUsage: {
          peak: 50000000,
          average: 40000000,
          start: 35000000,
          end: 45000000
        },
        cpuUsage: {
          cpuTime: 800,
          utilization: 0.8
        },
        ioStats: {
          bytesRead: 1000,
          bytesWritten: 500,
          readOperations: 1,
          writeOperations: 1
        },
        success: true
      };

      service.recordPerformanceData(performanceData);

      const stats = service.getPerformanceStatistics(24);
      expect(stats.totalOperations).toBe(1);
      expect(stats.successRate).toBe(100);
      expect(stats.averageProcessingTime).toBe(1000);
    });
  });

  describe('getOptimizationEffectiveness', () => {
    it('should calculate optimization effectiveness metrics', () => {
      // Record some test data
      const mockResult: OptimizedImageResult = {
        optimizedBuffer: Buffer.from('optimized'),
        originalSize: 2000,
        optimizedSize: 1000,
        compressionRatio: 0.5,
        dimensions: {
          original: { width: 200, height: 200 },
          optimized: { width: 100, height: 100 }
        },
        format: 'jpeg',
        processingTime: 200,
        metadata: {
          contentType: 'photo',
          qualityUsed: 75,
          formatConverted: false,
          originalFormat: 'jpeg',
          technique: 'aggressive'
        }
      };

      service.recordImageOptimization(mockResult, 'effectiveness-test');

      const effectiveness = service.getOptimizationEffectiveness();
      expect(effectiveness.overallCompressionRatio).toBe(0.5);
      expect(effectiveness.totalSizeSaved).toBe(1000);
      expect(effectiveness.averageSizeReduction).toBe(1000);
      expect(effectiveness.bestPerformingFormat).toBe('jpeg');
      expect(effectiveness.bestPerformingContentType).toBe('photo');
    });
  });

  describe('getMetricsSummaryForMonitoring', () => {
    it('should provide metrics summary for monitoring integration', () => {
      const mockResult: OptimizedImageResult = {
        optimizedBuffer: Buffer.from('optimized'),
        originalSize: 1000,
        optimizedSize: 600,
        compressionRatio: 0.4,
        dimensions: {
          original: { width: 100, height: 100 },
          optimized: { width: 80, height: 80 }
        },
        format: 'jpeg',
        processingTime: 100,
        metadata: {
          contentType: 'photo',
          qualityUsed: 80,
          formatConverted: false,
          originalFormat: 'jpeg',
          technique: 'aggressive'
        }
      };

      service.recordImageOptimization(mockResult, 'monitoring-test');

      const summary = service.getMetricsSummaryForMonitoring();
      expect(summary.totalImagesProcessed).toBe(1);
      expect(summary.successRate).toBe(100);
      expect(summary.averageCompressionRatio).toBe(40); // 0.4 * 100
      expect(summary.averageProcessingTime).toBe(100);
      expect(summary.totalSizeSaved).toBe(400);
      expect(summary.errorRate).toBe(0);
      expect(summary.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('resetCurrentMetrics', () => {
    it('should reset current session metrics', () => {
      // Record some data first
      const mockResult: OptimizedImageResult = {
        optimizedBuffer: Buffer.from('optimized'),
        originalSize: 1000,
        optimizedSize: 500,
        compressionRatio: 0.5,
        dimensions: {
          original: { width: 100, height: 100 },
          optimized: { width: 50, height: 50 }
        },
        format: 'jpeg',
        processingTime: 100,
        metadata: {
          contentType: 'photo',
          qualityUsed: 80,
          formatConverted: false,
          originalFormat: 'jpeg',
          technique: 'aggressive'
        }
      };

      service.recordImageOptimization(mockResult, 'reset-test');

      let metrics = service.getCurrentMetrics();
      expect(metrics.totalImagesProcessed).toBe(1);

      // Reset metrics
      service.resetCurrentMetrics();

      metrics = service.getCurrentMetrics();
      expect(metrics.totalImagesProcessed).toBe(0);
      expect(metrics.successfulOptimizations).toBe(0);
      expect(metrics.failedOptimizations).toBe(0);
      expect(metrics.totalOriginalSize).toBe(0);
      expect(metrics.totalOptimizedSize).toBe(0);
    });
  });
});