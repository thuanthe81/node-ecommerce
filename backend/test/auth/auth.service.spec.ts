import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/auth/auth.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../../src/notifications/services/email.service';
import { EmailTemplateService } from '../../src/notifications/services/email-template.service';
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { RefreshTokenStore } from '../../src/auth/entities/refresh-token.entity';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let emailService: EmailService;
  let emailTemplateService: EmailTemplateService;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
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
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockEmailService = {
    sendEmail: jest.fn(),
  };

  const mockEmailTemplateService = {
    getWelcomeEmailTemplate: jest.fn(),
    getPasswordResetTemplate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: EmailTemplateService, useValue: mockEmailTemplateService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    emailService = module.get<EmailService>(EmailService);
    emailTemplateService = module.get<EmailTemplateService>(
      EmailTemplateService,
    );

    // Clear all mocks before each test
    jest.clearAllMocks();
    RefreshTokenStore.clear();
  });

  describe('register', () => {
    const registerDto = {
      email: 'newuser@example.com',
      password: 'Password123!',
      firstName: 'Jane',
      lastName: 'Smith',
    };

    it('should successfully register a new user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      mockConfigService.get.mockReturnValue('secret');
      mockEmailTemplateService.getWelcomeEmailTemplate.mockReturnValue({
        subject: 'Welcome',
        html: '<p>Welcome</p>',
      });
      mockEmailService.sendEmail.mockResolvedValue(true);

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if user already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should successfully login with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash(loginDto.password, 10);
      const userWithHashedPassword = {
        ...mockUser,
        passwordHash: hashedPassword,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(
        userWithHashedPassword,
      );
      mockJwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      mockConfigService.get.mockReturnValue('secret');

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(loginDto.email);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh token with valid refresh token', async () => {
      const refreshToken = 'valid-refresh-token';
      const storedToken = {
        id: 'token-1',
        userId: mockUser.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };

      jest.spyOn(RefreshTokenStore, 'findByToken').mockReturnValue(storedToken);
      jest.spyOn(RefreshTokenStore, 'deleteByToken').mockImplementation(() => {});
      jest.spyOn(RefreshTokenStore, 'save').mockImplementation(() => {});
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValueOnce('new-access-token').mockReturnValueOnce('new-refresh-token');
      mockConfigService.get.mockReturnValue('secret');

      const result = await service.refreshToken(refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.accessToken).toBe('new-access-token');
    });

    it('should throw UnauthorizedException if refresh token not found', async () => {
      jest.spyOn(RefreshTokenStore, 'findByToken').mockReturnValue(undefined);

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if refresh token is expired', async () => {
      const refreshToken = 'expired-token';
      const expiredToken = {
        id: 'token-1',
        userId: mockUser.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() - 1000),
        createdAt: new Date(),
      };

      jest.spyOn(RefreshTokenStore, 'findByToken').mockReturnValue(expiredToken);
      jest.spyOn(RefreshTokenStore, 'deleteByToken').mockImplementation(() => {});

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should successfully logout with valid refresh token', async () => {
      const refreshToken = 'valid-refresh-token';
      const deleteByTokenSpy = jest.spyOn(RefreshTokenStore, 'deleteByToken').mockImplementation(() => {});

      const result = await service.logout(refreshToken);

      expect(result).toHaveProperty('message');
      expect(deleteByTokenSpy).toHaveBeenCalledWith(refreshToken);
    });

    it('should throw BadRequestException if refresh token is not provided', async () => {
      await expect(service.logout('')).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateUser', () => {
    it('should return user if found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser(mockUser.id);

      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('requestPasswordReset', () => {
    it('should send password reset email if user exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('reset-token');
      mockConfigService.get.mockReturnValue('secret');
      mockEmailTemplateService.getPasswordResetTemplate.mockReturnValue({
        subject: 'Password Reset',
        html: '<p>Reset your password</p>',
      });
      mockEmailService.sendEmail.mockResolvedValue(true);

      const result = await service.requestPasswordReset(mockUser.email);

      expect(result).toHaveProperty('message');
      expect(mockEmailService.sendEmail).toHaveBeenCalled();
    });

    it('should return generic message if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.requestPasswordReset('nonexistent@example.com');

      expect(result).toHaveProperty('message');
      expect(mockEmailService.sendEmail).not.toHaveBeenCalled();
    });
  });
});
