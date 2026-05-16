/**
 * Memory Leak Additional Fixes — Verification Tests
 *
 * Task 12: Fix-checking and preservation tests for the additional memory leak sources:
 *   - PDFAuditService log-rotation interval
 *   - EmailAttachmentService rateLimitMap and deliveryLogs cleanup
 *   - PDFImageConverterService LRU cache eviction
 *   - TemplateLoaderService reloadCallbacks accumulation
 *
 * All tests in this file SHOULD PASS on the fixed code.
 *
 * Run with:
 *   cd backend && npx jest --rootDir . --testRegex "src/test/memory-leak-additional-fixes\\.spec\\.ts$" --no-coverage --testTimeout=30000
 */

import * as path from 'path';

// ---------------------------------------------------------------------------
// Mock 'fs' at the module level so all tests can control filesystem behaviour
// without hitting the real disk.
// ---------------------------------------------------------------------------
jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  const mockStat = { size: 0, isDirectory: () => false, isFile: () => true };
  return {
    ...actual,
    existsSync: jest.fn().mockReturnValue(true),
    mkdirSync: jest.fn().mockReturnValue(undefined),
    readFileSync: jest.fn().mockReturnValue(''),
    appendFileSync: jest.fn().mockReturnValue(undefined),
    statSync: jest.fn().mockReturnValue(mockStat),
    renameSync: jest.fn().mockReturnValue(undefined),
    promises: {
      ...actual.promises,
      readFile: jest.fn().mockResolvedValue(Buffer.from('fake-image-data')),
    },
  };
});

// Mock puppeteer to prevent it from loading during EmailAttachmentService tests
// (EmailAttachmentService -> PDFGeneratorService -> puppeteer)
jest.mock('puppeteer', () => ({}));
jest.mock('../pdf-generator/pdf-generator.service', () => ({
  PDFGeneratorService: class {},
}));

// ---------------------------------------------------------------------------
// 12.1 — PDFAuditService: log-rotation interval cleared on destroy
// ---------------------------------------------------------------------------

describe('12.1 PDFAuditService.onModuleDestroy() clears the log-rotation interval', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  /**
   * 12.1 — PDFAuditService log-rotation interval is cleared on destroy
   * Validates: Task 8 fix
   */
  it('12.1 rotateLogFileIfNeeded is NOT called after onModuleDestroy()', () => {
    jest.useFakeTimers();

    const { PDFAuditService } = require('../pdf-generator/services/pdf-audit.service');
    const service = new PDFAuditService();

    const rotateSpy = jest.spyOn(service as any, 'rotateLogFileIfNeeded');

    service.onModuleDestroy();

    // Advance 2 hours — the interval fires every 1 hour
    jest.advanceTimersByTime(2 * 60 * 60 * 1000);

    expect(rotateSpy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 12.2 — EmailAttachmentService: rateLimitMap is bounded (expired entries cleaned up)
// ---------------------------------------------------------------------------

describe('12.2 EmailAttachmentService rateLimitMap is bounded (expired entries cleaned up)', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  function buildEmailAttachmentService() {
    const { EmailAttachmentService } = require('../pdf-generator/services/email-attachment.service');

    // Minimal stubs — the constructor only needs to set up the interval
    const stub = {} as any;
    return new EmailAttachmentService(
      stub, // emailService
      stub, // emailTemplateService
      stub, // pdfGeneratorService
      stub, // documentStorageService
      stub, // errorHandlerService
      stub, // monitoringService
      stub, // auditService
      stub, // ordersService
      stub, // footerSettingsService
      stub, // businessInfoService
    );
  }

  /**
   * 12.2 — rateLimitMap expired entries are removed after cleanup interval fires
   * Validates: Task 9 fix
   */
  it('12.2 expired rateLimitMap entries are removed after the cleanup interval fires', () => {
    jest.useFakeTimers();

    const service = buildEmailAttachmentService();
    const rateLimitMap: Map<string, { count: number; resetTime: Date }> =
      (service as any).rateLimitMap;

    // Add entries that are already expired (resetTime in the past)
    const pastTime = new Date(Date.now() - 1000);
    rateLimitMap.set('expired@example.com', { count: 3, resetTime: pastTime });
    rateLimitMap.set('also-expired@example.com', { count: 1, resetTime: pastTime });

    // Add one entry that is still valid
    const futureTime = new Date(Date.now() + 60 * 60 * 1000);
    rateLimitMap.set('valid@example.com', { count: 1, resetTime: futureTime });

    expect(rateLimitMap.size).toBe(3);

    // Advance past the 1-hour cleanup interval
    jest.advanceTimersByTime(60 * 60 * 1000 + 1);

    // Expired entries should be gone; valid entry should remain
    expect(rateLimitMap.has('expired@example.com')).toBe(false);
    expect(rateLimitMap.has('also-expired@example.com')).toBe(false);
    expect(rateLimitMap.has('valid@example.com')).toBe(true);
    expect(rateLimitMap.size).toBe(1);

    service.onModuleDestroy();
  });
});

// ---------------------------------------------------------------------------
// 12.3 — EmailAttachmentService: deliveryLogs is bounded (old entries cleaned up)
// ---------------------------------------------------------------------------

describe('12.3 EmailAttachmentService deliveryLogs is bounded (old entries cleaned up)', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  function buildEmailAttachmentService() {
    const { EmailAttachmentService } = require('../pdf-generator/services/email-attachment.service');
    const stub = {} as any;
    return new EmailAttachmentService(
      stub, stub, stub, stub, stub, stub, stub, stub, stub, stub,
    );
  }

  /**
   * 12.3 — deliveryLogs old entries are removed after cleanup interval fires
   * Validates: Task 9 fix
   */
  it('12.3 delivery log entries older than 24 hours are removed after the cleanup interval fires', () => {
    jest.useFakeTimers();

    const service = buildEmailAttachmentService();
    const deliveryLogs: Map<string, any> = (service as any).deliveryLogs;

    // Add entries with lastAttempt older than 24 hours
    const oldTime = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
    deliveryLogs.set('ORDER-001-old@example.com', {
      orderNumber: 'ORDER-001',
      customerEmail: 'old@example.com',
      attempts: [],
      finalStatus: 'delivered',
      lastAttempt: oldTime,
    });
    deliveryLogs.set('ORDER-002-old@example.com', {
      orderNumber: 'ORDER-002',
      customerEmail: 'old@example.com',
      attempts: [],
      finalStatus: 'failed',
      lastAttempt: oldTime,
    });

    // Add a recent entry (within 24 hours)
    const recentTime = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago
    deliveryLogs.set('ORDER-003-recent@example.com', {
      orderNumber: 'ORDER-003',
      customerEmail: 'recent@example.com',
      attempts: [],
      finalStatus: 'delivered',
      lastAttempt: recentTime,
    });

    expect(deliveryLogs.size).toBe(3);

    // Advance past the 1-hour cleanup interval
    jest.advanceTimersByTime(60 * 60 * 1000 + 1);

    // Old entries should be gone; recent entry should remain
    expect(deliveryLogs.has('ORDER-001-old@example.com')).toBe(false);
    expect(deliveryLogs.has('ORDER-002-old@example.com')).toBe(false);
    expect(deliveryLogs.has('ORDER-003-recent@example.com')).toBe(true);
    expect(deliveryLogs.size).toBe(1);

    service.onModuleDestroy();
  });
});

// ---------------------------------------------------------------------------
// 12.4 — PDFImageConverterService: cache does not exceed maxCacheSize
// ---------------------------------------------------------------------------

describe('12.4 PDFImageConverterService cache does not exceed maxCacheSize', () => {
  /**
   * 12.4 — imageCache.size stays <= 100 after caching 110 images
   * Validates: Task 10 fix (LRU eviction already implemented, verified here)
   */
  it('12.4 imageCache.size stays <= 100 after caching 110 images', async () => {
    const { PDFImageConverterService } = require('../pdf-generator/services/pdf-image-converter.service');
    const service = new PDFImageConverterService();

    // Call convertImageToBase64 110 times with unique local paths
    // The mocked fs.promises.readFile (set at top of file) returns fake data
    for (let i = 0; i < 110; i++) {
      await service.convertImageToBase64(`/uploads/image-${i}.jpg`);
    }

    const cacheSize: number = (service as any).imageCache.size;
    expect(cacheSize).toBeLessThanOrEqual(100);
  });
});

// ---------------------------------------------------------------------------
// 12.5 — TemplateLoaderService: reloadCallbacks cleared on destroy
// ---------------------------------------------------------------------------

describe('12.5 TemplateLoaderService reloadCallbacks is cleared on destroy', () => {
  /**
   * 12.5 — reloadCallbacks array is empty after onModuleDestroy()
   * Validates: Task 11 fix
   */
  it('12.5 reloadCallbacks array is empty after onModuleDestroy()', () => {
    const { TemplateLoaderService } = require('../notifications/services/template-loader.service');

    // Provide a minimal config that satisfies validation
    const config = {
      templatesPath: path.join(process.cwd(), 'src', 'notifications', 'templates'),
      isDevelopment: false,
      enableCaching: true,
      templateExtension: '.html',
      partialsPath: path.join(process.cwd(), 'src', 'notifications', 'templates', 'partials'),
      partialExtension: '.hbs',
    };

    const service = new TemplateLoaderService(config);

    // Register several callbacks
    service.onTemplateReload(() => {});
    service.onTemplateReload(() => {});
    service.onTemplateReload(() => {});

    expect((service as any).reloadCallbacks.length).toBe(3);

    // Destroy the module
    service.onModuleDestroy();

    // Callbacks array must be empty
    expect((service as any).reloadCallbacks.length).toBe(0);
    expect((service as any).reloadCallbacks).toEqual([]);
  });
});
