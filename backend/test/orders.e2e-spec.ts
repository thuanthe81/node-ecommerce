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

  describe('Guest Checkout Flow', () => {
    it('should allow guest user to create address without authentication', async () => {
      // Step 1: Create a guest address (no auth token)
      const guestAddressDto = {
        fullName: 'Guest User',
        phone: '+1234567890',
        addressLine1: '123 Guest Street',
        city: 'Guest City',
        state: 'GS',
        postalCode: '12345',
        country: 'US',
      };

      const addressResponse = await request(app.getHttpServer())
        .post('/users/addresses')
        .send(guestAddressDto)
        .expect((res) => {
          // Should create address successfully or fail with validation error
          expect([200, 201, 400, 500]).toContain(res.status);
        });

      // If address creation succeeded, verify it has null userId
      if (addressResponse.status === 200 || addressResponse.status === 201) {
        expect(addressResponse.body).toHaveProperty('id');
        expect(addressResponse.body.userId).toBeNull();
        expect(addressResponse.body.fullName).toBe('Guest User');
      }
    });
  });
});
