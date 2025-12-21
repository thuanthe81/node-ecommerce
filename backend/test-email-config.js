const { execSync } = require('child_process');
require('dotenv').config(); // Load environment variables from .env file

// Test the current email configuration by checking what values would be used
console.log('=== Email Configuration Test ===\n');

// Check environment variables
console.log('Environment Variables:');
console.log('SMTP_SERVER:', process.env.SMTP_SERVER || 'NOT SET');
console.log('SMTP_PORT:', process.env.SMTP_PORT || 'NOT SET');
console.log('SMTP_USER:', process.env.SMTP_USER || 'NOT SET');
console.log('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '[SET]' : 'NOT SET');

// Test swaks command with authentication
const testEmailCommand = `swaks --to "test@example.com" --server "smtp.gmail.com" --port "587" --h-Subject "Test Email" --tls --auth-user "your-email@gmail.com" --auth-password "zylshmakmxcgeepy" --body 'Test email body' --add-header "MIME-Version: 1.0" --add-header "Content-Type: text/html; charset=utf-8"`;

console.log('\n=== Testing swaks command ===');
console.log('Command (with redacted password):');
console.log(testEmailCommand.replace(/--auth-password "[^"]*"/, '--auth-password "[REDACTED]"'));
console.log('\n--- Command Output ---');

try {
  const output = execSync(testEmailCommand, { encoding: 'utf8', timeout: 30000 });
  console.log('SUCCESS:', output);
} catch (error) {
  console.error('ERROR:', error.message);
  if (error.stdout) {
    console.error('Stdout:', error.stdout);
  }
  if (error.stderr) {
    console.error('Stderr:', error.stderr);
  }
}