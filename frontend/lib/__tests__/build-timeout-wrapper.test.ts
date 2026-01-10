/**
 * Tests for build timeout wrapper functionality
 */

import {
  withTimeout,
  withTimeoutAndRetry,
  fetchWithBuildTimeout,
  getTimeoutMetrics,
  clearTimeoutMetrics,
  getTimeoutConfig
} from '../build-timeout-wrapper';

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
  clearTimeoutMetrics();
  jest.clearAllMocks();
});

afterEach(() => {
  process.env = originalEnv;
});

describe('Build Timeout Wrapper', () => {
  describe('withTimeout', () => {
    it('should resolve when promise completes within timeout', async () => {
      const fastPromise = new Promise(resolve =>
        setTimeout(() => resolve('success'), 100)
      );

      const result = await withTimeout(fastPromise, 1000, 'fast operation');
      expect(result).toBe('success');
    });

    it('should reject when promise exceeds timeout', async () => {
      const slowPromise = new Promise(resolve =>
        setTimeout(() => resolve('success'), 2000)
      );

      await expect(
        withTimeout(slowPromise, 500, 'slow operation')
      ).rejects.toThrow('slow operation timed out after 500ms');
    });

    it('should record metrics for successful operations', async () => {
      const promise = Promise.resolve('success');
      await withTimeout(promise, 1000, 'test operation');

      const metrics = getTimeoutMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].operation).toBe('test operation');
      expect(metrics[0].success).toBe(true);
    });

    it('should record metrics for failed operations', async () => {
      const promise = Promise.reject(new Error('test error'));

      await expect(
        withTimeout(promise, 1000, 'failing operation')
      ).rejects.toThrow('test error');

      const metrics = getTimeoutMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].operation).toBe('failing operation');
      expect(metrics[0].success).toBe(false);
    });
  });

  describe('withTimeoutAndRetry', () => {
    it('should succeed on first attempt', async () => {
      const successfulCall = jest.fn().mockResolvedValue('success');

      const result = await withTimeoutAndRetry(
        successfulCall,
        { retryAttempts: 3, apiTimeout: 1000 },
        'successful operation'
      );

      expect(result).toBe('success');
      expect(successfulCall).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const flakyCall = jest.fn()
        .mockRejectedValueOnce(new Error('first failure'))
        .mockRejectedValueOnce(new Error('second failure'))
        .mockResolvedValueOnce('success');

      const result = await withTimeoutAndRetry(
        flakyCall,
        { retryAttempts: 3, apiTimeout: 1000, retryDelay: 10 },
        'flaky operation'
      );

      expect(result).toBe('success');
      expect(flakyCall).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const failingCall = jest.fn().mockRejectedValue(new Error('persistent failure'));

      await expect(
        withTimeoutAndRetry(
          failingCall,
          { retryAttempts: 2, apiTimeout: 1000, retryDelay: 10 },
          'failing operation'
        )
      ).rejects.toThrow('persistent failure');

      expect(failingCall).toHaveBeenCalledTimes(2);
    });
  });

  describe('getTimeoutConfig', () => {
    it('should return default config when no env vars set', () => {
      process.env = {};
      const config = getTimeoutConfig();

      expect(config.apiTimeout).toBe(15000); // development default
      expect(config.retryAttempts).toBe(2);
    });

    it('should use environment variables when available', () => {
      process.env = {
        API_TIMEOUT: '5000',
        BUILD_TIMEOUT: '30000',
        RETRY_ATTEMPTS: '5',
        NODE_ENV: 'production'
      };

      const config = getTimeoutConfig();

      expect(config.apiTimeout).toBe(5000);
      expect(config.buildTimeout).toBe(30000);
      expect(config.retryAttempts).toBe(5);
    });
  });

  describe('fetchWithBuildTimeout', () => {
    // Mock fetch for testing
    const mockFetch = jest.fn();
    global.fetch = mockFetch;

    beforeEach(() => {
      mockFetch.mockClear();
    });

    it('should make successful fetch request', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ data: 'test' })
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await fetchWithBuildTimeout('/test-url');

      expect(result).toEqual({ data: 'test' });
      expect(mockFetch).toHaveBeenCalledWith('/test-url', expect.any(Object));
    });

    it('should handle fetch errors', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(
        fetchWithBuildTimeout('/error-url')
      ).rejects.toThrow('HTTP 500: Internal Server Error');
    });

    it('should handle network timeouts', async () => {
      mockFetch.mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 2000))
      );

      await expect(
        fetchWithBuildTimeout('/slow-url', {}, { apiTimeout: 100 })
      ).rejects.toThrow();
    });
  });

  describe('metrics collection', () => {
    it('should collect and clear metrics correctly', async () => {
      await withTimeout(Promise.resolve('test1'), 1000, 'operation1');
      await withTimeout(Promise.resolve('test2'), 1000, 'operation2');

      let metrics = getTimeoutMetrics();
      expect(metrics).toHaveLength(2);

      clearTimeoutMetrics();
      metrics = getTimeoutMetrics();
      expect(metrics).toHaveLength(0);
    });

    it('should track retry counts in metrics', async () => {
      const failThenSucceed = jest.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce('success');

      await withTimeoutAndRetry(
        failThenSucceed,
        { retryAttempts: 3, retryDelay: 10 },
        'retry test'
      );

      const metrics = getTimeoutMetrics();
      // Should have metrics for both the failed attempt and successful retry
      expect(metrics.length).toBeGreaterThan(0);

      // Find the final metric entry
      const finalMetric = metrics[metrics.length - 1];
      expect(finalMetric.success).toBe(true);
    });
  });
});