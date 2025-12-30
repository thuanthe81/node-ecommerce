/**
 * Performance Testing System for SVG Consolidation
 * Requirements: 10.2 - Performance and optimization testing
 *
 * Tests consolidation performance with large codebases, validates memory usage,
 * and provides optimization recommendations
 */

import { performance } from 'perf_hooks';
import { SvgAuditSystem } from './audit-system';
import { InlineSvgAudit, ScanOptions } from './types';
import { SvgConsolidationSystem, ConsolidationOptions } from './svg-consolidation-system';
import * as fs from 'fs';
import * as path from 'path';

export interface PerformanceMetrics {
  /** Total execution time in milliseconds */
  totalTime: number;
  /** Time spent on file scanning */
  scanTime: number;
  /** Time spent on AST parsing */
  parseTime: number;
  /** Time spent on SVG classification */
  classificationTime: number;
  /** Time spent on component generation */
  generationTime: number;
  /** Time spent on file integration */
  integrationTime: number;
  /** Time spent on SVG replacement */
  replacementTime: number;
  /** Peak memory usage in MB */
  peakMemoryUsage: number;
  /** Memory usage at start in MB */
  initialMemoryUsage: number;
  /** Memory usage at end in MB */
  finalMemoryUsage: number;
  /** Number of files processed */
  filesProcessed: number;
  /** Number of SVGs processed */
  svgsProcessed: number;
  /** Processing rate (files per second) */
  filesPerSecond: number;
  /** Processing rate (SVGs per second) */
  svgsPerSecond: number;
}

export interface PerformanceTestResult {
  /** Test configuration */
  testConfig: PerformanceTestConfig;
  /** Performance metrics */
  metrics: PerformanceMetrics;
  /** Memory usage samples during execution */
  memorySamples: { timestamp: number; usage: number }[];
  /** Performance bottlenecks identified */
  bottlenecks: string[];
  /** Optimization recommendations */
  recommendations: string[];
  /** Test success status */
  success: boolean;
  /** Any errors encountered */
  errors: string[];
}

export interface PerformanceTestConfig {
  /** Test name */
  name: string;
  /** Directory to test (defaults to frontend) */
  testDirectory?: string;
  /** Number of synthetic files to generate for stress testing */
  syntheticFileCount?: number;
  /** Number of SVGs per synthetic file */
  svgsPerFile?: number;
  /** Whether to include consolidation in the test */
  includeConsolidation?: boolean;
  /** Whether to perform actual file writes (vs dry run) */
  performWrites?: boolean;
  /** Memory monitoring interval in ms */
  memoryMonitoringInterval?: number;
  /** Maximum allowed execution time in ms */
  maxExecutionTime?: number;
  /** Maximum allowed memory usage in MB */
  maxMemoryUsage?: number;
}

export class PerformanceTester {
  private memorySamples: { timestamp: number; usage: number }[] = [];
  private memoryMonitoringInterval?: NodeJS.Timeout;
  private peakMemoryUsage = 0;

  /**
   * Run a comprehensive performance test
   */
  async runPerformanceTest(config: PerformanceTestConfig): Promise<PerformanceTestResult> {
    console.log(`Starting performance test: ${config.name}`);

    const startTime = performance.now();
    const initialMemory = this.getMemoryUsage();
    const errors: string[] = [];
    const bottlenecks: string[] = [];
    const recommendations: string[] = [];

    // Start memory monitoring
    this.startMemoryMonitoring(config.memoryMonitoringInterval || 100);

    try {
      // Setup test environment
      const testDir = await this.setupTestEnvironment(config);

      // Create audit system
      const auditSystem = new SvgAuditSystem({
        rootDir: testDir,
        extensions: ['.tsx', '.jsx'],
        excludeDirs: ['node_modules', 'dist', '.next']
      });

      // Measure scanning performance
      const scanStartTime = performance.now();
      const auditSummary = await auditSystem.performAudit();
      const scanEndTime = performance.now();
      const scanTime = scanEndTime - scanStartTime;

      // Measure consolidation performance if requested
      let consolidationTime = 0;
      let consolidationResult;

      if (config.includeConsolidation && auditSummary.totalInlineSvgs > 0) {
        const consolidationStartTime = performance.now();

        const consolidationSystem = new SvgConsolidationSystem({
          frontendDir: testDir,
          dryRun: !config.performWrites,
          createBackups: false // Don't create backups during performance testing
        });

        consolidationResult = await consolidationSystem.consolidateFromAuditSummary(auditSummary);
        const consolidationEndTime = performance.now();
        consolidationTime = consolidationEndTime - consolidationStartTime;
      }

      const totalTime = performance.now() - startTime;
      const finalMemory = this.getMemoryUsage();

      // Stop memory monitoring
      this.stopMemoryMonitoring();

      // Analyze performance
      const metrics: PerformanceMetrics = {
        totalTime,
        scanTime,
        parseTime: scanTime * 0.7, // Estimate - most scan time is parsing
        classificationTime: scanTime * 0.2, // Estimate
        generationTime: consolidationResult?.statistics.processingTime || 0,
        integrationTime: consolidationTime * 0.3, // Estimate
        replacementTime: consolidationTime * 0.7, // Estimate
        peakMemoryUsage: this.peakMemoryUsage,
        initialMemoryUsage: initialMemory,
        finalMemoryUsage: finalMemory,
        filesProcessed: auditSummary.totalFilesScanned,
        svgsProcessed: auditSummary.totalInlineSvgs,
        filesPerSecond: auditSummary.totalFilesScanned / (totalTime / 1000),
        svgsPerSecond: auditSummary.totalInlineSvgs / (totalTime / 1000)
      };

      // Identify bottlenecks
      this.identifyBottlenecks(metrics, bottlenecks);

      // Generate recommendations
      this.generateRecommendations(metrics, config, recommendations);

      // Check performance thresholds
      const success = this.checkPerformanceThresholds(metrics, config, errors);

      // Cleanup test environment
      await this.cleanupTestEnvironment(testDir, config);

      return {
        testConfig: config,
        metrics,
        memorySamples: this.memorySamples,
        bottlenecks,
        recommendations,
        success,
        errors
      };

    } catch (error) {
      this.stopMemoryMonitoring();
      errors.push(`Test execution failed: ${error instanceof Error ? error.message : String(error)}`);

      const totalTime = performance.now() - startTime;
      const finalMemory = this.getMemoryUsage();

      return {
        testConfig: config,
        metrics: {
          totalTime,
          scanTime: 0,
          parseTime: 0,
          classificationTime: 0,
          generationTime: 0,
          integrationTime: 0,
          replacementTime: 0,
          peakMemoryUsage: this.peakMemoryUsage,
          initialMemoryUsage: initialMemory,
          finalMemoryUsage: finalMemory,
          filesProcessed: 0,
          svgsProcessed: 0,
          filesPerSecond: 0,
          svgsPerSecond: 0
        },
        memorySamples: this.memorySamples,
        bottlenecks: ['Test execution failed'],
        recommendations: ['Fix test execution errors before performance optimization'],
        success: false,
        errors
      };
    }
  }

  /**
   * Run multiple performance tests with different configurations
   */
  async runPerformanceTestSuite(): Promise<PerformanceTestResult[]> {
    const testConfigs: PerformanceTestConfig[] = [
      {
        name: 'Baseline - Current Codebase',
        includeConsolidation: false,
        performWrites: false
      },
      {
        name: 'Small Scale - 50 files, 5 SVGs each',
        syntheticFileCount: 50,
        svgsPerFile: 5,
        includeConsolidation: true,
        performWrites: false,
        maxExecutionTime: 10000, // 10 seconds
        maxMemoryUsage: 100 // 100 MB
      },
      {
        name: 'Medium Scale - 200 files, 10 SVGs each',
        syntheticFileCount: 200,
        svgsPerFile: 10,
        includeConsolidation: true,
        performWrites: false,
        maxExecutionTime: 30000, // 30 seconds
        maxMemoryUsage: 200 // 200 MB
      },
      {
        name: 'Large Scale - 500 files, 15 SVGs each',
        syntheticFileCount: 500,
        svgsPerFile: 15,
        includeConsolidation: true,
        performWrites: false,
        maxExecutionTime: 60000, // 60 seconds
        maxMemoryUsage: 500 // 500 MB
      },
      {
        name: 'Stress Test - 1000 files, 20 SVGs each',
        syntheticFileCount: 1000,
        svgsPerFile: 20,
        includeConsolidation: false, // Skip consolidation for stress test
        performWrites: false,
        maxExecutionTime: 120000, // 2 minutes
        maxMemoryUsage: 1000 // 1 GB
      }
    ];

    const results: PerformanceTestResult[] = [];

    for (const config of testConfigs) {
      console.log(`\n=== Running ${config.name} ===`);

      // Reset memory tracking
      this.memorySamples = [];
      this.peakMemoryUsage = 0;

      const result = await this.runPerformanceTest(config);
      results.push(result);

      // Log immediate results
      console.log(`✓ Completed in ${result.metrics.totalTime.toFixed(2)}ms`);
      console.log(`✓ Peak memory: ${result.metrics.peakMemoryUsage.toFixed(2)}MB`);
      console.log(`✓ Processed ${result.metrics.filesProcessed} files, ${result.metrics.svgsProcessed} SVGs`);

      if (!result.success) {
        console.log(`❌ Test failed: ${result.errors.join(', ')}`);
      }

      // Brief pause between tests to allow garbage collection
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  }

  /**
   * Generate a comprehensive performance report
   */
  generatePerformanceReport(results: PerformanceTestResult[]): string {
    const lines: string[] = [];

    lines.push('# SVG Consolidation Performance Test Report');
    lines.push('');
    lines.push(`**Generated:** ${new Date().toISOString()}`);
    lines.push('');

    // Executive Summary
    lines.push('## Executive Summary');
    lines.push('');

    const successfulTests = results.filter(r => r.success);
    const failedTests = results.filter(r => !r.success);

    lines.push(`- **Total Tests:** ${results.length}`);
    lines.push(`- **Successful:** ${successfulTests.length}`);
    lines.push(`- **Failed:** ${failedTests.length}`);
    lines.push('');

    if (successfulTests.length > 0) {
      const avgTime = successfulTests.reduce((sum, r) => sum + r.metrics.totalTime, 0) / successfulTests.length;
      const avgMemory = successfulTests.reduce((sum, r) => sum + r.metrics.peakMemoryUsage, 0) / successfulTests.length;
      const maxFilesPerSecond = Math.max(...successfulTests.map(r => r.metrics.filesPerSecond));

      lines.push(`- **Average Execution Time:** ${avgTime.toFixed(2)}ms`);
      lines.push(`- **Average Peak Memory:** ${avgMemory.toFixed(2)}MB`);
      lines.push(`- **Best Processing Rate:** ${maxFilesPerSecond.toFixed(2)} files/second`);
      lines.push('');
    }

    // Individual Test Results
    lines.push('## Test Results');
    lines.push('');

    for (const result of results) {
      lines.push(`### ${result.testConfig.name}`);
      lines.push('');

      if (result.success) {
        lines.push('**Status:** ✅ PASSED');
      } else {
        lines.push('**Status:** ❌ FAILED');
        lines.push('**Errors:**');
        for (const error of result.errors) {
          lines.push(`- ${error}`);
        }
      }

      lines.push('');
      lines.push('**Performance Metrics:**');
      lines.push(`- Total Time: ${result.metrics.totalTime.toFixed(2)}ms`);
      lines.push(`- Files Processed: ${result.metrics.filesProcessed}`);
      lines.push(`- SVGs Processed: ${result.metrics.svgsProcessed}`);
      lines.push(`- Processing Rate: ${result.metrics.filesPerSecond.toFixed(2)} files/sec`);
      lines.push(`- Peak Memory: ${result.metrics.peakMemoryUsage.toFixed(2)}MB`);
      lines.push(`- Memory Growth: ${(result.metrics.finalMemoryUsage - result.metrics.initialMemoryUsage).toFixed(2)}MB`);
      lines.push('');

      if (result.bottlenecks.length > 0) {
        lines.push('**Bottlenecks Identified:**');
        for (const bottleneck of result.bottlenecks) {
          lines.push(`- ${bottleneck}`);
        }
        lines.push('');
      }

      if (result.recommendations.length > 0) {
        lines.push('**Optimization Recommendations:**');
        for (const recommendation of result.recommendations) {
          lines.push(`- ${recommendation}`);
        }
        lines.push('');
      }
    }

    // Performance Analysis
    if (successfulTests.length > 1) {
      lines.push('## Performance Analysis');
      lines.push('');

      // Scalability analysis
      const scalabilityTests = successfulTests.filter(r => r.testConfig.syntheticFileCount);
      if (scalabilityTests.length > 1) {
        lines.push('### Scalability');
        lines.push('');
        lines.push('| Files | SVGs | Time (ms) | Memory (MB) | Files/sec |');
        lines.push('|-------|------|-----------|-------------|-----------|');

        for (const test of scalabilityTests.sort((a, b) =>
          (a.testConfig.syntheticFileCount || 0) - (b.testConfig.syntheticFileCount || 0)
        )) {
          const files = test.testConfig.syntheticFileCount || 0;
          const svgs = test.metrics.svgsProcessed;
          const time = test.metrics.totalTime.toFixed(0);
          const memory = test.metrics.peakMemoryUsage.toFixed(1);
          const rate = test.metrics.filesPerSecond.toFixed(1);

          lines.push(`| ${files} | ${svgs} | ${time} | ${memory} | ${rate} |`);
        }
        lines.push('');
      }

      // Memory usage analysis
      lines.push('### Memory Usage Patterns');
      lines.push('');

      for (const test of successfulTests) {
        if (test.memorySamples.length > 0) {
          const maxSample = Math.max(...test.memorySamples.map(s => s.usage));
          const avgSample = test.memorySamples.reduce((sum, s) => sum + s.usage, 0) / test.memorySamples.length;

          lines.push(`**${test.testConfig.name}:**`);
          lines.push(`- Peak: ${maxSample.toFixed(2)}MB`);
          lines.push(`- Average: ${avgSample.toFixed(2)}MB`);
          lines.push(`- Samples: ${test.memorySamples.length}`);
          lines.push('');
        }
      }
    }

    // Overall Recommendations
    lines.push('## Overall Recommendations');
    lines.push('');

    const allRecommendations = new Set<string>();
    results.forEach(r => r.recommendations.forEach(rec => allRecommendations.add(rec)));

    if (allRecommendations.size > 0) {
      for (const recommendation of Array.from(allRecommendations).sort()) {
        lines.push(`- ${recommendation}`);
      }
    } else {
      lines.push('- No specific optimizations needed - performance is within acceptable limits');
    }

    lines.push('');

    return lines.join('\n');
  }

  /**
   * Setup test environment with synthetic files if needed
   */
  private async setupTestEnvironment(config: PerformanceTestConfig): Promise<string> {
    if (!config.syntheticFileCount) {
      return config.testDirectory || '.';
    }

    // Create temporary test directory
    const testDir = path.join(process.cwd(), 'temp-perf-test');
    await fs.promises.mkdir(testDir, { recursive: true });

    // Generate synthetic React files with inline SVGs
    for (let i = 0; i < config.syntheticFileCount; i++) {
      const fileName = `TestComponent${i}.tsx`;
      const filePath = path.join(testDir, fileName);
      const content = this.generateSyntheticReactFile(i, config.svgsPerFile || 5);

      await fs.promises.writeFile(filePath, content, 'utf-8');
    }

    console.log(`Generated ${config.syntheticFileCount} synthetic test files in ${testDir}`);
    return testDir;
  }

  /**
   * Generate a synthetic React component file with inline SVGs
   */
  private generateSyntheticReactFile(index: number, svgCount: number): string {
    const svgTemplates = [
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>',
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>',
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>',
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/></svg>'
    ];

    const lines: string[] = [];
    lines.push(`import React from 'react';`);
    lines.push('');
    lines.push(`interface TestComponent${index}Props {`);
    lines.push('  className?: string;');
    lines.push('  onClick?: () => void;');
    lines.push('}');
    lines.push('');
    lines.push(`export const TestComponent${index}: React.FC<TestComponent${index}Props> = ({ className, onClick }) => {`);
    lines.push('  return (');
    lines.push('    <div className={className} onClick={onClick}>');
    lines.push(`      <h2>Test Component ${index}</h2>`);

    // Add inline SVGs
    for (let i = 0; i < svgCount; i++) {
      const svgTemplate = svgTemplates[i % svgTemplates.length];
      const className = `icon-${i}`;
      lines.push(`      <div className="${className}">`);
      lines.push(`        ${svgTemplate}`);
      lines.push('      </div>');
    }

    lines.push('    </div>');
    lines.push('  );');
    lines.push('};');
    lines.push('');
    lines.push(`export default TestComponent${index};`);

    return lines.join('\n');
  }

  /**
   * Cleanup test environment
   */
  private async cleanupTestEnvironment(testDir: string, config: PerformanceTestConfig): Promise<void> {
    if (config.syntheticFileCount && testDir.includes('temp-perf-test')) {
      try {
        await fs.promises.rm(testDir, { recursive: true, force: true });
        console.log(`Cleaned up test directory: ${testDir}`);
      } catch (error) {
        console.warn(`Failed to cleanup test directory: ${error}`);
      }
    }
  }

  /**
   * Start monitoring memory usage
   */
  private startMemoryMonitoring(intervalMs: number): void {
    this.memorySamples = [];
    this.peakMemoryUsage = 0;

    this.memoryMonitoringInterval = setInterval(() => {
      const usage = this.getMemoryUsage();
      this.memorySamples.push({
        timestamp: Date.now(),
        usage
      });

      if (usage > this.peakMemoryUsage) {
        this.peakMemoryUsage = usage;
      }
    }, intervalMs);
  }

  /**
   * Stop monitoring memory usage
   */
  private stopMemoryMonitoring(): void {
    if (this.memoryMonitoringInterval) {
      clearInterval(this.memoryMonitoringInterval);
      this.memoryMonitoringInterval = undefined;
    }
  }

  /**
   * Get current memory usage in MB
   */
  private getMemoryUsage(): number {
    const usage = process.memoryUsage();
    return usage.heapUsed / 1024 / 1024; // Convert to MB
  }

  /**
   * Identify performance bottlenecks
   */
  private identifyBottlenecks(metrics: PerformanceMetrics, bottlenecks: string[]): void {
    // Slow processing rate
    if (metrics.filesPerSecond < 10) {
      bottlenecks.push(`Slow file processing rate: ${metrics.filesPerSecond.toFixed(2)} files/second`);
    }

    // High memory usage
    if (metrics.peakMemoryUsage > 500) {
      bottlenecks.push(`High memory usage: ${metrics.peakMemoryUsage.toFixed(2)}MB peak`);
    }

    // Memory growth
    const memoryGrowth = metrics.finalMemoryUsage - metrics.initialMemoryUsage;
    if (memoryGrowth > 100) {
      bottlenecks.push(`Significant memory growth: ${memoryGrowth.toFixed(2)}MB increase`);
    }

    // Long execution time
    if (metrics.totalTime > 30000) { // 30 seconds
      bottlenecks.push(`Long execution time: ${(metrics.totalTime / 1000).toFixed(2)} seconds`);
    }

    // Identify slowest phase
    const phases = {
      'File scanning': metrics.scanTime,
      'AST parsing': metrics.parseTime,
      'Classification': metrics.classificationTime,
      'Component generation': metrics.generationTime,
      'File integration': metrics.integrationTime,
      'SVG replacement': metrics.replacementTime
    };

    const slowestPhase = Object.entries(phases).reduce((max, [name, time]) =>
      time > max.time ? { name, time } : max, { name: '', time: 0 }
    );

    if (slowestPhase.time > metrics.totalTime * 0.4) {
      bottlenecks.push(`${slowestPhase.name} is the primary bottleneck (${(slowestPhase.time / 1000).toFixed(2)}s)`);
    }
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(
    metrics: PerformanceMetrics,
    config: PerformanceTestConfig,
    recommendations: string[]
  ): void {
    // Processing rate recommendations
    if (metrics.filesPerSecond < 20) {
      recommendations.push('Consider implementing parallel file processing to improve throughput');
      recommendations.push('Add file size filtering to skip very large files that may not contain SVGs');
    }

    // Memory optimization recommendations
    if (metrics.peakMemoryUsage > 200) {
      recommendations.push('Implement streaming processing to reduce memory footprint');
      recommendations.push('Add garbage collection hints after processing large batches');
      recommendations.push('Consider processing files in smaller chunks');
    }

    // AST parsing optimization
    if (metrics.parseTime > metrics.totalTime * 0.5) {
      recommendations.push('Optimize AST parsing by using faster parsers or caching parsed results');
      recommendations.push('Implement early exit strategies for files without SVG content');
    }

    // File I/O optimization
    if (metrics.integrationTime > 5000) {
      recommendations.push('Batch file write operations to reduce I/O overhead');
      recommendations.push('Use atomic file operations to prevent corruption during writes');
    }

    // Scalability recommendations
    if (config.syntheticFileCount && config.syntheticFileCount > 100) {
      if (metrics.totalTime > config.syntheticFileCount * 50) { // More than 50ms per file
        recommendations.push('Performance degrades with scale - implement worker threads for CPU-intensive tasks');
      }
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('Performance is within acceptable limits - no immediate optimizations needed');
    }
  }

  /**
   * Check if performance meets defined thresholds
   */
  private checkPerformanceThresholds(
    metrics: PerformanceMetrics,
    config: PerformanceTestConfig,
    errors: string[]
  ): boolean {
    let success = true;

    // Check execution time threshold
    if (config.maxExecutionTime && metrics.totalTime > config.maxExecutionTime) {
      errors.push(`Execution time ${metrics.totalTime.toFixed(2)}ms exceeds limit ${config.maxExecutionTime}ms`);
      success = false;
    }

    // Check memory usage threshold
    if (config.maxMemoryUsage && metrics.peakMemoryUsage > config.maxMemoryUsage) {
      errors.push(`Peak memory usage ${metrics.peakMemoryUsage.toFixed(2)}MB exceeds limit ${config.maxMemoryUsage}MB`);
      success = false;
    }

    // Check for reasonable processing rates
    if (metrics.filesPerSecond < 1) {
      errors.push(`Processing rate too slow: ${metrics.filesPerSecond.toFixed(2)} files/second`);
      success = false;
    }

    return success;
  }
}

/**
 * Utility function to run a quick performance test
 */
export async function runQuickPerformanceTest(): Promise<PerformanceTestResult> {
  const tester = new PerformanceTester();
  return tester.runPerformanceTest({
    name: 'Quick Performance Test',
    includeConsolidation: false,
    performWrites: false,
    maxExecutionTime: 30000,
    maxMemoryUsage: 200
  });
}

/**
 * Utility function to run the full performance test suite
 */
export async function runFullPerformanceTestSuite(): Promise<PerformanceTestResult[]> {
  const tester = new PerformanceTester();
  return tester.runPerformanceTestSuite();
}

/**
 * Utility function to generate and save a performance report
 */
export async function generatePerformanceReport(outputPath = 'svg-consolidation-performance-report.md'): Promise<void> {
  const tester = new PerformanceTester();
  const results = await tester.runPerformanceTestSuite();
  const report = tester.generatePerformanceReport(results);

  await fs.promises.writeFile(outputPath, report, 'utf-8');
  console.log(`Performance report saved to: ${outputPath}`);
}