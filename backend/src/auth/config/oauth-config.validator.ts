import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface OAuthConfig {
  provider: string;
  credentials: {
    clientId: string | undefined;
    clientSecret: string | undefined;
    callbackUrl: string | undefined;
  };
}

@Injectable()
export class OAuthConfigValidator {
  private readonly logger = new Logger(OAuthConfigValidator.name);

  constructor(private configService: ConfigService) {}

  /**
   * Validates that all required OAuth credentials are present
   * Throws an error if any credentials are missing
   */
  validateOAuthConfiguration(): void {
    this.logger.log('Validating OAuth configuration...');

    const configs: OAuthConfig[] = [
      {
        provider: 'Google',
        credentials: {
          clientId: this.configService.get<string>('GOOGLE_CLIENT_ID'),
          clientSecret: this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
          callbackUrl: this.configService.get<string>('GOOGLE_CALLBACK_URL'),
        },
      },
      {
        provider: 'Facebook',
        credentials: {
          clientId: this.configService.get<string>('FACEBOOK_APP_ID'),
          clientSecret: this.configService.get<string>('FACEBOOK_APP_SECRET'),
          callbackUrl: this.configService.get<string>('FACEBOOK_CALLBACK_URL'),
        },
      },
    ];

    const missingCredentials: string[] = [];

    for (const config of configs) {
      const missing = this.validateProviderConfig(config);
      if (missing.length > 0) {
        missingCredentials.push(...missing);
      }
    }

    if (missingCredentials.length > 0) {
      const errorMessage = this.buildErrorMessage(missingCredentials);
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    this.logger.log('OAuth configuration validated successfully');
    this.logConfigurationStatus(configs);
  }

  /**
   * Validates a single provider's configuration
   * Returns an array of missing credential names
   */
  private validateProviderConfig(config: OAuthConfig): string[] {
    const missing: string[] = [];

    if (!config.credentials.clientId) {
      missing.push(
        config.provider === 'Google'
          ? 'GOOGLE_CLIENT_ID'
          : 'FACEBOOK_APP_ID',
      );
    }

    if (!config.credentials.clientSecret) {
      missing.push(
        config.provider === 'Google'
          ? 'GOOGLE_CLIENT_SECRET'
          : 'FACEBOOK_APP_SECRET',
      );
    }

    if (!config.credentials.callbackUrl) {
      missing.push(
        config.provider === 'Google'
          ? 'GOOGLE_CALLBACK_URL'
          : 'FACEBOOK_CALLBACK_URL',
      );
    }

    return missing;
  }

  /**
   * Builds a detailed error message for missing credentials
   */
  private buildErrorMessage(missingCredentials: string[]): string {
    const lines: string[] = [
      '╔════════════════════════════════════════════════════════════════╗',
      '║  OAUTH CONFIGURATION ERROR                                     ║',
      '╚════════════════════════════════════════════════════════════════╝',
      '',
      'The following OAuth environment variables are missing or empty:',
      '',
    ];

    missingCredentials.forEach((credential) => {
      lines.push(`  ✗ ${credential}`);
    });

    lines.push('');
    lines.push('OAuth authentication is required for this application.');
    lines.push('Please configure the missing credentials in your .env file.');
    lines.push('');
    lines.push('Setup instructions:');
    lines.push('');

    if (
      missingCredentials.some((c) =>
        ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_CALLBACK_URL'].includes(c),
      )
    ) {
      lines.push('Google OAuth:');
      lines.push('  1. Visit: https://console.cloud.google.com/apis/credentials');
      lines.push('  2. Create OAuth 2.0 credentials');
      lines.push('  3. Add authorized redirect URI');
      lines.push('  4. Copy Client ID and Client Secret to .env');
      lines.push('');
    }

    if (
      missingCredentials.some((c) =>
        ['FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET', 'FACEBOOK_CALLBACK_URL'].includes(c),
      )
    ) {
      lines.push('Facebook OAuth:');
      lines.push('  1. Visit: https://developers.facebook.com/apps/');
      lines.push('  2. Create a new app or select existing');
      lines.push('  3. Add Facebook Login product');
      lines.push('  4. Configure OAuth redirect URIs');
      lines.push('  5. Copy App ID and App Secret to .env');
      lines.push('');
    }

    lines.push('Example .env configuration:');
    lines.push('');
    lines.push('  GOOGLE_CLIENT_ID=your-google-client-id');
    lines.push('  GOOGLE_CLIENT_SECRET=your-google-client-secret');
    lines.push('  GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback');
    lines.push('');
    lines.push('  FACEBOOK_APP_ID=your-facebook-app-id');
    lines.push('  FACEBOOK_APP_SECRET=your-facebook-app-secret');
    lines.push('  FACEBOOK_CALLBACK_URL=http://localhost:3001/api/auth/facebook/callback');
    lines.push('');
    lines.push('Application startup has been prevented to ensure OAuth is properly configured.');

    return lines.join('\n');
  }

  /**
   * Logs the current configuration status (without exposing secrets)
   */
  private logConfigurationStatus(configs: OAuthConfig[]): void {
    for (const config of configs) {
      const status = {
        provider: config.provider,
        clientId: config.credentials.clientId ? '✓ Configured' : '✗ Missing',
        clientSecret: config.credentials.clientSecret
          ? '✓ Configured'
          : '✗ Missing',
        callbackUrl: config.credentials.callbackUrl || '✗ Missing',
      };

      this.logger.log(
        `${status.provider} OAuth: ClientID ${status.clientId}, ClientSecret ${status.clientSecret}, Callback ${status.callbackUrl}`,
      );
    }
  }
}
