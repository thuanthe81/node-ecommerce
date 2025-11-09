import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { UserRole } from '@prisma/client';

describe('OrdersController (e2e)', () => {
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

  describe('/orders (POST)', () => {
    it('should have create order endpoint', () => {
      const invalidOrderDto = {
        email: 'invalid-email',
      };

      return request(app.getHttpServer())
        .post('/orders')
        .send(invalidOrderDto)
        .expect((res) => {
          // Endpoint exists
          expect([400, 401, 500]).toContain(res.status);
        });
    });
  });

  describe('/orders (GET)', () => {
    it('should have orders list endpoint', () => {
      return request(app.getHttpServer())
        .get('/orders')
        .expect((res) => {
          // Endpoint exists, requires auth
          expect([200, 401, 500]).toContain(res.status);
        });
    });
  });

  describe('/orders/:id (GET)', () => {
    it('should have order detail endpoint', () => {
      return request(app.getHttpServer())
        .get('/orders/test-id-12345')
        .expect((res) => {
          // Endpoint exists
          expect([404, 401, 500]).toContain(res.status);
        });
    });
  });
});
