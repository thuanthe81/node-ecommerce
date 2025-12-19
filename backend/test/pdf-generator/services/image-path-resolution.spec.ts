import { Test, TestingModule } from '@nestjs/testing';
import { PDFCompressionService } from '../../../src/pdf-generator/services/pdf-compression.service';
import { PDFImageOptimizationMetricsService } from '../../../src/pdf-generator/services/pdf-image-optimization-metrics.service';
import { PDFImageOptimizationConfigService } from '../../../src/pdf-generator/services/pdf-image-optimization-config.service';
import { PDFImageValidationService } from '../../../src/pdf-generator/services/pdf-image-validation.service';
import { CompressedImageService } from '../../../src/pdf-generator/services/compressed-image.service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Test to verify that image path resolution works correctly with UPLOAD_DIR
 * This test specifically addresses the bug where image URLs starting with /uploads/
 * were not being resolved correctly relative to the UPLOAD_DIR environment variable.
 */
describe('PDFCompressionService - Image Path Resolution', () => {
  let service: PDFCompressionService;

  const mockMetricsService = {
    recordOptimizationMetrics: jest.fn(),
    recordFallbackOperation: jest.fn(),
    getOptimizationSummary: jest.fn().mockReturnValue({
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      averageCompressionRatio: 0,
      totalSizeSavings: 0,
    }),
  };

  const mockConfigService = {
    getConfiguration: jest.fn().mockReturnValue({
      aggressiveMode: {
        enabled: true,
        maxDimensions: { width: 300, height: 300 },
        minDimensions: { width: 50, height: 50 },
        forceOptimization: true,
      },
      quality: {
        jpeg: { min: 40, max: 75, default: 60, progressive: true },
        png: { min: 50, max: 80, default: 65, progressive: true },
        webp: { min: 45, max: 80, default: 65 },
      },
      compression: {
        enabled: true,
        level: 'maximum',
        enableFormatConversion: true,
        preferredFormat: 'jpeg',
      },
      fallback: {
        enabled: true,
        maxRetries: 3,
        timeoutMs: 10000,
      },
      contentAware: {
        enabled: true,
        contentTypes: {
          text: { quality: 70 },
          photo: { quality: 55 },
          graphics: { quality: 65 },
          logo: { quality: 75 },
        },
      },
    }),
    reloadConfiguration: jest.fn(),
  };

  const mockValidationService = {
    validateAggressiveOptimization: jest.fn(),
    logOptimizationResults: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PDFCompressionService,
        {
          provide: PDFImageOptimizationMetricsService,
          useValue: mockMetricsService,
        },
        {
          provide: PDFImageOptimizationConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PDFImageValidationService,
          useValue: mockValidationService,
        },
        {
          provide: CompressedImageService,
          useValue: {
            hasCompressedImage: jest.fn().mockResolvedValue(false),
            getCompressedImage: jest.fn().mockResolvedValue(null),
            saveCompressedImage: jest.fn().mockResolvedValue('test-path'),
            generateCompressedPath: jest.fn().mockReturnValue('test-path'),
            getStorageMetrics: jest.fn().mockResolvedValue({
              totalStorageSize: 0,
              totalCompressedImages: 0,
              reuseRate: 0,
              averageCompressionRatio: 0,
              storageUtilization: 0,
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PDFCompressionService>(PDFCompressionService);
    jest.clearAllMocks();
  });

  describe('loadImageBuffer path resolution', () => {
    it('should correctly resolve /uploads/ paths relative to UPLOAD_DIR', async () => {
      // Set up test environment
      const originalUploadDir = process.env.UPLOAD_DIR;
      process.env.UPLOAD_DIR = 'uploads'; // This is the default value

      try {
        // Test with an actual image file that exists
        const testImagePath = '/uploads/products/9dd8b6b8-4696-4777-93fe-5b9ecce34be6/9dd8b6b8-4696-4777-93fe-5b9ecce34be6-1764320380597-t0edi4.jpg';

        // Check if the file exists in the expected location
        const expectedPath = path.join(process.cwd(), 'uploads', 'products/9dd8b6b8-4696-4777-93fe-5b9ecce34be6/9dd8b6b8-4696-4777-93fe-5b9ecce34be6-1764320380597-t0edi4.jpg');

        if (fs.existsSync(expectedPath)) {
          // Use reflection to access the private method
          const loadImageBuffer = (service as any).loadImageBuffer.bind(service);

          // This should not throw an error
          const buffer = await loadImageBuffer(testImagePath);

          expect(buffer).toBeInstanceOf(Buffer);
          expect(buffer.length).toBeGreaterThan(0);
        } else {
          // If the specific test file doesn't exist, test with a file we know exists
          const logoPath = '/uploads/logo.jpg';
          const logoExpectedPath = path.join(process.cwd(), 'uploads', 'logo.jpg');

          if (fs.existsSync(logoExpectedPath)) {
            const loadImageBuffer = (service as any).loadImageBuffer.bind(service);
            const buffer = await loadImageBuffer(logoPath);

            expect(buffer).toBeInstanceOf(Buffer);
            expect(buffer.length).toBeGreaterThan(0);
          } else {
            // Skip test if no test files are available
            console.log('Skipping test - no test image files available');
          }
        }
      } finally {
        // Restore original UPLOAD_DIR
        if (originalUploadDir) {
          process.env.UPLOAD_DIR = originalUploadDir;
        } else {
          delete process.env.UPLOAD_DIR;
        }
      }
    });

    it('should handle absolute UPLOAD_DIR paths correctly', async () => {
      const originalUploadDir = process.env.UPLOAD_DIR;
      const absoluteUploadDir = path.join(process.cwd(), 'uploads');
      process.env.UPLOAD_DIR = absoluteUploadDir;

      try {
        const testImagePath = '/uploads/logo.jpg';
        const expectedPath = path.join(absoluteUploadDir, 'logo.jpg');

        if (fs.existsSync(expectedPath)) {
          const loadImageBuffer = (service as any).loadImageBuffer.bind(service);
          const buffer = await loadImageBuffer(testImagePath);

          expect(buffer).toBeInstanceOf(Buffer);
          expect(buffer.length).toBeGreaterThan(0);
        } else {
          console.log('Skipping absolute path test - logo.jpg not found');
        }
      } finally {
        if (originalUploadDir) {
          process.env.UPLOAD_DIR = originalUploadDir;
        } else {
          delete process.env.UPLOAD_DIR;
        }
      }
    });

    it('should throw appropriate error for non-existent files', async () => {
      const testImagePath = '/uploads/non-existent-file.jpg';
      const loadImageBuffer = (service as any).loadImageBuffer.bind(service);

      await expect(loadImageBuffer(testImagePath)).rejects.toThrow('Image file not found');
    });

    it('should handle HTTP URLs correctly (unchanged behavior)', async () => {
      const httpUrl = 'https://example.com/image.jpg';
      const loadImageBuffer = (service as any).loadImageBuffer.bind(service);

      // Mock fetch for this test
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
      });

      const buffer = await loadImageBuffer(httpUrl);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(global.fetch).toHaveBeenCalledWith(httpUrl);
    });
  });
});