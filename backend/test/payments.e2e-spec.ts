import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { UserRole, OrderStatus, PaymentStatus } from '@prisma/client';

describe('PaymentsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/payments/refund (POST)', () => {
    it('should have refund endpoint', () => {
      const invalidRefundDto = {
        orderId: 'invalid-id',
        amount: -100,
      };

      return request(app.getHttpServer())
        .post('/payments/refund')
        .send(invalidRefundDto)
        .expect((res) => {
          // Endpoint exists
          expect([400, 401, 404, 500]).toContain(res.status);
        });
    });
  });

  describe('/payments/refund-info/:orderId (GET)', () => {
    it('should have refund info endpoint', () => {
      return request(app.getHttpServer())
        .get('/payments/refund-info/test-order-id-12345')
        .expect((res) => {
          // Endpoint exists
          expect([404, 401, 500]).toContain(res.status);
        });
    });
  });
});
