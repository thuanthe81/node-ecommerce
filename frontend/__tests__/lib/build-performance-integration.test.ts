/**
 * Build Performance Integration Tests
 *
 * Tests the integration of all build performance optimization components.
 */

import {
  createBuildPerformanceManager,
  getBuildPerformanceManager,
  withBuildPerformanceOptimization
} from '@/lib/build-performance-integration';

describe('Build Performance Integration', () => {
  beforeEach(() => {
    // Reset singleton for each test
    (global as any).performanceManager = null;
  });

  describe('Build Performance Manager Creation', () => {
    test('should create build performance manager with default config', () => {
      const manager = createBuildPerformanceManager();
      expect(manager).toBeDefined();
    });

    test('should return same instance for singleton pattern', () => {
      const manager1 = getBuildPerformanceManager();
      const manager2 = getBuildPerformanceManager();
      expect(manager1).toBe(manager2);
    });

    test('should create manager with custom config', () => {
      const customConfig = {
        enableIntegration: false,
        enablePerformanceLogging: true,
      };

      const manager = createBuildPerformanceManager(customConfig);
      expect(manager).toBeDefined();
    });
  });

  describe('Build Optimization Wrapper', () => {
    test('should wrap operation with performance optimization', async () => {
      const mockOperation = jest.fn().mockResolvedValue('test result');

      const result = await withBuildPerformanceOptimization('test-operation', mockOperation);

      expect(result).toBe('test result');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    test('should handle operation errors gracefully', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Test error'));

      await expect(
        withBuildPerformanceOptimization('test-operation', mockOperation)
      ).rejects.toThrow('Test error');

      expect(mockOperation).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance Statistics', () => {
    test('should get performance stats without initialization', async () => {
      const manager = getBuildPerformanceManager();

      // Should not throw even if not initialized
      const stats = await manager.getPerformanceStats();
      expect(stats).toBeDefined();
      expect(stats.overallPerformance).toBeDefined();
    });
  });

  describe('Cache Management', () => {
    test('should clear all caches', async () => {
      const manager = getBuildPerformanceManager();

      // Should not throw
      await expect(manager.clearAllCaches()).resolves.not.toThrow();
    });

    test('should force optimization', async () => {
      const manager = getBuildPerformanceManager();

      // Should not throw
      await expect(manager.forceOptimization()).resolves.not.toThrow();
    });
  });

  describe('Build Requirements Check', () => {
    test('should check build requirements', async () => {
      const manager = getBuildPerformanceManager();

      const requirements = await manager.checkBuildRequirements();

      expect(requirements).toBeDefined();
      expect(requirements.needsFullRebuild).toBeDefined();
      expect(requirements.incrementalResult).toBeDefined();
      expect(requirements.recommendations).toBeDefined();
      expect(Array.isArray(requirements.recommendations)).toBe(true);
    });
  });

  describe('Page Build Optimization', () => {
    test('should optimize page build successfully', async () => {
      const manager = getBuildPerformanceManager();
      const mockBuildFn = jest.fn().mockResolvedValue({ success: true });

      const result = await manager.optimizePageBuild('test-page', mockBuildFn);

      expect(result).toEqual({ success: true });
      expect(mockBuildFn).toHaveBeenCalledTimes(1);
    });

    test('should handle page build errors with cleanup', async () => {
      const manager = getBuildPerformanceManager();
      const mockBuildFn = jest.fn().mockRejectedValue(new Error('Build failed'));

      await expect(
        manager.optimizePageBuild('test-page', mockBuildFn)
      ).rejects.toThrow('Build failed');

      expect(mockBuildFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Initialization and Shutdown', () => {
    test('should initialize without errors', async () => {
      const manager = getBuildPerformanceManager();

      // Should not throw
      await expect(manager.initialize()).resolves.not.toThrow();
    });

    test('should shutdown without errors', async () => {
      const manager = getBuildPerformanceManager();

      // Should not throw
      await expect(manager.shutdown()).resolves.not.toThrow();
    });

    test('should handle multiple initialization calls', async () => {
      const manager = getBuildPerformanceManager();

      await manager.initialize();
      await manager.initialize(); // Should not throw on second call

      expect(true).toBe(true); // Test passes if no errors thrown
    });
  });
});