// Direct test of email functionality without going through the API
const { exec } = require('child_process');
const { promisify } = require('util');
require('dotenv').config();

const execAsync = promisify(exec);

async function directEmailTest() {
  console.log('=== Direct Email Test ===\n');

  try {
    // Test the exact same logic as EmailService
    const to = 'test@example.com';
    const subject = 'Test Email from Direct Test';
    const html = '<h1>Test Email</h1><p>This is a test email sent directly.</p>';

    // Use the same SMTP configuration
    const smtpServer = process.env.SMTP_SERVER || 'smtp.gmail.com';
    const smtpPort = process.env.SMTP_PORT || '587';
    const smtpUser = 'thuanthe81@gmail.com'; // From our earlier test
    const smtpPassword = process.env.SMTP_PASSWORD || '';

    console.log('SMTP Configuration:');
    console.log('  Server:', smtpServer);
    console.log('  Port:', smtpPort);
    console.log('  User:', smtpUser);
    console.log('  Password:', smtpPassword ? '[SET]' : '[NOT SET]');

    // Build the exact same command as EmailService would
    let command = `swaks --to "${to}" --server "${smtpServer}" --port "${smtpPort}" --h-Subject "${subject.replace(/"/g, '\\"')}"`;

    if (smtpUser && smtpPassword) {
      command += ` --tls --auth-user "${smtpUser}" --auth-password "${smtpPassword}"`;
    }

    command += ` --body '${html.replace(/"/g, '\\"').replace(/'/g, "\\'")}' --add-header "MIME-Version: 1.0" --add-header "Content-Type: text/html; charset=utf-8"`;

    const debugCommand = command.replace(/--auth-password "[^"]*"/, '--auth-password "[REDACTED]"');
    console.log('\nExecuting command:', debugCommand);

    console.log('\n=== Swaks Output ===');
    const result = await execAsync(command);

    console.log('SUCCESS!');
    console.log('Stdout:', result.stdout);
    if (result.stderr) {
      console.log('Stderr:', result.stderr);
    }

    return true;

  } catch (error) {
    console.log('FAILED!');
    console.error('Error:', error.message);
    if (error.stdout) {
      console.error('Stdout:', error.stdout);
    }
    if (error.stderr) {
      console.error('Stderr:', error.stderr);
    }
    return false;
  }
}

directEmailTest().then(success => {
  console.log('\n=== Final Result ===');
  console.log('Email test successful:', success);
  process.exit(success ? 0 : 1);
});