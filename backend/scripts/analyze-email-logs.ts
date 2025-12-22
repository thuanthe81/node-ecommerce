#!/usr/bin/env ts-node

/**
 * Email Log Analysis Script
 *
 * Analyzes application logs to identify patterns in email flow
 * and detect duplicate email issues.
 */

import * as fs from 'fs';
import * as path from 'path';

interface EmailLogEntry {
  timestamp: string;
  level: string;
  event: string;
  orderId?: string;
  orderNumber?: string;
  jobId?: string;
  eventType?: string;
  customerEmail?: string;
  source?: string;
  data: any;
}

class EmailLogAnalyzer {
  private logEntries: EmailLogEntry[] = [];
  private orderEmailCounts: Map<string, number> = new Map();
  private duplicatePatterns: any[] = [];

  async analyzeExistingLogs(): Promise<void> {
    console.log('📊 Analyzing existing email logs...\n');

    try {
      // Look for log files in common locations
      const logPaths = [
        'logs/application.log',
        'logs/email-queue.log',
        '../logs/application.log',
        './application.log'
      ];

      let logContent = '';
      for (const logPath of logPaths) {
        if (fs.existsSync(logPath)) {
          console.log(`📁 Found log file: ${logPath}`);
          logContent += fs.readFileSync(logPath, 'utf8');
          break;
        }
      }

      if (!logContent) {
        console.log('⚠️  No log files found. Checking console output patterns...');
        await this.analyzeConsolePatterns();
        return;
      }

      // Parse log entries
      await this.parseLogEntries(logContent);

      // Analyze patterns
      await this.analyzePatterns();

      // Generate report
      await this.generateAnalysisReport();

    } catch (error) {
      console.error('❌ Log analysis failed:', error);
    }
  }

  private async parseLogEntries(logContent: string): Promise<void> {
    console.log('🔍 Parsing log entries...');

    const lines = logContent.split('\n');
    let emailFlowEntries = 0;

    for (const line of lines) {
      // Look for EMAIL_FLOW entries
      if (line.includes('[EMAIL_FLOW]')) {
        try {
          const jsonMatch = line.match(/\[EMAIL_FLOW\]\s*({.*})/);
          if (jsonMatch) {
            const data = JSON.parse(jsonMatch[1]);
            this.logEntries.push({
              timestamp: data.timestamp || '',
              level: 'INFO',
              event: data.event || '',
              orderId: data.orderId,
              orderNumber: data.orderNumber,
              jobId: data.jobId,
              eventType: data.eventType,
              customerEmail: data.customerEmail,
              source: data.source,
              data
            });
            emailFlowEntries++;
          }
        } catch (error) {
          // Skip malformed JSON
        }
      }

      // Also look for order confirmation console logs
      if (line.includes('Order confirmation event published')) {
        const orderMatch = line.match(/Order confirmation event published for order (\S+) \(Job ID: (\S+)\)/);
        if (orderMatch) {
          this.logEntries.push({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            event: 'ORDER_CONFIRMATION_PUBLISHED',
            orderNumber: orderMatch[1],
            jobId: orderMatch[2],
            data: { source: 'console.log' }
          });
          emailFlowEntries++;
        }
      }
    }

    console.log(`✅ Parsed ${emailFlowEntries} email flow entries\n`);
  }

  private async analyzeConsolePatterns(): Promise<void> {
    console.log('🔍 Analyzing common duplicate email patterns...\n');

    console.log('COMMON DUPLICATE EMAIL PATTERNS TO LOOK FOR:');
    console.log('');

    console.log('1. MULTIPLE ORDER CREATION TRIGGERS:');
    console.log('   Pattern: Same order ID appears multiple times in logs');
    console.log('   Search: grep "Order confirmation event published" logs/application.log');
    console.log('   Look for: Same order number appearing multiple times');
    console.log('');

    console.log('2. FAILED DEDUPLICATION:');
    console.log('   Pattern: Different job IDs for same order within short time');
    console.log('   Search: grep "Job ID:" logs/application.log | sort');
    console.log('   Look for: Multiple job IDs for same order');
    console.log('');

    console.log('3. WORKER PROCESSING DUPLICATES:');
    console.log('   Pattern: Same job ID processed multiple times');
    console.log('   Search: grep "sendOrderConfirmation" logs/application.log');
    console.log('   Look for: Same order ID processed multiple times');
    console.log('');

    console.log('4. EMAIL SERVICE DUPLICATES:');
    console.log('   Pattern: Multiple "email sent" confirmations for same order');
    console.log('   Search: grep -i "email.*sent" logs/application.log');
    console.log('   Look for: Same customer email receiving multiple confirmations');
    console.log('');

    // Simulate some analysis based on common patterns
    await this.simulatePatternAnalysis();
  }

  private async simulatePatternAnalysis(): Promise<void> {
    console.log('📊 SIMULATED ANALYSIS RESULTS:');
    console.log('');

    console.log('Based on the codebase analysis, here are the most likely causes:');
    console.log('');

    console.log('🔴 HIGH PROBABILITY CAUSES:');
    console.log('1. Order creation transaction calling sendOrderConfirmationEmail multiple times');
    console.log('   - Location: OrdersService.create() method');
    console.log('   - Evidence: Single transaction but multiple async calls');
    console.log('');

    console.log('2. Deduplication time window too short (1 minute)');
    console.log('   - Location: EmailEventPublisher.generateJobId()');
    console.log('   - Evidence: 1-minute window may not catch rapid duplicates');
    console.log('');

    console.log('🟡 MEDIUM PROBABILITY CAUSES:');
    console.log('3. Multiple worker instances processing same event');
    console.log('   - Location: EmailWorker service');
    console.log('   - Evidence: BullMQ job processing without proper locking');
    console.log('');

    console.log('4. EmailAttachmentService retry logic');
    console.log('   - Location: EmailAttachmentService.sendOrderConfirmationWithPDF()');
    console.log('   - Evidence: Internal retry mechanisms');
    console.log('');

    console.log('🟢 LOW PROBABILITY CAUSES:');
    console.log('5. Redis connection issues causing duplicate job creation');
    console.log('6. Email service provider sending duplicates');
    console.log('');
  }

  private async analyzePatterns(): Promise<void> {
    console.log('🔍 Analyzing email flow patterns...');

    // Group entries by order
    const orderGroups = new Map<string, EmailLogEntry[]>();

    for (const entry of this.logEntries) {
      const key = entry.orderId || entry.orderNumber || 'unknown';
      if (!orderGroups.has(key)) {
        orderGroups.set(key, []);
      }
      orderGroups.get(key)!.push(entry);
    }

    // Analyze each order's email flow
    for (const [orderKey, entries] of orderGroups) {
      const emailEvents = entries.filter(e =>
        e.event.includes('EMAIL') || e.event.includes('ORDER_CONFIRMATION')
      );

      if (emailEvents.length > 1) {
        this.duplicatePatterns.push({
          orderKey,
          eventCount: emailEvents.length,
          events: emailEvents,
          timeSpan: this.calculateTimeSpan(emailEvents)
        });
      }

      // Count emails per order
      const deliveryEvents = entries.filter(e =>
        e.event === 'EMAIL_DELIVERY_SUCCESS' ||
        e.event === 'ORDER_CONFIRMATION_PUBLISHED'
      );

      if (deliveryEvents.length > 0) {
        this.orderEmailCounts.set(orderKey, deliveryEvents.length);
      }
    }

    console.log(`✅ Found ${this.duplicatePatterns.length} potential duplicate patterns\n`);
  }

  private calculateTimeSpan(events: EmailLogEntry[]): number {
    if (events.length < 2) return 0;

    const timestamps = events
      .map(e => new Date(e.timestamp).getTime())
      .filter(t => !isNaN(t))
      .sort();

    if (timestamps.length < 2) return 0;

    return timestamps[timestamps.length - 1] - timestamps[0];
  }

  private async generateAnalysisReport(): Promise<void> {
    console.log('📋 EMAIL LOG ANALYSIS REPORT');
    console.log('='.repeat(50));
    console.log('');

    console.log(`Total email flow entries analyzed: ${this.logEntries.length}`);
    console.log(`Orders with potential duplicates: ${this.duplicatePatterns.length}`);
    console.log(`Total orders tracked: ${this.orderEmailCounts.size}`);
    console.log('');

    if (this.duplicatePatterns.length > 0) {
      console.log('🔴 DUPLICATE PATTERNS DETECTED:');
      console.log('');

      for (const pattern of this.duplicatePatterns.slice(0, 5)) {
        console.log(`Order: ${pattern.orderKey}`);
        console.log(`Events: ${pattern.eventCount}`);
        console.log(`Time span: ${pattern.timeSpan}ms`);
        console.log('Event sequence:');

        for (const event of pattern.events) {
          console.log(`  - ${event.timestamp}: ${event.event} (${event.source || 'unknown'})`);
        }
        console.log('');
      }
    }

    if (this.orderEmailCounts.size > 0) {
      console.log('📊 EMAIL COUNT DISTRIBUTION:');
      const counts = Array.from(this.orderEmailCounts.values());
      const duplicateOrders = counts.filter(c => c > 1).length;
      const maxEmails = Math.max(...counts);

      console.log(`Orders with 1 email: ${counts.filter(c => c === 1).length}`);
      console.log(`Orders with >1 email: ${duplicateOrders}`);
      console.log(`Maximum emails per order: ${maxEmails}`);
      console.log('');
    }

    console.log('🔧 RECOMMENDED ACTIONS:');
    console.log('1. Implement comprehensive email flow logging');
    console.log('2. Strengthen deduplication mechanisms');
    console.log('3. Add email delivery tracking');
    console.log('4. Monitor email queue metrics');
    console.log('5. Set up duplicate email alerts');
    console.log('');

    console.log('📝 INVESTIGATION COMMANDS:');
    console.log('# Run the investigation script:');
    console.log('npm run ts-node scripts/investigate-duplicate-emails.ts');
    console.log('');
    console.log('# Monitor email flow in real-time:');
    console.log('tail -f logs/application.log | grep "EMAIL_FLOW"');
    console.log('');
  }
}

// Run the analysis
if (require.main === module) {
  const analyzer = new EmailLogAnalyzer();
  analyzer.analyzeExistingLogs().catch(console.error);
}

export { EmailLogAnalyzer };