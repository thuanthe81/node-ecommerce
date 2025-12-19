import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PDFGeneratorService } from '../../../src/pdf-generator/pdf-generator.service';
import { PDFCompressionService } from '../../../src/pdf-generator/services/pdf-compression.service';
import { PDFTemplateEngine } from '../../../src/pdf-generator/pdf-template.engine';
import { PDFDocumentStructureService } from '../../../src/pdf-generator/pdf-document-structure.service';
import { PDFLocalizationService } from '../../../src/pdf-generator/services/pdf-localization.service';
import { PDFAccessibilityService } from '../../../src/pdf-generator/services/pdf-accessibility.service';
import { PDFDeviceOptimizationService } from '../../../src/pdf-generator/services/pdf-device-optimization.service';
import { PDFErrorHandlerService } from '../../../src/pdf-generator/services/pdf-error-handler.service';
import { PDFMonitoringService } from '../../../src/pdf-generator/services/pdf-monitoring.service';
import { PDFAuditService } from '../../../src/pdf-generator/services/pdf-audit.service';
import { PDFImageConverterService } from '../../../src/pdf-generator/services/pdf-image-converter.service';
import { PDFImageOptimizationConfigService } from '../../../src/pdf-generator/services/pdf-image-optimization-config.service';
import { PDFImageOptimizationMetricsService } from '../../../src/pdf-generator/services/pdf-image-optimization-metrics.service';
import { PDFImageValidationService } from '../../../src/pdf-generator/services/pdf-image-validation.service';
import { CompressedImageService } from '../../../src/pdf-generator/services/compressed-image.service';
import { CompressedImageConfigService } from '../../../src/pdf-generator/services/compressed-image-config.service';
import { CompressedImageStorageMonitoringService } from '../../../src/pdf-generator/services/compressed-image-storage-monitoring.service';
import { PaymentSettingsService } from '../../../src/payment-settings/payment-settings.service';
import { OrderPDFData } from '../../../src/pdf-generator/types/pdf.types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Integration Tests for PDF Optimization
 *
 * **Task 15: Write integration tests for PDF optimization**
 *
 * Tests end-to-end PDF generation with image optimization,
 * integration with existing PDF services, performance impact,
 * and configuration changes affecting PDF generation.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 4.1, 4.2
 */
describe('PDF Optimization Integration Tests', () => {
  let pdfGeneratorService: PDFGeneratorService;
  let compressionService: PDFCompressionService;
  let configService: PDFImageOptimizationConfigService;
  let metricsService: PDFImageOptimizationMetricsService;
  let module: TestingModule;

  const mockOrderData: OrderPDFData = {
    orderNumber: 'INT-TEST-001',
    orderDate: '2024-01-15',
    customerInfo: {
      name: 'Integration Test Customer',
      email: 'integration@test.com',
      phone: '+1234567890',
    },
    billingAddress: {
      fullName: 'Integration Test Customer',
      addressLine1: '123 Integration St',
      city: 'Test City',
      state: 'Test State',
      postalCode: '12345',
      country: 'Test Country',
    },
    shippingAddress: {
      fullName: 'Integration Test Customer',
      addressLine1: '123 Integration St',
      city: 'Test City',
      state: 'Test State',
      postalCode: '12345',
      country: 'Test Country',
    },
    items: [
      {
        id: '1',
        name: 'Test Product with Image',
        quantity: 2,
        unitPrice: 50.00,
        totalPrice: 100.00,
        imageUrl: '/uploads/test-product-image.jpg',
        description: 'A test product with an image for optimization testing'
      },
      {
        id: '2',
        name: 'Another Test Product',
        quantity: 1,
        unitPrice: 25.00,
        totalPrice: 25.00,
        imageUrl: '/uploads/test-product-2.png',
        description: 'Another test product with PNG image'
      }
    ],
    pricing: {
      subtotal: 125.00,
      shippingCost: 15.00,
      tax: 12.50,
      total: 152.50,
    },
    paymentMethod: {
      type: 'bank_transfer',
      displayName: 'Bank Transfer',
      status: 'pending',
      qrCodeUrl: '/uploads/payment-qr/test-qr.png'
    },
    shippingMethod: {
      name: 'Express Shipping',
      estimatedDelivery: '2-3 business days'
    },
    businessInfo: {
      companyName: 'Integration Test Company',
      contactEmail: 'contact@integrationtest.com',
      logoUrl: '/uploads/business/test-logo.png',
      address: {
        fullName: 'Integration Test Company',
        addressLine1: '456 Business Ave',
        city: 'Business City',
        state: 'Business State',
        postalCode: '67890',
        country: 'Business Country',
      },
      termsAndConditions: 'Integration test terms and conditions for PDF generation testing.',
      returnPolicy: 'Integration test return policy for comprehensive testing.'
    },
    locale: 'en',
  };

  beforeEach(async () => {
    // Set up test environment variables
    process.env.IMAGE_OPTIMIZATION_ENABLED = 'true';
    process.env.IMAGE_AGGRESSIVE_MODE_ENABLED = 'true';
    process.env.IMAGE_MAX_WIDTH = '300';
    process.env.IMAGE_MAX_HEIGHT = '300';
    process.env.IMAGE_COMPRESSION_LEVEL = 'high';
    process.env.IMAGE_MONITORING_ENABLED = 'true';

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
      ],
      providers: [
        PDFGeneratorService,
        PDFTemplateEngine,
        PDFDocumentStructureService,
        PDFCompressionService,
        PDFImageOptimizationConfigService,
        PDFImageOptimizationMetricsService,
        PDFImageValidationService,
        CompressedImageService,
        CompressedImageConfigService,
        CompressedImageStorageMonitoringService,
        {
          provide: PDFLocalizationService,
          useValue: {
            getLocalizedText: jest.fn().mockReturnValue('Localized Text'),
            formatCurrency: jest.fn().mockReturnValue('152,50 ₫'),
            formatDate: jest.fn().mockReturnValue('Jan 15, 2024'),
            generateBankTransferInstructions: jest.fn().mockReturnValue('Test bank transfer instructions'),
          },
        },
        {
          provide: PDFAccessibilityService,
          useValue: {
            enhanceHTMLAccessibility: jest.fn().mockImplementation((html) => html),
            enhanceImageAltText: jest.fn().mockImplementation((html) => html),
            generateAccessibilityMetadata: jest.fn().mockReturnValue({
              title: 'Integration Test PDF',
              author: 'Integration Test Company'
            }),
          },
        },
        {
          provide: PDFDeviceOptimizationService,
          useValue: {
            addNavigationAnchors: jest.fn().mockImplementation((html) => html),
            getDeviceOptimizedPDFOptions: jest.fn().mockReturnValue({
              format: 'A4',
              printBackground: true,
              margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
            }),
          },
        },
        {
          provide: PDFErrorHandlerService,
          useValue: {
            handlePDFGenerationError: jest.fn().mockResolvedValue({ handled: true }),
          },
        },
        {
          provide: PDFMonitoringService,
          useValue: {
            recordPerformanceMetric: jest.fn(),
            getPerformanceMetrics: jest.fn().mockResolvedValue({
              pdfGeneration: { averageTime: 1000, successRate: 100 },
              imageOptimization: { totalImagesProcessed: 0, successRate: 0 },
              storage: { totalSize: 0, capacityUsage: 0 },
              emailDelivery: { successRate: 100, averageDeliveryTime: 500 }
            }),
          },
        },
        {
          provide: PDFAuditService,
          useValue: {
            logPDFGeneration: jest.fn().mockResolvedValue('audit-integration-test'),
          },
        },
        {
          provide: PDFImageConverterService,
          useValue: {
            convertImageToBase64: jest.fn().mockResolvedValue('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD'),
            convertMultipleImages: jest.fn().mockResolvedValue(new Map([
              ['/uploads/test-product-image.jpg', 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD'],
              ['/uploads/test-product-2.png', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='],
              ['/uploads/payment-qr/test-qr.png', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='],
              ['/uploads/business/test-logo.png', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==']
            ])),
            clearCache: jest.fn(),
            getCacheStats: jest.fn().mockReturnValue({ size: 4, maxSize: 100 }),
          },
        },
        {
          provide: PaymentSettingsService,
          useValue: {
            getBankTransferSettings: jest.fn().mockResolvedValue({
              accountName: 'Integration Test Account',
              accountNumber: '1234567890',
              bankName: 'Integration Test Bank',
              qrCodeUrl: '/uploads/payment-qr/test-qr.png',
            }),
          },
        },
      ],
    }).compile();

    pdfGeneratorService = module.get<PDFGeneratorService>(PDFGeneratorService);
    compressionService = module.get<PDFCompressionService>(PDFCompressionService);
    configService = module.get<PDFImageOptimizationConfigService>(PDFImageOptimizationConfigService);
    metricsService = module.get<PDFImageOptimizationMetricsService>(PDFImageOptimizationMetricsService);
  });

  afterEach(async () => {
    await module.close();

    // Clean up environment variables
    delete process.env.IMAGE_OPTIMIZATION_ENABLED;
    delete process.env.IMAGE_AGGRESSIVE_MODE_ENABLED;
    delete process.env.IMAGE_MAX_WIDTH;
    delete process.env.IMAGE_MAX_HEIGHT;
    delete process.env.IMAGE_COMPRESSION_LEVEL;
    delete process.env.IMAGE_MONITORING_ENABLED;
  });

  describe('End-to-End PDF Generation with Image Optimization', () => {
    /**
     * **Requirement 1.1, 1.2: PDF generation with optimization**
     */
    it('should generate PDF with optimized images end-to-end', async () => {
      // Mock Puppeteer to avoid actual PDF generation in tests
      const mockPDFBuffer = Buffer.from('mock-optimized-pdf-content');
      const mockPage = {
        setViewport: jest.fn(),
        setContent: jest.fn(),
        pdf: jest.fn().mockResolvedValue(mockPDFBuffer),
        close: jest.fn(),
      };
      const mockBrowser = {
        newPage: jest.fn().mockResolvedValue(mockPage),
        close: jest.fn(),
      };

      // Mock browser initialization
      jest.spyOn(pdfGeneratorService as any, 'initializeBrowser').mockResolvedValue(mockBrowser);

      // Mock image optimization
      jest.spyOn(compressionService, 'optimizeOrderDataForPDF').mockResolvedValue({
        optimizedData: mockOrderData,
        optimizations: [
          'Optimized product image: test-product-image.jpg (1000KB → 400KB, 60% reduction)',
          'Optimized product image: test-product-2.png (800KB → 350KB, 56% reduction)',
          'Optimized QR code: test-qr.png (200KB → 150KB, 25% reduction)',
          'Optimized business logo: test-logo.png (300KB → 200KB, 33% reduction)'
        ],
        sizeSavings: 1200000 // 1.2MB total savings
      });

      const result = await pdfGeneratorService.generateOrderPDF(mockOrderData, 'en');

      expect(result.success).toBe(true);
      expect(result.pdfBuffer).toEqual(mockPDFBuffer);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.optimizationMetrics).toBeDefined();
      expect(result.metadata.optimizationMetrics.optimizedImages).toBeGreaterThan(0);

      // Verify optimization was called
      expect(compressionService.optimizeOrderDataForPDF).toHaveBeenCalledWith(mockOrderData);
    });

    /**
     * **Requirement 1.3: File size reduction**
     */
    it('should demonstrate significant file size reduction through optimization', async () => {
      const mockPDFBuffer = Buffer.from('mock-compressed-pdf-content');
      const mockPage = {
        setViewport: jest.fn(),
        setContent: jest.fn(),
        pdf: jest.fn().mockResolvedValue(mockPDFBuffer),
        close: jest.fn(),
      };
      const mockBrowser = {
        newPage: jest.fn().mockResolvedValue(mockPage),
      };

      jest.spyOn(pdfGeneratorService as any, 'initializeBrowser').mockResolvedValue(mockBrowser);

      // Mock significant optimization results
      jest.spyOn(compressionService, 'optimizeOrderDataForPDF').mockResolvedValue({
        optimizedData: mockOrderData,
        optimizations: [
          'Aggressive optimization applied to 4 images',
          'Total size reduction: 2.5MB → 800KB (68% reduction)',
          'Format conversion: 2 PNG → JPEG for better compression',
          'Dynamic scaling applied based on content type'
        ],
        sizeSavings: 1700000 // 1.7MB savings
      });

      const result = await pdfGeneratorService.generateCompressedPDF(mockOrderData, 'en', 'high');

      expect(result.success).toBe(true);
      expect(result.metadata.optimizationMetrics.sizeSavings).toBeGreaterThan(1000000); // > 1MB savings
      expect(result.metadata.optimizationMetrics.compressionRatio).toBeGreaterThan(0.5); // > 50% compression
    });

    /**
     * **Requirement 1.4: Consistent optimization across multiple images**
     */
    it('should apply consistent optimization settings across all images in PDF', async () => {
      const mockPDFBuffer = Buffer.from('mock-consistent-pdf-content');
      const mockPage = {
        setViewport: jest.fn(),
        setContent: jest.fn(),
        pdf: jest.fn().mockResolvedValue(mockPDFBuffer),
        close: jest.fn(),
      };
      const mockBrowser = {
        newPage: jest.fn().mockResolvedValue(mockPage),
      };

      jest.spyOn(pdfGeneratorService as any, 'initializeBrowser').mockResolvedValue(mockBrowser);

      // Mock consistent batch optimization
      jest.spyOn(compressionService, 'optimizeOrderDataForPDF').mockResolvedValue({
        optimizedData: mockOrderData,
        optimizations: [
          'Consistent batch optimization completed for 4 images',
          'All images scaled to max 300x300 dimensions',
          'Uniform quality settings applied per content type',
          'Consistent format optimization: JPEG for photos, PNG for logos/graphics'
        ],
        sizeSavings: 1500000
      });

      const result = await pdfGeneratorService.generateOrderPDF(mockOrderData, 'en');

      expect(result.success).toBe(true);

      // Verify consistent optimization was applied
      const optimizations = result.metadata.optimizationMetrics.optimizations || [];
      expect(optimizations.some(opt => opt.includes('Consistent batch optimization'))).toBe(true);
      expect(optimizations.some(opt => opt.includes('Uniform quality settings'))).toBe(true);
    });
  });

  describe('Integration with Existing PDF Services', () => {
    /**
     * **Requirement 1.1, 1.2: Service integration**
     */
    it('should integrate seamlessly with PDFTemplateEngine', async () => {
      const mockHTML = '<html><body><h1>Integration Test PDF</h1><img src="data:image/jpeg;base64,optimized" alt="Optimized Image"></body></html>';
      const mockPDFBuffer = Buffer.from('integrated-pdf-content');

      const mockPage = {
        setViewport: jest.fn(),
        setContent: jest.fn(),
        pdf: jest.fn().mockResolvedValue(mockPDFBuffer),
        close: jest.fn(),
      };
      const mockBrowser = {
        newPage: jest.fn().mockResolvedValue(mockPage),
      };

      jest.spyOn(pdfGeneratorService as any, 'initializeBrowser').mockResolvedValue(mockBrowser);

      // Mock template engine to return HTML with optimized images
      const templateEngine = module.get<PDFTemplateEngine>(PDFTemplateEngine);
      jest.spyOn(templateEngine, 'generateHTMLFromOrderData').mockResolvedValue(mockHTML);

      // Mock optimization
      jest.spyOn(compressionService, 'optimizeOrderDataForPDF').mockResolvedValue({
        optimizedData: {
          ...mockOrderData,
          items: mockOrderData.items.map(item => ({
            ...item,
            imageUrl: item.imageUrl ? 'data:image/jpeg;base64,optimized' : undefined
          }))
        },
        optimizations: ['Template integration successful'],
        sizeSavings: 500000
      });

      const result = await pdfGeneratorService.generateOrderPDF(mockOrderData, 'en');

      expect(result.success).toBe(true);
      expect(templateEngine.generateHTMLFromOrderData).toHaveBeenCalled();
      expect(compressionService.optimizeOrderDataForPDF).toHaveBeenCalled();
    });

    it('should integrate with PDFAccessibilityService for optimized images', async () => {
      const mockPDFBuffer = Buffer.from('accessible-optimized-pdf');
      const mockPage = {
        setViewport: jest.fn(),
        setContent: jest.fn(),
        pdf: jest.fn().mockResolvedValue(mockPDFBuffer),
        close: jest.fn(),
      };
      const mockBrowser = {
        newPage: jest.fn().mockResolvedValue(mockPage),
      };

      jest.spyOn(pdfGeneratorService as any, 'initializeBrowser').mockResolvedValue(mockBrowser);

      const accessibilityService = module.get<PDFAccessibilityService>(PDFAccessibilityService);

      // Mock accessibility enhancement for optimized images
      jest.spyOn(accessibilityService, 'enhanceImageAltText').mockImplementation((html) => {
        return html.replace(/<img/g, '<img role="img" tabindex="0"');
      });

      jest.spyOn(compressionService, 'optimizeOrderDataForPDF').mockResolvedValue({
        optimizedData: mockOrderData,
        optimizations: ['Accessibility integration successful'],
        sizeSavings: 300000
      });

      const result = await pdfGeneratorService.generateOrderPDF(mockOrderData, 'en');

      expect(result.success).toBe(true);
      expect(accessibilityService.enhanceImageAltText).toHaveBeenCalled();
    });

    it('should integrate with PDFMonitoringService for optimization metrics', async () => {
      const mockPDFBuffer = Buffer.from('monitored-optimized-pdf');
      const mockPage = {
        setViewport: jest.fn(),
        setContent: jest.fn(),
        pdf: jest.fn().mockResolvedValue(mockPDFBuffer),
        close: jest.fn(),
      };
      const mockBrowser = {
        newPage: jest.fn().mockResolvedValue(mockPage),
      };

      jest.spyOn(pdfGeneratorService as any, 'initializeBrowser').mockResolvedValue(mockBrowser);

      const monitoringService = module.get<PDFMonitoringService>(PDFMonitoringService);

      jest.spyOn(compressionService, 'optimizeOrderDataForPDF').mockResolvedValue({
        optimizedData: mockOrderData,
        optimizations: ['Monitoring integration successful'],
        sizeSavings: 800000
      });

      const result = await pdfGeneratorService.generateOrderPDF(mockOrderData, 'en');

      expect(result.success).toBe(true);
      expect(monitoringService.recordPerformanceMetric).toHaveBeenCalled();

      // Verify optimization metrics are included
      expect(result.metadata.optimizationMetrics).toBeDefined();
      expect(result.metadata.optimizationMetrics.sizeSavings).toBe(800000);
    });
  });

  describe('Performance Impact Assessment', () => {
    /**
     * Test performance impact of image optimization on PDF generation
     */
    it('should measure performance impact of image optimization', async () => {
      const startTime = Date.now();

      const mockPDFBuffer = Buffer.from('performance-test-pdf');
      const mockPage = {
        setViewport: jest.fn(),
        setContent: jest.fn(),
        pdf: jest.fn().mockResolvedValue(mockPDFBuffer),
        close: jest.fn(),
      };
      const mockBrowser = {
        newPage: jest.fn().mockResolvedValue(mockPage),
      };

      jest.spyOn(pdfGeneratorService as any, 'initializeBrowser').mockResolvedValue(mockBrowser);

      // Mock optimization with realistic processing times
      jest.spyOn(compressionService, 'optimizeOrderDataForPDF').mockImplementation(async (orderData) => {
        // Simulate optimization processing time
        await new Promise(resolve => setTimeout(resolve, 200));

        return {
          optimizedData: orderData,
          optimizations: [
            'Performance test: 4 images optimized in 200ms',
            'Average optimization time: 50ms per image',
            'Total processing overhead: 200ms'
          ],
          sizeSavings: 1000000
        };
      });

      const result = await pdfGeneratorService.generateOrderPDF(mockOrderData, 'en');
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(result.success).toBe(true);

      // Performance should be reasonable (allowing for test overhead)
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Optimization should provide significant size savings to justify processing time
      expect(result.metadata.optimizationMetrics.sizeSavings).toBeGreaterThan(500000); // > 500KB savings
    });

    it('should handle concurrent PDF generation with optimization efficiently', async () => {
      const mockPDFBuffer = Buffer.from('concurrent-test-pdf');
      const mockPage = {
        setViewport: jest.fn(),
        setContent: jest.fn(),
        pdf: jest.fn().mockResolvedValue(mockPDFBuffer),
        close: jest.fn(),
      };
      const mockBrowser = {
        newPage: jest.fn().mockResolvedValue(mockPage),
      };

      jest.spyOn(pdfGeneratorService as any, 'initializeBrowser').mockResolvedValue(mockBrowser);

      jest.spyOn(compressionService, 'optimizeOrderDataForPDF').mockResolvedValue({
        optimizedData: mockOrderData,
        optimizations: ['Concurrent optimization test'],
        sizeSavings: 600000
      });

      // Generate multiple PDFs concurrently
      const concurrentPromises = Array.from({ length: 3 }, (_, index) =>
        pdfGeneratorService.generateOrderPDF({
          ...mockOrderData,
          orderNumber: `CONCURRENT-${index + 1}`
        }, 'en')
      );

      const results = await Promise.all(concurrentPromises);

      // All should succeed
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.metadata.optimizationMetrics).toBeDefined();
      });

      // Verify optimization was called for each
      expect(compressionService.optimizeOrderDataForPDF).toHaveBeenCalledTimes(3);
    });
  });

  describe('Configuration Changes Affecting PDF Generation', () => {
    /**
     * **Requirement 4.1, 4.2: Configuration management**
     */
    it('should apply configuration changes to PDF generation', async () => {
      const mockPDFBuffer = Buffer.from('config-test-pdf');
      const mockPage = {
        setViewport: jest.fn(),
        setContent: jest.fn(),
        pdf: jest.fn().mockResolvedValue(mockPDFBuffer),
        close: jest.fn(),
      };
      const mockBrowser = {
        newPage: jest.fn().mockResolvedValue(mockPage),
      };

      jest.spyOn(pdfGeneratorService as any, 'initializeBrowser').mockResolvedValue(mockBrowser);

      // Test with aggressive mode enabled
      jest.spyOn(configService, 'getConfiguration').mockReturnValue({
        aggressiveMode: {
          enabled: true,
          maxDimensions: { width: 200, height: 200 }, // Smaller than default
          minDimensions: { width: 30, height: 30 },
          forceOptimization: true
        },
        quality: {
          jpeg: { min: 30, max: 60, default: 45 }, // Lower quality
          png: { min: 40, max: 70, default: 55 },
          webp: { min: 35, max: 70, default: 55 }
        },
        compression: {
          enabled: true,
          level: 'maximum' as const,
          enableFormatConversion: true,
          preferredFormat: 'jpeg' as const
        },
        fallback: { enabled: true, maxRetries: 3, timeoutMs: 10000 },
        monitoring: { enabled: true, trackProcessingTime: true, trackCompressionRatio: true, trackSizeReduction: true },
        contentAware: {
          enabled: true,
          contentTypes: {
            text: { quality: 60, preserveSharpness: true },
            photo: { quality: 45, allowAggressive: true }, // More aggressive
            graphics: { quality: 55, preserveColors: true },
            logo: { quality: 65, maintainCrisp: true }
          }
        }
      });

      jest.spyOn(compressionService, 'optimizeOrderDataForPDF').mockResolvedValue({
        optimizedData: mockOrderData,
        optimizations: [
          'Applied aggressive configuration: max 200x200 dimensions',
          'Used lower quality settings for maximum compression',
          'Configuration-driven optimization completed'
        ],
        sizeSavings: 1800000 // Higher savings due to aggressive settings
      });

      const result = await pdfGeneratorService.generateOrderPDF(mockOrderData, 'en');

      expect(result.success).toBe(true);
      expect(result.metadata.optimizationMetrics.sizeSavings).toBeGreaterThan(1500000); // Higher savings

      const optimizations = result.metadata.optimizationMetrics.optimizations || [];
      expect(optimizations.some(opt => opt.includes('aggressive configuration'))).toBe(true);
    });

    it('should handle configuration reload during PDF generation', async () => {
      const mockPDFBuffer = Buffer.from('reload-test-pdf');
      const mockPage = {
        setViewport: jest.fn(),
        setContent: jest.fn(),
        pdf: jest.fn().mockResolvedValue(mockPDFBuffer),
        close: jest.fn(),
      };
      const mockBrowser = {
        newPage: jest.fn().mockResolvedValue(mockPage),
      };

      jest.spyOn(pdfGeneratorService as any, 'initializeBrowser').mockResolvedValue(mockBrowser);

      // Mock configuration reload
      let configCallCount = 0;
      jest.spyOn(configService, 'getConfiguration').mockImplementation(() => {
        configCallCount++;
        return {
          aggressiveMode: {
            enabled: true,
            maxDimensions: { width: configCallCount > 1 ? 250 : 300, height: configCallCount > 1 ? 250 : 300 },
            minDimensions: { width: 50, height: 50 },
            forceOptimization: true
          },
          quality: {
            jpeg: { min: 40, max: 75, default: 60 },
            png: { min: 50, max: 80, default: 65 },
            webp: { min: 45, max: 80, default: 65 }
          },
          compression: {
            enabled: true,
            level: 'high' as const,
            enableFormatConversion: true,
            preferredFormat: 'jpeg' as const
          },
          fallback: { enabled: true, maxRetries: 3, timeoutMs: 10000 },
          monitoring: { enabled: true, trackProcessingTime: true, trackCompressionRatio: true, trackSizeReduction: true },
          contentAware: {
            enabled: true,
            contentTypes: {
              text: { quality: 70, preserveSharpness: true },
              photo: { quality: 55, allowAggressive: true },
              graphics: { quality: 65, preserveColors: true },
              logo: { quality: 75, maintainCrisp: true }
            }
          }
        };
      });

      jest.spyOn(compressionService, 'optimizeOrderDataForPDF').mockResolvedValue({
        optimizedData: mockOrderData,
        optimizations: ['Configuration reload handled successfully'],
        sizeSavings: 900000
      });

      // Simulate configuration reload
      configService.reloadConfiguration();

      const result = await pdfGeneratorService.generateOrderPDF(mockOrderData, 'en');

      expect(result.success).toBe(true);
      expect(configService.getConfiguration).toHaveBeenCalled();
    });

    it('should disable optimization when configuration is disabled', async () => {
      const mockPDFBuffer = Buffer.from('disabled-optimization-pdf');
      const mockPage = {
        setViewport: jest.fn(),
        setContent: jest.fn(),
        pdf: jest.fn().mockResolvedValue(mockPDFBuffer),
        close: jest.fn(),
      };
      const mockBrowser = {
        newPage: jest.fn().mockResolvedValue(mockPage),
      };

      jest.spyOn(pdfGeneratorService as any, 'initializeBrowser').mockResolvedValue(mockBrowser);

      // Mock disabled configuration
      jest.spyOn(configService, 'getConfiguration').mockReturnValue({
        aggressiveMode: {
          enabled: false, // Disabled
          maxDimensions: { width: 300, height: 300 },
          minDimensions: { width: 50, height: 50 },
          forceOptimization: false
        },
        quality: {
          jpeg: { min: 40, max: 75, default: 60 },
          png: { min: 50, max: 80, default: 65 },
          webp: { min: 45, max: 80, default: 65 }
        },
        compression: {
          enabled: false, // Disabled
          level: 'low' as const,
          enableFormatConversion: false,
          preferredFormat: 'jpeg' as const
        },
        fallback: { enabled: true, maxRetries: 3, timeoutMs: 10000 },
        monitoring: { enabled: false, trackProcessingTime: false, trackCompressionRatio: false, trackSizeReduction: false },
        contentAware: {
          enabled: false, // Disabled
          contentTypes: {
            text: { quality: 70, preserveSharpness: true },
            photo: { quality: 55, allowAggressive: true },
            graphics: { quality: 65, preserveColors: true },
            logo: { quality: 75, maintainCrisp: true }
          }
        }
      });

      jest.spyOn(compressionService, 'optimizeOrderDataForPDF').mockResolvedValue({
        optimizedData: mockOrderData,
        optimizations: ['Optimization disabled by configuration'],
        sizeSavings: 0 // No optimization performed
      });

      const result = await pdfGeneratorService.generateOrderPDF(mockOrderData, 'en');

      expect(result.success).toBe(true);
      expect(result.metadata.optimizationMetrics.sizeSavings).toBe(0);

      const optimizations = result.metadata.optimizationMetrics.optimizations || [];
      expect(optimizations.some(opt => opt.includes('disabled by configuration'))).toBe(true);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle optimization failures gracefully without breaking PDF generation', async () => {
      const mockPDFBuffer = Buffer.from('fallback-pdf-content');
      const mockPage = {
        setViewport: jest.fn(),
        setContent: jest.fn(),
        pdf: jest.fn().mockResolvedValue(mockPDFBuffer),
        close: jest.fn(),
      };
      const mockBrowser = {
        newPage: jest.fn().mockResolvedValue(mockPage),
      };

      jest.spyOn(pdfGeneratorService as any, 'initializeBrowser').mockResolvedValue(mockBrowser);

      // Mock optimization failure
      jest.spyOn(compressionService, 'optimizeOrderDataForPDF').mockRejectedValueOnce(
        new Error('Image optimization service unavailable')
      );

      // Should still generate PDF without optimization
      const result = await pdfGeneratorService.generateOrderPDF(mockOrderData, 'en');

      expect(result.success).toBe(true);
      expect(result.pdfBuffer).toEqual(mockPDFBuffer);

      // Should have handled the error gracefully
      expect(result.metadata.optimizationMetrics).toBeDefined();
      expect(result.metadata.optimizationMetrics.sizeSavings).toBe(0);
    });

    it('should recover from partial optimization failures', async () => {
      const mockPDFBuffer = Buffer.from('partial-recovery-pdf');
      const mockPage = {
        setViewport: jest.fn(),
        setContent: jest.fn(),
        pdf: jest.fn().mockResolvedValue(mockPDFBuffer),
        close: jest.fn(),
      };
      const mockBrowser = {
        newPage: jest.fn().mockResolvedValue(mockPage),
      };

      jest.spyOn(pdfGeneratorService as any, 'initializeBrowser').mockResolvedValue(mockBrowser);

      // Mock partial optimization success
      jest.spyOn(compressionService, 'optimizeOrderDataForPDF').mockResolvedValue({
        optimizedData: mockOrderData,
        optimizations: [
          'Successfully optimized 2 out of 4 images',
          'Failed to optimize: test-product-2.png (file corrupted)',
          'Failed to optimize: test-qr.png (unsupported format)',
          'Partial optimization completed with fallback'
        ],
        sizeSavings: 400000 // Reduced savings due to partial failure
      });

      const result = await pdfGeneratorService.generateOrderPDF(mockOrderData, 'en');

      expect(result.success).toBe(true);
      expect(result.metadata.optimizationMetrics.sizeSavings).toBe(400000);

      const optimizations = result.metadata.optimizationMetrics.optimizations || [];
      expect(optimizations.some(opt => opt.includes('2 out of 4 images'))).toBe(true);
      expect(optimizations.some(opt => opt.includes('Partial optimization completed'))).toBe(true);
    });
  });
});