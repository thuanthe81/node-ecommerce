/**
 * Script to run the full SVG consolidation performance test suite
 */

import { runFullPerformanceTestSuite, generatePerformanceReport } from './svg-audit/performance-tester';

async function runPerformanceTests() {
  console.log('🚀 Starting SVG Consolidation Performance Test Suite...\n');

  try {
    // Run the full test suite
    const results = await runFullPerformanceTestSuite();

    // Generate and save the performance report
    console.log('\n📊 Generating performance report...');
    await generatePerformanceReport('svg-consolidation-performance-report.md');

    // Summary
    const passedTests = results.filter(r => r.success).length;
    const totalTests = results.length;

    console.log('\n=== Final Summary ===');
    console.log(`✅ Tests Passed: ${passedTests}/${totalTests}`);
    console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log(`📄 Report saved to: svg-consolidation-performance-report.md`);

    if (passedTests === totalTests) {
      console.log('🎉 All performance tests passed!');
    } else {
      console.log('⚠️  Some tests failed - check the report for details');
    }

  } catch (error) {
    console.error('❌ Performance testing failed:', error);
    process.exit(1);
  }
}

// Run if this script is executed directly
if (require.main === module) {
  runPerformanceTests();
}

export { runPerformanceTests };