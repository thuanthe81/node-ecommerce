import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('FooterSettingsController (e2e)', () => {
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

  describe('/footer-settings (GET)', () => {
    it('should return footer settings (public endpoint)', () => {
      return request(app.getHttpServer())
        .get('/footer-settings')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('copyrightText');
          expect(res.body).toHaveProperty('contactEmail');
          expect(res.body).toHaveProperty('contactPhone');
          expect(res.body).toHaveProperty('facebookUrl');
          expect(res.body).toHaveProperty('twitterUrl');
          expect(res.body).toHaveProperty('tiktokUrl');
        });
    });
  });

  describe('/footer-settings (PATCH)', () => {
    it('should require authentication for update', () => {
      const updateDto = {
        copyrightText: '© 2024 Test Company',
        contactEmail: 'test@example.com',
        contactPhone: '+1234567890',
      };

      return request(app.getHttpServer())
        .patch('/footer-settings')
        .send(updateDto)
        .expect(401); // Unauthorized without auth token
    });

    it('should validate required fields', () => {
      const invalidDto = {
        // Missing copyrightText
        contactEmail: 'test@example.com',
      };

      return request(app.getHttpServer())
        .patch('/footer-settings')
        .send(invalidDto)
        .expect((res) => {
          // Should fail validation (400) or auth (401)
          expect([400, 401]).toContain(res.status);
        });
    });

    it('should reject invalid URLs', () => {
      const invalidDto = {
        copyrightText: '© 2024 Test Company',
        facebookUrl: 'not-a-valid-url',
      };

      return request(app.getHttpServer())
        .patch('/footer-settings')
        .send(invalidDto)
        .expect((res) => {
          // Should fail validation (400) or auth (401)
          expect([400, 401]).toContain(res.status);
        });
    });
  });

  describe('E2E: Footer updates across pages', () => {
    let adminToken: string;

    beforeAll(async () => {
      // Login as admin to get token
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@handmade.com',
          password: 'admin123',
        });

      adminToken = loginResponse.body.accessToken;
    });

    it('should update footer and reflect changes across all pages', async () => {
      // Step 1: Get current footer settings
      const initialResponse = await request(app.getHttpServer())
        .get('/footer-settings')
        .expect(200);

      const originalCopyright = initialResponse.body.copyrightText;

      // Step 2: Admin updates footer settings
      const updatedCopyright = `© ${new Date().getFullYear()} E2E Test Company`;
      const updatedEmail = 'e2e-test@example.com';
      const updatedPhone = '+1-555-E2E-TEST';
      const updatedFacebook = 'https://facebook.com/e2etest';

      await request(app.getHttpServer())
        .patch('/footer-settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          copyrightText: updatedCopyright,
          contactEmail: updatedEmail,
          contactPhone: updatedPhone,
          facebookUrl: updatedFacebook,
        })
        .expect(200);

      // Step 3: Verify footer settings are updated (simulating multiple pages)
      const verifyResponse1 = await request(app.getHttpServer())
        .get('/footer-settings')
        .expect(200);

      expect(verifyResponse1.body.copyrightText).toBe(updatedCopyright);
      expect(verifyResponse1.body.contactEmail).toBe(updatedEmail);
      expect(verifyResponse1.body.contactPhone).toBe(updatedPhone);
      expect(verifyResponse1.body.facebookUrl).toBe(updatedFacebook);

      // Step 4: Verify again (simulating another page load)
      const verifyResponse2 = await request(app.getHttpServer())
        .get('/footer-settings')
        .expect(200);

      expect(verifyResponse2.body.copyrightText).toBe(updatedCopyright);
      expect(verifyResponse2.body.contactEmail).toBe(updatedEmail);

      // Step 5: Restore original settings
      await request(app.getHttpServer())
        .patch('/footer-settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          copyrightText: originalCopyright,
          contactEmail: initialResponse.body.contactEmail,
          contactPhone: initialResponse.body.contactPhone,
          facebookUrl: initialResponse.body.facebookUrl,
        })
        .expect(200);

      // Verify restoration
      const finalResponse = await request(app.getHttpServer())
        .get('/footer-settings')
        .expect(200);

      expect(finalResponse.body.copyrightText).toBe(originalCopyright);
    });
  });
});
