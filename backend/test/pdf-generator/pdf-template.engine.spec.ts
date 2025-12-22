import { Test, TestingModule } from '@nestjs/testing';
import { PDFTemplateEngine } from '../../src/pdf-generator/pdf-template.engine';
import { PDFDocumentStructureService } from '../../src/pdf-generator/pdf-document-structure.service';
import { PDFLocalizationService } from '../../src/pdf-generator/services/pdf-localization.service';
import { PDFAccessibilityService } from '../../src/pdf-generator/services/pdf-accessibility.service';
import { PDFDeviceOptimizationService } from '../../src/pdf-generator/services/pdf-device-optimization.service';
import { PDFImageConverterService } from '../../src/pdf-generator/services/pdf-image-converter.service';
import { PDFCompressionService } from '../../src/pdf-generator/services/pdf-compression.service';
import { PDFImageOptimizationMetricsService } from '../../src/pdf-generator/services/pdf-image-optimization-metrics.service';
import { OrderPDFData } from '../../src/pdf-generator/types/pdf.types';

describe('PDFTemplateEngine', () => {
  let service: PDFTemplateEngine;
  let compressionService: PDFCompressionService;

  const mockOrderData: OrderPDFData = {
    orderNumber: 'TEST-001',
    orderDate: new Date(),
    customerInfo: {
      name: 'Test Customer',
      email: 'test@example.com',
      phone: '+1234567890',
    },
    items: [
      {
        id: '1',
        name: 'Test Product',
        description: 'Test Description',
        sku: 'TEST-SKU',
        quantity: 1,
        unitPrice: 100,
        totalPrice: 100,
        imageUrl: 'test-product.jpg',
      },
    ],
    pricing: {
      subtotal: 100,
      shippingCost: 10,
      taxAmount: 0,
      discountAmount: 0,
      total: 110,
    },
    shippingAddress: {
      addressLine1: '123 Test St',
      addressLine2: '',
      city: 'Test City',
      state: 'Test State',
      postalCode: '12345',
      country: 'Test Country',
    },
    billingAddress: {
      addressLine1: '123 Test St',
      addressLine2: '',
      city: 'Test City',
      state: 'Test State',
      postalCode: '12345',
      country: 'Test Country',
    },
    paymentMethod: {
      displayName: 'Test Payment',
      status: 'pending',
      details: 'Test Details',
      instructions: 'Test Instructions',
      qrCodeUrl: 'test-qr.jpg',
    },
    shippingMethod: {
      name: 'Test Shipping',
      description: 'Test Shipping Description',
      estimatedDelivery: '2-3 days',
      trackingNumber: 'TEST123',
      carrier: 'Test Carrier',
    },
    businessInfo: {
      companyName: 'Test Company',
      logoUrl: 'test-logo.jpg',
      address: {
        addressLine1: '456 Business St',
        addressLine2: '',
        city: 'Business City',
        state: 'Business State',
        postalCode: '67890',
        country: 'Business Country',
      },
      contactEmail: 'business@example.com',
      contactPhone: '+0987654321',
      website: 'https://example.com',
      termsAndConditions: 'Test Terms',
      returnPolicy: 'Test Return Policy',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PDFTemplateEngine,
        {
          provide: PDFDocumentStructureService,
          useValue: {
            generateDocumentStructure: jest.fn().mockReturnValue('<html>Test HTML</html>'),
          },
        },
        {
          provide: PDFLocalizationService,
          useValue: {
            translate: jest.fn().mockReturnValue('Test Translation'),
            formatDate: jest.fn().mockReturnValue('Test Date'),
            formatAddress: jest.fn().mockReturnValue('Test Address'),
            formatPhoneNumber: jest.fn().mockReturnValue('Test Phone'),
            formatCurrency: jest.fn().mockReturnValue('100 đ'),
            getPaymentStatusText: jest.fn().mockReturnValue('Pending'),
          },
        },
        {
          provide: PDFAccessibilityService,
          useValue: {
            generateAccessibilityCSS: jest.fn().mockReturnValue('/* accessibility css */'),
          },
        },
        {
          provide: PDFDeviceOptimizationService,
          useValue: {
            generateCompleteDeviceCSS: jest.fn().mockReturnValue('/* device css */'),
          },
        },
        {
          provide: PDFImageConverterService,
          useValue: {
            convertImageToBase64: jest.fn().mockResolvedValue('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA=='),
            convertMultipleImages: jest.fn().mockResolvedValue(new Map([
              ['test-product.jpg', 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA=='],
              ['test-logo.jpg', 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA=='],
              ['test-qr.jpg', 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA=='],
            ])),
          },
        },
        {
          provide: PDFCompressionService,
          useValue: {
            optimizeImageForPDF: jest.fn().mockResolvedValue({
              optimizedBuffer: Buffer.from('optimized-image-data'),
              originalSize: 1000,
              optimizedSize: 500,
              compressionRatio: 0.5,
              dimensions: {
                original: { width: 800, height: 600 },
                optimized: { width: 300, height: 225 },
              },
              format: 'jpeg',
              processingTime: 100,
              metadata: {
                contentType: 'photo',
                qualityUsed: 60,
                formatConverted: false,
                originalFormat: 'jpeg',
                technique: 'comprehensive',
              },
            }),
            configService: {
              getConfiguration: jest.fn().mockReturnValue({
                aggressiveMode: {
                  enabled: true,
                  maxDimensions: { width: 300, height: 300 },
                  minDimensions: { width: 50, height: 50 },
                  forceOptimization: true,
                },
                compression: {
                  enabled: true,
                  level: 'maximum',
                  enableFormatConversion: true,
                  preferredFormat: 'jpeg',
                },
                contentAware: {
                  enabled: true,
                  contentTypes: {
                    text: { quality: 70, preserveSharpness: true },
                    photo: { quality: 55, allowAggressive: true },
                    graphics: { quality: 65, preserveColors: true },
                    logo: { quality: 75, maintainCrisp: true },
                  },
                },
                fallback: {
                  enabled: true,
                  maxRetries: 3,
                  timeoutMs: 10000,
                },
                monitoring: {
                  enabled: true,
                  trackProcessingTime: true,
                  trackCompressionRatio: true,
                  trackSizeReduction: true,
                },
              }),
              getContentTypeSettings: jest.fn().mockImplementation((contentType) => {
                const settings = {
                  text: { quality: 70, preserveSharpness: true },
                  photo: { quality: 55, allowAggressive: true },
                  graphics: { quality: 65, preserveColors: true },
                  logo: { quality: 75, maintainCrisp: true },
                };
                return settings[contentType] || settings.photo;
              }),
            },
          },
        },
        {
          provide: PDFImageOptimizationMetricsService,
          useValue: {
            recordPerformanceData: jest.fn(),
            getOptimizationMetrics: jest.fn().mockReturnValue({
              totalOptimizations: 0,
              successfulOptimizations: 0,
              failedOptimizations: 0,
              averageProcessingTime: 0,
              averageCompressionRatio: 0,
              totalSizeSaved: 0,
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PDFTemplateEngine>(PDFTemplateEngine);
    compressionService = module.get<PDFCompressionService>(PDFCompressionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrderTemplate', () => {
    it('should create order template with optimized images', async () => {
      const template = await service.createOrderTemplate(mockOrderData, 'en');

      expect(template).toBeDefined();
      expect(template.header).toBeDefined();
      expect(template.content).toBeDefined();
      expect(template.footer).toBeDefined();
      expect(template.styling).toBeDefined();
      expect(template.metadata).toBeDefined();

      // Verify that compression service was called for image optimization
      expect(compressionService.optimizeImageForPDF).toHaveBeenCalledWith('test-product.jpg', 'photo');
      expect(compressionService.optimizeImageForPDF).toHaveBeenCalledWith('test-logo.jpg', 'logo');
      expect(compressionService.optimizeImageForPDF).toHaveBeenCalledWith('test-qr.jpg', 'graphics');
    });

    it('should handle images that are already base64 encoded', async () => {
      const dataWithBase64 = {
        ...mockOrderData,
        items: [
          {
            ...mockOrderData.items[0],
            imageUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA==',
          },
        ],
      };

      const template = await service.createOrderTemplate(dataWithBase64, 'en');

      expect(template).toBeDefined();
      // Should not call compression service for already base64 encoded images
      expect(compressionService.optimizeImageForPDF).not.toHaveBeenCalledWith(
        expect.stringMatching(/^data:image/),
        expect.any(String)
      );
    });

    it('should log file size comparison and validation metrics', async () => {
      // Mock console.log to capture log messages
      const logSpy = jest.spyOn(service['logger'], 'log');

      // Create order data with multiple images for better size comparison
      const orderDataWithMultipleImages = {
        ...mockOrderData,
        items: [
          {
            ...mockOrderData.items[0],
            imageUrl: 'test-product-1.jpg',
          },
          {
            id: '2',
            name: 'Test Product 2',
            description: 'Test Description 2',
            sku: 'TEST-SKU-2',
            quantity: 2,
            unitPrice: 200,
            totalPrice: 400,
            imageUrl: 'test-product-2.jpg',
          },
        ],
      };

      // Mock compression service to return different sizes for each image
      compressionService.optimizeImageForPDF = jest.fn()
        .mockResolvedValueOnce({
          optimizedBuffer: Buffer.from('optimized-image-1'),
          originalSize: 2000,
          optimizedSize: 800,
          compressionRatio: 0.6,
          dimensions: {
            original: { width: 800, height: 600 },
            optimized: { width: 300, height: 225 },
          },
          format: 'jpeg',
          processingTime: 100,
          metadata: {
            contentType: 'photo',
            qualityUsed: 55,
            technique: 'comprehensive',
          },
        })
        .mockResolvedValueOnce({
          optimizedBuffer: Buffer.from('optimized-image-2'),
          originalSize: 1500,
          optimizedSize: 600,
          compressionRatio: 0.6,
          dimensions: {
            original: { width: 600, height: 400 },
            optimized: { width: 300, height: 200 },
          },
          format: 'jpeg',
          processingTime: 120,
          metadata: {
            contentType: 'photo',
            qualityUsed: 55,
            technique: 'comprehensive',
          },
        })
        .mockResolvedValueOnce({
          optimizedBuffer: Buffer.from('optimized-logo'),
          originalSize: 800,
          optimizedSize: 300,
          compressionRatio: 0.625,
          dimensions: {
            original: { width: 400, height: 300 },
            optimized: { width: 200, height: 150 },
          },
          format: 'jpeg',
          processingTime: 80,
          metadata: {
            contentType: 'logo',
            qualityUsed: 75,
            technique: 'comprehensive',
          },
        })
        .mockResolvedValueOnce({
          optimizedBuffer: Buffer.from('optimized-qr'),
          originalSize: 500,
          optimizedSize: 200,
          compressionRatio: 0.6,
          dimensions: {
            original: { width: 300, height: 300 },
            optimized: { width: 150, height: 150 },
          },
          format: 'jpeg',
          processingTime: 60,
          metadata: {
            contentType: 'graphics',
            qualityUsed: 65,
            technique: 'comprehensive',
          },
        });

      await service.createOrderTemplate(orderDataWithMultipleImages, 'en');

      // Verify file size comparison logging exists
      const logCalls = logSpy.mock.calls.map(call => call[0]);
      const hasFileSizeComparison = logCalls.some(call =>
        typeof call === 'string' && call.includes('File size comparison results')
      );
      const hasCompressionEffectiveness = logCalls.some(call =>
        typeof call === 'string' && call.includes('Compression Effectiveness')
      );
      const hasFileSizeReduction = logCalls.some(call =>
        typeof call === 'string' && call.includes('Total Size Reduction')
      );

      expect(hasFileSizeComparison).toBe(true);
      expect(hasCompressionEffectiveness).toBe(true);
      expect(hasFileSizeReduction).toBe(true);

      // Verify file size reduction validation
      const hasValidationPassed = logCalls.some(call =>
        typeof call === 'string' && call.includes('File size reduction validation PASSED')
      );
      expect(hasValidationPassed).toBe(true);

      logSpy.mockRestore();
    });

    it('should warn when compression effectiveness is low', async () => {
      const logSpy = jest.spyOn(service['logger'], 'warn');

      // Mock compression service to return minimal compression
      compressionService.optimizeImageForPDF = jest.fn()
        .mockResolvedValue({
          optimizedBuffer: Buffer.from('barely-optimized-image'),
          originalSize: 1000,
          optimizedSize: 950, // Only 5% compression
          compressionRatio: 0.05,
          dimensions: {
            original: { width: 800, height: 600 },
            optimized: { width: 780, height: 585 },
          },
          format: 'jpeg',
          processingTime: 100,
          metadata: {
            contentType: 'photo',
            qualityUsed: 90, // High quality = low compression
            technique: 'minimal',
          },
        });

      await service.createOrderTemplate(mockOrderData, 'en');

      // Verify low compression effectiveness warning exists
      const warnCalls = logSpy.mock.calls.map(call => call[0]);
      const hasLowCompressionWarning = warnCalls.some(call =>
        typeof call === 'string' && call.includes('File size reduction below optimal threshold')
      );
      expect(hasLowCompressionWarning).toBe(true);

      logSpy.mockRestore();
    });

    it('should handle file size comparison when optimization fails', async () => {
      const logSpy = jest.spyOn(service['logger'], 'warn');

      // Mock compression service to fail
      compressionService.optimizeImageForPDF = jest.fn()
        .mockResolvedValue({
          optimizedBuffer: null,
          originalSize: 0,
          optimizedSize: 0,
          compressionRatio: 0,
          error: 'Optimization failed',
          dimensions: {
            original: { width: 0, height: 0 },
            optimized: { width: 0, height: 0 },
          },
          format: 'jpeg',
          processingTime: 0,
        });

      await service.createOrderTemplate(mockOrderData, 'en');

      // Verify warning about missing size data
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unable to calculate file size comparison - missing size data')
      );

      logSpy.mockRestore();
    });
  });

  describe('generateHTML', () => {
    it('should generate HTML with base64 image validation', async () => {
      const template = await service.createOrderTemplate(mockOrderData, 'en');
      const html = service.generateHTML(template);

      expect(html).toBeDefined();
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('</html>');

      // Should contain error handling for images
      expect(html).toContain('onerror="this.style.display=\'none\';"');
      expect(html).toContain('onload="this.style.display=\'block\';"');
    });
  });

  describe('generateHTMLFromOrderData', () => {
    it('should generate HTML directly from order data with optimized images', async () => {
      const html = await service.generateHTMLFromOrderData(mockOrderData, 'en');

      expect(html).toBeDefined();
      expect(html).toContain('Test HTML');

      // Verify that compression service was called for image optimization
      expect(compressionService.optimizeImageForPDF).toHaveBeenCalledWith('test-product.jpg', 'photo');
      expect(compressionService.optimizeImageForPDF).toHaveBeenCalledWith('test-logo.jpg', 'logo');
      expect(compressionService.optimizeImageForPDF).toHaveBeenCalledWith('test-qr.jpg', 'graphics');
    });
  });

  describe('configuration validation', () => {
    it('should load and validate image optimization configuration', async () => {
      const template = await service.createOrderTemplate(mockOrderData, 'en');

      expect(template).toBeDefined();

      // Verify that configuration was loaded from compression service
      expect(compressionService['configService'].getConfiguration).toHaveBeenCalled();

      // Verify that content type settings were retrieved for each image type
      expect(compressionService['configService'].getContentTypeSettings).toHaveBeenCalledWith('photo');
      expect(compressionService['configService'].getContentTypeSettings).toHaveBeenCalledWith('logo');
      expect(compressionService['configService'].getContentTypeSettings).toHaveBeenCalledWith('graphics');
    });

    it('should warn when aggressive mode is disabled', async () => {
      // Mock configuration with aggressive mode disabled
      compressionService['configService'].getConfiguration.mockReturnValueOnce({
        aggressiveMode: {
          enabled: false,
          maxDimensions: { width: 300, height: 300 },
          minDimensions: { width: 50, height: 50 },
          forceOptimization: false,
        },
        compression: {
          enabled: true,
          level: 'medium',
          enableFormatConversion: true,
          preferredFormat: 'jpeg',
        },
        contentAware: {
          enabled: true,
          contentTypes: {
            text: { quality: 70, preserveSharpness: true },
            photo: { quality: 55, allowAggressive: true },
            graphics: { quality: 65, preserveColors: true },
            logo: { quality: 75, maintainCrisp: true },
          },
        },
        fallback: {
          enabled: true,
          maxRetries: 3,
          timeoutMs: 10000,
        },
        monitoring: {
          enabled: true,
          trackProcessingTime: true,
          trackCompressionRatio: true,
          trackSizeReduction: true,
        },
      });

      const loggerSpy = jest.spyOn(service['logger'], 'warn');

      await service.createOrderTemplate(mockOrderData, 'en');

      // Should warn about aggressive mode being disabled
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('WARNING: Aggressive mode is DISABLED')
      );
    });

    it('should warn when max dimensions are larger than recommended', async () => {
      // Mock configuration with large max dimensions
      compressionService['configService'].getConfiguration.mockReturnValueOnce({
        aggressiveMode: {
          enabled: true,
          maxDimensions: { width: 1000, height: 1000 }, // Larger than recommended 300x300
          minDimensions: { width: 50, height: 50 },
          forceOptimization: true,
        },
        compression: {
          enabled: true,
          level: 'maximum',
          enableFormatConversion: true,
          preferredFormat: 'jpeg',
        },
        contentAware: {
          enabled: true,
          contentTypes: {
            text: { quality: 70, preserveSharpness: true },
            photo: { quality: 55, allowAggressive: true },
            graphics: { quality: 65, preserveColors: true },
            logo: { quality: 75, maintainCrisp: true },
          },
        },
        fallback: {
          enabled: true,
          maxRetries: 3,
          timeoutMs: 10000,
        },
        monitoring: {
          enabled: true,
          trackProcessingTime: true,
          trackCompressionRatio: true,
          trackSizeReduction: true,
        },
      });

      const loggerSpy = jest.spyOn(service['logger'], 'warn');

      await service.createOrderTemplate(mockOrderData, 'en');

      // Should warn about large max dimensions
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('WARNING: Max dimensions (1000x1000) are larger than recommended')
      );
    });

    it('should warn when compression level is not maximum', async () => {
      // Mock configuration with non-maximum compression level
      compressionService['configService'].getConfiguration.mockReturnValueOnce({
        aggressiveMode: {
          enabled: true,
          maxDimensions: { width: 300, height: 300 },
          minDimensions: { width: 50, height: 50 },
          forceOptimization: true,
        },
        compression: {
          enabled: true,
          level: 'medium', // Not maximum
          enableFormatConversion: true,
          preferredFormat: 'jpeg',
        },
        contentAware: {
          enabled: true,
          contentTypes: {
            text: { quality: 70, preserveSharpness: true },
            photo: { quality: 55, allowAggressive: true },
            graphics: { quality: 65, preserveColors: true },
            logo: { quality: 75, maintainCrisp: true },
          },
        },
        fallback: {
          enabled: true,
          maxRetries: 3,
          timeoutMs: 10000,
        },
        monitoring: {
          enabled: true,
          trackProcessingTime: true,
          trackCompressionRatio: true,
          trackSizeReduction: true,
        },
      });

      const loggerSpy = jest.spyOn(service['logger'], 'warn');

      await service.createOrderTemplate(mockOrderData, 'en');

      // Should warn about compression level not being maximum
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining("WARNING: Compression level is 'medium' instead of 'maximum'")
      );
    });

    it('should validate configuration compliance after processing', async () => {
      const loggerSpy = jest.spyOn(service['logger'], 'log');

      await service.createOrderTemplate(mockOrderData, 'en');

      // Should log configuration validation success
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('✓ Configuration validation PASSED: All images processed with aggressive optimization')
      );

      // Should log configuration compliance check completion
      expect(loggerSpy).toHaveBeenCalledWith('Configuration compliance check completed');
    });
  });

  describe('validateTemplate', () => {
    it('should validate template structure', async () => {
      const template = await service.createOrderTemplate(mockOrderData, 'en');
      const validation = service.validateTemplate(template);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing template components', () => {
      const incompleteTemplate = {
        header: null,
        content: [],
        footer: null,
        styling: null,
        metadata: null,
      } as any;

      const validation = service.validateTemplate(incompleteTemplate);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });
});