#!/usr/bin/env ts-node

/**
 * Order Email Integration Test Runner
 *
 * Runs comprehensive integration tests for order email flow
 * including single email delivery and deduplication under load.
 *
 * Requirements: 2.5, 4.5, 2.4, 4.4
 */

import { execSync } from 'child_process';
import { Logger } from '@nestjs/common';

const logger = new Logger('OrderEmailIntegrationTestRunner');

async function runIntegrationTests(): Promise<void> {
  console.log('🧪 Starting Order Email Integration Tests...\n');

  try {
    // Set test environment
    process.env.NODE_ENV = 'test';

    console.log('📋 Test Configuration:');
    console.log('- Environment: test');
    console.log('- Test file: order-email-integration.e2e-spec.ts');
    console.log('- Focus: Complete order flow with email delivery');
    console.log('- Focus: Deduplication under concurrent load');
    console.log('');

    // Run the specific integration test
    console.log('🚀 Running integration tests...\n');

    const testCommand = 'npm run test:e2e -- --testNamePattern="Order Email Integration" --verbose';

    try {
      const output = execSync(testCommand, {
        encoding: 'utf8',
        stdio: 'inherit',
        cwd: process.cwd()
      });

      console.log('\n✅ Integration tests completed successfully!');

    } catch (error) {
      console.error('\n❌ Integration tests failed:');
      console.error(error);

      console.log('\n🔧 Troubleshooting Tips:');
      console.log('1. Ensure the backend server is running');
      console.log('2. Check database connection');
      console.log('3. Verify email queue service is available');
      console.log('4. Check test database has required test data');
      console.log('');

      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  }
}

async function runSpecificTestSuite(suiteName: string): Promise<void> {
  console.log(`🎯 Running specific test suite: ${suiteName}\n`);

  const testCommands = {
    'complete-flow': 'npm run test:e2e -- --testNamePattern="Test complete order flow with email delivery"',
    'concurrent-load': 'npm run test:e2e -- --testNamePattern="Test deduplication under concurrent load"',
    'special-characters': 'npm run test:e2e -- --testNamePattern="special characters in customer data"',
    'email-clients': 'npm run test:e2e -- --testNamePattern="email formatting in multiple email client"',
    'performance': 'npm run test:e2e -- --testNamePattern="monitor email queue performance under load"'
  };

  const command = testCommands[suiteName as keyof typeof testCommands];

  if (!command) {
    console.error(`❌ Unknown test suite: ${suiteName}`);
    console.log('Available test suites:');
    Object.keys(testCommands).forEach(suite => console.log(`  - ${suite}`));
    process.exit(1);
  }

  try {
    execSync(command, {
      encoding: 'utf8',
      stdio: 'inherit',
      cwd: process.cwd()
    });

    console.log(`\n✅ Test suite "${suiteName}" completed successfully!`);

  } catch (error) {
    console.error(`\n❌ Test suite "${suiteName}" failed:`, error);
    process.exit(1);
  }
}

// Command line interface
const args = process.argv.slice(2);

if (args.length === 0) {
  runIntegrationTests().catch(console.error);
} else if (args[0] === '--suite' && args[1]) {
  runSpecificTestSuite(args[1]).catch(console.error);
} else {
  console.log('Usage:');
  console.log('  npm run ts-node scripts/run-order-email-integration-tests.ts');
  console.log('  npm run ts-node scripts/run-order-email-integration-tests.ts --suite <suite-name>');
  console.log('');
  console.log('Available test suites:');
  console.log('  - complete-flow: Test complete order flow with email delivery');
  console.log('  - concurrent-load: Test deduplication under concurrent load');
  console.log('  - special-characters: Test special characters handling');
  console.log('  - email-clients: Test email client compatibility');
  console.log('  - performance: Test performance under load');
}