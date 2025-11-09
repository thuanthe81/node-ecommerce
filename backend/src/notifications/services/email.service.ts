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
   * Send email using Linux mail command
   * Note: Requires mailutils or similar to be installed on the system
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const { to, subject, html } = options;

      // Convert HTML to plain text for mail command
      const plainText = this.htmlToPlainText(html);

      // Use echo and pipe to mail command
      const command = `echo "${plainText.replace(/"/g, '\\"')}" | mail -s "${subject.replace(/"/g, '\\"')}" "${to}"`;

      await execAsync(command);

      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      // Don't throw error to prevent email failures from breaking the application
    }
  }

  /**
   * Convert HTML to plain text
   */
  private htmlToPlainText(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }
}
