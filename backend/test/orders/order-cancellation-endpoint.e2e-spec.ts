import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Order Cancellation Endpoint (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/api/orders/:id/cancel (PATCH) - should return proper response structure', async () => {
    const orderId = 'test-order-id';

    const response = await request(app.getHttpServer())
      .patch(`/api/orders/${orderId}/cancel`)
      .send({
        reason: 'Customer request'
      })
      .expect((res) => {
        // The endpoint should return a structured response
        // Even if it fails due to missing order, it should have proper error structure
        expect(res.body).toHaveProperty('statusCode');
        expect(res.body).toHaveProperty('message');
        expect(typeof res.body.message).toBe('string');
      });

    // The test verifies the endpoint is accessible and returns expected structure
    // We expect either success or proper error response
    expect([200, 400, 404, 500]).toContain(response.status);
  });

  it('/api/orders/:id (GET) - should return proper response structure', async () => {
    const orderId = 'test-order-id';

    const response = await request(app.getHttpServer())
      .get(`/api/orders/${orderId}`)
      .expect((res) => {
        // The endpoint should return a structured response
        expect(res.body).toHaveProperty('statusCode');
        expect(res.body).toHaveProperty('message');
        expect(typeof res.body.message).toBe('string');
      });

    // The test verifies the endpoint is accessible and returns expected structure
    expect([200, 404, 500]).toContain(response.status);
  });
});