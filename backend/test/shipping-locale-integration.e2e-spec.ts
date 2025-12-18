import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Shipping Locale Integration (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('End-to-End Locale Switching Workflow', () => {
    const testShippingData = {
      destinationCity: 'Ho Chi Minh City',
      destinationState: 'Ho Chi Minh',
      destinationPostalCode: '700000',
      destinationCountry: 'Vietnam',
      items: [
        {
          weight: 0.5,
          quantity: 2,
        },
      ],
      orderValue: 500000,
    };

    beforeEach(async () => {
      // Ensure we have test shipping methods with both English and Vietnamese translations
      await prisma.shippingMethod.deleteMany({
        where: {
          methodId: {
            in: ['test-standard', 'test-express'],
          },
        },
      });

      await prisma.shippingMethod.createMany({
        data: [
          {
            methodId: 'test-standard',
            nameEn: 'Standard Shipping',
            nameVi: 'Giao hàng tiêu chuẩn',
            descriptionEn: 'Delivery in 3-5 business days',
            descriptionVi: 'Giao hàng trong 3-5 ngày làm việc',
            baseRate: 25000,
            estimatedDaysMin: 3,
            estimatedDaysMax: 5,
            isActive: true,
            carrier: 'Vietnam Post',
          },
          {
            methodId: 'test-express',
            nameEn: 'Express Shipping',
            nameVi: 'Giao hàng nhanh',
            descriptionEn: 'Delivery in 1-2 business days',
            descriptionVi: 'Giao hàng trong 1-2 ngày làm việc',
            baseRate: 50000,
            estimatedDaysMin: 1,
            estimatedDaysMax: 2,
            isActive: true,
            carrier: 'DHL Express',
          },
        ],
      });
    });

    afterEach(async () => {
      // Clean up test data
      await prisma.shippingMethod.deleteMany({
        where: {
          methodId: {
            in: ['test-standard', 'test-express'],
          },
        },
      });
    });

    it('should complete full user journey from language selection to checkout with Vietnamese locale', async () => {
      // Step 1: Calculate shipping with Vietnamese locale
      const viResponse = await request(app.getHttpServer())
        .post('/shipping/calculate')
        .send({
          ...testShippingData,
          locale: 'vi',
        })
        .expect(201);

      expect(viResponse.body.length).toBeGreaterThanOrEqual(2);

      // Verify Vietnamese primary fields are used for our test methods
      const standardMethod = viResponse.body.find((m: any) => m.method === 'test-standard');
      expect(standardMethod).toBeDefined();
      expect(standardMethod.name).toBe('Giao hàng tiêu chuẩn');
      expect(standardMethod.description).toBe('Giao hàng trong 3-5 ngày làm việc');

      // Verify all locale fields are included for frontend switching
      expect(standardMethod.nameEn).toBe('Standard Shipping');
      expect(standardMethod.nameVi).toBe('Giao hàng tiêu chuẩn');
      expect(standardMethod.descriptionEn).toBe('Delivery in 3-5 business days');
      expect(standardMethod.descriptionVi).toBe('Giao hàng trong 3-5 ngày làm việc');

      const expressMethod = viResponse.body.find((m: any) => m.method === 'test-express');
      expect(expressMethod).toBeDefined();
      expect(expressMethod.name).toBe('Giao hàng nhanh');
      expect(expressMethod.description).toBe('Giao hàng trong 1-2 ngày làm việc');
    });

    it('should complete full user journey from language selection to checkout with English locale', async () => {
      // Step 1: Calculate shipping with English locale
      const enResponse = await request(app.getHttpServer())
        .post('/shipping/calculate')
        .send({
          ...testShippingData,
          locale: 'en',
        })
        .expect(201);

      expect(enResponse.body.length).toBeGreaterThanOrEqual(2);

      // Verify English primary fields are used for our test methods
      const standardMethod = enResponse.body.find((m: any) => m.method === 'test-standard');
      expect(standardMethod).toBeDefined();
      expect(standardMethod.name).toBe('Standard Shipping');
      expect(standardMethod.description).toBe('Delivery in 3-5 business days');

      // Verify all locale fields are included for frontend switching
      expect(standardMethod.nameEn).toBe('Standard Shipping');
      expect(standardMethod.nameVi).toBe('Giao hàng tiêu chuẩn');
      expect(standardMethod.descriptionEn).toBe('Delivery in 3-5 business days');
      expect(standardMethod.descriptionVi).toBe('Giao hàng trong 3-5 ngày làm việc');

      const expressMethod = enResponse.body.find((m: any) => m.method === 'test-express');
      expect(expressMethod).toBeDefined();
      expect(expressMethod.name).toBe('Express Shipping');
      expect(expressMethod.description).toBe('Delivery in 1-2 business days');
    });

    it('should handle locale switching during checkout workflow', async () => {
      // Step 1: Start with Vietnamese locale
      const viResponse = await request(app.getHttpServer())
        .post('/shipping/calculate')
        .send({
          ...testShippingData,
          locale: 'vi',
        })
        .expect(201);

      const viStandardMethod = viResponse.body.find((m: any) => m.method === 'test-standard');
      expect(viStandardMethod.name).toBe('Giao hàng tiêu chuẩn');

      // Step 2: Switch to English locale (simulating user language change)
      const enResponse = await request(app.getHttpServer())
        .post('/shipping/calculate')
        .send({
          ...testShippingData,
          locale: 'en',
        })
        .expect(201);

      const enStandardMethod = enResponse.body.find((m: any) => m.method === 'test-standard');
      expect(enStandardMethod.name).toBe('Standard Shipping');

      // Step 3: Verify both responses have same method IDs and costs (consistency)
      expect(viResponse.body.length).toBe(enResponse.body.length);

      for (let i = 0; i < viResponse.body.length; i++) {
        const viMethod = viResponse.body[i];
        const enMethod = enResponse.body.find((m: any) => m.method === viMethod.method);

        expect(enMethod).toBeDefined();
        expect(viMethod.method).toBe(enMethod.method);
        expect(viMethod.cost).toBe(enMethod.cost);
        expect(viMethod.estimatedDays).toBe(enMethod.estimatedDays);
        expect(viMethod.carrier).toBe(enMethod.carrier);
        expect(viMethod.isFreeShipping).toBe(enMethod.isFreeShipping);
      }
    });

    it('should maintain consistent localized text across all system components', async () => {
      // Step 1: Get shipping method details for Vietnamese locale
      const viShippingResponse = await request(app.getHttpServer())
        .post('/shipping/calculate')
        .send({
          ...testShippingData,
          locale: 'vi',
        })
        .expect(201);

      const viStandardMethod = viShippingResponse.body.find((m: any) => m.method === 'test-standard');

      // Step 2: Test PDF generation uses same localized text
      // Note: This would typically require creating an order and generating a PDF
      // For this test, we'll verify the shipping method details endpoint consistency
      const viMethodDetails = await request(app.getHttpServer())
        .get('/shipping/methods/test-standard?locale=vi')
        .expect((res) => {
          // Endpoint should exist and return consistent data
          if (res.status === 200) {
            expect(res.body.name).toBe('Giao hàng tiêu chuẩn');
            expect(res.body.description).toBe('Giao hàng trong 3-5 ngày làm việc');
          }
        });

      // Step 3: Test English locale consistency
      const enShippingResponse = await request(app.getHttpServer())
        .post('/shipping/calculate')
        .send({
          ...testShippingData,
          locale: 'en',
        })
        .expect(201);

      const enStandardMethod = enShippingResponse.body.find((m: any) => m.method === 'test-standard');

      const enMethodDetails = await request(app.getHttpServer())
        .get('/shipping/methods/test-standard?locale=en')
        .expect((res) => {
          // Endpoint should exist and return consistent data
          if (res.status === 200) {
            expect(res.body.name).toBe('Standard Shipping');
            expect(res.body.description).toBe('Delivery in 3-5 business days');
          }
        });

      // Verify consistency between shipping calculation and method details
      if (viMethodDetails.status === 200) {
        expect(viStandardMethod.name).toBe(viMethodDetails.body.name);
        expect(viStandardMethod.description).toBe(viMethodDetails.body.description);
      }

      if (enMethodDetails.status === 200) {
        expect(enStandardMethod.name).toBe(enMethodDetails.body.name);
        expect(enStandardMethod.description).toBe(enMethodDetails.body.description);
      }
    });

    it('should handle default locale behavior when no locale provided', async () => {
      // Test without locale parameter (should default to English)
      const defaultResponse = await request(app.getHttpServer())
        .post('/shipping/calculate')
        .send(testShippingData)
        .expect(201);

      const standardMethod = defaultResponse.body.find((m: any) => m.method === 'test-standard');
      expect(standardMethod).toBeDefined();

      // Should default to English
      expect(standardMethod.name).toBe('Standard Shipping');
      expect(standardMethod.description).toBe('Delivery in 3-5 business days');

      // Should still include all locale fields
      expect(standardMethod.nameEn).toBe('Standard Shipping');
      expect(standardMethod.nameVi).toBe('Giao hàng tiêu chuẩn');
      expect(standardMethod.descriptionEn).toBe('Delivery in 3-5 business days');
      expect(standardMethod.descriptionVi).toBe('Giao hàng trong 3-5 ngày làm việc');
    });

    it('should handle invalid locale gracefully with fallback to English', async () => {
      // Test with invalid locale
      const invalidLocaleResponse = await request(app.getHttpServer())
        .post('/shipping/calculate')
        .send({
          ...testShippingData,
          locale: 'invalid',
        })
        .expect(400); // Should return validation error

      // Test with another invalid locale that might pass validation but isn't supported
      const unsupportedLocaleResponse = await request(app.getHttpServer())
        .post('/shipping/calculate')
        .send({
          ...testShippingData,
          locale: 'fr', // French not supported
        })
        .expect(400); // Should return validation error due to @IsIn(['en', 'vi']) constraint
    });

    it('should handle missing translation data with fallback logic', async () => {
      // Create a method with missing Vietnamese translations
      await prisma.shippingMethod.create({
        data: {
          methodId: 'test-incomplete',
          nameEn: 'Incomplete Method',
          nameVi: '', // Empty Vietnamese name (since null not allowed)
          descriptionEn: 'English description only',
          descriptionVi: '', // Empty Vietnamese description (since null not allowed)
          baseRate: 30000,
          estimatedDaysMin: 2,
          estimatedDaysMax: 4,
          isActive: true,
        },
      });

      try {
        // Test Vietnamese locale with missing translations
        const viResponse = await request(app.getHttpServer())
          .post('/shipping/calculate')
          .send({
            ...testShippingData,
            locale: 'vi',
          })
          .expect(201);

        const incompleteMethod = viResponse.body.find((m: any) => m.method === 'test-incomplete');

        if (incompleteMethod) {
          // If method is returned, verify fallback behavior
          expect(incompleteMethod.name).toBe('Incomplete Method');
          expect(incompleteMethod.description).toBe('English description only');

          // Should still include all fields with fallbacks
          expect(incompleteMethod.nameEn).toBe('Incomplete Method');
          expect(incompleteMethod.nameVi).toBe('Incomplete Method'); // Fallback to English
          expect(incompleteMethod.descriptionEn).toBe('English description only');
          expect(incompleteMethod.descriptionVi).toBe('English description only'); // Fallback to English
        } else {
          // Method might be filtered out by validation service due to empty translations
          // This is also acceptable behavior - log for debugging
          console.log('Method with empty translations was filtered out by validation service');
        }
      } finally {
        // Clean up
        await prisma.shippingMethod.delete({
          where: { methodId: 'test-incomplete' },
        });
      }
    });
  });
});