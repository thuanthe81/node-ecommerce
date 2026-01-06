import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { OrdersModule } from '../src/orders/orders.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { EnhancedRateLimitGuard } from '../src/common/guards/enhanced-rate-limit.guard';

describe('Invoice Email API (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockRateLimitGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [OrdersModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(EnhancedRateLimitGuard)
      .useValue(mockRateLimitGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/orders/:orderNumber/send-invoice-email (POST) - should return 400 for invalid email', () => {
    return request(app.getHttpServer())
      .post('/orders/ORDER123/send-invoice-email')
      .send({
        email: 'invalid-email',
        locale: 'en'
      })
      .expect(400);
  });

  it('/orders/:orderNumber/send-invoice-email (POST) - should validate email format', () => {
    return request(app.getHttpServer())
      .post('/orders/ORDER123/send-invoice-email')
      .send({
        email: 'test@example.com',
        locale: 'en'
      })
      .expect((res) => {
        // Should return 400 because order doesn't exist, but email format is valid
        expect(res.status).toBe(400);
        expect(res.body.message).not.toContain('email address format');
      });
  });

  it('/orders/:orderNumber/send-invoice-email (POST) - should require email field', () => {
    return request(app.getHttpServer())
      .post('/orders/ORDER123/send-invoice-email')
      .send({
        locale: 'en'
      })
      .expect(400);
  });
});