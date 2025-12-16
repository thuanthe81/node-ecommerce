/**
 * Integration test for PDF Generator Service with Compressed Image Storage
 * Tests that storage metrics are properly included in PDF generation results
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PDFGeneratorService } from '../pdf-generator.service';
import { PDFCompressionService } from './pdf-compression.service';
import { PDFTemplateEngine } from '../pdf-template.engine';
import { PDFLocalizationService } from './pdf-localization.service';
import { PDFAccessibilityService } from './pdf-accessibility.service';
import { PDFDeviceOptimizationService } from './pdf-device-optimization.service';
import { PDFErrorHandlerService } from './pdf-error-handler.service';
import { PDFMonitoringService } from './pdf-monitoring.service';
import { PDFAuditService } from './pdf-audit.service';
import { PDFImageConverterService } from './pdf-image-converter.service';
import { PaymentSettingsService } from '../../payment-settings/payment-settings.service';
import { OrderPDFData } from '../types/pdf.types';

describe('PDFGeneratorService - Storage Integration', () => {
  let service: PDFGeneratorService;
  let compressionService: PDFCompressionService;

  const mockOrderData: OrderPDFData = {
    orderNumber: 'TEST-001',
    orderDate: '2024-01-01',
    customerInfo: {
      name: 'Test Customer',
      email: 'test@example.com',
    },
    billingAddress: {
      fullName: 'Test Customer',
      addressLine1: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      postalCode: '12345',
      country: 'Test Country',
    },
    shippingAddress: {
      fullName: 'Test Customer',
      addressLine1: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      postalCode: '12345',
      country: 'Test Country',
    },
    items: [
      {
        id: '1',
        name: 'Test Product',
        quantity: 1,
        unitPrice: 100,
        totalPrice: 100,
        imageUrl: '/uploads/test-image.jpg',
      },
    ],
    pricing: {
      subtotal: 100,
      shippingCost: 10,
      total: 110,
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
      companyName: 'Test Company',
      contactEmail: 'contact@test.com',
      address: {
        fullName: 'Test Company',
        addressLine1: '456 Business St',
        city: 'Business City',
        state: 'Business State',
        postalCode: '67890',
        country: 'Business Country',
      },
    },
    locale: 'en',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PDFGeneratorService,
        {
          provide: PDFTemplateEngine,
          useValue: {
            generateHTMLFromOrderData: jest.fn().mockResolvedValue('<html>Test HTML</html>'),
          },
        },
        {
          provide: PDFLocalizationService,
          useValue: {
            generateBankTransferInstructions: jest.fn().mockReturnValue('Test instructions'),
          },
        },
        {
          provide: PDFAccessibilityService,
          useValue: {
            enhanceHTMLAccessibility: jest.fn().mockImplementation((html) => html),
            enhanceImageAltText: jest.fn().mockImplementation((html) => html),
            generateAccessibilityMetadata: jest.fn().mockReturnValue({}),
          },
        },
        {
          provide: PDFDeviceOptimizationService,
          useValue: {
            addNavigationAnchors: jest.fn().mockImplementation((html) => html),
            getDeviceOptimizedPDFOptions: jest.fn().mockReturnValue({
              format: 'A4',
              printBackground: true,
            }),
          },
        },
        {
          provide: PDFCompressionService,
          useValue: {
            optimizeOrderDataForPDF: jest.fn().mockResolvedValue({
              optimizedData: mockOrderData,
              optimizations: ['Test optimization'],
              sizeSavings: 1024,
            }),
            getCompressedImageStorageMetrics: jest.fn().mockResolvedValue({
              totalStorageSize: 5120,
              totalCompressedImages: 3,
              reuseRate: 0.75,
              averageCompressionRatio: 0.6,
              storageUtilization: 0.25,
            }),
            getCompressionOptimizedPDFOptions: jest.fn().mockReturnValue({
              format: 'A4',
              printBackground: true,
            }),
            validatePDFSize: jest.fn().mockReturnValue({
              isValid: true,
              warnings: [],
            }),
            generateAlternativeDeliveryMethods: jest.fn().mockReturnValue({
              methods: [],
            }),
          },
        },
        {
          provide: PDFErrorHandlerService,
          useValue: {
            handlePDFGenerationError: jest.fn(),
          },
        },
        {
          provide: PDFMonitoringService,
          useValue: {
            recordPerformanceMetric: jest.fn(),
          },
        },
        {
          provide: PDFAuditService,
          useValue: {
            logPDFGeneration: jest.fn().mockResolvedValue('audit-id'),
          },
        },
        {
          provide: PDFImageConverterService,
          useValue: {},
        },
        {
          provide: PaymentSettingsService,
          useValue: {
            getBankTransferSettings: jest.fn().mockResolvedValue({
              accountName: 'Test Account',
              accountNumber: '123456789',
              bankName: 'Test Bank',
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PDFGeneratorService>(PDFGeneratorService);
    compressionService = module.get<PDFCompressionService>(PDFCompressionService);
  });

  it('should include storage metrics in PDF generation metadata', async () => {
    // Mock Puppeteer to avoid actual PDF generation
    const mockPDF = jest.fn().mockResolvedValue(Buffer.from('mock pdf content'));
    const mockPage = {
      setViewport: jest.fn(),
      setContent: jest.fn(),
      pdf: mockPDF,
      close: jest.fn(),
    };
    const mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
    };

    // Mock the browser initialization
    jest.spyOn(service as any, 'initializeBrowser').mockResolvedValue(mockBrowser);

    const result = await service.generateOrderPDF(mockOrderData, 'en');

    expect(result.success).toBe(true);
    expect(result.metadata).toBeDefined();
    expect(result.metadata.storageMetrics).toBeDefined();
    expect(result.metadata.optimizationMetrics).toBeDefined();

    // Verify storage metrics structure
    const storageMetrics = result.metadata.storageMetrics!;
    expect(storageMetrics.reusedImages).toBe(3);
    expect(storageMetrics.newlyOptimizedImages).toBe(1);
    expect(storageMetrics.cacheHitRate).toBe(0.75);
    expect(storageMetrics.totalStorageSize).toBe(5120);
    expect(storageMetrics.storageUtilization).toBe(0.25);

    // Verify optimization metrics structure
    const optimizationMetrics = result.metadata.optimizationMetrics!;
    expect(optimizationMetrics.optimizedImages).toBe(1);
    expect(optimizationMetrics.processingTime).toBeGreaterThanOrEqual(0);

    // Verify that compression service methods were called
    expect(compressionService.optimizeOrderDataForPDF).toHaveBeenCalledWith(mockOrderData);
    expect(compressionService.getCompressedImageStorageMetrics).toHaveBeenCalled();
  });

  it('should include storage metrics in all PDF generation methods', async () => {
    // Mock Puppeteer to avoid actual PDF generation
    const mockPDF = jest.fn().mockResolvedValue(Buffer.from('mock pdf content'));
    const mockPage = {
      setViewport: jest.fn(),
      setContent: jest.fn(),
      pdf: mockPDF,
      close: jest.fn(),
    };
    const mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
    };

    // Mock the browser initialization
    jest.spyOn(service as any, 'initializeBrowser').mockResolvedValue(mockBrowser);

    // Test generateInvoicePDF
    const invoiceResult = await service.generateInvoicePDF(mockOrderData, 'en');
    expect(invoiceResult.success).toBe(true);
    expect(invoiceResult.metadata.storageMetrics).toBeDefined();
    expect(invoiceResult.metadata.optimizationMetrics).toBeDefined();

    // Test generateCompressedPDF
    const compressedResult = await service.generateCompressedPDF(mockOrderData, 'en', 'high');
    expect(compressedResult.success).toBe(true);
    expect(compressedResult.metadata.storageMetrics).toBeDefined();
    expect(compressedResult.metadata.optimizationMetrics).toBeDefined();

    // Test generateDeviceOptimizedPDF
    jest.spyOn(service as any, 'getDeviceViewport').mockReturnValue({ width: 800, height: 600 });

    const deviceResult = await service.generateDeviceOptimizedPDF(mockOrderData, 'en', 'desktop');
    expect(deviceResult.success).toBe(true);
    expect(deviceResult.metadata.storageMetrics).toBeDefined();
    expect(deviceResult.metadata.optimizationMetrics).toBeDefined();
  });
});