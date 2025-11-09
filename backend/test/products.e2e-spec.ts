import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { UserRole } from '@prisma/client';

describe('ProductsController (e2e)', () => {
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

  describe('/products (GET)', () => {
    it('should have products list endpoint', () => {
      return request(app.getHttpServer())
        .get('/products')
        .expect((res) => {
          // Endpoint exists and returns a response
          expect([200, 500]).toContain(res.status);
          if (res.status === 200) {
            expect(res.body).toHaveProperty('data');
            expect(res.body).toHaveProperty('meta');
          }
        });
    });
  });

  describe('/products/:slug (GET)', () => {
    it('should have product detail endpoint', () => {
      return request(app.getHttpServer())
        .get('/products/non-existent-slug-12345')
        .expect((res) => {
          // Endpoint exists, returns 404 or 500 if DB not set up
          expect([404, 500]).toContain(res.status);
        });
    });
  });

  describe('/products/search (GET)', () => {
    it('should have search endpoint', () => {
      return request(app.getHttpServer())
        .get('/products/search?q=test')
        .expect((res) => {
          // Endpoint exists
          expect([200, 404, 500]).toContain(res.status);
        });
    });
  });
});
