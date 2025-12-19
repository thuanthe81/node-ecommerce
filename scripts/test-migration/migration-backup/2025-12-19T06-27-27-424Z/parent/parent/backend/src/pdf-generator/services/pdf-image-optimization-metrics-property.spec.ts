import { Test, TestingModule } from '@nestjs/testing';
import { PDFImageOptimizationMetricsService } from './pdf-image-optimization-metrics.service';
import * as fc from 'fast-check';
import { OptimizedImageResult, OptimizationMetrics } from '../types/image-optimization.types';

/**
 * Property-Based Tests for PDFImageOptimizationMetricsService
 *
 * These tests verify universal properties that should hold across all valid executions
 * of the image optimization metrics system, using fast-check for property-based testing.
 *
 * **Feature: pdf-image-optimization, Property 9: Metrics generation**
 * **Validates: Requirements 4.5**
 */
describe('PDFImageOptimizationMetricsService - Property-Based Tests', () => {
  let service: PDFImageOptimizationMetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PDFImageOptimizationMetricsService
      ]
    }).compile();

    service = module.get<PDFImageOptimizationMetricsService>(PDFImageOptimizationMetricsService);
  });

  afterEach(() => {
    // Reset metrics after each test to ensure clean state
    service.resetCurrentMetrics();
  });

  /**
   * Arbitraries for generating test data
   */
  const optimizedImageResultArbitrary = fc.record({
    originalSize: fc.integer({ min: 1000, max: 10000000 }), // 1KB to 10MB
    optimizedSize: fc.integer({ min: 500, max: 5000000 }), // 500B to 5MB
    compressionRatio: fc.float({ min: 0, max: 1 }),
    dimensions: fc.record({
      original: fc.record({
        width: fc.integer({ min: 100, max: 4000 }),
        height: fc.integer({ min: 100, max: 4000 })
      }),
      optimized: fc.record({
        width: fc.integer({ min: 50, max: 2000 }),
        height: fc.integer({ min: 50, max: 2000 })
      })
    }),
    format: fc.constantFrom('jpeg', 'png', 'webp'),
    processingTime: fc.integer({ min: 10, max: 5000 }), // 10ms to 5s
    metadata: fc.record({
      contentType: fc.constantFrom('text', 'photo', 'graphics', 'logo'),
      qualityUsed: fc.integer({ min: 10, max: 100 }),
      formatConverted: fc.boolean(),
      originalFormat: fc.constantFrom('jpeg', 'png', 'webp', 'gif', 'bmp'),
      technique: fc.constantFrom('aggressive', 'standard', 'fallback', 'comprehensive')
    })
  }).map((data): OptimizedImageResult => ({
    ...data,
    // Ensure optimized size is not larger than original size
    optimizedSize: Math.min(data.optimizedSize, data.originalSize),
    // Recalculate compression ratio based on actual sizes
    compressionRatio: data.originalSize > 0 ?
      Math.max(0, (data.originalSize - Math.min(data.optimizedSize, data.originalSize)) / data.originalSize) : 0
  }));

  const optimizedImageResultWithErrorArbitrary = fc.record({
    originalSize: fc.integer({ min: 1000, max: 10000000 }),
    optimizedSize: fc.integer({ min: 500, max: 5000000 }),
    compressionRatio: fc.float({ min: 0, max: 1 }),
    dimensions: fc.record({
      original: fc.record({
        width: fc.integer({ min: 100, max: 4000 }),
        height: fc.integer({ min: 100, max: 4000 })
      }),
      optimized: fc.record({
        width: fc.integer({ min: 50, max: 2000 }),
        height: fc.integer({ min: 50, max: 2000 })
      })
    }),
    format: fc.constantFrom('jpeg', 'png', 'webp'),
    processingTime: fc.integer({ min: 10, max: 5000 }),
    error: fc.oneof(
      fc.constant(undefined),
      fc.constantFrom(
        'File not found',
        'Network error occurred',
        'Out of memory',
        'Invalid format',
        'Timeout error',
        'Unknown processing error'
      )
    ),
    metadata: fc.record({
      contentType: fc.constantFrom('text', 'photo', 'graphics', 'logo'),
      qualityUsed: fc.integer({ min: 10, max: 100 }),
      formatConverted: fc.boolean(),
      originalFormat: fc.constantFrom('jpeg', 'png', 'webp', 'gif', 'bmp'),
      technique: fc.constantFrom('aggressive', 'standard', 'fallback', 'comprehensive')
    })
  }).map((data): OptimizedImageResult => ({
    ...data,
    optimizedSize: Math.min(data.optimizedSize, data.originalSize),
    compressionRatio: data.originalSize > 0 ?
      Math.max(0, (data.originalSize - Math.min(data.optimizedSize, data.originalSize)) / data.originalSize) : 0
  }));

  /**
   * Property 9: Metrics generation
   * For any PDF generation with image optimization, the system should generate metrics
   * including original size, optimized size, and compression ratio
   * **Feature: pdf-image-optimization, Property 9: Metrics generation**
   * **Validates: Requirements 4.5**
   */
  it('Property 9: Should generate comprehensive metrics for any image optimization operation', () => {
    fc.assert(
      fc.property(
        optimizedImageResultArbitrary,
        fc.string({ minLength: 1, maxLength: 50 }), // operationId
        (imageResult, operationId) => {
          // Record the image optimization
          service.recordImageOptimization(imageResult, operationId);

          // Get current metrics
          const metrics = service.getCurrentMetrics();

          // Verify that metrics are generated and contain required information

          // 1. Metrics should track the processed image
          expect(metrics.totalImagesProcessed).toBeGreaterThan(0);

          // 2. Metrics should include original size information
          expect(metrics.totalOriginalSize).toBeGreaterThanOrEqual(imageResult.originalSize);

          // 3. Metrics should include optimized size information
          expect(metrics.totalOptimizedSize).toBeGreaterThanOrEqual(imageResult.optimizedSize);

          // 4. Metrics should include compression ratio information
          expect(metrics.overallCompressionRatio).toBeGreaterThanOrEqual(0);
          expect(metrics.overallCompressionRatio).toBeLessThanOrEqual(1);

          // 5. Metrics should track processing time
          expect(metrics.totalProcessingTime).toBeGreaterThanOrEqual(imageResult.processingTime);
          expect(metrics.averageProcessingTime).toBeGreaterThan(0);

          // 6. Metrics should include format breakdown
          expect(metrics.formatBreakdown).toBeDefined();
          expect(metrics.formatBreakdown[imageResult.format]).toBeDefined();
          expect(metrics.formatBreakdown[imageResult.format].count).toBeGreaterThan(0);
          expect(metrics.formatBreakdown[imageResult.format].originalSize).toBeGreaterThanOrEqual(imageResult.originalSize);
          expect(metrics.formatBreakdown[imageResult.format].optimizedSize).toBeGreaterThanOrEqual(imageResult.optimizedSize);

          // 7. Metrics should include content type breakdown
          expect(metrics.contentTypeBreakdown).toBeDefined();
          const contentType = imageResult.metadata.contentType;
          expect(metrics.contentTypeBreakdown[contentType]).toBeDefined();
          expect(metrics.contentTypeBreakdown[contentType].count).toBeGreaterThan(0);

          // 8. Metrics should have a valid timestamp
          expect(metrics.timestamp).toBeInstanceOf(Date);
          expect(metrics.timestamp.getTime()).toBeLessThanOrEqual(Date.now());

          // 9. Success/failure tracking should be consistent
          if (imageResult.error) {
            expect(metrics.failedOptimizations).toBeGreaterThan(0);
            expect(metrics.errorBreakdown).toBeDefined();
            expect(Object.keys(metrics.errorBreakdown).length).toBeGreaterThan(0);
          } else {
            expect(metrics.successfulOptimizations).toBeGreaterThan(0);
          }

          // Reset for next iteration
          service.resetCurrentMetrics();
        }
      ),
      {
        numRuns: 100, // Run 100 iterations as specified in design
        timeout: 60000, // 60 second timeout for property test
        verbose: true
      }
    );
  });

  /**
   * Property 9 (Extended): Metrics should accumulate correctly across multiple operations
   * **Feature: pdf-image-optimization, Property 9: Metrics generation**
   * **Validates: Requirements 4.5**
   */
  it('Property 9 (Extended): Should accumulate metrics correctly across multiple image optimizations', () => {
    fc.assert(
      fc.property(
        fc.array(optimizedImageResultWithErrorArbitrary, { minLength: 1, maxLength: 10 }),
        (imageResults) => {
          // Record all image optimizations
          imageResults.forEach((result, index) => {
            service.recordImageOptimization(result, `operation-${index}`);
          });

          // Get accumulated metrics
          const metrics = service.getCurrentMetrics();

          // Calculate expected values
          const expectedTotalImages = imageResults.length;
          const expectedTotalOriginalSize = imageResults.reduce((sum, result) => sum + result.originalSize, 0);
          const expectedTotalOptimizedSize = imageResults.reduce((sum, result) => sum + result.optimizedSize, 0);
          const expectedTotalProcessingTime = imageResults.reduce((sum, result) => sum + result.processingTime, 0);
          const expectedSuccessful = imageResults.filter(result => !result.error).length;
          const expectedFailed = imageResults.filter(result => result.error).length;

          // Verify accumulated metrics
          expect(metrics.totalImagesProcessed).toBe(expectedTotalImages);
          expect(metrics.totalOriginalSize).toBe(expectedTotalOriginalSize);
          expect(metrics.totalOptimizedSize).toBe(expectedTotalOptimizedSize);
          expect(metrics.totalProcessingTime).toBe(expectedTotalProcessingTime);
          expect(metrics.successfulOptimizations).toBe(expectedSuccessful);
          expect(metrics.failedOptimizations).toBe(expectedFailed);

          // Verify average processing time calculation
          const expectedAverageProcessingTime = expectedTotalProcessingTime / expectedTotalImages;
          expect(Math.abs(metrics.averageProcessingTime - expectedAverageProcessingTime)).toBeLessThan(0.01);

          // Verify overall compression ratio calculation
          if (expectedTotalOriginalSize > 0) {
            const expectedCompressionRatio = (expectedTotalOriginalSize - expectedTotalOptimizedSize) / expectedTotalOriginalSize;
            expect(Math.abs(metrics.overallCompressionRatio - expectedCompressionRatio)).toBeLessThan(0.01);
          }

          // Verify format breakdown accumulation
          const formatCounts = imageResults.reduce((counts, result) => {
            counts[result.format] = (counts[result.format] || 0) + 1;
            return counts;
          }, {} as { [format: string]: number });

          Object.entries(formatCounts).forEach(([format, expectedCount]) => {
            expect(metrics.formatBreakdown[format]).toBeDefined();
            expect(metrics.formatBreakdown[format].count).toBe(expectedCount);
          });

          // Verify content type breakdown accumulation
          const contentTypeCounts = imageResults.reduce((counts, result) => {
            const contentType = result.metadata.contentType;
            counts[contentType] = (counts[contentType] || 0) + 1;
            return counts;
          }, {} as { [contentType: string]: number });

          Object.entries(contentTypeCounts).forEach(([contentType, expectedCount]) => {
            expect(metrics.contentTypeBreakdown[contentType]).toBeDefined();
            expect(metrics.contentTypeBreakdown[contentType].count).toBe(expectedCount);
          });

          // Reset for next iteration
          service.resetCurrentMetrics();
        }
      ),
      {
        numRuns: 100, // Run 100 iterations as specified in design
        timeout: 60000, // 60 second timeout for property test
        verbose: true
      }
    );
  });

  /**
   * Property 9 (Extended): Metrics summary should provide monitoring-ready data
   * **Feature: pdf-image-optimization, Property 9: Metrics generation**
   * **Validates: Requirements 4.5**
   */
  it('Property 9 (Extended): Should provide monitoring-ready metrics summary for any optimization session', () => {
    fc.assert(
      fc.property(
        fc.array(optimizedImageResultWithErrorArbitrary, { minLength: 1, maxLength: 20 }),
        (imageResults) => {
          // Record all image optimizations
          imageResults.forEach((result, index) => {
            service.recordImageOptimization(result, `monitoring-test-${index}`);
          });

          // Get monitoring summary
          const summary = service.getMetricsSummaryForMonitoring();

          // Verify summary contains all required monitoring data
          expect(summary.totalImagesProcessed).toBe(imageResults.length);
          expect(summary.successRate).toBeGreaterThanOrEqual(0);
          expect(summary.successRate).toBeLessThanOrEqual(100);
          expect(summary.averageCompressionRatio).toBeGreaterThanOrEqual(0);
          expect(summary.averageProcessingTime).toBeGreaterThanOrEqual(0);
          expect(summary.totalSizeSaved).toBeGreaterThanOrEqual(0);
          expect(summary.errorRate).toBeGreaterThanOrEqual(0);
          expect(summary.errorRate).toBeLessThanOrEqual(100);
          expect(summary.lastUpdated).toBeInstanceOf(Date);

          // Verify success rate calculation
          const successfulCount = imageResults.filter(result => !result.error).length;
          const expectedSuccessRate = (successfulCount / imageResults.length) * 100;
          expect(Math.abs(summary.successRate - expectedSuccessRate)).toBeLessThan(0.01);

          // Verify error rate calculation
          const failedCount = imageResults.filter(result => result.error).length;
          const expectedErrorRate = (failedCount / imageResults.length) * 100;
          expect(Math.abs(summary.errorRate - expectedErrorRate)).toBeLessThan(0.01);

          // Verify total size saved calculation
          const totalOriginalSize = imageResults.reduce((sum, result) => sum + result.originalSize, 0);
          const totalOptimizedSize = imageResults.reduce((sum, result) => sum + result.optimizedSize, 0);
          const expectedSizeSaved = totalOriginalSize - totalOptimizedSize;
          expect(summary.totalSizeSaved).toBe(expectedSizeSaved);

          // Reset for next iteration
          service.resetCurrentMetrics();
        }
      ),
      {
        numRuns: 100, // Run 100 iterations as specified in design
        timeout: 60000, // 60 second timeout for property test
        verbose: true
      }
    );
  });
});