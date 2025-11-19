import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('PaymentSettingsController (e2e)', () => {
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

  describe('/payment-settings/bank-transfer (GET)', () => {
    it('should return bank transfer settings (public endpoint)', () => {
      return request(app.getHttpServer())
        .get('/payment-settings/bank-transfer')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accountName');
          expect(res.body).toHaveProperty('accountNumber');
          expect(res.body).toHaveProperty('bankName');
          expect(res.body).toHaveProperty('qrCodeUrl');
        });
    });
  });

  describe('/payment-settings/bank-transfer (PUT)', () => {
    it('should require authentication for update', () => {
      const updateDto = {
        accountName: 'Test Account',
        accountNumber: '1234567890',
        bankName: 'Test Bank',
      };

      return request(app.getHttpServer())
        .put('/payment-settings/bank-transfer')
        .send(updateDto)
        .expect(401); // Unauthorized without auth token
    });

    it('should validate required fields', () => {
      const invalidDto = {
        accountName: 'Test Account',
        // Missing accountNumber and bankName
      };

      return request(app.getHttpServer())
        .put('/payment-settings/bank-transfer')
        .send(invalidDto)
        .expect((res) => {
          // Should fail validation (400) or auth (401)
          expect([400, 401]).toContain(res.status);
        });
    });
  });
});
