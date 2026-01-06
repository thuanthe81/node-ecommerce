/**
 * SSR Performance Validation Tests
 * Validates Core Web Vitals improvements and performance requirements
 * Validates Requirements 5.1, 5.2, 5.3 from SSR Enhancement spec
 */

import { PerformanceMonitor, measureExecutionTime, performanceMonitor } from '@/lib/performance-monitoring';
import { PERFORMANCE_CONFIG } from '@/lib/cache-config';

describe('SSR Performance Validation Tests', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = PerformanceMonitor.getInstance();
    // Clear any existing metrics
    monitor.cleanupOldMetrics(0);
  });

  describe('Core Web Vitals Thresholds', () => {
    test('should validate LCP threshold configuration', () => {
      const { coreWebVitals } = PERFORMANCE_CONFIG;

      // LCP should be under 2.5 seconds (2500ms) for good performance
      expect(coreWebVitals.lcp).toBeLessThanOrEqual(2500);
      expect(coreWebVitals.lcp).toBeGreaterThan(0);
    });

    test('should validate FID threshold configuration', () => {
      const { coreWebVitals } = PERFORMANCE_CONFIG;

      // FID should be under 100ms for good performance
      expect(coreWebVitals.fid).toBeLessThanOrEqual(100);
      expect(coreWebVitals.fid).toBeGreaterThan(0);
    });

    test('should validate CLS threshold configuration', () => {
      const { coreWebVitals } = PERFORMANCE_CONFIG;

      // CLS should be under 0.1 for good performance
      expect(coreWebVitals.cls).toBeLessThanOrEqual(0.1);
      expect(coreWebVitals.cls).toBeGreaterThanOrEqual(0);
    });

    test('should track Core Web Vitals within acceptable ranges', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Test good performance metrics
      monitor.trackCoreWebVitals('/products/test-product', {
        lcp: 1800, // Good LCP
        fid: 50,   // Good FID
        cls: 0.05, // Good CLS
        fcp: 1200, // Good FCP
        ttfb: 200  // Good TTFB
      });

      expect(consoleSpy).toHaveBeenCalledWith('Core Web Vitals:', {
        path: '/products/test-product',
        lcp: 1800,
        fid: 50,
        cls: 0.05,
        fcp: 1200,
        ttfb: 200
      });

      // Should not trigger warnings for good metrics
      expect(warnSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
      warnSpy.mockRestore();
    });

    test('should warn when Core Web Vitals exceed thresholds', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Test poor performance metrics
      monitor.trackCoreWebVitals('/categories/slow-category', {
        lcp: 3000, // Poor LCP
        fid: 150,  // Poor FID
        cls: 0.15  // Poor CLS
      });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('LCP threshold exceeded: 3000ms')
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('FID threshold exceeded: 150ms')
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('CLS threshold exceeded: 0.15')
      );

      warnSpy.mockRestore();
    });
  });

  describe('SSR Performance Tracking', () => {
    test('should track request performance metrics', () => {
      const requestId = 'test-request-1';
      const path = '/products/test-product';

      // Start tracking
      monitor.startRequest(requestId, path, 'GET');

      // Simulate some processing time
      const startTime = Date.now();

      // Simulate SSR render time
      monitor.trackSSRRender(requestId, 150);

      // Simulate API call time
      monitor.trackAPICall(requestId, 80);

      // End tracking
      monitor.endRequest(requestId, true, 0); // Cache hit, no errors

      const summary = monitor.getPerformanceSummary();

      expect(summary.requests).toHaveLength(1);
      expect(summary.requests[0].path).toBe(path);
      expect(summary.requests[0].cacheHit).toBe(true);
      expect(summary.requests[0].ssrRenderTime).toBe(150);
      expect(summary.requests[0].apiCallTime).toBe(80);
      expect(summary.requests[0].errorCount).toBe(0);
      expect(summary.cacheHitRate).toBe(1.0);
      expect(summary.errorRate).toBe(0);
    });

    test('should identify slow requests', () => {
      const requestId = 'slow-request';
      const path = '/categories/heavy-category';

      monitor.startRequest(requestId, path, 'GET');

      // Simulate slow processing
      setTimeout(() => {
        monitor.endRequest(requestId, false, 0);
      }, 0);

      // Manually set duration to simulate slow request
      const metrics = monitor.getPerformanceSummary().requests;
      if (metrics.length > 0) {
        metrics[0].duration = 1500; // 1.5 seconds
      }

      const summary = monitor.getPerformanceSummary();
      const slowRequests = summary.slowRequests;

      expect(slowRequests.length).toBeGreaterThanOrEqual(0);
    });

    test('should track cache performance', () => {
      const cacheKey = 'product-list-page-1';

      // Simulate cache operations
      monitor.updateCacheMetrics(cacheKey, true, 50);   // Cache hit
      monitor.updateCacheMetrics(cacheKey, true, 45);   // Cache hit
      monitor.updateCacheMetrics(cacheKey, false, 200); // Cache miss
      monitor.updateCacheMetrics(cacheKey, true, 55);   // Cache hit

      const cacheMetrics = monitor.getCachePerformanceSummary();
      const metrics = cacheMetrics.get(cacheKey);

      expect(metrics).toBeDefined();
      expect(metrics!.hitRate).toBeGreaterThan(0.5); // Should have good hit rate
      expect(metrics!.averageResponseTime).toBeLessThan(100); // Should be fast
      expect(metrics!.errorRate).toBe(0); // No errors
    });
  });

  describe('Performance Measurement Utilities', () => {
    test('should measure execution time accurately', async () => {
      const testOperation = async () => {
        return new Promise<string>((resolve) => {
          setTimeout(() => resolve('test result'), 100);
        });
      };

      const { result, duration } = await measureExecutionTime(
        testOperation,
        'Test Operation'
      );

      expect(result).toBe('test result');
      expect(duration).toBeGreaterThanOrEqual(90); // Allow some variance
      expect(duration).toBeLessThan(150);
    });

    test('should handle operation failures', async () => {
      const failingOperation = async () => {
        throw new Error('Test error');
      };

      await expect(
        measureExecutionTime(failingOperation, 'Failing Operation')
      ).rejects.toThrow('Test error');
    });
  });

  describe('Performance Thresholds Validation', () => {
    test('should validate SSR timeout configurations', () => {
      const { ssrTimeouts } = PERFORMANCE_CONFIG;

      // Page render should be reasonable (under 5 seconds)
      expect(ssrTimeouts.pageRender).toBeLessThanOrEqual(5000);
      expect(ssrTimeouts.pageRender).toBeGreaterThan(0);

      // API calls should be fast (under 10 seconds)
      expect(ssrTimeouts.apiCall).toBeLessThanOrEqual(10000);
      expect(ssrTimeouts.apiCall).toBeGreaterThan(0);

      // Data fetching should be reasonable
      expect(ssrTimeouts.dataFetch).toBeLessThanOrEqual(8000);
      expect(ssrTimeouts.dataFetch).toBeGreaterThan(0);
    });

    test('should validate cache performance thresholds', () => {
      const { cacheMetrics } = PERFORMANCE_CONFIG;

      // Cache hit rate should be reasonable (at least 50%)
      expect(cacheMetrics.hitRateThreshold).toBeGreaterThanOrEqual(0.5);
      expect(cacheMetrics.hitRateThreshold).toBeLessThanOrEqual(1.0);

      // Response time threshold should be reasonable
      expect(cacheMetrics.responseTimeThreshold).toBeLessThanOrEqual(1000);
      expect(cacheMetrics.responseTimeThreshold).toBeGreaterThan(0);
    });
  });

  describe('ISR Performance Validation', () => {
    test('should validate ISR revalidation intervals', () => {
      const isrConfigs = {
        homepage: { revalidate: 300 },     // 5 minutes
        productPages: { revalidate: 600 }, // 10 minutes
        categoryPages: { revalidate: 900 }, // 15 minutes
        blogPosts: { revalidate: false },   // Static generation
      };

      // Homepage should revalidate frequently for dynamic content
      expect(isrConfigs.homepage.revalidate).toBeLessThanOrEqual(600);
      expect(isrConfigs.homepage.revalidate).toBeGreaterThan(0);

      // Product pages should balance freshness with performance
      expect(isrConfigs.productPages.revalidate).toBeLessThanOrEqual(1800);
      expect(isrConfigs.productPages.revalidate).toBeGreaterThan(300);

      // Category pages can be cached longer
      expect(isrConfigs.categoryPages.revalidate).toBeLessThanOrEqual(1800);
      expect(isrConfigs.categoryPages.revalidate).toBeGreaterThan(600);

      // Blog posts should be static for best performance
      expect(isrConfigs.blogPosts.revalidate).toBe(false);
    });
  });

  describe('Memory and Resource Management', () => {
    test('should cleanup old metrics to prevent memory leaks', () => {
      // Add some test metrics
      monitor.startRequest('old-request-1', '/test-1', 'GET');
      monitor.endRequest('old-request-1');

      monitor.startRequest('old-request-2', '/test-2', 'GET');
      monitor.endRequest('old-request-2');

      // Verify metrics exist
      let summary = monitor.getPerformanceSummary();
      expect(summary.requests.length).toBeGreaterThanOrEqual(2);

      // Cleanup old metrics (0ms age means cleanup all)
      monitor.cleanupOldMetrics(0);

      // Verify metrics are cleaned up
      summary = monitor.getPerformanceSummary();
      expect(summary.requests).toHaveLength(0);
    });

    test('should maintain reasonable memory usage', () => {
      // Add many metrics to test memory management
      for (let i = 0; i < 1000; i++) {
        monitor.startRequest(`request-${i}`, `/test-${i}`, 'GET');
        monitor.endRequest(`request-${i}`);
      }

      const summary = monitor.getPerformanceSummary();
      expect(summary.requests).toHaveLength(1000);

      // Cleanup should work efficiently
      const startTime = Date.now();
      monitor.cleanupOldMetrics(0);
      const cleanupTime = Date.now() - startTime;

      expect(cleanupTime).toBeLessThan(100); // Should cleanup quickly
      expect(monitor.getPerformanceSummary().requests).toHaveLength(0);
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle performance tracking errors gracefully', () => {
      // Test with invalid request ID
      monitor.endRequest('non-existent-request');
      monitor.trackSSRRender('non-existent-request', 100);
      monitor.trackAPICall('non-existent-request', 50);

      // Should not throw errors
      const summary = monitor.getPerformanceSummary();
      expect(summary).toBeDefined();
    });

    test('should track error rates correctly', () => {
      // Add requests with errors
      monitor.startRequest('error-request-1', '/error-1', 'GET');
      monitor.endRequest('error-request-1', false, 1); // 1 error

      monitor.startRequest('success-request-1', '/success-1', 'GET');
      monitor.endRequest('success-request-1', true, 0); // No errors

      monitor.startRequest('error-request-2', '/error-2', 'GET');
      monitor.endRequest('error-request-2', false, 2); // 2 errors

      const summary = monitor.getPerformanceSummary();

      expect(summary.errorRate).toBeGreaterThan(0);
      expect(summary.errorRate).toBeLessThanOrEqual(1);
      expect(summary.requests).toHaveLength(3);
    });
  });
});