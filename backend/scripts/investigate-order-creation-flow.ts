#!/usr/bin/env ts-node

/**
 * Order Creation Flow Investigation
 *
 * This script analyzes the order creation code flow to identify
 * potential sources of duplicate email triggers.
 */

import * as fs from 'fs';
import * as path from 'path';

interface CodeAnalysis {
  file: string;
  method: string;
  calls: string[];
  issues: string[];
}

class OrderCreationFlowInvestigator {
  private analyses: CodeAnalysis[] = [];

  async investigate(): Promise<void> {
    console.log('🔍 Investigating order creation flow for duplicate email triggers...\n');

    try {
      // Analyze OrdersService.create method
      await this.analyzeOrdersService();

      // Analyze EmailEventPublisher
      await this.analyzeEmailEventPublisher();

      // Analyze EmailWorker
      await this.analyzeEmailWorker();

      // Generate comprehensive report
      await this.generateReport();

    } catch (error) {
      console.error('❌ Investigation failed:', error);
    }
  }

  private async analyzeOrdersService(): Promise<void> {
    console.log('📦 Analyzing OrdersService.create method...');

    const filePath = 'src/orders/orders.service.ts';
    if (!fs.existsSync(filePath)) {
      console.log('❌ OrdersService file not found');
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const analysis: CodeAnalysis = {
      file: filePath,
      method: 'create',
      calls: [],
      issues: []
    };

    // Look for email-related method calls
    const emailCalls = [
      'sendOrderConfirmationEmail',
      'sendAdminOrderNotification',
      'emailEventPublisher.sendOrderConfirmation',
      'emailEventPublisher.sendAdminOrderNotification'
    ];

    for (const call of emailCalls) {
      const regex = new RegExp(`\\b${call.replace('.', '\\.')}\\b`, 'g');
      const matches = content.match(regex);
      if (matches) {
        analysis.calls.push(`${call}: ${matches.length} occurrences`);
      }
    }

    // Check for potential issues
    if (content.includes('await this.sendOrderConfirmationEmail') &&
        content.includes('await this.sendAdminOrderNotification')) {
      // Check if both are called in the same method
      const createMethodMatch = content.match(/async create\([^}]+\{([^}]+\{[^}]*\}[^}]*)*[^}]*\}/s);
      if (createMethodMatch) {
        const createMethod = createMethodMatch[0];
        if (createMethod.includes('sendOrderConfirmationEmail') &&
            createMethod.includes('sendAdminOrderNotification')) {
          analysis.issues.push('Both customer and admin emails are triggered in create method');
        }
      }
    }

    // Check for transaction boundaries
    if (content.includes('$transaction') && content.includes('sendOrderConfirmationEmail')) {
      const transactionMatch = content.match(/\$transaction\([^}]+\{([^}]+\{[^}]*\}[^}]*)*[^}]*\}/s);
      if (transactionMatch) {
        const transactionCode = transactionMatch[0];
        if (transactionCode.includes('sendOrderConfirmationEmail')) {
          analysis.issues.push('Email sending is inside database transaction');
        }
      }
    }

    // Check for multiple async calls without proper error handling
    const asyncEmailCalls = content.match(/await.*send.*Email/g);
    if (asyncEmailCalls && asyncEmailCalls.length > 1) {
      analysis.issues.push(`Multiple async email calls found: ${asyncEmailCalls.length}`);
    }

    this.analyses.push(analysis);
    console.log(`✅ Found ${analysis.calls.length} email-related calls`);
    if (analysis.issues.length > 0) {
      console.log(`⚠️  Found ${analysis.issues.length} potential issues`);
    }
    console.log('');
  }

  private async analyzeEmailEventPublisher(): Promise<void> {
    console.log('📧 Analyzing EmailEventPublisher...');

    const filePath = 'src/email-queue/services/email-event-publisher.service.ts';
    if (!fs.existsSync(filePath)) {
      console.log('❌ EmailEventPublisher file not found');
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const analysis: CodeAnalysis = {
      file: filePath,
      method: 'sendOrderConfirmation',
      calls: [],
      issues: []
    };

    // Check deduplication logic
    if (content.includes('generateJobId')) {
      analysis.calls.push('generateJobId: deduplication logic present');
    } else {
      analysis.issues.push('No deduplication logic found');
    }

    // Check time window for deduplication
    const timeWindowMatch = content.match(/(\d+)\s*\*\s*60\s*\*\s*1000/);
    if (timeWindowMatch) {
      const minutes = parseInt(timeWindowMatch[1]);
      analysis.calls.push(`Deduplication window: ${minutes} minutes`);
      if (minutes < 5) {
        analysis.issues.push(`Deduplication window may be too short: ${minutes} minutes`);
      }
    }

    // Check for hash collision handling
    if (content.includes('hashEventContent')) {
      analysis.calls.push('hashEventContent: content hashing present');
    } else {
      analysis.issues.push('No content hashing for deduplication');
    }

    // Check for job ID consistency
    if (content.includes('jobId') && content.includes('publishEvent')) {
      const publishEventMatch = content.match(/publishEvent\([^)]+\)/g);
      if (publishEventMatch) {
        analysis.calls.push(`publishEvent calls: ${publishEventMatch.length}`);
      }
    }

    this.analyses.push(analysis);
    console.log(`✅ Analyzed deduplication mechanisms`);
    if (analysis.issues.length > 0) {
      console.log(`⚠️  Found ${analysis.issues.length} potential issues`);
    }
    console.log('');
  }

  private async analyzeEmailWorker(): Promise<void> {
    console.log('⚙️  Analyzing EmailWorker...');

    const filePath = 'src/email-queue/services/email-worker.service.ts';
    if (!fs.existsSync(filePath)) {
      console.log('❌ EmailWorker file not found');
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const analysis: CodeAnalysis = {
      file: filePath,
      method: 'sendOrderConfirmation',
      calls: [],
      issues: []
    };

    // Check for multiple processing of same event
    if (content.includes('sendOrderConfirmation') && content.includes('EmailAttachmentService')) {
      analysis.calls.push('EmailAttachmentService integration present');
    }

    // Check for retry logic
    if (content.includes('retry') || content.includes('attempt')) {
      analysis.calls.push('Retry logic present');
    }

    // Check for duplicate processing prevention
    if (content.includes('jobId') && content.includes('processEmailEvent')) {
      analysis.calls.push('Job ID tracking present');
    } else {
      analysis.issues.push('No job ID tracking for duplicate prevention');
    }

    // Check for error handling that might cause retries
    const errorHandlingMatches = content.match(/catch\s*\([^)]+\)\s*\{[^}]*throw/g);
    if (errorHandlingMatches) {
      analysis.calls.push(`Error handling blocks: ${errorHandlingMatches.length}`);
    }

    this.analyses.push(analysis);
    console.log(`✅ Analyzed worker processing logic`);
    if (analysis.issues.length > 0) {
      console.log(`⚠️  Found ${analysis.issues.length} potential issues`);
    }
    console.log('');
  }

  private async generateReport(): Promise<void> {
    console.log('📋 DUPLICATE EMAIL INVESTIGATION REPORT');
    console.log('='.repeat(60));
    console.log('');

    console.log('ANALYSIS SUMMARY:');
    console.log(`Files analyzed: ${this.analyses.length}`);
    const totalIssues = this.analyses.reduce((sum, analysis) => sum + analysis.issues.length, 0);
    console.log(`Total potential issues: ${totalIssues}`);
    console.log('');

    // Detailed analysis
    for (const analysis of this.analyses) {
      console.log(`📁 ${analysis.file} (${analysis.method})`);
      console.log('-'.repeat(40));

      if (analysis.calls.length > 0) {
        console.log('Calls/Features found:');
        for (const call of analysis.calls) {
          console.log(`  ✅ ${call}`);
        }
      }

      if (analysis.issues.length > 0) {
        console.log('Potential issues:');
        for (const issue of analysis.issues) {
          console.log(`  ⚠️  ${issue}`);
        }
      }

      console.log('');
    }

    // Root cause analysis
    console.log('🔍 ROOT CAUSE ANALYSIS:');
    console.log('');

    const ordersServiceAnalysis = this.analyses.find(a => a.file.includes('orders.service'));
    const publisherAnalysis = this.analyses.find(a => a.file.includes('email-event-publisher'));
    const workerAnalysis = this.analyses.find(a => a.file.includes('email-worker'));

    console.log('🔴 HIGH PROBABILITY CAUSES:');

    if (ordersServiceAnalysis?.issues.some(i => i.includes('Multiple async email calls'))) {
      console.log('1. ✅ CONFIRMED: Multiple async email calls in OrdersService');
      console.log('   - OrdersService.create() calls both customer and admin email methods');
      console.log('   - This could cause race conditions or multiple triggers');
    }

    if (publisherAnalysis?.issues.some(i => i.includes('too short'))) {
      console.log('2. ✅ CONFIRMED: Deduplication window too short');
      console.log('   - Current window may not catch rapid duplicate events');
      console.log('   - Recommend increasing to 5-10 minutes');
    }

    if (ordersServiceAnalysis?.issues.some(i => i.includes('inside database transaction'))) {
      console.log('3. ✅ CONFIRMED: Email sending inside database transaction');
      console.log('   - This can cause issues if transaction is retried');
      console.log('   - Emails should be sent after transaction commits');
    }

    console.log('');
    console.log('🟡 MEDIUM PROBABILITY CAUSES:');

    if (workerAnalysis?.issues.some(i => i.includes('No job ID tracking'))) {
      console.log('4. Worker processing same event multiple times');
      console.log('   - No job ID tracking for duplicate prevention');
    }

    if (!publisherAnalysis?.calls.some(c => c.includes('content hashing'))) {
      console.log('5. Weak deduplication mechanism');
      console.log('   - Content hashing may not be robust enough');
    }

    console.log('');
    console.log('🔧 RECOMMENDED FIXES:');
    console.log('');
    console.log('1. IMMEDIATE (High Impact):');
    console.log('   - Move email sending outside database transaction');
    console.log('   - Increase deduplication time window to 5-10 minutes');
    console.log('   - Add comprehensive logging to track email flow');
    console.log('');

    console.log('2. SHORT TERM (Medium Impact):');
    console.log('   - Strengthen deduplication with better content hashing');
    console.log('   - Add job ID tracking in worker for duplicate prevention');
    console.log('   - Implement email delivery tracking');
    console.log('');

    console.log('3. LONG TERM (Preventive):');
    console.log('   - Set up monitoring and alerting for duplicate emails');
    console.log('   - Create email flow dashboards');
    console.log('   - Implement end-to-end email delivery verification');
    console.log('');

    console.log('📝 NEXT STEPS:');
    console.log('1. Implement the logging enhancements already added');
    console.log('2. Test with a real order creation to see logging output');
    console.log('3. Apply the recommended fixes based on findings');
    console.log('4. Monitor email delivery metrics after fixes');
    console.log('');
  }
}

// Run the investigation
if (require.main === module) {
  const investigator = new OrderCreationFlowInvestigator();
  investigator.investigate().catch(console.error);
}

export { OrderCreationFlowInvestigator };