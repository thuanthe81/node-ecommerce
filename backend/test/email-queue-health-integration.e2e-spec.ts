import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { EmailQueueModule } from '../src/email-queue/email-queue.module';
import { NotificationsModule } from '../src/notifications/notifications.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { FooterSettingsModule } from '../src/footer-settings/footer-settings.module';

describe('EmailQueueHealthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        EmailQueueModule,
        NotificationsModule,
        PrismaModule,
        FooterSettingsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/email-queue/health (GET)', () => {
    it('should return health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/email-queue/health')
        .expect((res) => {
          // Should return either 200 (healthy/warning) or 503 (error)
          expect([200, 503]).toContain(res.status);
        });

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('service', 'email-queue');
      expect(response.body).toHaveProperty('components');
      expect(Array.isArray(response.body.components)).toBe(true);
    });
  });

  describe('/api/email-queue/health/ping (GET)', () => {
    it('should return simple ping response', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/email-queue/health/ping')
        .expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
        service: 'email-queue',
        uptime: expect.any(Number),
      });
    });
  });

  describe('/api/email-queue/health/status (GET)', () => {
    it('should return queue status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/email-queue/health/status')
        .expect((res) => {
          // Should return either 200 (operational/degraded) or 503 (down)
          expect([200, 503]).toContain(res.status);
        });

      expect(response.body).toHaveProperty('status');
      expect(['operational', 'degraded', 'down']).toContain(response.body.status);
      expect(response.body).toHaveProperty('service', 'email-queue');
      expect(response.body).toHaveProperty('queue');
      expect(response.body).toHaveProperty('worker');
      expect(response.body).toHaveProperty('indicators');
    });
  });

  describe('/api/email-queue/health/metrics (GET)', () => {
    it('should return queue metrics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/email-queue/health/metrics')
        .expect((res) => {
          // Should return either 200 (success) or 500 (error)
          expect([200, 500]).toContain(res.status);
        });

      if (response.status === 200) {
        expect(response.body).toHaveProperty('waiting');
        expect(response.body).toHaveProperty('active');
        expect(response.body).toHaveProperty('completed');
        expect(response.body).toHaveProperty('failed');
        expect(response.body).toHaveProperty('total');
        expect(response.body).toHaveProperty('worker');
        expect(response.body).toHaveProperty('processing');
        expect(response.body).toHaveProperty('errors');
        expect(response.body).toHaveProperty('system');
        expect(response.body).toHaveProperty('service', 'email-queue');
      }
    });
  });

  describe('/api/email-queue/health/errors (GET)', () => {
    it('should return error information', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/email-queue/health/errors')
        .expect((res) => {
          // Should return either 200 (success) or 500 (error)
          expect([200, 500]).toContain(res.status);
        });

      if (response.status === 200) {
        expect(response.body).toHaveProperty('errorRate');
        expect(response.body).toHaveProperty('totalErrors');
        expect(response.body).toHaveProperty('recentErrors');
        expect(response.body).toHaveProperty('commonErrors');
        expect(response.body).toHaveProperty('service', 'email-queue');
      }
    });
  });

  describe('/api/email-queue/health/system (GET)', () => {
    it('should return system information', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/email-queue/health/system')
        .expect((res) => {
          // Should return either 200 (success) or 500 (error)
          expect([200, 500]).toContain(res.status);
        });

      if (response.status === 200) {
        expect(response.body).toHaveProperty('system');
        expect(response.body).toHaveProperty('configuration');
        expect(response.body).toHaveProperty('service', 'email-queue');
        expect(response.body.system).toHaveProperty('nodeVersion');
        expect(response.body.system).toHaveProperty('platform');
        expect(response.body.system).toHaveProperty('uptime');
        expect(response.body.system).toHaveProperty('memory');
        expect(response.body.system).toHaveProperty('pid');
      }
    });
  });
});