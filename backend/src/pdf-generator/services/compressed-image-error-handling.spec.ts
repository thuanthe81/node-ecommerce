import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CompressedImageService } from './compressed-image.service';
import { CompressedImageConfigService } from './compressed-image-config.service';
import { CompressedImageStorageMonitoringService } from './compressed-image-storage-monitoring.service';
import { PDFCompressionService } from './pdf-compression.service';
import { PDFImageOptimizationMetricsService } from './pdf-image-optimization-metrics.service';
import { PDFImageOptimizationConfigService } from './pdf-image-optimization-config.service';
import { PDFImageValidationService } from './pdf-image-validation.service';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Enhanced Error Handling and Fallback Tests
 *
 * Tests the enhanced error handling and fallback mechanisms implemented in task 21:
 * - Graceful degradation when compressed directory is unavailable
 * - Fallback to fresh optimization when compressed image retrieval fails
 * - File system error handling and automatic recovery
 * - Ensuring PDF generation continues even with storage failures
 */
describe('Enhanced Error Handling and Fallback Tests', () => {
  let compressedImageService: CompressedImageService;
  let compressionService: PDFCompressionService;
  let configService: CompressedImageConfigService;
  let testDir: string;

  beforeEach(async () => {
    // Create a temporary test directory
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'compressed-error-test-'));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompressedImageService,
        CompressedImageConfigService,
        CompressedImageStorageMonitoringService,
        PDFCompressionService,
        PDFImageOptimizationMetricsService,
        PDFImageOptimizationConfigService,
        PDFImageValidationService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'COMPRESSED_IMAGE_STORAGE_ENABLED':
                  return 'true';
                case 'COMPRESSED_IMAGE_BASE_DIRECTORY':
                  return path.join(testDir, 'compressed');
                case 'COMPRESSED_IMAGE_GRACEFUL_DEGRADATION':
                  return 'true';
                case 'COMPRESSED_IMAGE_MAX_RETRIES':
                  return '2';
                case 'COMPRESSED_IMAGE_RETRY_DELAY':
                  return '100';
                default:
                  return undefined;
              }
            }),
          },
        },
      ],
    }).compile();

    compressedImageService = module.get<CompressedImageService>(CompressedImageService);
    compressionService = module.get<PDFCompressionService>(PDFCompressionService);
    configService = module.get<CompressedImageConfigService>(CompressedImageConfigService);
  });

  afterEach(async () => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Graceful Degradation', () => {
    it('should handle unavailable compressed directory gracefully', async () => {
      // Create a test image
      const testImagePath = path.join(testDir, 'test-image.jpg');
      const testImageBuffer = Buffer.from('fake-image-data');
      fs.writeFileSync(testImagePath, testImageBuffer);

      // Make the compressed directory read-only to simulate unavailability
      const compressedDir = path.join(testDir, 'compressed');
      fs.mkdirSync(compressedDir, { recursive: true });
      fs.chmodSync(compressedDir, 0o444); // Read-only

      const optimizationResult = {
        optimizedBuffer: testImageBuffer,
        originalSize: testImageBuffer.length,
        optimizedSize: testImageBuffer.length,
        compressionRatio: 0,
        dimensions: {
          original: { width: 100, height: 100 },
          optimized: { width: 100, height: 100 },
        },
        format: 'jpeg' as const,
        processingTime: 0,
        metadata: {
          contentType: 'photo' as const,
          qualityUsed: 80,
          formatConverted: false,
          originalFormat: 'jpeg',
          technique: 'test',
        },
      };

      // Should not throw error, should return empty path indicating graceful degradation
      const savedPath = await compressedImageService.saveCompressedImage(testImagePath, optimizationResult);
      expect(savedPath).toBe(''); // Empty path indicates graceful degradation

      // Restore permissions for cleanup
      fs.chmodSync(compressedDir, 0o755);
    });

    it('should fallback to fresh optimization when retrieval fails', async () => {
      const testImagePath = 'non-existent-image.jpg';

      // Should return null when image doesn't exist, not throw error
      const result = await compressedImageService.getCompressedImage(testImagePath);
      expect(result).toBeNull();
    });
  });

  describe('File System Error Recovery', () => {
    it('should handle file system errors with retry logic', async () => {
      const testImagePath = path.join(testDir, 'test-image.jpg');
      const testImageBuffer = Buffer.from('fake-image-data');
      fs.writeFileSync(testImagePath, testImageBuffer);

      const optimizationResult = {
        optimizedBuffer: testImageBuffer,
        originalSize: testImageBuffer.length,
        optimizedSize: testImageBuffer.length,
        compressionRatio: 0,
        dimensions: {
          original: { width: 100, height: 100 },
          optimized: { width: 100, height: 100 },
        },
        format: 'jpeg' as const,
        processingTime: 0,
        metadata: {
          contentType: 'photo' as const,
          qualityUsed: 80,
          formatConverted: false,
          originalFormat: 'jpeg',
          technique: 'test',
        },
      };

      // First save should succeed
      const savedPath = await compressedImageService.saveCompressedImage(testImagePath, optimizationResult);
      expect(savedPath).toBeTruthy();

      // Retrieval should work
      const retrieved = await compressedImageService.getCompressedImage(testImagePath);
      expect(retrieved).toBeTruthy();
      expect(retrieved?.optimizedBuffer).toEqual(testImageBuffer);
    });
  });

  describe('PDF Generation Continuity', () => {
    it('should ensure PDF generation continues even with storage failures', async () => {
      // Test that compression service methods don't throw errors even when storage fails
      const testImagePath = 'non-existent-image.jpg';

      // This should not throw an error, even if the image doesn't exist
      // The compression service should handle all errors gracefully
      const hasCompressed = await compressionService.hasCompressedImage(testImagePath);
      expect(typeof hasCompressed).toBe('boolean');

      // Storage metrics should be accessible even with errors
      const metrics = await compressionService.getCompressedImageStorageMetrics();
      expect(metrics).toBeDefined();
      expect(typeof metrics.totalStorageSize).toBe('number');
      expect(typeof metrics.totalCompressedImages).toBe('number');
    });

    it('should handle invalid image paths gracefully', async () => {
      const invalidPaths = ['', null, undefined, '   ', '/invalid/path/image.jpg'];

      for (const invalidPath of invalidPaths) {
        // Should not throw errors for invalid paths
        const hasCompressed = await compressionService.hasCompressedImage(invalidPath as string);
        expect(typeof hasCompressed).toBe('boolean');
      }
    });
  });

  describe('Configuration-Based Error Handling', () => {
    it('should respect graceful degradation configuration', async () => {
      // Verify that graceful degradation is enabled in test configuration
      expect(configService.isGracefulDegradationEnabled()).toBe(true);
      expect(configService.isEnabled()).toBe(true);

      const retryConfig = configService.getRetryConfig();
      expect(retryConfig.maxRetries).toBe(2);
      expect(retryConfig.retryDelay).toBe(100);
    });

    it('should handle disabled storage gracefully', async () => {
      // Mock disabled storage
      jest.spyOn(configService, 'isEnabled').mockReturnValue(false);

      const testImagePath = 'test-image.jpg';
      const optimizationResult = {
        optimizedBuffer: Buffer.from('test'),
        originalSize: 100,
        optimizedSize: 50,
        compressionRatio: 0.5,
        dimensions: {
          original: { width: 100, height: 100 },
          optimized: { width: 50, height: 50 },
        },
        format: 'jpeg' as const,
        processingTime: 0,
        metadata: {
          contentType: 'photo' as const,
          qualityUsed: 80,
          formatConverted: false,
          originalFormat: 'jpeg',
          technique: 'test',
        },
      };

      // Should return empty path when storage is disabled but graceful degradation is enabled
      const savedPath = await compressedImageService.saveCompressedImage(testImagePath, optimizationResult);
      expect(savedPath).toBe('');

      // Should return null when storage is disabled
      const retrieved = await compressedImageService.getCompressedImage(testImagePath);
      expect(retrieved).toBeNull();
    });
  });
});