/**
 * Memory Leak Exploration Tests
 *
 * EXPLORATORY — expected to FAIL on unfixed code. Failure confirms the bug.
 *
 * Run with:
 *   cd backend && npx jest memory-leak-exploration.spec.ts --no-coverage --testTimeout=30000
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

import { PDFGeneratorService } from 'src/pdf-generator/pdf-generator.service';
import { PDFTemplateEngine } from 'src/pdf-generator/pdf-template.engine';
import { PDFLocalizationService } from 'src/pdf-generator/services/pdf-localization.service';
import { PDFAccessibilityService } from 'src/pdf-generator/services/pdf-accessibility.service';
import { PDFDeviceOptimizationService } from 'src/pdf-generator/services/pdf-device-optimization.service';
import { PDFCompressionService } from 'src/pdf-generator/services/pdf-compression.service';
import { PDFErrorHandlerService } from 'src/pdf-generator/services/pdf-error-handler.service';
import { PDFMonitoringService } from 'src/pdf-generator/services/pdf-monitoring.service';
import { PDFAuditService } from 'src/pdf-generator/services/pdf-audit.service';
import { PDFImageConverterService } from 'src/pdf-generator/services/pdf-image-converter.service';
import { PaymentSettingsService } from 'src/payment-settings/payment-settings.service';

import { RefreshTokenStore } from 'src/auth/entities/refresh-token.entity';
import { EnhancedRateLimitMiddleware } from 'src/common/middleware/enhanced-rate-limit.middleware';
import { EnhancedRateLimitGuard } from 'src/common/guards/enhanced-rate-limit.guard';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeConfigService(overrides: Record<string, string> = {}): ConfigService {
  return {
    get: (key: string, defaultValue?: string) => overrides[key] ?? defaultValue,
  } as unknown as ConfigService;
}

function makeReflector(): Reflector {
  return { get: () => undefined } as unknown as Reflector;
}

// ---------------------------------------------------------------------------
// Shared minimal OrderPDFData fixture
// ---------------------------------------------------------------------------

const minimalOrderData = {
  orderNumber: 'TEST-001',
  orderDate: new Date(),
  locale: 'en' as const,
  customerInfo: { name: 'Test User', email: 'test@example.com', phone: '0000000000' },
  items: [
    { id: '1', name: 'Widget', quantity: 1, unitPrice: 10, totalPrice: 10, sku: 'SKU-1', imageUrl: '' },
  ],
  pricing: { subtotal: 10, shipping: 0, tax: 0, discount: 0, total: 10, currency: 'USD' },
  shippingAddress: { name: 'Test User', street: '1 Main St', city: 'City', state: 'ST', postalCode: '00000', country: 'US' },
  billingAddress:  { name: 'Test User', street: '1 Main St', city: 'City', state: 'ST', postalCode: '00000', country: 'US' },
  paymentMethod: { type: 'credit_card' as const, details: 'Visa ending 1234' },
  status: 'confirmed' as const,
};

// ---------------------------------------------------------------------------
// Bug Condition 1 — PDF page never closed
// ---------------------------------------------------------------------------

describe('Bug Condition 1 — PDF page never closed', () => {
  let service: PDFGeneratorService;
  let fakePage: {
    close: jest.Mock;
    setViewport: jest.Mock;
    setContent: jest.Mock;
    pdf: jest.Mock;
    on: jest.Mock;
    isClosed: jest.Mock;
    setDefaultTimeout: jest.Mock;
    setDefaultNavigationTimeout: jest.Mock;
  };

  beforeEach(async () => {
    fakePage = {
      close: jest.fn().mockResolvedValue(undefined),
      setViewport: jest.fn().mockResolvedValue(undefined),
      setContent: jest.fn().mockResolvedValue(undefined),
      pdf: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4 fake')),
      on: jest.fn(),
      isClosed: jest.fn().mockReturnValue(false),
      setDefaultTimeout: jest.fn(),
      setDefaultNavigationTimeout: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PDFGeneratorService,
        { provide: PDFTemplateEngine,
          useValue: { generateHTMLFromOrderData: jest.fn().mockResolvedValue('<html></html>'), setTemplateMode: jest.fn() } },
        { provide: PDFLocalizationService,
          useValue: { generateBankTransferInstructions: jest.fn().mockReturnValue('') } },
        { provide: PDFAccessibilityService,
          useValue: {
            enhanceHTMLAccessibility: jest.fn().mockImplementation((h: string) => h),
            enhanceImageAltText: jest.fn().mockImplementation((h: string) => h),
            generateAccessibilityMetadata: jest.fn().mockReturnValue({}),
          } },
        { provide: PDFDeviceOptimizationService,
          useValue: { addNavigationAnchors: jest.fn().mockImplementation((h: string) => h) } },
        { provide: PDFCompressionService,
          useValue: {
            optimizeOrderDataForPDF: jest.fn().mockResolvedValue({ optimizedData: minimalOrderData, optimizations: [], sizeSavings: 0 }),
            getCompressionOptimizedPDFOptions: jest.fn().mockReturnValue({}),
            validatePDFSize: jest.fn().mockReturnValue({ isValid: true, warnings: [] }),
            generateAlternativeDeliveryMethods: jest.fn().mockReturnValue({ methods: [] }),
          } },
        { provide: PDFErrorHandlerService,
          useValue: { handlePDFGenerationError: jest.fn().mockResolvedValue({ error: 'mocked error' }) } },
        { provide: PDFMonitoringService,
          useValue: { recordPerformanceMetric: jest.fn() } },
        { provide: PDFAuditService,
          useValue: { logPDFGeneration: jest.fn().mockResolvedValue(undefined) } },
        { provide: PDFImageConverterService, useValue: {} },
        { provide: PaymentSettingsService,
          useValue: { getBankTransferSettings: jest.fn().mockResolvedValue({ accountName: '', accountNumber: '', bankName: '', qrCodeUrl: '' }) } },
      ],
    }).compile();

    service = module.get<PDFGeneratorService>(PDFGeneratorService);
    jest.spyOn(service as any, 'createPageWithRetry').mockResolvedValue(fakePage);
    jest.spyOn(service as any, 'closeBrowser').mockResolvedValue(undefined);
    jest.spyOn(require('fs'), 'existsSync').mockReturnValue(true);
    jest.spyOn(require('fs'), 'mkdirSync').mockReturnValue(undefined);
    jest.spyOn(require('fs'), 'writeFileSync').mockReturnValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Task 1.1 — PDF page not closed on success path
   *
   * EXPECTED TO FAIL on unfixed code.
   * Counterexample: expect(jest.fn()).toHaveBeenCalledTimes(1) → Expected: 1, Received: 0
   */
  it('1.1 page.close() should be called on the success path', async () => {
    await service.generateOrderPDF(minimalOrderData, 'en');
    // FAILS on unfixed code: page.close() is never called
    expect(fakePage.close).toHaveBeenCalledTimes(1);
  });

  /**
   * Task 1.2 — PDF page not closed on error path
   *
   * EXPECTED TO FAIL on unfixed code.
   * Counterexample: expect(jest.fn()).toHaveBeenCalledTimes(1) → Expected: 1, Received: 0
   */
  it('1.2 page.close() should be called even when generation throws an error', async () => {
    (fakePage.setContent as jest.Mock).mockRejectedValue(new Error('Simulated render failure'));
    await service.generateOrderPDF(minimalOrderData, 'en');
    // FAILS on unfixed code: no finally block exists
    expect(fakePage.close).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Bug Condition 2 — RefreshTokenStore grows without cleanup
// ---------------------------------------------------------------------------

describe('Bug Condition 2 — RefreshTokenStore grows without cleanup', () => {
  beforeEach(() => { RefreshTokenStore.clear(); });
  afterEach(() => { RefreshTokenStore.clear(); });

  /**
   * Task 1.3 — RefreshTokenStore grows without cleanup
   *
   * EXPECTED TO FAIL on unfixed code.
   * Counterexample: expect(received).toBe(expected) → Expected: 0, Received: 100
   */
  it('1.3 RefreshTokenStore should be empty after all tokens expire (requires scheduled cleanup)', () => {
    const TOKEN_COUNT = 100;
    const pastDate = new Date(Date.now() - 1000); // already expired

    for (let i = 0; i < TOKEN_COUNT; i++) {
      RefreshTokenStore.save({
        id: `id-${i}`,
        userId: `user-${i}`,
        token: `token-${i}`,
        expiresAt: pastDate,
        createdAt: new Date(),
      });
    }

    // Confirm all tokens were stored
    expect((RefreshTokenStore as any).tokens.size).toBe(TOKEN_COUNT);

    // We do NOT call RefreshTokenStore.cleanup() manually here.
    // On fixed code a scheduled cleanup would have run automatically.
    // FAILS on unfixed code: no automatic cleanup is wired up, size stays at 100.
    expect((RefreshTokenStore as any).tokens.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Bug Condition 3 — setInterval handles never stored or cleared
// ---------------------------------------------------------------------------

describe('Bug Condition 3 — setInterval handles never stored or cleared', () => {
  /**
   * Task 1.4 — EnhancedRateLimitMiddleware has no onModuleDestroy
   *
   * EXPECTED TO FAIL on unfixed code.
   * Counterexample: expect(received).toBeDefined() → Received: undefined
   */
  it('1.4 EnhancedRateLimitMiddleware should have an onModuleDestroy method', () => {
    const middleware = new EnhancedRateLimitMiddleware(makeConfigService());
    // FAILS on unfixed code: onModuleDestroy does not exist
    expect((middleware as any).onModuleDestroy).toBeDefined();
    expect(typeof (middleware as any).onModuleDestroy).toBe('function');
  });

  /**
   * Task 1.5 — EnhancedRateLimitGuard has no onModuleDestroy
   *
   * EXPECTED TO FAIL on unfixed code.
   * Counterexample: expect(received).toBeDefined() → Received: undefined
   */
  it('1.5 EnhancedRateLimitGuard should have an onModuleDestroy method', () => {
    const guard = new EnhancedRateLimitGuard(makeReflector(), makeConfigService());
    // FAILS on unfixed code: onModuleDestroy does not exist
    expect((guard as any).onModuleDestroy).toBeDefined();
    expect(typeof (guard as any).onModuleDestroy).toBe('function');
  });

  afterAll(() => {
    // Open handles from setInterval in constructors above are intentional —
    // they are the bug being confirmed.
  });
});
