/**
 * Tests for Build Data Fetching Optimization
 *
 * This test suite verifies the functionality of the connection pooling,
 * request deduplication, and retry logic components.
 */

import { BuildConnectionPool } from '../build-connection-pool';
import { RequestDeduplicator } from '../build-request-deduplication';
import { RetryManager, CircuitBreaker } from '../build-retry-logic';
import { OptimizedDataFetcher } from '../build-optimized-data-fetcher';

// Mock fetch for testing
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Build Data Fetching Optimization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('BuildConnectionPool', () => {
    test('should handle concurrent requests within connection limit', async () => {
      const pool = new BuildConnectionPool({ maxConnections: 2 });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      });

      const requests = [
        pool.request('http://test1.com'),
        pool.request('http://test2.com'),
        pool.request('http://test3.com'),
      ];

      const results = await Promise.all(requests);

      expect(results).toHaveLength(3);
      expect(mockFetch).toHaveBeenCalledTimes(3);

      const metrics = pool.getMetrics();
      expect(metrics.totalRequests).toBe(3);
      expect(metrics.successfulRequests).toBe(3);

      pool.shutdown();
    });

    test('should queue requests when connection limit is exceeded', async () => {
      const pool = new BuildConnectionPool({
        maxConnections: 1,
        connectionTimeout: 100,
      });

      let resolveFirst: (value: any) => void;
      const firstPromise = new Promise(resolve => {
        resolveFirst = resolve;
      });

      mockFetch
        .mockImplementationOnce(() => firstPromise.then(() => ({
          ok: true,
          json: () => Promise.resolve({ data: 'first' }),
        })))
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ data: 'queued' }),
        });

      // Start first request (will occupy the single connection)
      const firstRequest = pool.request('http://test1.com');

      // Start second request (should be queued)
      const secondRequest = pool.request('http://test2.com');

      // Verify first request is active, second is queued
      const initialMetrics = pool.getMetrics();
      expect(initialMetrics.activeConnections).toBe(1);
      expect(initialMetrics.queuedRequests).toBe(1);

      // Complete first request
      resolveFirst!({});
      await firstRequest;

      // Wait for second request to complete
      await secondRequest;

      const finalMetrics = pool.getMetrics();
      expect(finalMetrics.totalRequests).toBe(2);
      expect(finalMetrics.successfulRequests).toBe(2);

      pool.shutdown();
    });
  });

  describe('RequestDeduplicator', () => {
    test('should deduplicate identical requests', async () => {
      const deduplicator = new RequestDeduplicator({
        enableBatching: false, // Disable batching for this test to test pure deduplication
      });

      const mockFetchFunction = jest.fn().mockResolvedValue({ data: 'test' });

      // Start first request
      const firstRequest = deduplicator.request('http://test.com', {}, mockFetchFunction);

      // Start second and third requests while first is still pending
      const secondRequest = deduplicator.request('http://test.com', {}, mockFetchFunction);
      const thirdRequest = deduplicator.request('http://test.com', {}, mockFetchFunction);

      const results = await Promise.all([firstRequest, secondRequest, thirdRequest]);

      // Should only make one actual fetch call
      expect(mockFetchFunction).toHaveBeenCalledTimes(1);
      expect(results).toHaveLength(3);
      expect(results[0]).toEqual(results[1]);
      expect(results[1]).toEqual(results[2]);

      const metrics = deduplicator.getMetrics();
      expect(metrics.totalRequests).toBe(3);
      expect(metrics.deduplicatedRequests).toBe(2);

      deduplicator.shutdown();
    });

    test('should handle different requests separately', async () => {
      const deduplicator = new RequestDeduplicator();

      const mockFetchFunction = jest.fn()
        .mockResolvedValueOnce({ data: 'test1' })
        .mockResolvedValueOnce({ data: 'test2' });

      const requests = [
        deduplicator.request('http://test1.com', {}, mockFetchFunction),
        deduplicator.request('http://test2.com', {}, mockFetchFunction),
      ];

      const results = await Promise.all(requests);

      expect(mockFetchFunction).toHaveBeenCalledTimes(2);
      expect(results[0]).toEqual({ data: 'test1' });
      expect(results[1]).toEqual({ data: 'test2' });

      deduplicator.shutdown();
    });
  });

  describe('RetryManager', () => {
    test('should retry failed requests with exponential backoff', async () => {
      const retryManager = new RetryManager({
        maxAttempts: 3,
        baseDelay: 10, // Short delay for testing
        retryableStatusCodes: [500],
      });

      let attemptCount = 0;
      const mockOperation = jest.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          const error = new Error('Server error') as any;
          error.status = 500;
          throw error;
        }
        return Promise.resolve({ data: 'success' });
      });

      const result = await retryManager.executeWithRetry(
        mockOperation,
        'http://test.com',
        'test operation'
      );

      expect(mockOperation).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ data: 'success' });

      const metrics = retryManager.getMetrics();
      expect(metrics.successfulRetries).toBe(1);
    });

    test('should not retry non-retryable errors', async () => {
      const retryManager = new RetryManager({
        maxAttempts: 3,
        retryableStatusCodes: [500],
      });

      const mockOperation = jest.fn().mockImplementation(() => {
        const error = new Error('Bad request') as any;
        error.status = 400; // Not retryable
        throw error;
      });

      await expect(
        retryManager.executeWithRetry(mockOperation, 'http://test.com', 'test operation')
      ).rejects.toThrow('Bad request');

      expect(mockOperation).toHaveBeenCalledTimes(1);
    });
  });

  describe('CircuitBreaker', () => {
    test('should open circuit after failure threshold', async () => {
      const circuitBreaker = new CircuitBreaker('http://test.com', {
        failureThreshold: 2,
        minimumRequests: 2,
      });

      // Record failures
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();

      // Circuit should be open now
      expect(circuitBreaker.canExecute()).toBe(false);

      const state = circuitBreaker.getState();
      expect(state.state).toBe('open');
    });

    test('should allow requests when circuit is closed', () => {
      const circuitBreaker = new CircuitBreaker('http://test.com');

      expect(circuitBreaker.canExecute()).toBe(true);

      const state = circuitBreaker.getState();
      expect(state.state).toBe('closed');
    });
  });

  describe('OptimizedDataFetcher', () => {
    test('should integrate all optimization features', async () => {
      const fetcher = new OptimizedDataFetcher({
        enableConnectionPooling: true,
        enableDeduplication: true,
        enableRetryLogic: true,
        enableTimeouts: true,
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'optimized' }),
      });

      const result = await fetcher.fetch('http://test.com');

      expect(result).toEqual({ data: 'optimized' });

      const metrics = fetcher.getMetrics();
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.successfulRequests).toBe(1);

      fetcher.shutdown();
    });

    test('should handle batch requests efficiently', async () => {
      const fetcher = new OptimizedDataFetcher();

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'batch' }),
      });

      const requests = [
        { id: '1', url: 'http://test1.com' },
        { id: '2', url: 'http://test2.com' },
        { id: '3', url: 'http://test3.com' },
      ];

      const results = await fetcher.fetchBatch(requests);

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);

      fetcher.shutdown();
    });
  });
});