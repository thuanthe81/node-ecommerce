import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  locale?: 'en' | 'vi';
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  /**
   * Validate email address format
   * @param email - Email address to validate
   * @returns true if email is valid, false otherwise
   */
  private isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
      return false;
    }

    // RFC 5322 compliant email regex (simplified but robust)
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    return emailRegex.test(email);
  }

  /**
   * Send email using swaks command
   * Note: Requires swaks to be installed on the system
   * @param options - Email options including recipient, subject, and HTML content
   * @returns Promise<boolean> - true if email sent successfully, false otherwise
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const { to, subject, html } = options;

      // Validate email address before sending
      if (!this.isValidEmail(to)) {
        this.logger.warn(`Invalid email address: ${to}. Skipping email send.`);
        return false;
      }

      // Get SMTP configuration from environment variables
      const smtpServer = process.env.SMTP_SERVER || 'localhost';
      const smtpPort = process.env.SMTP_PORT || '25';
      const smtpFrom = process.env.SMTP_FROM || 'noreply@ala-market.com';
      const smtpUser = process.env.SMTP_USER || '';
      const smtpPassword = process.env.SMTP_PASSWORD || '';

      // Build swaks command with proper escaping
      let command = `swaks --to "${to}" --from "${smtpFrom}" --server "${smtpServer}:${smtpPort}" --subject "${subject.replace(/"/g, '\\"')}"`;

      // Add authentication if credentials are provided
      if (smtpUser && smtpPassword) {
        command += ` --auth LOGIN --auth-user "${smtpUser}" --auth-password "${smtpPassword}"`;
      }

      // Add HTML body
      command += ` --body "${html.replace(/"/g, '\\"').replace(/\n/g, '\\n')}" --add-header "Content-Type: text/html; charset=UTF-8"`;

      await execAsync(command);

      this.logger.log(
        `Email sent successfully to ${to} with subject: "${subject}"`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${options.to} with subject "${options.subject}":`,
        error.message || error,
      );
      // Don't throw error to prevent email failures from breaking the application
      return false;
    }
  }

  /**
   * Convert HTML to plain text with improved formatting
   * Handles tables, lists, and preserves structure for better readability
   * @param html - HTML content to convert
   * @returns Plain text representation
   */
  private htmlToPlainText(html: string): string {
    let text = html;

    // Handle headings with emphasis
    text = text.replace(
      /<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi,
      '\n\n$1\n' + '='.repeat(50) + '\n',
    );

    // Handle list items with bullets/numbers
    text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, '  • $1\n');
    text = text.replace(/<\/ul>/gi, '\n');
    text = text.replace(/<\/ol>/gi, '\n');

    // Handle table rows and cells
    text = text.replace(/<tr[^>]*>/gi, '\n');
    text = text.replace(/<\/tr>/gi, '');
    text = text.replace(/<td[^>]*>(.*?)<\/td>/gi, '$1 | ');
    text = text.replace(/<th[^>]*>(.*?)<\/th>/gi, '$1 | ');
    text = text.replace(/<\/table>/gi, '\n');

    // Handle line breaks and paragraphs
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<\/p>/gi, '\n\n');
    text = text.replace(/<\/div>/gi, '\n');
    text = text.replace(/<hr\s*\/?>/gi, '\n' + '-'.repeat(50) + '\n');

    // Remove remaining HTML tags
    text = text.replace(/<[^>]+>/g, '');

    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    text = text.replace(/&apos;/g, "'");

    // Clean up excessive whitespace while preserving intentional line breaks
    text = text.replace(/[ \t]+/g, ' '); // Multiple spaces/tabs to single space
    text = text.replace(/\n\s*\n\s*\n/g, '\n\n'); // Multiple blank lines to double newline
    text = text.replace(/^\s+|\s+$/g, ''); // Trim start and end

    return text;
  }
}