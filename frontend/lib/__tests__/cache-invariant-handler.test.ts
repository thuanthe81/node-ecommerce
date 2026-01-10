/**
 * Tests for Cache Invariant Error Handler
 */

import {
  CacheInvariantHandler,
  CacheRecoveryManager,
  isNextJsCacheInvariantError,
  extractCacheKeyFromError,
} from '../cache-invariant-handler';

describe('CacheInvariantHandler', () => {
  let handler: CacheInvariantHandler;

  beforeEach(() => {
    handler = new CacheInvariantHandler({
      enableDetailedLogging: false,
      maxRetryAttempts: 3,
      retryDelayMs: 100,
    });
  });

  afterEach(() => {
    handler.clearErrorTracking();
  });

  describe('detectInvariantError', () => {
    it('should detect Next.js cache invariant errors', () => {
      const error = new Error('Invariant: Expected cached value for cache key "test-key" to be a "FETCH" kind, got undefined instead');

      expect(handler.detectInvariantError(error)).toBe(true);
    });

    it('should detect "This is a bug in Next.js" errors', () => {
      const error = new Error('This is a bug in Next.js');

      expect(handler.detectInvariantError(error)).toBe(true);
    });

    it('should not detect regular errors', () => {
      const error = new Error('Regular error message');

      expect(handler.detectInvariantError(error)).toBe(false);
    });

    it('should handle null/undefined errors gracefully', () => {
      expect(handler.detectInvariantError(null as any)).toBe(false);
      expect(handler.detectInvariantError(undefined as any)).toBe(false);
    });
  });

  describe('extractCacheKey', () => {
    it('should extract cache key from error message', () => {
      const error = new Error('Invariant: Expected cached value for cache key "my-cache-key" to be a "FETCH" kind');

      const cacheKey = handler.extractCacheKey(error);
      expect(cacheKey).toBe('my-cache-key');
    });

    it('should return "unknown" for errors without cache key', () => {
      const error = new Error('Some other error');

      const cacheKey = handler.extractCacheKey(error);
      expect(cacheKey).toBe('unknown');
    });
  });

  describe('extractKinds', () => {
    it('should extract expected and actual kinds', () => {
      const error = new Error('Expected cached value to be a "FETCH" kind, got "undefined" instead');

      const kinds = handler.extractKinds(error);
      expect(kinds.expected).toBe('FETCH');
      expect(kinds.actual).toBe('undefined');
    });
  });

  describe('createInvariantError', () => {
    it('should create structured error object', () => {
      const originalError = new Error('Invariant: Expected cached value for cache key "test-key" to be a "FETCH" kind, got undefined instead');

      const invariantError = handler.createInvariantError(originalError, 'test-page');

      expect(invariantError.type).toBe('FETCH_KIND_MISMATCH');
      expect(invariantError.cacheKey).toBe('test-key');
      expect(invariantError.expectedKind).toBe('FETCH');
      expect(invariantError.actualKind).toBe('undefined');
      expect(invariantError.pageId).toBe('test-page');
      expect(invariantError.originalError).toBe(originalError);
    });
  });

  describe('getErrorStats', () => {
    it('should track error statistics', () => {
      const error1 = new Error('Invariant: Expected cached value for cache key "key1" to be a "FETCH" kind, got undefined instead');
      const error2 = new Error('Invariant: Expected cached value for cache key "key2" to be a "FETCH" kind, got undefined instead');

      handler.createInvariantError(error1, 'page1');
      handler.createInvariantError(error2, 'page2');

      const stats = handler.getErrorStats();

      expect(stats.totalErrors).toBe(2);
      expect(stats.errorsByType.FETCH_KIND_MISMATCH).toBe(2);
      expect(stats.errorsByPage.page1).toBe(1);
      expect(stats.errorsByPage.page2).toBe(1);
    });
  });
});

describe('CacheRecoveryManager', () => {
  let recoveryManager: CacheRecoveryManager;

  beforeEach(() => {
    recoveryManager = new CacheRecoveryManager({
      enableDetailedLogging: false,
      maxRetryAttempts: 2,
      retryDelayMs: 50,
    });
  });

  describe('retryWithCacheClear', () => {
    it('should retry operation after cache clear', async () => {
      let attempts = 0;
      const operation = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Invariant: cache error');
        }
        return Promise.resolve('success');
      });

      const result = await recoveryManager.retryWithCacheClear(operation, 2);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should throw error after max attempts', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Persistent error'));

      await expect(
        recoveryManager.retryWithCacheClear(operation, 2)
      ).rejects.toThrow('Persistent error');

      expect(operation).toHaveBeenCalledTimes(2);
    });
  });
});

describe('Utility functions', () => {
  describe('isNextJsCacheInvariantError', () => {
    it('should detect cache invariant errors', () => {
      const error = new Error('Invariant: Expected cached value for cache key "test" to be a "FETCH" kind, got undefined instead');

      expect(isNextJsCacheInvariantError(error)).toBe(true);
    });

    it('should not detect regular errors', () => {
      const error = new Error('Regular error');

      expect(isNextJsCacheInvariantError(error)).toBe(false);
    });
  });

  describe('extractCacheKeyFromError', () => {
    it('should extract cache key from error', () => {
      const error = new Error('cache key "my-key" error');

      const key = extractCacheKeyFromError(error);
      expect(key).toBe('my-key');
    });
  });
});