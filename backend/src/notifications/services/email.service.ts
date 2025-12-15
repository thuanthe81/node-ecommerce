import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { FooterSettingsService } from '../../footer-settings/footer-settings.service';

const execAsync = promisify(exec);

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  locale?: 'en' | 'vi';
}

export interface EmailAttachmentOptions extends EmailOptions {
  attachments?: Array<{
    filename: string;
    path: string;
    contentType?: string;
  }>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private footerSettingsService: FooterSettingsService) {}

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

      // Get contact email from footer settings to use as "from" address
      const footerSettings = await this.footerSettingsService.getFooterSettings();
      const smtpFrom = footerSettings.contactEmail || process.env.SMTP_USER || 'noreply@example.com';

      // Get SMTP configuration from environment variables
      const smtpServer = process.env.SMTP_SERVER || 'smtp.gmail.com';
      const smtpPort = process.env.SMTP_PORT || '587';
      const smtpUser = smtpFrom || process.env.SMTP_USER || '';
      const smtpPassword = process.env.SMTP_PASSWORD || '';

      // Build swaks command with proper escaping
      let command = `swaks --to "${to}" --server "${smtpServer}" --port "${smtpPort}" --h-Subject "${subject.replace(/"/g, '\\"')}"`;

      // Add authentication if credentials are provided
      if (smtpUser && smtpPassword) {
        command += ` --tls --auth-user "${smtpUser}" --auth-password "${smtpPassword}"`;
      }

      // Add HTML body
      command += ` --body '${html.replace(/"/g, '\\"').replace(/'/g, "\\'")}' --add-header "MIME-Version: 1.0" --add-header "Content-Type: text/html"`;

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
   * Send email with PDF attachment using swaks command
   * @param options - Email options including attachments
   * @returns Promise<boolean> - true if email sent successfully, false otherwise
   */
  async sendEmailWithAttachment(options: EmailAttachmentOptions): Promise<boolean> {
    try {
      const { to, subject, html, attachments } = options;

      // Validate email address before sending
      if (!this.isValidEmail(to)) {
        this.logger.warn(`Invalid email address: ${to}. Skipping email send.`);
        return false;
      }

      // Get contact email from footer settings to use as "from" address
      const footerSettings = await this.footerSettingsService.getFooterSettings();
      const smtpFrom = footerSettings.contactEmail || process.env.SMTP_USER || 'noreply@example.com';

      // Get SMTP configuration from environment variables
      const smtpServer = process.env.SMTP_SERVER || 'smtp.gmail.com';
      const smtpPort = process.env.SMTP_PORT || '587';
      const smtpUser = smtpFrom || process.env.SMTP_USER || '';
      const smtpPassword = process.env.SMTP_PASSWORD || '';

      // Build swaks command with proper escaping
      let command = `swaks --to "${to}" --server "${smtpServer}" --port "${smtpPort}" --h-Subject "${subject.replace(/"/g, '\\"')}"`;

      // Add authentication if credentials are provided
      if (smtpUser && smtpPassword) {
        command += ` --tls --auth-user "${smtpUser}" --auth-password "${smtpPassword}"`;
      }

      // Add attachments if provided
      if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          // Validate attachment file exists
          const fs = require('fs');
          if (!fs.existsSync(attachment.path)) {
            this.logger.warn(`Attachment file not found: ${attachment.path}`);
            continue;
          }

          // Validate attachment size (max 25MB for email compatibility)
          const stats = fs.statSync(attachment.path);
          const maxSize = 25 * 1024 * 1024; // 25MB
          if (stats.size > maxSize) {
            this.logger.warn(`Attachment too large: ${attachment.path} (${stats.size} bytes, max ${maxSize})`);
            continue;
          }

          // Get content type with proper MIME type for PDF
          const contentType = attachment.contentType || this.getMimeType(attachment.path);

          // Add attachment to swaks command with proper syntax
          // According to swaks documentation, use --attach with file path
          command += ` --attach-type ${contentType} --attach "@${attachment.path}"`;
        }
      }

      // Add HTML body with simplified content to avoid swaks errors
      const simplifiedHtml = this.simplifyHtmlForSwaks(html);

      // When attachments are present, swaks handles MIME structure automatically
      // Just add the body content and let swaks create the multipart structure
      command += ` --attach-type text/html --attach-body '${simplifiedHtml.replace(/'/g, "'\\''")}'`;

      // Log the command for debugging (without sensitive info)
      const debugCommand = command.replace(/--auth-password "[^"]*"/, '--auth-password "[REDACTED]"');
      this.logger.debug(`Executing swaks command: ${debugCommand}`);

      await execAsync(command);

      this.logger.log(
        `Email with ${attachments?.length || 0} attachment(s) sent successfully to ${to} with subject: "${subject}"`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send email with attachment to ${options.to} with subject "${options.subject}":`,
        error.message || error,
      );
      // Don't throw error to prevent email failures from breaking the application
      return false;
    }
  }

  /**
   * Get MIME type based on file extension
   * @param filePath - Path to the file
   * @returns MIME type string
   */
  private getMimeType(filePath: string): string {
    const path = require('path');
    const ext = path.extname(filePath).toLowerCase();

    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.txt': 'text/plain',
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.zip': 'application/zip',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Validate attachment for email client compatibility
   * @param attachment - Attachment to validate
   * @returns Validation result with warnings
   */
  private validateAttachmentCompatibility(attachment: { filename: string; path: string; contentType?: string }): {
    isValid: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];
    const fs = require('fs');

    // Check file size
    const stats = fs.statSync(attachment.path);
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (stats.size > maxSize) {
      warnings.push(`Attachment size (${Math.round(stats.size / 1024 / 1024)}MB) exceeds recommended limit (25MB)`);
    }

    // Check filename for special characters that might cause issues
    const problematicChars = /[<>:"|?*]/;
    if (problematicChars.test(attachment.filename)) {
      warnings.push('Filename contains characters that may cause issues in some email clients');
    }

    // Check for very long filenames
    if (attachment.filename.length > 100) {
      warnings.push('Filename is very long and may be truncated in some email clients');
    }

    return {
      isValid: warnings.length === 0,
      warnings,
    };
  }

  /**
   * Simplify HTML content to avoid swaks syntax errors
   * Enhanced version that handles more complex HTML structures
   * @param html - Original HTML content
   * @returns Simplified HTML content
   */
  private simplifyHtmlForSwaks(html: string): string {
    let simplified = html;

    // Remove complex CSS that might cause issues
    simplified = simplified.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

    // Remove script tags
    simplified = simplified.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

    // Remove link tags (external stylesheets)
    simplified = simplified.replace(/<link[^>]*>/gi, '');

    // Simplify complex style attributes - keep only basic ones
    simplified = simplified.replace(/style="([^"]*)"/gi, (match, styleContent) => {
      // Keep only basic styles that are safe for email
      const safeStyles = styleContent
        .split(';')
        .filter((style: string) => {
          const prop = style.trim().toLowerCase();
          return prop.startsWith('color:') ||
                 prop.startsWith('background-color:') ||
                 prop.startsWith('font-family:') ||
                 prop.startsWith('font-size:') ||
                 prop.startsWith('font-weight:') ||
                 prop.startsWith('text-align:') ||
                 prop.startsWith('padding:') ||
                 prop.startsWith('margin:') ||
                 prop.startsWith('border:') ||
                 prop.startsWith('width:') ||
                 prop.startsWith('height:');
        })
        .join(';');

      return safeStyles ? `style="${safeStyles}"` : '';
    });

    // Remove complex class attributes
    simplified = simplified.replace(/class="[^"]*"/gi, '');

    // Remove data attributes that might cause issues
    simplified = simplified.replace(/data-[^=]*="[^"]*"/gi, '');

    // Remove onclick and other event handlers
    simplified = simplified.replace(/on\w+="[^"]*"/gi, '');

    // Remove comments
    simplified = simplified.replace(/<!--[\s\S]*?-->/g, '');

    // Remove empty attributes
    simplified = simplified.replace(/\s+[a-zA-Z-]+=""\s*/g, ' ');

    // Clean up multiple spaces
    simplified = simplified.replace(/\s+/g, ' ');

    // Ensure proper encoding of special characters for swaks
    simplified = simplified.replace(/'/g, '&#39;');
    simplified = simplified.replace(/"/g, '&quot;');

    // Remove any remaining problematic characters that might break swaks
    simplified = simplified.replace(/[`$\\]/g, '');

    return simplified;
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