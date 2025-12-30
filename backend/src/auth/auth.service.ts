import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  RefreshToken,
  RefreshTokenStore,
} from './entities/refresh-token.entity';
import { User, UserRole } from '@prisma/client';
import { EmailEventPublisher } from '../email-queue/services/email-event-publisher.service';
import { EmailValidationErrorHandler } from '../common/utils/email-validation-error-handler.util';
import { OAuthUserData, AuthResponse } from './dto/oauth-user.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailEventPublisher: EmailEventPublisher,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName } = registerDto;

    this.logger.log(`User registration attempt`, {
      email: EmailValidationErrorHandler['redactEmail'](email),
      firstName,
      lastName,
      timestamp: new Date().toISOString(),
    });

    // Validate email uniqueness with detailed error message
    const validationResult = await EmailValidationErrorHandler.validateEmailUniqueness(
      email,
      async (email) => {
        return this.prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true },
        });
      },
      {
        email,
        operation: 'registration',
      }
    );

    if (!validationResult.isValid) {
      throw EmailValidationErrorHandler.createExceptionFromValidation(validationResult);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user with database constraint protection
    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          role: UserRole.CUSTOMER,
          isEmailVerified: false,
        },
      });

      EmailValidationErrorHandler.logEmailValidationSuccess({
        email,
        operation: 'registration',
        userId: user.id,
      });

      // Generate tokens
      const tokens = await this.generateTokens(user);

      // Send welcome email
      await this.sendWelcomeEmail(user);

      return {
        user: this.sanitizeUser(user),
        ...tokens,
      };
    } catch (error) {
      const handledException = EmailValidationErrorHandler.handleEmailConstraintViolation(error, {
        email,
        operation: 'registration',
      });
      throw handledException;
    }
  }

  private async validateEmailUniqueness(email: string, excludeUserId?: string) {
    const validationResult = await EmailValidationErrorHandler.validateEmailUniqueness(
      email,
      async (email) => {
        return this.prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true },
        });
      },
      {
        email,
        operation: 'email_uniqueness_check',
        excludeUserId,
      }
    );

    if (!validationResult.isValid) {
      throw EmailValidationErrorHandler.createExceptionFromValidation(validationResult);
    }

    return true;
  }

  /**
   * Send welcome email to new user using event publisher
   */
  private async sendWelcomeEmail(user: User) {
    try {
      const locale = 'en'; // Default to English
      const userName = `${user.firstName} ${user.lastName}`;

      // Publish welcome email event to queue
      const jobId = await this.emailEventPublisher.sendWelcomeEmail(
        user.id,
        user.email,
        userName,
        locale
      );

      console.log(`Welcome email event published for user ${user.email} (Job ID: ${jobId})`);
    } catch (error) {
      console.error('Failed to publish welcome email event:', error);
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user has a password (OAuth users don't have passwords)
    if (!user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    // Find refresh token
    const storedToken = RefreshTokenStore.findByToken(refreshToken);

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      RefreshTokenStore.deleteByToken(refreshToken);
      throw new UnauthorizedException('Refresh token expired');
    }

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { id: storedToken.userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Delete old refresh token
    RefreshTokenStore.deleteByToken(refreshToken);

    // Generate new tokens
    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async logout(refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    RefreshTokenStore.deleteByToken(refreshToken);

    return { message: 'Logged out successfully' };
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // Generate access token (15 minutes)
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: '12h',
    });

    // Generate refresh token (7 days)
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    // Store refresh token
    const refreshTokenEntity: RefreshToken = {
      id: Math.random().toString(36).substring(7),
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: new Date(),
    };

    RefreshTokenStore.save(refreshTokenEntity);

    return {
      accessToken,
      refreshToken,
    };
  }

  private sanitizeUser(user: User) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  /**
   * Find or create OAuth user
   * Implements account linking based on email with enhanced error handling
   */
  async findOrCreateOAuthUser(oauthData: OAuthUserData): Promise<User> {
    const { email, firstName, lastName, provider, providerId, username } =
      oauthData;

    this.logger.log(`OAuth user authentication attempt`, {
      email,
      provider,
      providerId,
      timestamp: new Date().toISOString(),
    });

    try {
      // Check if user exists by email
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        this.logger.log(`Existing user found for OAuth login, linking provider`, {
          userId: existingUser.id,
          email,
          provider,
          timestamp: new Date().toISOString(),
        });
        // User exists - link OAuth provider to existing account
        return this.linkOAuthProvider(
          existingUser.id,
          provider,
          providerId,
          username,
        );
      }

      // User doesn't exist - create new user with OAuth data
      try {
        const newUser = await this.prisma.user.create({
          data: {
            email,
            firstName,
            lastName,
            username,
            role: UserRole.CUSTOMER,
            isEmailVerified: true, // OAuth users have verified emails
            googleId: provider === 'google' ? providerId : null,
            facebookId: provider === 'facebook' ? providerId : null,
            passwordHash: null, // OAuth users don't have passwords
          },
        });

        this.logger.log(`New OAuth user created successfully`, {
          userId: newUser.id,
          email,
          provider,
          timestamp: new Date().toISOString(),
        });

        return newUser;
      } catch (error) {
        const handledException = EmailValidationErrorHandler.handleEmailConstraintViolation(error, {
          email,
          operation: 'oauth_registration',
          provider,
        });
        throw handledException;
      }
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      this.logger.error(`OAuth user authentication failed`, {
        email,
        provider,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * Link OAuth provider to existing user account
   * Maintains multiple provider IDs in user record
   */
  async linkOAuthProvider(
    userId: string,
    provider: 'google' | 'facebook',
    providerId: string,
    username?: string,
  ): Promise<User> {
    // Prepare update data based on provider
    const updateData: any = {};

    if (provider === 'google') {
      updateData.googleId = providerId;
    } else if (provider === 'facebook') {
      updateData.facebookId = providerId;
    }

    // Update username if provided and not already set
    if (username) {
      updateData.username = username;
    }

    // Update user record with OAuth provider information
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return updatedUser;
  }

  /**
   * Validate OAuth user and generate tokens
   */
  async validateOAuthUser(oauthData: OAuthUserData): Promise<AuthResponse> {
    // Find or create user based on OAuth data
    const user = await this.findOrCreateOAuthUser(oauthData);

    // Generate JWT tokens for user
    const tokens = await this.generateTokens(user);

    // Return user and tokens
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // Generate reset token (in production, store this in database with expiry)
    const resetToken = this.jwtService.sign(
      { sub: user.id, email: user.email, type: 'password-reset' },
      {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: '1h',
      },
    );

    // Send password reset email
    await this.sendPasswordResetEmail(user, resetToken);

    return { message: 'If the email exists, a reset link has been sent' };
  }

  /**
   * Send password reset email using event publisher
   */
  private async sendPasswordResetEmail(user: User, resetToken: string) {
    try {
      const locale = 'en'; // Default to English

      // Publish password reset email event to queue
      const jobId = await this.emailEventPublisher.sendPasswordReset(
        user.id,
        user.email,
        resetToken,
        locale
      );

      console.log(`Password reset email event published for user ${user.email} (Job ID: ${jobId})`);
    } catch (error) {
      console.error('Failed to publish password reset email event:', error);
    }
  }
}
