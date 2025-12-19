import { ConfigService } from '@nestjs/config';
import { OAuthConfigValidator } from '../../../src/auth/config/oauth-config.validator';

describe('OAuthConfigValidator', () => {
  let validator: OAuthConfigValidator;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn(),
    } as any;
    validator = new OAuthConfigValidator(mockConfigService);
  });

  describe('validateOAuthConfiguration', () => {
    it('should pass validation when all OAuth credentials are present', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, string> = {
          GOOGLE_CLIENT_ID: 'test-google-client-id',
          GOOGLE_CLIENT_SECRET: 'test-google-secret',
          GOOGLE_CALLBACK_URL: 'http://localhost:3001/api/auth/google/callback',
          FACEBOOK_APP_ID: 'test-facebook-app-id',
          FACEBOOK_APP_SECRET: 'test-facebook-secret',
          FACEBOOK_CALLBACK_URL:
            'http://localhost:3001/api/auth/facebook/callback',
        };
        return config[key];
      });

      expect(() => validator.validateOAuthConfiguration()).not.toThrow();
    });

    it('should throw error when Google credentials are missing', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, string> = {
          FACEBOOK_APP_ID: 'test-facebook-app-id',
          FACEBOOK_APP_SECRET: 'test-facebook-secret',
          FACEBOOK_CALLBACK_URL:
            'http://localhost:3001/api/auth/facebook/callback',
        };
        return config[key];
      });

      expect(() => validator.validateOAuthConfiguration()).toThrow(
        /GOOGLE_CLIENT_ID/,
      );
      expect(() => validator.validateOAuthConfiguration()).toThrow(
        /GOOGLE_CLIENT_SECRET/,
      );
      expect(() => validator.validateOAuthConfiguration()).toThrow(
        /GOOGLE_CALLBACK_URL/,
      );
    });

    it('should throw error when Facebook credentials are missing', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, string> = {
          GOOGLE_CLIENT_ID: 'test-google-client-id',
          GOOGLE_CLIENT_SECRET: 'test-google-secret',
          GOOGLE_CALLBACK_URL: 'http://localhost:3001/api/auth/google/callback',
        };
        return config[key];
      });

      expect(() => validator.validateOAuthConfiguration()).toThrow(
        /FACEBOOK_APP_ID/,
      );
      expect(() => validator.validateOAuthConfiguration()).toThrow(
        /FACEBOOK_APP_SECRET/,
      );
      expect(() => validator.validateOAuthConfiguration()).toThrow(
        /FACEBOOK_CALLBACK_URL/,
      );
    });

    it('should throw error when all credentials are missing', () => {
      mockConfigService.get.mockReturnValue(undefined);

      expect(() => validator.validateOAuthConfiguration()).toThrow(
        /OAUTH CONFIGURATION ERROR/,
      );
      expect(() => validator.validateOAuthConfiguration()).toThrow(
        /GOOGLE_CLIENT_ID/,
      );
      expect(() => validator.validateOAuthConfiguration()).toThrow(
        /FACEBOOK_APP_ID/,
      );
    });

    it('should include setup instructions in error message', () => {
      mockConfigService.get.mockReturnValue(undefined);

      try {
        validator.validateOAuthConfiguration();
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Setup instructions:');
        expect(error.message).toContain('console.cloud.google.com');
        expect(error.message).toContain('developers.facebook.com');
        expect(error.message).toContain('Example .env configuration:');
      }
    });

    it('should prevent application startup message in error', () => {
      mockConfigService.get.mockReturnValue(undefined);

      try {
        validator.validateOAuthConfiguration();
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain(
          'Application startup has been prevented',
        );
      }
    });

    it('should handle empty string credentials as missing', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, string> = {
          GOOGLE_CLIENT_ID: '',
          GOOGLE_CLIENT_SECRET: '',
          GOOGLE_CALLBACK_URL: '',
          FACEBOOK_APP_ID: '',
          FACEBOOK_APP_SECRET: '',
          FACEBOOK_CALLBACK_URL: '',
        };
        return config[key];
      });

      expect(() => validator.validateOAuthConfiguration()).toThrow(
        /OAUTH CONFIGURATION ERROR/,
      );
    });

    it('should validate only missing provider when one is configured', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, string> = {
          GOOGLE_CLIENT_ID: 'test-google-client-id',
          GOOGLE_CLIENT_SECRET: 'test-google-secret',
          GOOGLE_CALLBACK_URL: 'http://localhost:3001/api/auth/google/callback',
        };
        return config[key];
      });

      try {
        validator.validateOAuthConfiguration();
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('FACEBOOK_APP_ID');
        expect(error.message).toContain('FACEBOOK_APP_SECRET');
        expect(error.message).toContain('FACEBOOK_CALLBACK_URL');
        // The error message should list missing credentials
        const lines = error.message.split('\n');
        const missingSection = lines.slice(
          lines.indexOf('The following OAuth environment variables are missing or empty:'),
          lines.indexOf('OAuth authentication is required for this application.'),
        );
        const missingText = missingSection.join('\n');
        // Only Facebook credentials should be in the missing list
        expect(missingText).toContain('✗ FACEBOOK_APP_ID');
        expect(missingText).not.toContain('✗ GOOGLE_CLIENT_ID');
      }
    });
  });
});
