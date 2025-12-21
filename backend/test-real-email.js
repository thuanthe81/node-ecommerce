const { execSync } = require('child_process');
require('dotenv').config();

// Test with the actual email from footer settings
const testEmailCommand = `swaks --to "test@example.com" --server "smtp.gmail.com" --port "587" --h-Subject "Test Email" --tls --auth-user "thuanthe81@gmail.com" --auth-password "${process.env.SMTP_PASSWORD}" --body 'Test email body' --add-header "MIME-Version: 1.0" --add-header "Content-Type: text/html; charset=utf-8"`;

console.log('=== Testing with Real Gmail Account ===');
console.log('Email: thuanthe81@gmail.com');
console.log('Password: [REDACTED]');
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