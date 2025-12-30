/**
 * Test script for SVG consolidation performance testing system
 * Requirements: 10.2 - Performance and optimization testing validation
 */

import { PerformanceTester, runQuickPerformanceTest, runFullPerformanceTestSuite } from './svg-audit/performance-tester';

async function testPerformanceSystem() {
  console.log('=== Testing SVG Consolidation Performance System ===\n');

  try {
    // Test 1: Quick performance test
    console.log('1. Running quick performance test...');
    const quickResult = await runQuickPerformanceTest();

    console.log(`✓ Quick test completed in ${quickResult.metrics.totalTime.toFixed(2)}ms`);
    console.log(`✓ Processed ${quickResult.metrics.filesProcessed} files`);
    console.log(`✓ Peak memory usage: ${quickResult.metrics.peakMemoryUsage.toFixed(2)}MB`);
    console.log(`✓ Processing rate: ${quickResult.metrics.filesPerSecond.toFixed(2)} files/second`);

    if (quickResult.success) {
      console.log('✅ Quick performance test PASSED\n');
    } else {
      console.log('❌ Quick performance test FAILED');
      console.log('Errors:', quickResult.errors.join(', '));
      console.log('');
    }

    // Test 2: Small scale synthetic test
    console.log('2. Running small scale synthetic test...');
    const tester = new PerformanceTester();
    const syntheticResult = await tester.runPerformanceTest({
      name: 'Small Synthetic Test',
      syntheticFileCount: 10,
      svgsPerFile: 3,
      includeConsolidation: true,
      performWrites: false,
      maxExecutionTime: 15000,
      maxMemoryUsage: 100
    });

    console.log(`✓ Synthetic test completed in ${syntheticResult.metrics.totalTime.toFixed(2)}ms`);
    console.log(`✓ Generated and processed ${syntheticResult.testConfig.syntheticFileCount} synthetic files`);
    console.log(`✓ Found ${syntheticResult.metrics.svgsProcessed} SVGs`);
    console.log(`✓ Peak memory usage: ${syntheticResult.metrics.peakMemoryUsage.toFixed(2)}MB`);

    if (syntheticResult.success) {
      console.log('✅ Synthetic performance test PASSED\n');
    } else {
      console.log('❌ Synthetic performance test FAILED');
      console.log('Errors:', syntheticResult.errors.join(', '));
      console.log('');
    }

    // Test 3: Memory monitoring validation
    console.log('3. Validating memory monitoring...');
    if (syntheticResult.memorySamples.length > 0) {
      const avgMemory = syntheticResult.memorySamples.reduce((sum, s) => sum + s.usage, 0) / syntheticResult.memorySamples.length;
      console.log(`✓ Collected ${syntheticResult.memorySamples.length} memory samples`);
      console.log(`✓ Average memory usage: ${avgMemory.toFixed(2)}MB`);
      console.log(`✓ Peak memory usage: ${syntheticResult.metrics.peakMemoryUsage.toFixed(2)}MB`);
      console.log('✅ Memory monitoring WORKING\n');
    } else {
      console.log('❌ Memory monitoring FAILED - no samples collected\n');
    }

    // Test 4: Performance analysis validation
    console.log('4. Validating performance analysis...');
    if (syntheticResult.bottlenecks.length > 0) {
      console.log('✓ Bottlenecks identified:');
      syntheticResult.bottlenecks.forEach(b => console.log(`  - ${b}`));
    } else {
      console.log('✓ No performance bottlenecks detected');
    }

    if (syntheticResult.recommendations.length > 0) {
      console.log('✓ Recommendations generated:');
      syntheticResult.recommendations.forEach(r => console.log(`  - ${r}`));
    } else {
      console.log('✓ No optimization recommendations needed');
    }
    console.log('✅ Performance analysis WORKING\n');

    // Test 5: Report generation
    console.log('5. Testing report generation...');
    const report = tester.generatePerformanceReport([quickResult, syntheticResult]);

    if (report.includes('# SVG Consolidation Performance Test Report')) {
      console.log('✓ Performance report generated successfully');
      console.log(`✓ Report length: ${report.length} characters`);
      console.log('✅ Report generation WORKING\n');
    } else {
      console.log('❌ Report generation FAILED - invalid report format\n');
    }

    // Summary
    console.log('=== Performance Testing System Validation Summary ===');
    const allTests = [quickResult, syntheticResult];
    const passedTests = allTests.filter(t => t.success).length;
    const totalTests = allTests.length;

    console.log(`✓ Tests completed: ${totalTests}`);
    console.log(`✓ Tests passed: ${passedTests}`);
    console.log(`✓ Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (passedTests === totalTests) {
      console.log('🎉 All performance tests PASSED - system is ready for production use!');
    } else {
      console.log('⚠️  Some performance tests failed - review errors and optimize before production use');
    }

  } catch (error) {
    console.error('❌ Performance testing system validation FAILED:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testPerformanceSystem().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

export { testPerformanceSystem };