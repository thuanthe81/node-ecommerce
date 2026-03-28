/**
 * Memory Leak Fix Verification Tests
 *
 * Task 6: Fix-checking tests — verify the fixed code correctly releases resources.
 * Task 7: Preservation-checking tests — verify existing behavior is unchanged.
 *
 * All tests in this file SHOULD PASS on the fixed code.
 *
 * Run with:
 *   cd backend && npx jest src/test/memory-leak-fix-verification.spec.ts --no-coverage --testTimeout=30000
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import * as path from 'path';

import { PDFGeneratorService } from '../pdf-generator/pdf-generator.service';
import { PDFTemplateEngine } from '../pdf-generator/pdf-template.engine';
import { PDFLocalizationService } from '../pdf-generator/services/pdf-localization.service';
import { PDFAccessibilityService } from '../pdf-generator/services/pdf-accessibility.service';
import { PDFDeviceOptimizationService } from '../pdf-generator/services/pdf-device-optimization.service';
import { PDFCompressionService } from '../pdf-generator/services/pdf-compression.service';
import { PDFErrorHandlerService } from '../pdf-generator/services/pdf-error-handler.service';
import { PDFMonitoringService } from '../pdf-generator/services/pdf-monitoring.service';
import { PDFAuditService } from '../pdf-generator/services/pdf-audit.service';
import { PDFImageConverterService } from '../pdf-generator/services/pdf-image-converter.service';
import { PaymentSettingsService } from '../payment-settings/payment-settings.service';

import { RefreshTokenStore } from '../auth/entities/refresh-token.entity';
import { EnhancedRateLimitMiddleware } from '../common/middleware/enhanced-rate-limit.middleware';
import { EnhancedRateLimitGuard } from '../common/guards/enhanced-rate-limit.guard';

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
// Shared PDF service factory
// ---------------------------------------------------------------------------

async function buildPDFService(fakePage: object): Promise<PDFGeneratorService> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      PDFGeneratorService,
      {
        provide: PDFTemplateEngine,
        useValue: {
          generateHTMLFromOrderData: jest.fn().mockResolvedValue('<html></html>'),
          setTemplateMode: jest.fn(),
        },
      },
      {
        provide: PDFLocalizationService,
        useValue: { generateBankTransferInstructions: jest.fn().mockReturnValue('') },
      },
      {
        provide: PDFAccessibilityService,
        useValue: {
          enhanceHTMLAccessibility: jest.fn().mockImplementation((h: string) => h),
          enhanceImageAltText: jest.fn().mockImplementation((h: string) => h),
          generateAccessibilityMetadata: jest.fn().mockReturnValue({}),
        },
      },
      {
        provide: PDFDeviceOptimizationService,
        useValue: { addNavigationAnchors: jest.fn().mockImplementation((h: string) => h) },
      },
      {
        provide: PDFCompressionService,
        useValue: {
          optimizeOrderDataForPDF: jest.fn().mockResolvedValue({
            optimizedData: minimalOrderData,
            optimizations: [],
            sizeSavings: 0,
          }),
          getCompressionOptimizedPDFOptions: jest.fn().mockReturnValue({}),
          validatePDFSize: jest.fn().mockReturnValue({ isValid: true, warnings: [] }),
          generateAlternativeDeliveryMethods: jest.fn().mockReturnValue({ methods: [] }),
        },
      },
      {
        provide: PDFErrorHandlerService,
        useValue: { handlePDFGenerationError: jest.fn().mockResolvedValue({ error: 'mocked error' }) },
      },
      {
        provide: PDFMonitoringService,
        useValue: { recordPerformanceMetric: jest.fn() },
      },
      {
        provide: PDFAuditService,
        useValue: { logPDFGeneration: jest.fn().mockResolvedValue(undefined) },
      },
      { provide: PDFImageConverterService, useValue: {} },
      {
        provide: PaymentSettingsService,
        useValue: {
          getBankTransferSettings: jest.fn().mockResolvedValue({
            accountName: '',
            accountNumber: '',
            bankName: '',
            qrCodeUrl: '',
          }),
        },
      },
    ],
  }).compile();

  const service = module.get<PDFGeneratorService>(PDFGeneratorService);
  jest.spyOn(service as any, 'createPageWithRetry').mockResolvedValue(fakePage);
  jest.spyOn(service as any, 'closeBrowser').mockResolvedValue(undefined);
  jest.spyOn(require('fs'), 'existsSync').mockReturnValue(true);
  jest.spyOn(require('fs'), 'mkdirSync').mockReturnValue(undefined);
  jest.spyOn(require('fs'), 'writeFileSync').mockReturnValue(undefined);
  return service;
}

function makeFakePage() {
  return {
    close: jest.fn().mockResolvedValue(undefined),
    setViewport: jest.fn().mockResolvedValue(undefined),
    setContent: jest.fn().mockResolvedValue(undefined),
    pdf: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4 fake')),
    on: jest.fn(),
    isClosed: jest.fn().mockReturnValue(false),
    setDefaultTimeout: jest.fn(),
    setDefaultNavigationTimeout: jest.fn(),
  };
}

// ===========================================================================
// TASK 6 — Fix-checking tests
// ===========================================================================

// ---------------------------------------------------------------------------
// Property 1 — page.close() called after fix
// ---------------------------------------------------------------------------

describe('Task 6 — Fix-checking: Property 1 — page.close() called after fix', () => {
  let service: PDFGeneratorService;
  let fakePage: ReturnType<typeof makeFakePage>;

  beforeEach(async () => {
    fakePage = makeFakePage();
    service = await buildPDFService(fakePage);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * 6.1 — page.close() called on success path after fix
   * Validates: Requirements 2.1 (Property 1)
   */
  it('6.1 page.close() is called exactly once on the success path', async () => {
    const result = await service.generateOrderPDF(minimalOrderData, 'en');
    // The fixed code uses finally { await page?.close() }
    expect(fakePage.close).toHaveBeenCalledTimes(1);
    // Sanity check: generation still succeeded
    expect(result.success).toBe(true);
  });

  /**
   * 6.2 — page.close() called on error path after fix
   * Validates: Requirements 2.2 (Property 1)
   */
  it('6.2 page.close() is called exactly once even when generation throws an error', async () => {
    fakePage.setContent.mockRejectedValue(new Error('Simulated render failure'));
    const result = await service.generateOrderPDF(minimalOrderData, 'en');
    // The fixed code has a finally block — page.close() must fire regardless
    expect(fakePage.close).toHaveBeenCalledTimes(1);
    // Generation should return a failure result, not throw
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Property 2 — RefreshTokenStore size is bounded after cleanup
// ---------------------------------------------------------------------------

describe('Task 6 — Fix-checking: Property 2 — RefreshTokenStore bounded after cleanup', () => {
  beforeEach(() => { RefreshTokenStore.clear(); });
  afterEach(() => { RefreshTokenStore.clear(); });

  /**
   * 6.3 — RefreshTokenStore size is bounded after cleanup runs
   * Validates: Requirements 2.3, 2.4 (Property 2)
   */
  it('6.3 cleanup() removes expired tokens and the store size is bounded to valid tokens only', () => {
    const now = Date.now();
    const expiredDate = new Date(now - 1000);   // already expired
    const validDate   = new Date(now + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    // Add 50 expired tokens
    for (let i = 0; i < 50; i++) {
      RefreshTokenStore.save({
        id: `expired-${i}`,
        userId: `user-${i}`,
        token: `expired-token-${i}`,
        expiresAt: expiredDate,
        createdAt: new Date(),
      });
    }

    // Add 10 valid tokens
    for (let i = 0; i < 10; i++) {
      RefreshTokenStore.save({
        id: `valid-${i}`,
        userId: `user-valid-${i}`,
        token: `valid-token-${i}`,
        expiresAt: validDate,
        createdAt: new Date(),
      });
    }

    expect((RefreshTokenStore as any).tokens.size).toBe(60);

    // Call cleanup directly (as the scheduled interval would)
    RefreshTokenStore.cleanup();

    // Only the 10 valid tokens should remain
    expect((RefreshTokenStore as any).tokens.size).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// Property 3 — Intervals cleared on destroy
// ---------------------------------------------------------------------------

describe('Task 6 — Fix-checking: Property 3 — Intervals cleared on destroy', () => {
  /**
   * 6.4 — onModuleDestroy clears middleware interval
   * Validates: Requirements 2.5 (Property 3)
   */
  it('6.4 EnhancedRateLimitMiddleware.onModuleDestroy() clears the cleanup interval', () => {
    jest.useFakeTimers();
    const cleanupSpy = jest.fn();

    const middleware = new EnhancedRateLimitMiddleware(makeConfigService());
    // Patch the private method to observe if it fires after destroy
    (middleware as any).cleanupExpiredEntries = cleanupSpy;

    // Destroy the module — should clear the interval
    middleware.onModuleDestroy();

    // Advance time well past the 5-minute cleanup interval
    jest.advanceTimersByTime(10 * 60 * 1000);

    // The cleanup callback must NOT have fired after destroy
    expect(cleanupSpy).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  /**
   * 6.5 — onModuleDestroy clears guard interval
   * Validates: Requirements 2.6 (Property 3)
   */
  it('6.5 EnhancedRateLimitGuard.onModuleDestroy() clears the cleanup interval', () => {
    jest.useFakeTimers();
    const cleanupSpy = jest.fn();

    const guard = new EnhancedRateLimitGuard(makeReflector(), makeConfigService());
    // Patch the private method to observe if it fires after destroy
    (guard as any).cleanupExpiredEntries = cleanupSpy;

    // Destroy the module — should clear the interval
    guard.onModuleDestroy();

    // Advance time well past the 5-minute cleanup interval
    jest.advanceTimersByTime(10 * 60 * 1000);

    // The cleanup callback must NOT have fired after destroy
    expect(cleanupSpy).not.toHaveBeenCalled();

    jest.useRealTimers();
  });
});

// ===========================================================================
// TASK 7 — Preservation-checking tests
// ===========================================================================

// ---------------------------------------------------------------------------
// Property 4 — PDF output unchanged
// ---------------------------------------------------------------------------

describe('Task 7 — Preservation: Property 4 — PDF generation still returns correct result', () => {
  let service: PDFGeneratorService;
  let fakePage: ReturnType<typeof makeFakePage>;

  beforeEach(async () => {
    fakePage = makeFakePage();
    service = await buildPDFService(fakePage);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * 7.1 — PDF generation still returns correct result after fix
   * Validates: Requirements 3.1 (Property 4)
   */
  it('7.1 generateOrderPDF still returns { success: true, filePath, fileName, fileSize } with valid data', async () => {
    const result = await service.generateOrderPDF(minimalOrderData, 'en');

    expect(result.success).toBe(true);
    expect(typeof result.filePath).toBe('string');
    expect(result.filePath!.length).toBeGreaterThan(0);
    expect(typeof result.fileName).toBe('string');
    expect(result.fileName!.length).toBeGreaterThan(0);
    expect(typeof result.fileSize).toBe('number');
    expect(result.fileSize!).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Property 5 — Token flow unchanged
// ---------------------------------------------------------------------------

describe('Task 7 — Preservation: Property 5 — Token flow still works after fix', () => {
  beforeEach(() => { RefreshTokenStore.clear(); });
  afterEach(() => { RefreshTokenStore.clear(); });

  /**
   * 7.2 — Token refresh flow still works after fix
   * Validates: Requirements 3.2, 3.6 (Property 5)
   *
   * cleanup() removes expired tokens but keeps valid ones.
   */
  it('7.2 RefreshTokenStore.cleanup() retains valid (non-expired) tokens', () => {
    const validDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    RefreshTokenStore.save({
      id: 'valid-1',
      userId: 'user-1',
      token: 'valid-refresh-token',
      expiresAt: validDate,
      createdAt: new Date(),
    });

    RefreshTokenStore.cleanup();

    // Valid token must still be present after cleanup
    const found = RefreshTokenStore.findByToken('valid-refresh-token');
    expect(found).toBeDefined();
    expect(found!.userId).toBe('user-1');
  });

  /**
   * 7.3 — Logout still removes token from store after fix
   * Validates: Requirements 3.3 (Property 5)
   */
  it('7.3 deleteByToken() still removes a specific token (logout behavior)', () => {
    const validDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    RefreshTokenStore.save({
      id: 'logout-test',
      userId: 'user-logout',
      token: 'logout-token',
      expiresAt: validDate,
      createdAt: new Date(),
    });

    expect(RefreshTokenStore.findByToken('logout-token')).toBeDefined();

    // Simulate logout
    RefreshTokenStore.deleteByToken('logout-token');

    expect(RefreshTokenStore.findByToken('logout-token')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Property 6 — Rate limit behavior unchanged
// ---------------------------------------------------------------------------

describe('Task 7 — Preservation: Property 6 — Rate limit behavior unchanged after fix', () => {
  function makeRequest(ip = '127.0.0.1') {
    return {
      ip,
      connection: { remoteAddress: ip },
      get: jest.fn().mockReturnValue('test-agent'),
      user: undefined,
      sessionID: undefined,
      session: undefined,
    } as any;
  }

  function makeResponse() {
    const headers: Record<string, string> = {};
    return {
      set: jest.fn().mockImplementation((h: Record<string, string>) => Object.assign(headers, h)),
      _headers: headers,
    } as any;
  }

  afterEach(() => {
    jest.useRealTimers();
  });

  /**
   * 7.4 — Rate limit still returns HTTP 429 with correct headers after fix
   * Validates: Requirements 3.4 (Property 6)
   */
  it('7.4 EnhancedRateLimitMiddleware still throws HTTP 429 when limit is exceeded', () => {
    const config = makeConfigService({
      CANCELLATION_RATE_LIMIT_MAX: '2',
      CANCELLATION_RATE_LIMIT_WINDOW: '60000',
    });
    const middleware = new EnhancedRateLimitMiddleware(config);
    const next = jest.fn();

    // First two requests should pass
    middleware.use(makeRequest(), makeResponse(), next);
    middleware.use(makeRequest(), makeResponse(), next);
    expect(next).toHaveBeenCalledTimes(2);

    // Third request should throw 429
    expect(() => middleware.use(makeRequest(), makeResponse(), next)).toThrow();

    try {
      middleware.use(makeRequest(), makeResponse(), next);
    } catch (err: any) {
      expect(err.getStatus()).toBe(429);
      expect(err.getResponse().code).toBe('RATE_LIMIT_EXCEEDED');
    }

    // Clean up interval
    middleware.onModuleDestroy();
  });

  /**
   * 7.5 — Requests within rate limit still pass through with correct headers after fix
   * Validates: Requirements 3.5 (Property 6)
   */
  it('7.5 EnhancedRateLimitMiddleware still sets X-RateLimit-* headers on allowed requests', () => {
    const config = makeConfigService({
      CANCELLATION_RATE_LIMIT_MAX: '5',
      CANCELLATION_RATE_LIMIT_WINDOW: '60000',
    });
    const middleware = new EnhancedRateLimitMiddleware(config);
    const next = jest.fn();
    const res = makeResponse();

    middleware.use(makeRequest(), res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.set).toHaveBeenCalled();

    // Verify X-RateLimit headers were set
    const setCallArgs = res.set.mock.calls[0][0] as Record<string, string>;
    expect(setCallArgs['X-RateLimit-Limit']).toBeDefined();
    expect(setCallArgs['X-RateLimit-Remaining']).toBeDefined();
    expect(setCallArgs['X-RateLimit-Reset']).toBeDefined();
    expect(Number(setCallArgs['X-RateLimit-Limit'])).toBe(5);
    expect(Number(setCallArgs['X-RateLimit-Remaining'])).toBe(4);

    // Clean up interval
    middleware.onModuleDestroy();
  });
});
