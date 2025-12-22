import { Test, TestingModule } from '@nestjs/testing';
import { PDFCompressionService } from '../../../src/pdf-generator/services/pdf-compression.service';
import { CompressedImageService } from '../../../src/pdf-generator/services/compressed-image.service';
import { PDFImageOptimizationConfigService } from '../../../src/pdf-generator/services/pdf-image-optimization-config.service';
import { PDFImageOptimizationMetricsService } from '../../../src/pdf-generator/services/pdf-image-optimization-metrics.service';
import { OptimizedImageResult } from '../../../src/pdf-generator/types/image-optimization.types';

/**
 * Integration test to verify compressed image storage and reuse functionality
 *
 * This test verifies that:
 * 1. Storage hits and misses are properly logged
 * 2. Reused images maintain quality verification
 * 3. Storage metrics are available
 *
 * Requirements: 2.4 - Compressed image reuse
 */
describe('Compressed Image Storage Integration', () => {
  let compressionService: PDFCompressionService;
  let compressedImageService: CompressedImageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PDFCompressionService,
        {
          provide: CompressedImageService,
          useValue: {
            getCompressedImage: jest.fn(),
            saveCompressedImage: jest.fn(),
            hasCompressedImage: jest.fn(),
            getStorageMetrics: jest.fn().mockResolvedValue({
              totalStorageSize: 1024,
              totalCompressedImages: 1,
              reuseRate: 0.5,
              averageCompressionRatio: 0.7,
              storageUtilization: 0.1,
            }),
          },
        },
        {
          provide: PDFImageOptimizationConfigService,
          useValue: {
            getConfiguration: jest.fn().mockReturnValue({
              aggressiveMode: {
                enabled: true,
                maxDimensions: { width: 300, height: 300 },
              },
            }),
            getContentTypeSettings: jest.fn().mockReturnValue({ quality: 60 }),
          },
        },
        {
          provide: PDFImageOptimizationMetricsService,
          useValue: {
            recordImageOptimization: jest.fn(),
          },
        },
      ],
    }).compile();

    compressionService = module.get<PDFCompressionService>(PDFCompressionService);
    compressedImageService = module.get<CompressedImageService>(CompressedImageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Storage Hit - Image Reuse', () => {
    it('should reuse existing compressed image when available', async () => {
      const mockStoredImage: OptimizedImageResult = {
        optimizedBuffer: Buffer.from('stored-optimized-image-data'),
        originalSize: 1000,
        optimizedSize: 300,
        compressionRatio: 0.7,
        dimensions: {
          original: { width: 800, height: 600 },
          optimized: { width: 300, height: 225 },
        },
        format: 'jpeg',
        processingTime: 150,
        metadata: {
          contentType: 'photo',
          qualityUsed: 60,
          formatConverted: true,
          originalFormat: 'png',
          technique: 'aggressive',
        },
      };

      // Mock storage hit
      (compressedImageService.getCompressedImage as jest.Mock).mockResolvedValue(mockStoredImage);

      const result = await compressionService.optimizeImageForPDF('/test/image.jpg', 'photo');

      expect(result).toBeDefined();
      expect(result.optimizedBuffer).toEqual(mockStoredImage.optimizedBuffer);
      expect(result.metadata?.technique).toBe('storage');
      expect(result.processingTime).toBe(0); // No processing time for retrieval

      // Verify storage was checked
      expect(compressedImageService.getCompressedImage).toHaveBeenCalledWith('/test/image.jpg');

      // Verify image was NOT saved again (since it was reused)
      expect(compressedImageService.saveCompressedImage).not.toHaveBeenCalled();
    });

    it('should log storage hit and reuse details', async () => {
      const logSpy = jest.spyOn(compressionService['logger'], 'log');

      const mockStoredImage: OptimizedImageResult = {
        optimizedBuffer: Buffer.from('stored-optimized-image-data'),
        originalSize: 1000,
        optimizedSize: 300,
        compressionRatio: 0.7,
        dimensions: {
          original: { width: 800, height: 600 },
          optimized: { width: 300, height: 225 },
        },
        format: 'jpeg',
        processingTime: 150,
        metadata: {
          contentType: 'photo',
          qualityUsed: 60,
          formatConverted: true,
          originalFormat: 'png',
          technique: 'aggressive',
        },
      };

      // Mock storage hit
      (compressedImageService.getCompressedImage as jest.Mock).mockResolvedValue(mockStoredImage);

      await compressionService.optimizeImageForPDF('/test/image.jpg', 'photo');

      // Verify storage hit was logged
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('✓ STORAGE HIT: Using existing compressed image for')
      );

      // Verify reuse details were logged
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('- Reused Size:')
      );
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('- Original Compression Ratio: 70.0%')
      );
    });

    it('should verify quality of reused images', async () => {
      const logSpy = jest.spyOn(compressionService['logger'], 'log');

      const mockStoredImage: OptimizedImageResult = {
        optimizedBuffer: Buffer.from('stored-optimized-image-data'),
        originalSize: 1000,
        optimizedSize: 300,
        compressionRatio: 0.7,
        dimensions: {
          original: { width: 800, height: 600 },
          optimized: { width: 300, height: 225 },
        },
        format: 'jpeg',
        processingTime: 150,
        metadata: {
          contentType: 'photo',
          qualityUsed: 60, // Matches current config
          formatConverted: true,
          originalFormat: 'png',
          technique: 'aggressive',
        },
      };

      // Mock storage hit
      (compressedImageService.getCompressedImage as jest.Mock).mockResolvedValue(mockStoredImage);

      await compressionService.optimizeImageForPDF('/test/image.jpg', 'photo');

      // Verify quality verification passed
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('✓ Quality verification passed: reused image quality (60) matches current settings')
      );

      // Verify dimension verification passed
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('✓ Dimension verification passed: reused image dimensions (300x225) within current limits (300x300)')
      );

      // Verify compression verification passed
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('✓ Compression verification passed: reused image has good compression ratio (70.0%)')
      );
    });

    it('should warn about quality mismatches in reused images', async () => {
      const warnSpy = jest.spyOn(compressionService['logger'], 'warn');

      const mockStoredImage: OptimizedImageResult = {
        optimizedBuffer: Buffer.from('stored-optimized-image-data'),
        originalSize: 1000,
        optimizedSize: 300,
        compressionRatio: 0.7,
        dimensions: {
          original: { width: 800, height: 600 },
          optimized: { width: 400, height: 300 }, // Exceeds current limits
        },
        format: 'jpeg',
        processingTime: 150,
        metadata: {
          contentType: 'photo',
          qualityUsed: 80, // Different from current config (60)
          formatConverted: true,
          originalFormat: 'png',
          technique: 'aggressive',
        },
      };

      // Mock storage hit
      (compressedImageService.getCompressedImage as jest.Mock).mockResolvedValue(mockStoredImage);

      await compressionService.optimizeImageForPDF('/test/image.jpg', 'photo');

      // Verify quality mismatch warning
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Quality mismatch for reused image')
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('stored=80, expected=60')
      );

      // Verify dimension mismatch warning
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Dimension mismatch for reused image')
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('stored=400x300, max allowed=300x300')
      );
    });
  });

  describe('Storage Miss Logging', () => {
    it('should log storage miss when no compressed image exists', async () => {
      const logSpy = jest.spyOn(compressionService['logger'], 'log');

      // Mock storage miss
      (compressedImageService.getCompressedImage as jest.Mock).mockResolvedValue(null);

      // This will fail due to Sharp processing, but we can still verify the storage miss logging
      try {
        await compressionService.optimizeImageForPDF('/test/image.jpg', 'photo');
      } catch (error) {
        // Expected to fail due to Sharp processing, but storage miss should still be logged
      }

      // Verify storage miss was logged
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Checking compressed storage for: /test/image.jpg')
      );
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('✗ STORAGE MISS: No compressed image found for: /test/image.jpg, performing fresh optimization')
      );
    });
  });

  describe('Storage Error Handling', () => {
    it('should handle storage retrieval errors gracefully', async () => {
      const warnSpy = jest.spyOn(compressionService['logger'], 'warn');

      // Mock storage retrieval error
      (compressedImageService.getCompressedImage as jest.Mock).mockRejectedValue(new Error('Storage unavailable'));

      // This will fail due to Sharp processing, but we can still verify error handling
      try {
        await compressionService.optimizeImageForPDF('/test/image.jpg', 'photo');
      } catch (error) {
        // Expected to fail due to Sharp processing
      }

      // Verify error was logged but processing continued
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to retrieve compressed image for /test/image.jpg: Storage unavailable. Proceeding with fresh optimization.')
      );
    });
  });

  describe('Storage Metrics', () => {
    it('should provide storage metrics', async () => {
      const metrics = await compressionService.getCompressedImageStorageMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.totalStorageSize).toBe(1024);
      expect(metrics.totalCompressedImages).toBe(1);
      expect(metrics.reuseRate).toBe(0.5);
      expect(metrics.averageCompressionRatio).toBe(0.7);
      expect(metrics.storageUtilization).toBe(0.1);

      expect(compressedImageService.getStorageMetrics).toHaveBeenCalled();
    });

    it('should check if compressed image exists', async () => {
      (compressedImageService.hasCompressedImage as jest.Mock).mockResolvedValue(true);

      const exists = await compressionService.hasCompressedImage('/test/image.jpg');

      expect(exists).toBe(true);
      expect(compressedImageService.hasCompressedImage).toHaveBeenCalledWith('/test/image.jpg');
    });
  });
});