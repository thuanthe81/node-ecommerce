import { Test, TestingModule } from '@nestjs/testing';
import { PDFTemplateEngine } from './pdf-template.engine';
import { PDFDocumentStructureService } from './pdf-document-structure.service';
import { PDFLocalizationService } from './services/pdf-localization.service';
import { PDFAccessibilityService } from './services/pdf-accessibility.service';
import { PDFDeviceOptimizationService } from './services/pdf-device-optimization.service';
import { PDFImageConverterService } from './services/pdf-image-converter.service';
import { PDFCompressionService } from './services/pdf-compression.service';
import { OrderPDFData } from './types/pdf.types';

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