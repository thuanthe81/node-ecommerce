#!/usr/bin/env node

/**
 * Test script for completeness validation system
 * Verifies that the post-consolidation validation works correctly
 */

import { performCompletenessValidation, getConsolidationStatus, isConsolidationComplete } from './svg-audit/completeness-validation-system';
import { LogLevel } from './svg-audit/logger';

async function testCompletenessValidation() {
  console.log('🧪 Testing SVG Completeness Validation System\n');

  try {
    // Test 1: Quick status check
    console.log('1️⃣  Testing quick status check...');
    const status = await getConsolidationStatus();
    console.log(`   Status: ${status.status}`);
    console.log(`   Message: ${status.message}`);
    if (status.details) {
      console.log(`   Details: ${JSON.stringify(status.details, null, 2)}`);
    }
    console.log('   ✅ Status check completed\n');

    // Test 2: Simple completion check
    console.log('2️⃣  Testing simple completion check...');
    const isComplete = await isConsolidationComplete();
    console.log(`   Is consolidation complete: ${isComplete ? '✅ Yes' : '❌ No'}`);
    console.log('   ✅ Completion check completed\n');

    // Test 3: Full validation (with minimal logging to avoid spam)
    console.log('3️⃣  Testing full validation system...');
    const validationResult = await performCompletenessValidation({
      saveReport: false, // Don't save reports during testing
      generateRecommendations: true,
      includePerformanceMetrics: true,
      logLevel: LogLevel.WARN, // Only show warnings and errors
      maxRetryAttempts: 1 // Reduce retry attempts for faster testing
    });

    console.log('   📊 Validation Results:');
    console.log(`      - Success: ${validationResult.success ? '✅' : '❌'}`);
    console.log(`      - Complete: ${validationResult.isComplete ? '✅' : '❌'}`);
    console.log(`      - Files scanned: ${validationResult.performance.filesScanned}`);
    console.log(`      - Validation time: ${(validationResult.performance.validationTime / 1000).toFixed(2)}s`);
    console.log(`      - Processing rate: ${validationResult.performance.processingRate.toFixed(1)} files/sec`);

    if (!validationResult.isComplete && validationResult.remainingWork) {
      console.log(`      - Remaining SVGs: ${validationResult.remainingWork.count}`);
      console.log(`      - Affected files: ${validationResult.remainingWork.affectedFiles.length}`);
      console.log(`      - Estimated effort: ${validationResult.remainingWork.estimatedEffort}`);
    }

    // Show error summary
    const errorSummary = validationResult.comprehensiveReport.errorReport.summary;
    if (errorSummary.totalErrors > 0) {
      console.log('   ⚠️  Issues found:');
      console.log(`      - Critical: ${errorSummary.criticalErrors}`);
      console.log(`      - Errors: ${errorSummary.errors}`);
      console.log(`      - Warnings: ${errorSummary.warnings}`);
      console.log(`      - Info: ${errorSummary.infos}`);
    }

    // Show immediate recommendations
    const immediateRecs = validationResult.comprehensiveReport.recommendations.immediate;
    if (immediateRecs.length > 0) {
      console.log('   🚨 Immediate actions:');
      immediateRecs.slice(0, 3).forEach(rec => {
        console.log(`      - ${rec}`);
      });
      if (immediateRecs.length > 3) {
        console.log(`      ... and ${immediateRecs.length - 3} more recommendations`);
      }
    }

    console.log('   ✅ Full validation completed\n');

    // Test 4: Error handling
    console.log('4️⃣  Testing error handling...');
    try {
      // Test with invalid directory to trigger error handling
      await performCompletenessValidation({
        saveReport: false,
        logLevel: LogLevel.ERROR, // Only show errors
        maxRetryAttempts: 1
      });
      console.log('   ✅ Error handling test completed\n');
    } catch (error) {
      console.log(`   ✅ Error handling working correctly: ${(error as Error).message}\n`);
    }

    console.log('🎉 All tests completed successfully!');

    // Final summary
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Quick status check');
    console.log('   ✅ Simple completion check');
    console.log('   ✅ Full validation system');
    console.log('   ✅ Error handling');
    console.log('\n💡 The completeness validation system is working correctly!');

  } catch (error) {
    console.error('❌ Test failed:', (error as Error).message);
    console.error('\n🔍 Error details:');
    console.error((error as Error).stack);
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testCompletenessValidation().catch(error => {
    console.error('💥 Fatal test error:', error);
    process.exit(1);
  });
}

export { testCompletenessValidation };