const { execSync } = require('child_process');

// Test the swaks command with proper Gmail authentication
// Using the SMTP_PASSWORD from .env file
const smtpPassword = 'zylshmakmxcgeepy'; // From .env
const smtpUser = 'your-email@gmail.com'; // This needs to be set

const testEmailCommand = `swaks --to "test@example.com" --server "smtp.gmail.com" --port "587" --h-Subject "Test Email" --tls --auth-user "${smtpUser}" --auth-password "${smtpPassword}" --body 'Test email body' --add-header "MIME-Version: 1.0" --add-header "Content-Type: text/html; charset=utf-8"`;

console.log('Testing swaks command with authentication:');
console.log(testEmailCommand.replace(smtpPassword, '[REDACTED]'));
console.log('\n--- Command Output ---');

try {
  const output = execSync(testEmailCommand, { encoding: 'utf8', timeout: 10000 });
  console.log(output);
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stdout:', error.stdout);
  console.error('Stderr:', error.stderr);
}