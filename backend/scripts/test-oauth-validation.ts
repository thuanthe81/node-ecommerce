import { ConfigService } from '@nestjs/config';
import { OAuthConfigValidator } from '../src/auth/config/oauth-config.validator';

/**
 * Test script to verify OAuth configuration validation
 * This simulates what happens when the application starts
 */

// Mock ConfigService with missing credentials
class MockConfigService {
  private config: Record<string, string | undefined>;

  constructor(config: Record<string, string | undefined>) {
    this.config = config;
  }

  get<T = any>(key: string): T | undefined {
    return this.config[key] as T | undefined;
  }
}

console.log('Testing OAuth Configuration Validator\n');
console.log('═'.repeat(70));

// Test 1: All credentials present
console.log('\nTest 1: All credentials present');
console.log('─'.repeat(70));
try {
  const configService = new MockConfigService({
    GOOGLE_CLIENT_ID: 'test-google-client-id',
    GOOGLE_CLIENT_SECRET: 'test-google-secret',
    GOOGLE_CALLBACK_URL: 'http://localhost:3001/api/auth/google/callback',
    FACEBOOK_APP_ID: 'test-facebook-app-id',
    FACEBOOK_APP_SECRET: 'test-facebook-secret',
    FACEBOOK_CALLBACK_URL: 'http://localhost:3001/api/auth/facebook/callback',
  });

  const validator = new OAuthConfigValidator(
    configService as unknown as ConfigService,
  );
  validator.validateOAuthConfiguration();
  console.log('✓ Validation passed - all credentials present');
} catch (error) {
  console.error('✗ Unexpected error:', error.message);
}

// Test 2: Missing Google credentials
console.log('\n\nTest 2: Missing Google credentials');
console.log('─'.repeat(70));
try {
  const configService = new MockConfigService({
    FACEBOOK_APP_ID: 'test-facebook-app-id',
    FACEBOOK_APP_SECRET: 'test-facebook-secret',
    FACEBOOK_CALLBACK_URL: 'http://localhost:3001/api/auth/facebook/callback',
  });

  const validator = new OAuthConfigValidator(
    configService as unknown as ConfigService,
  );
  validator.validateOAuthConfiguration();
  console.log('✗ Validation should have failed but passed');
} catch (error) {
  console.log('✓ Validation correctly failed');
  console.log('\nError message preview:');
  console.log(error.message.split('\n').slice(0, 15).join('\n'));
}

// Test 3: Missing Facebook credentials
console.log('\n\nTest 3: Missing Facebook credentials');
console.log('─'.repeat(70));
try {
  const configService = new MockConfigService({
    GOOGLE_CLIENT_ID: 'test-google-client-id',
    GOOGLE_CLIENT_SECRET: 'test-google-secret',
    GOOGLE_CALLBACK_URL: 'http://localhost:3001/api/auth/google/callback',
  });

  const validator = new OAuthConfigValidator(
    configService as unknown as ConfigService,
  );
  validator.validateOAuthConfiguration();
  console.log('✗ Validation should have failed but passed');
} catch (error) {
  console.log('✓ Validation correctly failed');
  console.log('\nError message preview:');
  console.log(error.message.split('\n').slice(0, 15).join('\n'));
}

// Test 4: All credentials missing
console.log('\n\nTest 4: All credentials missing');
console.log('─'.repeat(70));
try {
  const configService = new MockConfigService({});

  const validator = new OAuthConfigValidator(
    configService as unknown as ConfigService,
  );
  validator.validateOAuthConfiguration();
  console.log('✗ Validation should have failed but passed');
} catch (error) {
  console.log('✓ Validation correctly failed');
  console.log('\nFull error message:');
  console.log(error.message);
}

console.log('\n' + '═'.repeat(70));
console.log('All tests completed\n');
