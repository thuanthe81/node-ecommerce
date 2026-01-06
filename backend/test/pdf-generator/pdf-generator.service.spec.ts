import { Test, TestingModule } from '@nestjs/testing';
import { PDFGeneratorService } from '../../src/pdf-generator/pdf-generator.service';
import { PDFTemplateEngine } from '../../src/pdf-generator/pdf-template.engine';
import { PDFDocumentStructureService } from '../../src/pdf-generator/pdf-document-structure.service';
import { PaymentSettingsService } from '../../src/payment-settings/payment-settings.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { PDFLocalizationService } from '../../src/pdf-generator/services/pdf-localization.service';
import { PDFAccessibilityService } from '../../src/pdf-generator/services/pdf-accessibility.service';
import { PDFDeviceOptimizationService } from '../../src/pdf-generator/services/pdf-device-optimization.service';
import { PDFCompressionService } from '../../src/pdf-generator/services/pdf-compression.service';
import { PDFErrorHandlerService } from '../../src/pdf-generator/services/pdf-error-handler.service';
import { PDFMonitoringService } from '../../src/pdf-generator/services/pdf-monitoring.service';
import { PDFAuditService } from '../../src/pdf-generator/services/pdf-audit.service';
import { PDFImageConverterService } from '../../src/pdf-generator/services/pdf-image-converter.service';
import { PDFImageOptimizationMetricsService } from '../../src/pdf-generator/services/pdf-image-optimization-metrics.service';
import { PDFTemplateLoaderService } from '../../src/pdf-generator/services/pdf-template-loader.service';
import { TemplateVariableProcessorService } from '../../src/pdf-generator/services/template-variable-processor.service';
import { OrderPDFData } from '../../src/pdf-generator/types/pdf.types';
import { ShippingService } from '../../src/shipping/shipping.service';

describe('PDFGeneratorService', () => {
  let service: PDFGeneratorService;
  let templateEngine: PDFTemplateEngine;
  let paymentSettingsService: PaymentSettingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PDFGeneratorService,
        PDFTemplateEngine,
        PDFDocumentStructureService,
        {
          provide: PDFLocalizationService,
          useValue: {
            getLocalizedText: jest.fn().mockReturnValue('Localized Text'),
            formatCurrency: jest.fn().mockReturnValue('10 ₫'),
            formatDate: jest.fn().mockReturnValue('Dec 15, 2023'),
            translate: jest.fn().mockReturnValue('Translated Text'),
            formatAddress: jest.fn().mockReturnValue('123 Main St\nAnytown, CA 12345\nUSA'),
            formatPhoneNumber: jest.fn().mockReturnValue('+1234567890'),
            getPaymentStatusText: jest.fn().mockReturnValue('Pending'),
            generateBankTransferInstructions: jest.fn().mockReturnValue('Please transfer to account...'),
          },
        },
        {
          provide: PDFAccessibilityService,
          useValue: {
            addAccessibilityFeatures: jest.fn().mockReturnValue('<html>Accessible HTML</html>'),
            enhanceHTMLAccessibility: jest.fn().mockReturnValue('<html>Enhanced Accessible HTML</html>'),
            enhanceImageAltText: jest.fn().mockReturnValue('<html>Enhanced Image Alt Text</html>'),
            generateAccessibilityMetadata: jest.fn().mockReturnValue({ title: 'Test PDF', author: 'Test' }),
            generateAccessibilityCSS: jest.fn().mockReturnValue('/* accessibility css */'),
          },
        },
        {
          provide: PDFDeviceOptimizationService,
          useValue: {
            optimizeForDevice: jest.fn().mockReturnValue('<html>Optimized HTML</html>'),
            addNavigationAnchors: jest.fn().mockReturnValue('<html>Navigation HTML</html>'),
            generateCompleteDeviceCSS: jest.fn().mockReturnValue('/* device css */'),
            getDeviceOptimizedPDFOptions: jest.fn().mockReturnValue({
              format: 'A4',
              printBackground: true,
              margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
            }),
          },
        },
        {
          provide: PDFCompressionService,
          useValue: {
            compressPDF: jest.fn().mockResolvedValue(Buffer.from('compressed pdf')),
            optimizeOrderDataForPDF: jest.fn().mockResolvedValue({
              optimizedData: {},
              optimizations: [],
              sizeSavings: 0,
            }),
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
            getCompressionOptimizedPDFOptions: jest.fn().mockReturnValue({
              format: 'A4',
              printBackground: true,
              margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
            }),
            validatePDFSize: jest.fn().mockReturnValue({ isValid: true, warnings: [] }),
            generateAlternativeDeliveryMethods: jest.fn().mockReturnValue({ methods: [] }),
          },
        },
        {
          provide: PDFErrorHandlerService,
          useValue: {
            handleError: jest.fn(),
            logError: jest.fn(),
            handlePDFGenerationError: jest.fn().mockResolvedValue({ handled: true }),
          },
        },
        {
          provide: PDFMonitoringService,
          useValue: {
            recordGenerationTime: jest.fn(),
            recordFileSize: jest.fn(),
            recordPerformanceMetric: jest.fn(),
          },
        },
        {
          provide: PDFAuditService,
          useValue: {
            logPDFGeneration: jest.fn(),
          },
        },
        {
          provide: PDFImageConverterService,
          useValue: {
            convertImageToBase64: jest.fn().mockResolvedValue('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD'),
            convertMultipleImages: jest.fn().mockResolvedValue(new Map([
              ['test-image.jpg', 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD']
            ])),
            clearCache: jest.fn(),
            getCacheStats: jest.fn().mockReturnValue({ size: 0, maxSize: 100 }),
            preloadImages: jest.fn().mockResolvedValue(undefined),
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
        {
          provide: PDFTemplateLoaderService,
          useValue: {
            loadTemplate: jest.fn().mockResolvedValue('<html>{{orderNumber}}</html>'),
            loadStylesheet: jest.fn().mockResolvedValue('/* CSS styles */'),
          },
        },
        {
          provide: TemplateVariableProcessorService,
          useValue: {
            processVariables: jest.fn().mockReturnValue('<html>ORDER CONFIRMATION ORD-123 John Doe Test Product 30 ₫</html>'),
            processPartials: jest.fn().mockImplementation((template, partials) => template),
          },
        },
        {
          provide: PaymentSettingsService,
          useValue: {
            getBankTransferSettings: jest.fn().mockResolvedValue({
              accountName: 'Test Account',
              accountNumber: '1234567890',
              bankName: 'Test Bank',
              qrCodeUrl: '/uploads/payment-qr/test-qr.png',
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            // Mock PrismaService methods if needed
          },
        },
        {
          provide: ShippingService,
          useValue: {
            calculateShipping: jest.fn().mockResolvedValue([
              {
                method: 'standard',
                name: 'Standard Shipping',
                description: 'Delivery in 3-5 days',
                cost: 5.0,
                estimatedDays: '3-5 days',
                carrier: 'Test Carrier',
                isFreeShipping: false,
              },
            ]),
            getShippingMethodDetails: jest.fn().mockResolvedValue({
              method: 'standard',
              name: 'Standard Shipping',
              description: 'Delivery in 3-5 days',
              cost: 5.0,
              estimatedDays: '3-5 days',
              carrier: 'Test Carrier',
              isFreeShipping: false,
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PDFGeneratorService>(PDFGeneratorService);
    templateEngine = module.get<PDFTemplateEngine>(PDFTemplateEngine);
    paymentSettingsService = module.get<PaymentSettingsService>(PaymentSettingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should validate order data correctly', () => {
    const validOrderData: OrderPDFData = {
      orderNumber: 'ORD-123',
      orderDate: '2023-12-15',
      customerInfo: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      },
      billingAddress: {
        fullName: 'John Doe',
        addressLine1: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        postalCode: '12345',
        country: 'USA',
      },
      shippingAddress: {
        fullName: 'John Doe',
        addressLine1: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        postalCode: '12345',
        country: 'USA',
      },
      items: [
        {
          id: '1',
          name: 'Test Product',
          quantity: 2,
          unitPrice: 25.00,
          totalPrice: 50.00,
        },
      ],
      pricing: {
        subtotal: 50.00,
        shippingCost: 10.00,
        total: 60.00,
      },
      paymentMethod: {
        type: 'bank_transfer',
        displayName: 'Bank Transfer',
        status: 'pending',
      },
      shippingMethod: {
        name: 'Standard Shipping',
      },
      businessInfo: {
        companyName: 'AlaCraft',
        contactEmail: 'info@alacraft.com',
        address: {
          fullName: 'AlaCraft',
          addressLine1: '456 Business Ave',
          city: 'Business City',
          state: 'BC',
          postalCode: '67890',
          country: 'USA',
        },
      },
      locale: 'en',
    };

    const result = service.validateOrderData(validOrderData);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should return validation errors for invalid order data', () => {
    const invalidOrderData = {} as OrderPDFData;

    const result = service.validateOrderData(invalidOrderData);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors).toContain('Order number is required');
  });

  it('should generate HTML content from order data', async () => {
    const orderData: OrderPDFData = {
      orderNumber: 'ORD-123',
      orderDate: '2023-12-15',
      customerInfo: {
        name: 'John Doe',
        email: 'john@example.com',
      },
      billingAddress: {
        fullName: 'John Doe',
        addressLine1: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        postalCode: '12345',
        country: 'USA',
      },
      shippingAddress: {
        fullName: 'John Doe',
        addressLine1: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        postalCode: '12345',
        country: 'USA',
      },
      items: [
        {
          id: '1',
          name: 'Test Product',
          quantity: 1,
          unitPrice: 25.00,
          totalPrice: 25.00,
        },
      ],
      pricing: {
        subtotal: 25.00,
        shippingCost: 5.00,
        total: 30.00,
      },
      paymentMethod: {
        type: 'bank_transfer',
        displayName: 'Bank Transfer',
        status: 'pending',
      },
      shippingMethod: {
        name: 'Standard Shipping',
      },
      businessInfo: {
        companyName: 'AlaCraft',
        contactEmail: 'info@alacraft.com',
        address: {
          fullName: 'AlaCraft',
          addressLine1: '456 Business Ave',
          city: 'Business City',
          state: 'BC',
          postalCode: '67890',
          country: 'USA',
        },
      },
      locale: 'en',
    };

    const htmlContent = await templateEngine.generateHTMLFromOrderData(orderData, 'en');

    expect(htmlContent).toContain('ORDER CONFIRMATION');
    expect(htmlContent).toContain('ORD-123');
    expect(htmlContent).toContain('John Doe');
    expect(htmlContent).toContain('Test Product');
    expect(htmlContent).toContain('30 ₫');
  });
});