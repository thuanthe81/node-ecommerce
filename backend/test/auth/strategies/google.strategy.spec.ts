import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GoogleStrategy } from '../../../src/auth/strategies/google.strategy';
import { AuthService } from '../../../src/auth/auth.service';
import { Profile } from 'passport-google-oauth20';
import { STATUS } from '../../../src/common/constants';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;
  let authService: AuthService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        GOOGLE_CLIENT_ID: 'test-client-id',
        GOOGLE_CLIENT_SECRET: 'test-client-secret',
        GOOGLE_CALLBACK_URL: 'http://localhost:3001/auth/google/callback',
      };
      return config[key];
    }),
  };

  const mockAuthService = {
    validateOAuthUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleStrategy,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    strategy = module.get<GoogleStrategy>(GoogleStrategy);
    authService = module.get<AuthService>(AuthService);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should throw error if Google OAuth credentials are missing', () => {
    const invalidConfigService = {
      get: jest.fn(() => undefined),
    };

    expect(() => {
      new GoogleStrategy(invalidConfigService as any, authService);
    }).toThrow('Google OAuth credentials are not defined in environment variables');
  });

  describe('validate', () => {
    it('should extract user information from Google profile and call validateOAuthUser', async () => {
      const mockProfile: Partial<Profile> = {
        id: 'google-123',
        emails: [{ value: 'test@example.com', verified: true }],
        name: { givenName: 'John', familyName: 'Doe' },
        displayName: 'John Doe',
      };

      const mockAuthResponse = {
        user: {
          id: 'user-1',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: STATUS.USER_ROLES.CUSTOMER,
          isEmailVerified: true,
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockAuthService.validateOAuthUser.mockResolvedValue(mockAuthResponse);

      const done = jest.fn();

      await strategy.validate(
        {}, // req parameter
        'access-token',
        'refresh-token',
        mockProfile as Profile,
        done,
      );

      expect(mockAuthService.validateOAuthUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        provider: 'google',
        providerId: 'google-123',
        username: 'John Doe',
        isEmailVerified: true,
      });

      expect(done).toHaveBeenCalledWith(null, { ...mockAuthResponse, redirect: undefined });
    });

    it('should handle profile without name object', async () => {
      const mockProfile: Partial<Profile> = {
        id: 'google-456',
        emails: [{ value: 'jane@example.com', verified: true }],
        displayName: 'Jane Smith',
      };

      const mockAuthResponse = {
        user: {
          id: 'user-2',
          email: 'jane@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          role: STATUS.USER_ROLES.CUSTOMER,
          isEmailVerified: true,
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockAuthService.validateOAuthUser.mockResolvedValue(mockAuthResponse);

      const done = jest.fn();

      await strategy.validate(
        {}, // req parameter
        'access-token',
        'refresh-token',
        mockProfile as Profile,
        done,
      );

      expect(mockAuthService.validateOAuthUser).toHaveBeenCalledWith({
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        provider: 'google',
        providerId: 'google-456',
        username: 'Jane Smith',
        isEmailVerified: true,
      });

      expect(done).toHaveBeenCalledWith(null, { ...mockAuthResponse, redirect: undefined });
    });

    it('should return error if email is not provided', async () => {
      const mockProfile: Partial<Profile> = {
        id: 'google-789',
        emails: [],
        displayName: 'No Email User',
      };

      const done = jest.fn();

      await strategy.validate(
        {}, // req parameter
        'access-token',
        'refresh-token',
        mockProfile as Profile,
        done,
      );

      expect(done).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Email not provided by Google',
        }),
        false,
      );
    });

    it('should handle errors from validateOAuthUser', async () => {
      const mockProfile: Partial<Profile> = {
        id: 'google-999',
        emails: [{ value: 'error@example.com', verified: true }],
        name: { givenName: 'Error', familyName: 'User' },
        displayName: 'Error User',
      };

      const error = new Error('OAuth validation failed');
      mockAuthService.validateOAuthUser.mockRejectedValue(error);

      const done = jest.fn();

      await strategy.validate(
        {}, // req parameter
        'access-token',
        'refresh-token',
        mockProfile as Profile,
        done,
      );

      expect(done).toHaveBeenCalledWith(error, false);
    });
  });
});
