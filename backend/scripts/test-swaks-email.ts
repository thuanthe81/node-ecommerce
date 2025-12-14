#!/usr/bin/env ts-node

/**
 * Test script for swaks email sending
 *
 * This script tests the swaks email functionality by sending a test email.
 *
 * Usage:
 *   ts-node scripts/test-swaks-email.ts <recipient-email>
 *
 * Example:
 *   ts-node scripts/test-swaks-email.ts test@example.com
 *
 * Prerequisites:
 *   - swaks must be installed on the system
 *   - SMTP configuration must be set in .env file
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as dotenv from 'dotenv';
import * as path from 'path';

const execAsync = promisify(exec);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testSwaksEmail(recipientEmail: string) {
  console.log('🧪 Testing swaks email sending...\n');

  // Get SMTP configuration from environment variables
  const smtpServer = process.env.SMTP_SERVER || 'localhost';
  const smtpPort = process.env.SMTP_PORT || '25';
  const smtpFrom = process.env.SMTP_FROM || 'noreply@alacraft.com';
  const smtpUser = process.env.SMTP_USER || '';
  const smtpPassword = process.env.SMTP_PASSWORD || ''

  console.log('📧 SMTP Configuration:');
  console.log(`   Server: ${smtpServer}:${smtpPort}`);
  console.log(`   From: ${smtpFrom}`);
  console.log(`   To: ${recipientEmail}`);
  console.log(`   Auth: ${smtpUser ? 'Yes (user: ' + smtpUser + ')' : 'No'}\n`);

  // Test HTML email
  const subject = 'Test Email from AlaCraft';
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f8f9fa; }
    .footer { padding: 10px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AlaCraft Test Email</h1>
    </div>
    <div class="content">
      <h2>This is a test email</h2>
      <p>If you're reading this, the swaks email configuration is working correctly!</p>
      <p><strong>Test Details:</strong></p>
      <ul>
        <li>SMTP Server: ${smtpServer}:${smtpPort}</li>
        <li>From: ${smtpFrom}</li>
        <li>Timestamp: ${new Date().toISOString()}</li>
      </ul>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} AlaCraft. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  try {
    // Build swaks command
    let command = `swaks --to "${recipientEmail}" --from "${smtpFrom}" --server "${smtpServer}" --port "${smtpPort}" --h-Subject "${subject}"`;

    // Add authentication if credentials are provided
    if (smtpUser && smtpPassword) {
      command += ` --auth LOGIN --auth-user "${smtpUser}" --auth-password "${smtpPassword}"`;
    }

    // Add HTML body
    command += ` --body '${htmlBody.replace(/"/g, '\\"').replace(/\n/g, '\\n')}" --attach-type "text/html"'`;

    console.log('📤 Sending test email...\n');

    const { stdout, stderr } = await execAsync(command);

    if (stdout) {
      console.log('✅ Command output:');
      console.log(stdout);
    }

    if (stderr) {
      console.log('⚠️  Warnings/Errors:');
      console.log(stderr);
    }

    console.log('\n✅ Test email sent successfully!');
    console.log(`📬 Check ${recipientEmail} for the test email.`);
  } catch (error: any) {
    console.error('\n❌ Failed to send test email:');
    console.error(error.message);

    if (error.message.includes('command not found') || error.message.includes('swaks: not found')) {
      console.error('\n💡 Tip: swaks is not installed. Install it using:');
      console.error('   Ubuntu/Debian: sudo apt-get install swaks');
      console.error('   CentOS/RHEL: sudo yum install swaks');
      console.error('   macOS: brew install swaks');
    }

    process.exit(1);
  }
}

// Main execution
const recipientEmail = process.argv[2];

if (!recipientEmail) {
  console.error('❌ Error: Recipient email is required');
  console.error('\nUsage: ts-node scripts/test-swaks-email.ts <recipient-email>');
  console.error('Example: ts-node scripts/test-swaks-email.ts test@example.com');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(recipientEmail)) {
  console.error('❌ Error: Invalid email address format');
  process.exit(1);
}

testSwaksEmail(recipientEmail).catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});