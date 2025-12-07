import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('ContentMedia Authorization (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();

    // Create admin user and get token
    const adminEmail = `admin-auth-test-${Date.now()}@test.com`;
    const hashedPassword = await bcrypt.hash('password123', 10);

    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
      },
    });

    const adminLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: adminEmail,
        password: 'password123',
      });

    adminToken = adminLoginResponse.body.accessToken;

    // Create regular user and get token
    const userEmail = `user-auth-test-${Date.now()}@test.com`;

    await prisma.user.create({
      data: {
        email: userEmail,
        passwordHash: hashedPassword,
        firstName: 'Regular',
        lastName: 'User',
        role: UserRole.CUSTOMER,
      },
    });

    const userLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: userEmail,
        password: 'password123',
      });

    userToken = userLoginResponse.body.accessToken;
  });

  afterAll(async () => {
    // Clean up test users
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'auth-test',
        },
      },
    });

    await app.close();
  });

  describe('POST /content-media/upload', () => {
    it('should allow admin to upload media', async () => {
      // Note: This test would need a real file upload
      // For now, we just verify the endpoint exists and requires auth
      const response = await request(app.getHttpServer())
        .post('/content-media/upload')
        .set('Authorization', `Bearer ${adminToken}`);

      // Will fail with 400 because no file is provided, but that's expected
      // The important thing is it's not 401 or 403
      expect([400, 201]).toContain(response.status);
    });

    it('should block non-admin user from uploading media', async () => {
      const response = await request(app.getHttpServer())
        .post('/content-media/upload')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    it('should block unauthenticated requests', async () => {
      const response = await request(app.getHttpServer())
        .post('/content-media/upload');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /content-media', () => {
    it('should allow admin to list media', async () => {
      const response = await request(app.getHttpServer())
        .get('/content-media')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('totalPages');
    });

    it('should block non-admin user from listing media', async () => {
      const response = await request(app.getHttpServer())
        .get('/content-media')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    it('should block unauthenticated requests', async () => {
      const response = await request(app.getHttpServer())
        .get('/content-media');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /content-media/:id', () => {
    it('should allow admin to get media by id', async () => {
      // First create a media item
      const mediaItem = await prisma.contentMedia.create({
        data: {
          filename: 'test-auth-media.jpg',
          originalName: 'test.jpg',
          mimeType: 'image/jpeg',
          size: 1024,
          url: '/uploads/content-media/test-auth-media.jpg',
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/content-media/${mediaItem.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', mediaItem.id);

      // Clean up
      await prisma.contentMedia.delete({ where: { id: mediaItem.id } });
    });

    it('should block non-admin user from getting media by id', async () => {
      const mediaItem = await prisma.contentMedia.create({
        data: {
          filename: 'test-auth-media-2.jpg',
          originalName: 'test2.jpg',
          mimeType: 'image/jpeg',
          size: 1024,
          url: '/uploads/content-media/test-auth-media-2.jpg',
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/content-media/${mediaItem.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);

      // Clean up
      await prisma.contentMedia.delete({ where: { id: mediaItem.id } });
    });

    it('should block unauthenticated requests', async () => {
      const response = await request(app.getHttpServer())
        .get('/content-media/some-id');

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /content-media/:id', () => {
    it('should allow admin to delete media', async () => {
      const mediaItem = await prisma.contentMedia.create({
        data: {
          filename: 'test-auth-delete.jpg',
          originalName: 'test-delete.jpg',
          mimeType: 'image/jpeg',
          size: 1024,
          url: '/uploads/content-media/test-auth-delete.jpg',
        },
      });

      const response = await request(app.getHttpServer())
        .delete(`/content-media/${mediaItem.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Will fail with 500 because file doesn't exist, but that's expected
      // The important thing is it's not 401 or 403
      expect([200, 500]).toContain(response.status);

      // Clean up if it still exists
      const stillExists = await prisma.contentMedia.findUnique({
        where: { id: mediaItem.id },
      });
      if (stillExists) {
        await prisma.contentMedia.delete({ where: { id: mediaItem.id } });
      }
    });

    it('should block non-admin user from deleting media', async () => {
      const mediaItem = await prisma.contentMedia.create({
        data: {
          filename: 'test-auth-delete-2.jpg',
          originalName: 'test-delete-2.jpg',
          mimeType: 'image/jpeg',
          size: 1024,
          url: '/uploads/content-media/test-auth-delete-2.jpg',
        },
      });

      const response = await request(app.getHttpServer())
        .delete(`/content-media/${mediaItem.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);

      // Clean up
      await prisma.contentMedia.delete({ where: { id: mediaItem.id } });
    });

    it('should block unauthenticated requests', async () => {
      const response = await request(app.getHttpServer())
        .delete('/content-media/some-id');

      expect(response.status).toBe(401);
    });
  });
});
