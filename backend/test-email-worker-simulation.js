// Simulate what the EmailWorker does when processing an ORDER_CONFIRMATION event
const { PrismaClient } = require('@prisma/client');
const { exec } = require('child_process');
const { promisify } = require('util');
require('dotenv').config();

const execAsync = promisify(exec);

class MockEmailService {
  constructor() {
    this.logger = {
      log: (msg) => console.log(`[EmailService] ${msg}`),
      warn: (msg) => console.warn(`[EmailService] ${msg}`),
      error: (msg) => console.error(`[EmailService] ${msg}`)
    };
  }

  isValidEmail(email) {
    if (!email || typeof email !== 'string') {
      return false;
    }
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }

  async sendEmail(options) {
    this.logger.log(`Starting email send process to: ${options.to}`);

    try {
      const { to, subject, html } = options;

      // Validate email address before sending
      if (!this.isValidEmail(to)) {
        this.logger.warn(`Invalid email address: ${to}. Skipping email send.`);
        return false;
      }

      // Get footer settings (simulate)
      const prisma = new PrismaClient();
      const footerSettings = await prisma.footerSettings.findFirst({
        orderBy: { updatedAt: 'desc' },
      });
      await prisma.$disconnect();

      const smtpUser = footerSettings?.contactEmail || process.env.SMTP_USER || 'SYSTEM.EMAIL.DEFAULT_FROM';
      const smtpServer = process.env.SMTP_SERVER || 'SYSTEM.EMAIL.SMTP_SERVER';
      const smtpPort = process.env.SMTP_PORT || 'SYSTEM.EMAIL.SMTP_PORT';
      const smtpPassword = process.env.SMTP_PASSWORD || '';

      this.logger.log(`SMTP Configuration:`);
      this.logger.log(`  - Server: ${smtpServer}`);
      this.logger.log(`  - Port: ${smtpPort}`);
      this.logger.log(`  - User: ${smtpUser}`);
      this.logger.log(`  - Password: ${smtpPassword ? '[SET]' : '[NOT SET]'}`);
      this.logger.log(`  - Footer Contact Email: ${footerSettings?.contactEmail || '[NOT SET]'}`);

      // Check if SMTP configuration is valid
      if (!smtpServer || !smtpPort) {
        this.logger.error(`Missing SMTP server configuration. Server: ${smtpServer}, Port: ${smtpPort}`);
        return false;
      }

      if (!smtpUser || !smtpPassword) {
        this.logger.error(`Missing SMTP authentication. User: ${smtpUser ? '[SET]' : '[NOT SET]'}, Password: ${smtpPassword ? '[SET]' : '[NOT SET]'}`);
        return false;
      }

      // Validate SMTP user email format
      if (!this.isValidEmail(smtpUser)) {
        this.logger.error(`Invalid SMTP user email format: ${smtpUser}`);
        return false;
      }

      // Build swaks command with proper escaping
      let command = `swaks --to "${to}" --server "${smtpServer}" --port "${smtpPort}" --h-Subject "${subject.replace(/"/g, '\\"')}"`;

      // Add authentication if credentials are provided
      if (smtpUser && smtpPassword) {
        command += ` --tls --auth-user "${smtpUser}" --auth-password "${smtpPassword}"`;
      }

      // Add HTML body
      command += ` --body '${html.replace(/"/g, '\\"').replace(/'/g, "\\'")}' --add-header "MIME-Version: 1.0" --add-header "Content-Type: text/html; charset=utf-8"`;

      // Log the command for debugging (without sensitive info)
      const debugCommand = command.replace(/--auth-password "[^"]*"/, '--auth-password "[REDACTED]"');
      this.logger.log(`Executing swaks command: ${debugCommand}`);

      this.logger.log(`About to execute swaks command...`);
      const result = await execAsync(command);
      this.logger.log(`Swaks command executed successfully. Output: ${result.stdout || 'No output'}`);
      if (result.stderr) {
        this.logger.warn(`Swaks stderr: ${result.stderr}`);
      }

      this.logger.log(`Email sent successfully to ${to} with subject: "${subject}"`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to} with subject "${options.subject}":`, error.message || error);
      if (error.stdout) {
        this.logger.error(`Command stdout: ${error.stdout}`);
      }
      if (error.stderr) {
        this.logger.error(`Command stderr: ${error.stderr}`);
      }
      return false;
    }
  }
}

async function simulateEmailWorker() {
  console.log('=== Simulating Email Worker Processing ===\n');

  const emailService = new MockEmailService();

  // Simulate an order confirmation event
  const mockEvent = {
    type: 'ORDER_CONFIRMATION',
    orderId: 'test-order-id',
    locale: 'en',
    timestamp: new Date().toISOString()
  };

  console.log('Processing mock event:', mockEvent);

  // Test the email service directly
  const success = await emailService.sendEmail({
    to: 'test@example.com',
    subject: 'Order Confirmation - Test Order',
    html: '<h1>Thank you for your order!</h1><p>Your order has been confirmed.</p>',
    locale: 'en'
  });

  console.log('\n=== Result ===');
  console.log('Email sent successfully:', success);
}

simulateEmailWorker().catch(console.error);