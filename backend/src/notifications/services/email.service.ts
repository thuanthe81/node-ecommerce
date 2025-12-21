import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { FooterSettingsService } from '../../footer-settings/footer-settings.service';
import { SYSTEM } from '../../common/constants';

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
    this.logger.log(`[EmailService] Starting email send process to: ${options.to}`);

    try {
      const { to, subject, html } = options;

      // Validate email address before sending
      if (!this.isValidEmail(to)) {
        this.logger.warn(`[EmailService] Invalid email address: ${to}. Skipping email send.`);
        return false;
      }

      // Get contact email from footer settings to use as "from" address and SMTP user
      const footerSettings = await this.footerSettingsService.getFooterSettings();
      const smtpUser = footerSettings.contactEmail || process.env.SMTP_USER || SYSTEM.EMAIL.DEFAULT_FROM;

      // Get SMTP configuration from environment variables
      const smtpServer = process.env.SMTP_SERVER || SYSTEM.EMAIL.SMTP_SERVER;
      const smtpPort = process.env.SMTP_PORT || SYSTEM.EMAIL.SMTP_PORT;
      const smtpPassword = process.env.SMTP_PASSWORD || '';

      this.logger.log(`[EmailService] SMTP Configuration:`);
      this.logger.log(`  - Server: ${smtpServer}`);
      this.logger.log(`  - Port: ${smtpPort}`);
      this.logger.log(`  - User: ${smtpUser}`);
      this.logger.log(`  - Password: ${smtpPassword ? '[SET]' : '[NOT SET]'}`);
      this.logger.log(`  - Footer Contact Email: ${footerSettings.contactEmail || '[NOT SET]'}`);

      // Check if SMTP configuration is valid
      if (!smtpServer || !smtpPort) {
        this.logger.error(`[EmailService] Missing SMTP server configuration. Server: ${smtpServer}, Port: ${smtpPort}`);
        return false;
      }

      if (!smtpUser || !smtpPassword) {
        this.logger.error(`[EmailService] Missing SMTP authentication. User: ${smtpUser ? '[SET]' : '[NOT SET]'}, Password: ${smtpPassword ? '[SET]' : '[NOT SET]'}`);
        return false;
      }

      // Validate SMTP user email format
      if (!this.isValidEmail(smtpUser)) {
        this.logger.error(`[EmailService] Invalid SMTP user email format: ${smtpUser}`);
        return false;
      }

      // Simplify HTML content to avoid swaks syntax errors
      const simplifiedHtml = this.simplifyHtmlForSwaks(html);
      this.logger.log(`[EmailService] HTML simplified for swaks compatibility`);

      // Build swaks command with proper escaping
      let command = `swaks --to "${to}" --server "${smtpServer}" --port "${smtpPort}" --h-Subject "${this.escapeForShell(subject)}"`;

      // Add authentication if credentials are provided
      if (smtpUser && smtpPassword) {
        command += ` --tls --auth-user "${smtpUser}" --auth-password "${smtpPassword}"`;
      }

      // Add HTML body with proper shell escaping
      command += ` --body ${this.escapeHtmlForSwaks(simplifiedHtml)} --add-header "MIME-Version: 1.0" --add-header "Content-Type: ${SYSTEM.MIME_TYPES.HTML}"`;

      // Log the command for debugging (without sensitive info)
      const debugCommand = command.replace(/--auth-password "[^"]*"/, '--auth-password "[REDACTED]"');
      this.logger.log(`[EmailService] Executing swaks command: ${debugCommand}`);

      this.logger.log(`[EmailService] About to execute swaks command...`);
      const result = await execAsync(command);
      this.logger.log(`[EmailService] Swaks command executed successfully. Output: ${result.stdout || 'No output'}`);
      if (result.stderr) {
        this.logger.warn(`[EmailService] Swaks stderr: ${result.stderr}`);
      }

      this.logger.log(
        `[EmailService] Email sent successfully to ${to} with subject: "${subject}"`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `[EmailService] Failed to send email to ${options.to} with subject "${options.subject}":`,
        error.message || error,
      );
      if (error.stdout) {
        this.logger.error(`[EmailService] Command stdout: ${error.stdout}`);
      }
      if (error.stderr) {
        this.logger.error(`[EmailService] Command stderr: ${error.stderr}`);
      }
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

      // Get contact email from footer settings to use as "from" address and SMTP user
      const footerSettings = await this.footerSettingsService.getFooterSettings();
      const smtpUser = footerSettings.contactEmail || process.env.SMTP_USER || SYSTEM.EMAIL.DEFAULT_FROM;

      // Get SMTP configuration from environment variables
      const smtpServer = process.env.SMTP_SERVER || SYSTEM.EMAIL.SMTP_SERVER;
      const smtpPort = process.env.SMTP_PORT || SYSTEM.EMAIL.SMTP_PORT;
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
      command += ` --attach-type ${SYSTEM.MIME_TYPES.HTML} --attach-body ${this.escapeHtmlForSwaks(simplifiedHtml)}`;

      // Log the command for debugging (without sensitive info)
      const debugCommand = command.replace(/--auth-password "[^"]*"/, '--auth-password "[REDACTED]"');
      this.logger.debug(`Executing swaks command: ${debugCommand}`);

      await execAsync(command, { maxBuffer: 4 * 1024 * 1024 });

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
      '.pdf': SYSTEM.MIME_TYPES.PDF,
      '.jpg': SYSTEM.MIME_TYPES.JPEG,
      '.jpeg': SYSTEM.MIME_TYPES.JPEG,
      '.png': SYSTEM.MIME_TYPES.PNG,
      '.gif': 'image/gif',
      '.txt': SYSTEM.MIME_TYPES.TEXT,
      '.html': SYSTEM.MIME_TYPES.HTML,
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': SYSTEM.MIME_TYPES.JSON,
      '.xml': SYSTEM.MIME_TYPES.XML,
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
   * Escape string for shell command
   * @param str - String to escape
   * @returns Shell-escaped string
   */
  private escapeForShell(str: string): string {
    // Replace double quotes with escaped double quotes
    return str.replace(/"/g, '\\"');
  }

  /**
   * Escape HTML content for swaks command using temporary file approach
   * @param html - HTML content to escape
   * @returns Properly escaped HTML for swaks
   */
  private escapeHtmlForSwaks(html: string): string {
    // For complex HTML, use a temporary file approach
    // This completely avoids shell escaping issues
    const fs = require('fs');
    const path = require('path');
    const os = require('os');

    try {
      // Create a temporary file with the HTML content
      const tempDir = os.tmpdir();
      const tempFile = path.join(tempDir, `swaks-body-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.html`);

      fs.writeFileSync(tempFile, html, 'utf8');

      // Return the file reference for swaks
      return `"$(cat '${tempFile}' && rm '${tempFile}')"`;
    } catch (error) {
      // Fallback to simple escaping if file approach fails
      this.logger.warn(`[EmailService] Temp file approach failed, using fallback escaping: ${error.message}`);
      return `'${html.replace(/'/g, "'\"'\"'")}'`;
    }
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

    // Remove complex style attributes entirely - they cause the most issues
    simplified = simplified.replace(/\s+style="[^"]*"/gi, '');

    // Remove complex class attributes
    simplified = simplified.replace(/\s+class="[^"]*"/gi, '');

    // Remove data attributes that might cause issues
    simplified = simplified.replace(/\s+data-[^=]*="[^"]*"/gi, '');

    // Remove onclick and other event handlers
    simplified = simplified.replace(/\s+on\w+="[^"]*"/gi, '');

    // Remove comments
    simplified = simplified.replace(/<!--[\s\S]*?-->/g, '');

    // Remove empty attributes
    simplified = simplified.replace(/\s+[a-zA-Z-]+=""\s*/g, ' ');

    // Clean up multiple spaces and newlines
    simplified = simplified.replace(/\s+/g, ' ');
    simplified = simplified.replace(/\n+/g, ' ');

    // Remove any remaining problematic characters that might break shell commands
    simplified = simplified.replace(/[`$\\]/g, '');

    // Remove curly braces that can cause shell issues
    simplified = simplified.replace(/[{}]/g, '');

    // Trim whitespace
    simplified = simplified.trim();

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