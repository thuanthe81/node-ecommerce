import { Logger } from '@nestjs/common';
import { EmailFlowLogger } from '../../email-queue/utils/email-flow-logger';
import { HTMLEscapingService } from '../services/html-escaping.service';

/**
 * Email Testing Utilities
 *
 * Provides utilities for testing and verifying email functionality:
 * - Email content formatting verification
 * - Email count tracking per order
 * - Test mode with comprehensive logging
 *
 * Requirements: 4.1, 4.2, 4.3
 */
export class EmailTestingUtils {
  private static readonly logger = new Logger('EmailTestingUtils');
  private static emailCountTracker = new Map<string, number>();
  private static testModeEnabled = false;
  private static testModeOrderIds = new Set<string>();

  /**
   * Verify email content formatting
   * Validates HTML escaping, CSS formatting, and overall structure
   *
   * Requirement 4.1: Add utility to verify email content formatting
   */
  static verifyEmailContentFormatting(
    htmlContent: string,
    textContent: string,
    subject: string,
    orderId?: string
  ): EmailFormattingVerificationResult {
    const timestamp = new Date().toISOString();
    const result: EmailFormattingVerificationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      checks: {
        htmlEscaping: false,
        cssFormatting: false,
        htmlStructure: false,
        textContentPresent: false,
        subjectValid: false,
      },
      timestamp,
      orderId,
    };

    try {
      // Check HTML escaping
      result.checks.htmlEscaping = this.verifyHtmlEscaping(htmlContent, result);

      // Check CSS formatting
      result.checks.cssFormatting = this.verifyCssFormatting(htmlContent, result);

      // Check HTML structure
      result.checks.htmlStructure = this.verifyHtmlStructure(htmlContent, result);

      // Check text content
      result.checks.textContentPresent = this.verifyTextContent(textContent, result);

      // Check subject
      result.checks.subjectValid = this.verifySubject(subject, result);

      // Overall validation
      result.isValid = Object.values(result.checks).every(check => check);

      // Log verification result in test mode
      if (this.testModeEnabled && orderId) {
        const testLogger = EmailFlowLogger.createTestModeLogger(orderId);
        testLogger.logStep('EMAIL_CONTENT_VERIFICATION', {
          result,
          htmlContentLength: htmlContent.length,
          textContentLength: textContent.length,
          subject,
        });
      }

      this.logger.log(`Email content verification completed for order ${orderId || 'unknown'}: ${result.isValid ? 'PASSED' : 'FAILED'}`);

      return result;
    } catch (error) {
      result.isValid = false;
      result.errors.push(`Verification failed: ${error.message}`);

      this.logger.error(`Email content verification error for order ${orderId || 'unknown'}: ${error.message}`);

      return result;
    }
  }

  /**
   * Count emails sent per order
   * Tracks and returns the number of emails sent for a specific order
   *
   * Requirement 4.2: Add utility to count emails sent per order
   */
  static countEmailsForOrder(orderId: string): number {
    return this.emailCountTracker.get(orderId) || 0;
  }

  /**
   * Increment email count for an order
   * Called when an email is sent for an order
   */
  static incrementEmailCount(orderId: string, emailType: string = 'order_confirmation'): void {
    const currentCount = this.emailCountTracker.get(orderId) || 0;
    const newCount = currentCount + 1;
    this.emailCountTracker.set(orderId, newCount);

    // Log email count increment
    this.logger.log(`Email count incremented for order ${orderId}: ${newCount} (type: ${emailType})`);

    // Log in test mode with extra detail
    if (this.testModeEnabled && this.testModeOrderIds.has(orderId)) {
      const testLogger = EmailFlowLogger.createTestModeLogger(orderId);
      testLogger.logStep('EMAIL_COUNT_INCREMENT', {
        orderId,
        emailType,
        previousCount: currentCount,
        newCount,
        timestamp: new Date().toISOString(),
      });
    }

    // Warn if duplicate emails detected
    if (newCount > 1) {
      this.logger.warn(`DUPLICATE EMAIL DETECTED: Order ${orderId} has received ${newCount} emails`);

      if (this.testModeEnabled && this.testModeOrderIds.has(orderId)) {
        const testLogger = EmailFlowLogger.createTestModeLogger(orderId);
        testLogger.logError('DUPLICATE_EMAIL_DETECTED', {
          orderId,
          totalCount: newCount,
          emailType,
        });
      }
    }
  }

  /**
   * Reset email count for an order
   * Useful for testing scenarios
   */
  static resetEmailCount(orderId: string): void {
    this.emailCountTracker.delete(orderId);
    this.logger.log(`Email count reset for order ${orderId}`);
  }

  /**
   * Get all email counts
   * Returns a map of all order IDs and their email counts
   */
  static getAllEmailCounts(): Map<string, number> {
    return new Map(this.emailCountTracker);
  }

  /**
   * Enable test mode with comprehensive logging
   * When enabled, provides detailed logging for email flow debugging
   *
   * Requirement 4.3: Add test mode with comprehensive logging
   */
  static enableTestMode(orderIds?: string[]): void {
    this.testModeEnabled = true;

    if (orderIds) {
      orderIds.forEach(orderId => this.testModeOrderIds.add(orderId));
    }

    this.logger.log(`Test mode enabled for email testing${orderIds ? ` (tracking orders: ${orderIds.join(', ')})` : ' (tracking all orders)'}`);
  }

  /**
   * Disable test mode
   */
  static disableTestMode(): void {
    this.testModeEnabled = false;
    this.testModeOrderIds.clear();
    this.logger.log('Test mode disabled for email testing');
  }

  /**
   * Check if test mode is enabled
   */
  static isTestModeEnabled(): boolean {
    return this.testModeEnabled;
  }

  /**
   * Add order to test mode tracking
   */
  static addOrderToTestMode(orderId: string): void {
    if (this.testModeEnabled) {
      this.testModeOrderIds.add(orderId);
      this.logger.log(`Added order ${orderId} to test mode tracking`);
    }
  }

  /**
   * Remove order from test mode tracking
   */
  static removeOrderFromTestMode(orderId: string): void {
    this.testModeOrderIds.delete(orderId);
    this.logger.log(`Removed order ${orderId} from test mode tracking`);
  }

  /**
   * Get comprehensive test report for an order
   * Provides detailed analysis of email flow for debugging
   */
  static getTestReport(orderId: string): EmailTestReport {
    const emailCount = this.countEmailsForOrder(orderId);
    const isInTestMode = this.testModeOrderIds.has(orderId);

    const report: EmailTestReport = {
      orderId,
      emailCount,
      isInTestMode,
      testModeEnabled: this.testModeEnabled,
      timestamp: new Date().toISOString(),
      status: emailCount === 1 ? 'SUCCESS' : emailCount > 1 ? 'DUPLICATE_DETECTED' : 'NO_EMAILS',
      recommendations: [],
    };

    // Add recommendations based on findings
    if (emailCount === 0) {
      report.recommendations.push('No emails sent - check if order confirmation was triggered');
    } else if (emailCount > 1) {
      report.recommendations.push(`${emailCount} emails sent - investigate duplicate email issue`);
      report.recommendations.push('Check Email Event Publisher deduplication logic');
      report.recommendations.push('Review Email Worker processing for duplicate handling');
    } else {
      report.recommendations.push('Email count is correct (1 email sent)');
    }

    if (!isInTestMode && this.testModeEnabled) {
      report.recommendations.push('Order not in test mode - add to test mode for detailed logging');
    }

    // Log test report generation
    if (this.testModeEnabled && isInTestMode) {
      const testLogger = EmailFlowLogger.createTestModeLogger(orderId);
      testLogger.logStep('TEST_REPORT_GENERATION', report);
    }

    return report;
  }

  /**
   * Clear all tracking data
   * Useful for test cleanup
   */
  static clearAllData(): void {
    this.emailCountTracker.clear();
    this.testModeOrderIds.clear();
    this.testModeEnabled = false;
    this.logger.log('All email testing data cleared');
  }

  // Private helper methods for content verification

  private static verifyHtmlEscaping(htmlContent: string, result: EmailFormattingVerificationResult): boolean {
    const unescapedPatterns = [
      { pattern: /[^&]&[^#\w]/, description: 'Unescaped ampersand (&)' },
      { pattern: /<(?!\/?\w+[^>]*>)/, description: 'Unescaped less-than (<)' },
      { pattern: />(?![^<]*<\/\w+>)/, description: 'Unescaped greater-than (>)' },
      { pattern: /"(?![^<]*>)(?![^&]*;)/, description: 'Unescaped double quote (")' },
    ];

    let hasIssues = false;

    for (const { pattern, description } of unescapedPatterns) {
      if (pattern.test(htmlContent)) {
        result.errors.push(`HTML escaping issue: ${description}`);
        hasIssues = true;
      }
    }

    // Check for proper HTML entities
    const requiredEntities = ['&amp;', '&lt;', '&gt;', '&quot;'];
    const hasEntities = requiredEntities.some(entity => htmlContent.includes(entity));

    if (!hasEntities && htmlContent.length > 100) {
      result.warnings.push('No HTML entities found - content may not contain special characters or escaping may be missing');
    }

    return !hasIssues;
  }

  private static verifyCssFormatting(htmlContent: string, result: EmailFormattingVerificationResult): boolean {
    const cssIssues = [
      { pattern: /style="[^"]*"[^"]*"/, description: 'Unescaped quotes in CSS' },
      { pattern: /javascript:/i, description: 'JavaScript in CSS (security risk)' },
      { pattern: /expression\(/i, description: 'CSS expressions (security risk)' },
      { pattern: /@import/i, description: 'CSS @import (email client compatibility issue)' },
      { pattern: /position:\s*absolute/i, description: 'Absolute positioning (email client compatibility issue)' },
    ];

    let hasIssues = false;

    for (const { pattern, description } of cssIssues) {
      if (pattern.test(htmlContent)) {
        result.errors.push(`CSS formatting issue: ${description}`);
        hasIssues = true;
      }
    }

    // Check for very long CSS lines (email client compatibility)
    const cssLines = htmlContent.match(/style="[^"]*"/g) || [];
    for (const line of cssLines) {
      if (line.length > 1000) {
        result.warnings.push('Very long CSS line detected - may cause email client issues');
      }
    }

    return !hasIssues;
  }

  private static verifyHtmlStructure(htmlContent: string, result: EmailFormattingVerificationResult): boolean {
    const structureChecks = [
      { pattern: /<html[^>]*>/, required: true, description: 'HTML tag' },
      { pattern: /<body[^>]*>/, required: true, description: 'Body tag' },
      { pattern: /<\/html>/, required: true, description: 'Closing HTML tag' },
      { pattern: /<\/body>/, required: true, description: 'Closing body tag' },
    ];

    let hasIssues = false;

    for (const { pattern, required, description } of structureChecks) {
      if (required && !pattern.test(htmlContent)) {
        result.errors.push(`HTML structure issue: Missing ${description}`);
        hasIssues = true;
      }
    }

    // Check for unclosed tags (basic check)
    const openTags = (htmlContent.match(/<\w+[^>]*>/g) || []).length;
    const closeTags = (htmlContent.match(/<\/\w+>/g) || []).length;

    if (Math.abs(openTags - closeTags) > 2) { // Allow some tolerance for self-closing tags
      result.warnings.push('Potential unclosed HTML tags detected');
    }

    return !hasIssues;
  }

  private static verifyTextContent(textContent: string, result: EmailFormattingVerificationResult): boolean {
    if (!textContent || textContent.trim().length === 0) {
      result.errors.push('Text content is missing or empty');
      return false;
    }

    if (textContent.length < 50) {
      result.warnings.push('Text content is very short - may not be complete');
    }

    // Check for HTML tags in text content
    if (/<[^>]+>/.test(textContent)) {
      result.warnings.push('HTML tags found in text content - should be plain text');
    }

    return true;
  }

  private static verifySubject(subject: string, result: EmailFormattingVerificationResult): boolean {
    if (!subject || subject.trim().length === 0) {
      result.errors.push('Email subject is missing or empty');
      return false;
    }

    if (subject.length > 78) {
      result.warnings.push('Email subject is longer than 78 characters - may be truncated by email clients');
    }

    // Check for HTML in subject
    if (/<[^>]+>/.test(subject)) {
      result.errors.push('HTML tags found in email subject - should be plain text');
      return false;
    }

    return true;
  }
}

/**
 * Email formatting verification result
 */
export interface EmailFormattingVerificationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  checks: {
    htmlEscaping: boolean;
    cssFormatting: boolean;
    htmlStructure: boolean;
    textContentPresent: boolean;
    subjectValid: boolean;
  };
  timestamp: string;
  orderId?: string;
}

/**
 * Email test report for comprehensive analysis
 */
export interface EmailTestReport {
  orderId: string;
  emailCount: number;
  isInTestMode: boolean;
  testModeEnabled: boolean;
  timestamp: string;
  status: 'SUCCESS' | 'DUPLICATE_DETECTED' | 'NO_EMAILS';
  recommendations: string[];
}