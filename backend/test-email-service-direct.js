const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// Mock the EmailService logic to test what's happening
async function testEmailServiceLogic() {
  const prisma = new PrismaClient();

  try {
    console.log('=== Testing Email Service Logic Directly ===\n');

    // Get footer settings (same as EmailService does)
    const footerSettings = await prisma.footerSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    console.log('1. Footer Settings:');
    console.log('   Contact Email:', footerSettings?.contactEmail || '[NOT SET]');

    // Determine SMTP user (same logic as EmailService)
    const smtpUser = footerSettings?.contactEmail || process.env.SMTP_USER || 'SYSTEM.EMAIL.DEFAULT_FROM';
    const smtpServer = process.env.SMTP_SERVER || 'SYSTEM.EMAIL.SMTP_SERVER';
    const smtpPort = process.env.SMTP_PORT || 'SYSTEM.EMAIL.SMTP_PORT';
    const smtpPassword = process.env.SMTP_PASSWORD || '';

    console.log('\n2. SMTP Configuration:');
    console.log('   Server:', smtpServer);
    console.log('   Port:', smtpPort);
    console.log('   User:', smtpUser);
    console.log('   Password:', smtpPassword ? '[SET]' : '[NOT SET]');

    // Test email validation (same as EmailService)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    console.log('\n3. Validation Checks:');

    // Check recipient email (example)
    const testRecipient = 'test@example.com';
    const isValidRecipient = emailRegex.test(testRecipient);
    console.log('   Recipient valid:', isValidRecipient, `(${testRecipient})`);

    // Check SMTP server config
    const hasServerConfig = !!(smtpServer && smtpPort);
    console.log('   Server config valid:', hasServerConfig);

    // Check SMTP auth
    const hasAuth = !!(smtpUser && smtpPassword);
    console.log('   Auth config valid:', hasAuth);

    // Check SMTP user email format
    const isValidSmtpUser = emailRegex.test(smtpUser);
    console.log('   SMTP user email valid:', isValidSmtpUser, `(${smtpUser})`);

    console.log('\n4. Overall Status:');
    if (!isValidRecipient) {
      console.log('   ❌ ISSUE: Invalid recipient email');
    } else if (!hasServerConfig) {
      console.log('   ❌ ISSUE: Missing SMTP server configuration');
    } else if (!hasAuth) {
      console.log('   ❌ ISSUE: Missing SMTP authentication');
    } else if (!isValidSmtpUser) {
      console.log('   ❌ ISSUE: Invalid SMTP user email format');
    } else {
      console.log('   ✅ All validations pass - swaks command should execute');

      // Build the command that would be executed
      const subject = 'Test Email';
      const html = '<p>Test email body</p>';

      let command = `swaks --to "${testRecipient}" --server "${smtpServer}" --port "${smtpPort}" --h-Subject "${subject.replace(/"/g, '\\"')}"`;

      if (smtpUser && smtpPassword) {
        command += ` --tls --auth-user "${smtpUser}" --auth-password "${smtpPassword}"`;
      }

      command += ` --body '${html.replace(/"/g, '\\"').replace(/'/g, "\\'")}' --add-header "MIME-Version: 1.0" --add-header "Content-Type: text/html; charset=utf-8"`;

      console.log('\n5. Command that would be executed:');
      const debugCommand = command.replace(/--auth-password "[^"]*"/, '--auth-password "[REDACTED]"');
      console.log('   ', debugCommand);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEmailServiceLogic();