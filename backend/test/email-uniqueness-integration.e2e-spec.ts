import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../src/auth/auth.service';
import { UsersService } from '../src/users/users.service';

describe('Email Uniqueness Integration (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let authService: AuthService;
  let usersService: UsersService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    authService = moduleFixture.get<AuthService>(AuthService);
    usersService = moduleFixture.get<UsersService>(UsersService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await prismaService.user.deleteMany({
      where: {
        email: {
          in: [
            'test1@example.com',
            'test2@example.com',
            'updated@example.com',
            'oauth@example.com',
            'existing@example.com',
            'original@example.com',
            'constraint-test@example.com',
            'user1@example.com',
            'user2@example.com',
          ],
        },
      },
    });
  });

  describe('Service Layer Email Uniqueness', () => {
    it('should successfully register user with unique email through service', async () => {
      const registerData = {
        email: 'test1@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };

      const result = await authService.register(registerData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result.user.email).toBe(registerData.email);
    });

    it('should reject registration with duplicate email through service', async () => {
      const registerData = {
        email: 'test2@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };

      // First registration should succeed
      await authService.register(registerData);

      // Second registration with same email should fail
      await expect(authService.register(registerData)).rejects.toThrow(
        'An account with this email address already exists. Please use a different email or try logging in.',
      );
    });
  });

  describe('Email Update Through HTTP API', () => {
    let userToken: string;
    let userId: string;

    beforeEach(async () => {
      // Create a test user through service
      const registerData = {
        email: 'original@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };

      const registerResponse = await authService.register(registerData);
      userToken = registerResponse.accessToken;
      userId = registerResponse.user.id;
    });

    it('should successfully update email to unique address', async () => {
      const updateData = {
        email: 'updated@example.com',
      };

      const response = await request(app.getHttpServer())
        .put('/users/email')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.email).toBe(updateData.email);
    });

    it('should reject email update to existing email', async () => {
      // Create another user with the target email
      await prismaService.user.create({
        data: {
          email: 'existing@example.com',
          passwordHash: 'hashed',
          firstName: 'Other',
          lastName: 'User',
          role: 'CUSTOMER',
        },
      });

      const updateData = {
        email: 'existing@example.com',
      };

      const response = await request(app.getHttpServer())
        .put('/users/email')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.message).toContain('already in use');
    });

    it('should allow user to update to their current email', async () => {
      const updateData = {
        email: 'original@example.com',
      };

      const response = await request(app.getHttpServer())
        .put('/users/email')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.email).toBe(updateData.email);
    });
  });

  describe('Database Constraint Enforcement', () => {
    it('should enforce email uniqueness at database level', async () => {
      const email = 'constraint-test@example.com';

      // Create user directly in database
      const user1 = await prismaService.user.create({
        data: {
          email,
          passwordHash: 'hashed1',
          firstName: 'User',
          lastName: 'One',
          role: 'CUSTOMER',
        },
      });

      // Attempt to create another user with same email should fail
      await expect(
        prismaService.user.create({
          data: {
            email,
            passwordHash: 'hashed2',
            firstName: 'User',
            lastName: 'Two',
            role: 'CUSTOMER',
          },
        }),
      ).rejects.toThrow();

      // Clean up
      await prismaService.user.delete({ where: { id: user1.id } });
    });
  });

  describe('OAuth User Creation Email Uniqueness', () => {
    it('should successfully create OAuth user with unique email', async () => {
      const oauthData = {
        email: 'oauth@example.com',
        firstName: 'OAuth',
        lastName: 'User',
        provider: 'google' as const,
        providerId: 'google-123',
        username: 'oauthuser',
      };

      const result = await authService.findOrCreateOAuthUser(oauthData);

      expect(result.email).toBe(oauthData.email);
      expect(result.googleId).toBe(oauthData.providerId);
    });

    it('should link OAuth provider to existing user with same email', async () => {
      // Create existing user
      const existingUser = await prismaService.user.create({
        data: {
          email: 'oauth@example.com',
          passwordHash: 'hashed',
          firstName: 'Existing',
          lastName: 'User',
          role: 'CUSTOMER',
        },
      });

      const oauthData = {
        email: 'oauth@example.com',
        firstName: 'OAuth',
        lastName: 'User',
        provider: 'google' as const,
        providerId: 'google-123',
        username: 'oauthuser',
      };

      const result = await authService.findOrCreateOAuthUser(oauthData);

      expect(result.id).toBe(existingUser.id);
      expect(result.googleId).toBe(oauthData.providerId);
    });
  });

  describe('Service Layer Email Validation', () => {
    it('should validate email uniqueness correctly', async () => {
      // Should return true for unique email
      const result1 = await usersService.validateEmailUniqueness('unique@example.com');
      expect(result1).toBe(true);

      // Create a user
      const user = await prismaService.user.create({
        data: {
          email: 'existing@example.com',
          passwordHash: 'hashed',
          firstName: 'Test',
          lastName: 'User',
          role: 'CUSTOMER',
        },
      });

      // Should throw for duplicate email
      await expect(
        usersService.validateEmailUniqueness('existing@example.com'),
      ).rejects.toThrow('Email address is already in use by another account');

      // Should allow email when excluding the same user
      const result2 = await usersService.validateEmailUniqueness(
        'existing@example.com',
        user.id,
      );
      expect(result2).toBe(true);
    });
  });
});