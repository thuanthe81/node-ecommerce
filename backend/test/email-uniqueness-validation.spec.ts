import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../src/auth/auth.service';
import { UsersService } from '../src/users/users.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmailEventPublisher } from '../src/email-queue/services/email-event-publisher.service';
import {
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

describe('Email Uniqueness Validation', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let prismaService: PrismaService;

  const mockUser = {
    id: 'user-1',
    email: 'existing@example.com',
    passwordHash: 'hashed-password',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.CUSTOMER,
    isEmailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockEmailEventPublisher = {
    sendWelcomeEmail: jest.fn(),
    sendPasswordReset: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EmailEventPublisher, useValue: mockEmailEventPublisher },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('User Registration Email Uniqueness', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'Jane',
      lastName: 'Smith',
    };

    it('should successfully register with unique email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      mockConfigService.get.mockReturnValue('secret');
      mockEmailEventPublisher.sendWelcomeEmail.mockResolvedValue('job-id');

      const result = await authService.register(registerDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
        select: { id: true, email: true },
      });
    });

    it('should throw ConflictException with detailed message when email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(authService.register(registerDto)).rejects.toThrow(
        new ConflictException('An account with this email address already exists. Please use a different email or try logging in.'),
      );
    });

    it('should handle database constraint violation during registration', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      const constraintError = new Error('Unique constraint violation');
      constraintError.code = 'P2002';
      constraintError.meta = { target: ['email'] };
      mockPrismaService.user.create.mockRejectedValue(constraintError);

      await expect(authService.register(registerDto)).rejects.toThrow(
        new ConflictException('An account with this email address already exists. Please use a different email or try logging in.'),
      );
    });
  });

  describe('Email Update Validation', () => {
    const userId = 'user-1';
    const newEmail = 'newemail@example.com';

    it('should successfully update email when new email is unique', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        email: newEmail,
      });

      const result = await usersService.updateEmail(userId, newEmail);

      expect(result.email).toBe(newEmail);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: newEmail },
        select: { id: true, email: true },
      });
    });

    it('should allow user to update to their current email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      const result = await usersService.updateEmail(userId, mockUser.email);

      expect(result.email).toBe(mockUser.email);
    });

    it('should throw BadRequestException when email is already used by another user', async () => {
      const otherUser = { ...mockUser, id: 'other-user-id' };
      mockPrismaService.user.findUnique.mockResolvedValue(otherUser);

      await expect(usersService.updateEmail(userId, newEmail)).rejects.toThrow(
        new BadRequestException('Email address is already in use by another account'),
      );
    });

    it('should handle database constraint violation during email update', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      const constraintError = new Error('Unique constraint violation');
      constraintError.code = 'P2002';
      constraintError.meta = { target: ['email'] };
      mockPrismaService.user.update.mockRejectedValue(constraintError);

      await expect(usersService.updateEmail(userId, newEmail)).rejects.toThrow(
        new BadRequestException('Email address is already in use by another account'),
      );
    });
  });

  describe('OAuth User Creation Email Uniqueness', () => {
    const oauthData = {
      email: 'oauth@example.com',
      firstName: 'OAuth',
      lastName: 'User',
      provider: 'google' as const,
      providerId: 'google-123',
      username: 'oauthuser',
    };

    it('should successfully create OAuth user with unique email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        ...mockUser,
        email: oauthData.email,
        googleId: oauthData.providerId,
      });

      const result = await authService.findOrCreateOAuthUser(oauthData);

      expect(result.email).toBe(oauthData.email);
      expect(result.googleId).toBe(oauthData.providerId);
    });

    it('should link OAuth provider to existing user with same email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        googleId: oauthData.providerId,
      });

      const result = await authService.findOrCreateOAuthUser(oauthData);

      expect(result.id).toBe(mockUser.id);
      expect(result.googleId).toBe(oauthData.providerId);
    });

    it('should handle database constraint violation during OAuth user creation', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      const constraintError = new Error('Unique constraint violation');
      constraintError.code = 'P2002';
      constraintError.meta = { target: ['email'] };
      mockPrismaService.user.create.mockRejectedValue(constraintError);

      await expect(authService.findOrCreateOAuthUser(oauthData)).rejects.toThrow(
        new ConflictException('An account with this email address already exists. Please try logging in with your existing account.'),
      );
    });
  });

  describe('Email Uniqueness Validation Helper', () => {
    it('should return true for unique email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await usersService.validateEmailUniqueness('unique@example.com');

      expect(result).toBe(true);
    });

    it('should throw BadRequestException for duplicate email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        usersService.validateEmailUniqueness('existing@example.com'),
      ).rejects.toThrow(
        new BadRequestException('Email address is already in use by another account'),
      );
    });

    it('should allow email when excluding the same user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await usersService.validateEmailUniqueness(
        'existing@example.com',
        mockUser.id,
      );

      expect(result).toBe(true);
    });
  });
});