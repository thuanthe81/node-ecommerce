#!/usr/bin/env node

/**
 * CLI tool for SVG consolidation performance testing
 * Requirements: 10.2 - Create consolidation CLI tool
 */

import { Command } from 'commander';
import {
  PerformanceTester,
  runQuickPerformanceTest,
  runFullPerformanceTestSuite,
  generatePerformanceReport
} from './svg-audit/performance-tester';
import {
  createOptimizedPerformanceSystem,
  runOptimizedAuditAndConsolidation
} from './svg-audit/performance-optimizer';

// CLI Program setup
const program = new Command();
program
  .name('svg-performance')
  .description('SVG Consolidation Performance Testing CLI')
  .version('1.0.0');

// Quick performance test command
program
  .command('quick')
  .description('Run a quick performance test on the current codebase')
  .option('-v, --verbose', 'Enable verbose output')
  .action(async (options: any) => {
    console.log('🚀 Running quick performance test...\n');

    try {
      const result = await runQuickPerformanceTest();

      console.log('=== Quick Performance Test Results ===');
      console.log(`✓ Execution Time: ${result.metrics.totalTime.toFixed(2)}ms`);
      console.log(`✓ Files Processed: ${result.metrics.filesProcessed}`);
      console.log(`✓ SVGs Found: ${result.metrics.svgsProcessed}`);
      console.log(`✓ Processing Rate: ${result.metrics.filesPerSecond.toFixed(2)} files/sec`);
      console.log(`✓ Peak Memory: ${result.metrics.peakMemoryUsage.toFixed(2)}MB`);

      if (result.success) {
        console.log('🎉 Test PASSED');
      } else {
        console.log('❌ Test FAILED');
        console.log('Errors:', result.errors.join(', '));
      }

      if (options.verbose) {
        console.log('\n=== Detailed Analysis ===');
        if (result.bottlenecks.length > 0) {
          console.log('Bottlenecks:');
          result.bottlenecks.forEach(b => console.log(`  - ${b}`));
        }
        if (result.recommendations.length > 0) {
          console.log('Recommendations:');
          result.recommendations.forEach(r => console.log(`  - ${r}`));
        }
      }

    } catch (error) {
      console.error('❌ Quick test failed:', error);
      process.exit(1);
    }
  });

// Full test suite command
program
  .command('suite')
  .description('Run the complete performance test suite')
  .option('-o, --output <file>', 'Output report file', 'performance-report.md')
  .option('--no-report', 'Skip generating the report file')
  .action(async (options: any) => {
    console.log('🚀 Running full performance test suite...\n');

    try {
      const results = await runFullPerformanceTestSuite();

      // Generate report if requested
      if (options.report) {
        console.log(`\n📊 Generating report: ${options.output}`);
        const tester = new PerformanceTester();
        const report = tester.generatePerformanceReport(results);

        const fs = await import('fs');
        await fs.promises.writeFile(options.output, report, 'utf-8');
        console.log(`✅ Report saved to: ${options.output}`);
      }

      // Summary
      const passedTests = results.filter(r => r.success).length;
      const totalTests = results.length;

      console.log('\n=== Final Summary ===');
      console.log(`✅ Tests Passed: ${passedTests}/${totalTests}`);
      console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

      if (passedTests === totalTests) {
        console.log('🎉 All tests passed!');
      } else {
        console.log('⚠️  Some tests failed - check the report for details');
        process.exit(1);
      }

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    }
  });

// Custom test command
program
  .command('test')
  .description('Run a custom performance test')
  .option('-f, --files <number>', 'Number of synthetic files to generate', '100')
  .option('-s, --svgs <number>', 'Number of SVGs per file', '10')
  .option('-c, --consolidation', 'Include consolidation in the test')
  .option('-w, --write', 'Perform actual file writes (not dry run)')
  .option('-t, --timeout <ms>', 'Maximum execution time in milliseconds', '30000')
  .option('-m, --memory <mb>', 'Maximum memory usage in MB', '500')
  .option('-v, --verbose', 'Enable verbose output')
  .action(async (options: any) => {
    const fileCount = parseInt(options.files);
    const svgCount = parseInt(options.svgs);
    const timeout = parseInt(options.timeout);
    const memoryLimit = parseInt(options.memory);

    console.log(`🚀 Running custom performance test...`);
    console.log(`📁 Files: ${fileCount}, SVGs per file: ${svgCount}`);
    console.log(`⏱️  Timeout: ${timeout}ms, Memory limit: ${memoryLimit}MB\n`);

    try {
      const tester = new PerformanceTester();
      const result = await tester.runPerformanceTest({
        name: `Custom Test - ${fileCount} files, ${svgCount} SVGs each`,
        syntheticFileCount: fileCount,
        svgsPerFile: svgCount,
        includeConsolidation: options.consolidation,
        performWrites: options.write,
        maxExecutionTime: timeout,
        maxMemoryUsage: memoryLimit
      });

      console.log('=== Custom Test Results ===');
      console.log(`✓ Execution Time: ${result.metrics.totalTime.toFixed(2)}ms`);
      console.log(`✓ Files Processed: ${result.metrics.filesProcessed}`);
      console.log(`✓ SVGs Found: ${result.metrics.svgsProcessed}`);
      console.log(`✓ Processing Rate: ${result.metrics.filesPerSecond.toFixed(2)} files/sec`);
      console.log(`✓ Peak Memory: ${result.metrics.peakMemoryUsage.toFixed(2)}MB`);

      if (result.success) {
        console.log('🎉 Test PASSED');
      } else {
        console.log('❌ Test FAILED');
        console.log('Errors:', result.errors.join(', '));
      }

      if (options.verbose || !result.success) {
        console.log('\n=== Detailed Analysis ===');
        if (result.bottlenecks.length > 0) {
          console.log('Bottlenecks:');
          result.bottlenecks.forEach(b => console.log(`  - ${b}`));
        }
        if (result.recommendations.length > 0) {
          console.log('Recommendations:');
          result.recommendations.forEach(r => console.log(`  - ${r}`));
        }
      }

    } catch (error) {
      console.error('❌ Custom test failed:', error);
      process.exit(1);
    }
  });

// Optimization test command
program
  .command('optimize')
  .description('Test performance optimizations')
  .option('-d, --directory <path>', 'Directory to test', '.')
  .option('-v, --verbose', 'Enable verbose output')
  .action(async (options: any) => {
    console.log('🚀 Testing performance optimizations...\n');

    try {
      const optimizer = createOptimizedPerformanceSystem({
        enableParallelProcessing: true,
        enableMemoryOptimization: true,
        enableCaching: true,
        enableEarlyExit: true
      });

      const metrics = await optimizer.comparePerformance(options.directory);

      console.log('=== Optimization Results ===');
      console.log(`⚡ Baseline Time: ${metrics.baselineTime.toFixed(2)}ms`);
      console.log(`⚡ Optimized Time: ${metrics.optimizedTime.toFixed(2)}ms`);
      console.log(`📈 Performance Improvement: ${metrics.improvementPercentage.toFixed(1)}%`);
      console.log(`💾 Baseline Memory: ${metrics.baselineMemory.toFixed(2)}MB`);
      console.log(`💾 Optimized Memory: ${metrics.optimizedMemory.toFixed(2)}MB`);
      console.log(`📉 Memory Reduction: ${metrics.memoryReductionPercentage.toFixed(1)}%`);
      console.log(`🚀 Processing Rate: ${metrics.optimizedFilesPerSecond.toFixed(2)} files/sec`);

      if (options.verbose) {
        console.log('\n=== Applied Optimizations ===');
        metrics.appliedOptimizations.forEach(opt => console.log(`  ✓ ${opt}`));
      }

      await optimizer.cleanup();

    } catch (error) {
      console.error('❌ Optimization test failed:', error);
      process.exit(1);
    }
  });

// Benchmark command
program
  .command('benchmark')
  .description('Run comprehensive benchmarks')
  .option('-o, --output <file>', 'Output benchmark file', 'benchmark-results.json')
  .action(async (options: any) => {
    console.log('🚀 Running comprehensive benchmarks...\n');

    try {
      const tester = new PerformanceTester();

      // Run multiple test configurations
      const benchmarkConfigs = [
        { name: 'Tiny', files: 10, svgs: 2 },
        { name: 'Small', files: 50, svgs: 5 },
        { name: 'Medium', files: 200, svgs: 10 },
        { name: 'Large', files: 500, svgs: 15 },
        { name: 'XLarge', files: 1000, svgs: 20 }
      ];

      const benchmarkResults = [];

      for (const config of benchmarkConfigs) {
        console.log(`Running ${config.name} benchmark (${config.files} files, ${config.svgs} SVGs each)...`);

        const result = await tester.runPerformanceTest({
          name: `${config.name} Benchmark`,
          syntheticFileCount: config.files,
          svgsPerFile: config.svgs,
          includeConsolidation: false,
          performWrites: false
        });

        benchmarkResults.push({
          name: config.name,
          files: config.files,
          svgs: config.svgs,
          totalSvgs: result.metrics.svgsProcessed,
          executionTime: result.metrics.totalTime,
          filesPerSecond: result.metrics.filesPerSecond,
          peakMemory: result.metrics.peakMemoryUsage,
          success: result.success
        });

        console.log(`  ✓ ${result.metrics.totalTime.toFixed(2)}ms, ${result.metrics.filesPerSecond.toFixed(2)} files/sec`);
      }

      // Save benchmark results
      const fs = await import('fs');
      await fs.promises.writeFile(
        options.output,
        JSON.stringify(benchmarkResults, null, 2),
        'utf-8'
      );

      console.log(`\n📊 Benchmark results saved to: ${options.output}`);
      console.log('\n=== Benchmark Summary ===');

      benchmarkResults.forEach(result => {
        const status = result.success ? '✅' : '❌';
        console.log(`${status} ${result.name}: ${result.executionTime.toFixed(2)}ms (${result.filesPerSecond.toFixed(2)} files/sec)`);
      });

    } catch (error) {
      console.error('❌ Benchmark failed:', error);
      process.exit(1);
    }
  });

// Help command
program
  .command('help')
  .description('Show detailed help and examples')
  .action(() => {
    console.log(`
SVG Consolidation Performance Testing CLI

USAGE:
  svg-performance <command> [options]

COMMANDS:
  quick                    Run a quick performance test
  suite                    Run the complete test suite
  test                     Run a custom performance test
  optimize                 Test performance optimizations
  benchmark                Run comprehensive benchmarks
  help                     Show this help

EXAMPLES:
  # Quick test of current codebase
  svg-performance quick

  # Full test suite with custom report
  svg-performance suite -o my-report.md

  # Custom test with 200 files, 15 SVGs each
  svg-performance test -f 200 -s 15 -c -v

  # Test optimizations on specific directory
  svg-performance optimize -d ./components -v

  # Run benchmarks and save results
  svg-performance benchmark -o results.json

OPTIONS:
  -v, --verbose            Enable verbose output
  -o, --output <file>      Specify output file
  -f, --files <number>     Number of synthetic files
  -s, --svgs <number>      Number of SVGs per file
  -c, --consolidation      Include consolidation testing
  -w, --write              Perform actual file writes
  -t, --timeout <ms>       Maximum execution time
  -m, --memory <mb>        Maximum memory usage
  -d, --directory <path>   Directory to test

For more information, visit: https://github.com/your-repo/svg-consolidation
`);
  });

// Parse command line arguments
program.parse(process.argv);

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}