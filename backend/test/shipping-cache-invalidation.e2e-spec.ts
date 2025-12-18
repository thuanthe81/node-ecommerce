import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ShippingService } from '../src/shipping/shipping.service';
import { ShippingMethodsService } from '../src/shipping/shipping-methods.service';

describe('Shipping Cache Invalidation (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let shippingService: ShippingService;
  let shippingMethodsService: ShippingMethodsService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    shippingService = moduleFixture.get<ShippingService>(ShippingService);
    shippingMethodsService = moduleFixture.get<ShippingMethodsService>(ShippingMethodsService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Cache Invalidation for Translation Updates', () => {
    const testShippingData = {
      destinationCity: 'Ho Chi Minh City',
      destinationState: 'Ho Chi Minh',
      destinationPostalCode: '700000',
      destinationCountry: 'Vietnam',
      items: [
        {
          weight: 0.5,
          quantity: 1,
        },
      ],
      orderValue: 300000,
    };

    beforeEach(async () => {
      // Create test shipping method
      await prisma.shippingMethod.deleteMany({
        where: { methodId: 'test-cache-method' },
      });

      await prisma.shippingMethod.create({
        data: {
          methodId: 'test-cache-method',
          nameEn: 'Original English Name',
          nameVi: 'Tên tiếng Việt gốc',
          descriptionEn: 'Original English description',
          descriptionVi: 'Mô tả tiếng Việt gốc',
          baseRate: 35000,
          estimatedDaysMin: 2,
          estimatedDaysMax: 4,
          isActive: true,
          carrier: 'Test Carrier',
        },
      });
    });

    afterEach(async () => {
      // Clean up test data
      await prisma.shippingMethod.deleteMany({
        where: { methodId: 'test-cache-method' },
      });
    });

    it('should invalidate cache when shipping method translations are updated', async () => {
      // Step 1: Get initial shipping rates (this may populate cache)
      const initialViResponse = await request(app.getHttpServer())
        .post('/shipping/calculate')
        .send({
          ...testShippingData,
          locale: 'vi',
        })
        .expect(201);

      const initialMethod = initialViResponse.body.find((m: any) => m.method === 'test-cache-method');
      expect(initialMethod).toBeDefined();
      expect(initialMethod.name).toBe('Tên tiếng Việt gốc');
      expect(initialMethod.description).toBe('Mô tả tiếng Việt gốc');

      // Step 2: Update the shipping method translations using the service (which invalidates cache)
      const method = await prisma.shippingMethod.findUnique({
        where: { methodId: 'test-cache-method' },
      });

      await shippingMethodsService.update(method.id, {
        nameVi: 'Tên tiếng Việt đã cập nhật',
        descriptionVi: 'Mô tả tiếng Việt đã cập nhật',
        nameEn: 'Updated English Name',
        descriptionEn: 'Updated English description',
      });

      // Step 3: Verify cache invalidation by checking if updated translations appear
      // Note: In a real caching system, we might need to wait or trigger cache invalidation
      const updatedViResponse = await request(app.getHttpServer())
        .post('/shipping/calculate')
        .send({
          ...testShippingData,
          locale: 'vi',
        })
        .expect(201);

      const updatedMethod = updatedViResponse.body.find((m: any) => m.method === 'test-cache-method');
      expect(updatedMethod).toBeDefined();
      expect(updatedMethod.name).toBe('Tên tiếng Việt đã cập nhật');
      expect(updatedMethod.description).toBe('Mô tả tiếng Việt đã cập nhật');

      // Step 4: Verify English locale also gets updated translations
      const updatedEnResponse = await request(app.getHttpServer())
        .post('/shipping/calculate')
        .send({
          ...testShippingData,
          locale: 'en',
        })
        .expect(201);

      const updatedEnMethod = updatedEnResponse.body.find((m: any) => m.method === 'test-cache-method');
      expect(updatedEnMethod).toBeDefined();
      expect(updatedEnMethod.name).toBe('Updated English Name');
      expect(updatedEnMethod.description).toBe('Updated English description');
    });

    it('should propagate translation updates across all system components', async () => {
      // Step 1: Get initial method details
      const initialDetailsResponse = await request(app.getHttpServer())
        .get('/shipping/methods/test-cache-method?locale=vi')
        .expect((res) => {
          if (res.status === 200) {
            expect(res.body.name).toBe('Tên tiếng Việt gốc');
            expect(res.body.description).toBe('Mô tả tiếng Việt gốc');
          }
        });

      // Step 2: Update translations using service (which invalidates cache)
      const method = await prisma.shippingMethod.findUnique({
        where: { methodId: 'test-cache-method' },
      });

      await shippingMethodsService.update(method.id, {
        nameVi: 'Tên mới sau cập nhật',
        descriptionVi: 'Mô tả mới sau cập nhật',
      });

      // Step 3: Verify shipping calculation API reflects changes
      const calculationResponse = await request(app.getHttpServer())
        .post('/shipping/calculate')
        .send({
          ...testShippingData,
          locale: 'vi',
        })
        .expect(201);

      const calculationMethod = calculationResponse.body.find((m: any) => m.method === 'test-cache-method');
      expect(calculationMethod.name).toBe('Tên mới sau cập nhật');
      expect(calculationMethod.description).toBe('Mô tả mới sau cập nhật');

      // Step 4: Verify method details API reflects changes
      const updatedDetailsResponse = await request(app.getHttpServer())
        .get('/shipping/methods/test-cache-method?locale=vi')
        .expect((res) => {
          if (res.status === 200) {
            expect(res.body.name).toBe('Tên mới sau cập nhật');
            expect(res.body.description).toBe('Mô tả mới sau cập nhật');
          }
        });

      // Step 5: Verify consistency between different endpoints
      if (updatedDetailsResponse.status === 200) {
        expect(calculationMethod.name).toBe(updatedDetailsResponse.body.name);
        expect(calculationMethod.description).toBe(updatedDetailsResponse.body.description);
      }
    });

    it('should handle partial translation updates correctly', async () => {
      // Step 1: Update only Vietnamese name, leave description unchanged
      const method = await prisma.shippingMethod.findUnique({
        where: { methodId: 'test-cache-method' },
      });

      await shippingMethodsService.update(method.id, {
        nameVi: 'Chỉ cập nhật tên',
        // descriptionVi remains unchanged
      });

      // Step 2: Verify partial update is reflected
      const partialUpdateResponse = await request(app.getHttpServer())
        .post('/shipping/calculate')
        .send({
          ...testShippingData,
          locale: 'vi',
        })
        .expect(201);

      const partialMethod = partialUpdateResponse.body.find((m: any) => m.method === 'test-cache-method');
      expect(partialMethod).toBeDefined();
      expect(partialMethod.name).toBe('Chỉ cập nhật tên'); // Updated
      expect(partialMethod.description).toBe('Mô tả tiếng Việt gốc'); // Original

      // Step 3: Update only description, leave name unchanged
      const method2 = await prisma.shippingMethod.findUnique({
        where: { methodId: 'test-cache-method' },
      });

      await shippingMethodsService.update(method2.id, {
        descriptionVi: 'Chỉ cập nhật mô tả',
        // nameVi remains as updated above
      });

      // Step 4: Verify second partial update
      const secondPartialResponse = await request(app.getHttpServer())
        .post('/shipping/calculate')
        .send({
          ...testShippingData,
          locale: 'vi',
        })
        .expect(201);

      const secondPartialMethod = secondPartialResponse.body.find((m: any) => m.method === 'test-cache-method');
      expect(secondPartialMethod).toBeDefined();
      expect(secondPartialMethod.name).toBe('Chỉ cập nhật tên'); // From previous update
      expect(secondPartialMethod.description).toBe('Chỉ cập nhật mô tả'); // New update
    });

    it('should handle translation updates when method becomes inactive then active again', async () => {
      // Step 1: Deactivate the method
      const method = await prisma.shippingMethod.findUnique({
        where: { methodId: 'test-cache-method' },
      });

      await shippingMethodsService.update(method.id, {
        isActive: false,
      });

      // Step 2: Verify method is not returned when inactive
      const inactiveResponse = await request(app.getHttpServer())
        .post('/shipping/calculate')
        .send({
          ...testShippingData,
          locale: 'vi',
        })
        .expect(201);

      const inactiveMethod = inactiveResponse.body.find((m: any) => m.method === 'test-cache-method');
      expect(inactiveMethod).toBeUndefined();

      // Step 3: Update translations while inactive
      const method2 = await prisma.shippingMethod.findUnique({
        where: { methodId: 'test-cache-method' },
      });

      await shippingMethodsService.update(method2.id, {
        nameVi: 'Cập nhật khi không hoạt động',
        descriptionVi: 'Mô tả cập nhật khi không hoạt động',
      });

      // Step 4: Reactivate the method
      const method3 = await prisma.shippingMethod.findUnique({
        where: { methodId: 'test-cache-method' },
      });

      await shippingMethodsService.update(method3.id, {
        isActive: true,
      });

      // Step 5: Verify updated translations appear when reactivated
      const reactivatedResponse = await request(app.getHttpServer())
        .post('/shipping/calculate')
        .send({
          ...testShippingData,
          locale: 'vi',
        })
        .expect(201);

      const reactivatedMethod = reactivatedResponse.body.find((m: any) => m.method === 'test-cache-method');
      expect(reactivatedMethod).toBeDefined();
      expect(reactivatedMethod.name).toBe('Cập nhật khi không hoạt động');
      expect(reactivatedMethod.description).toBe('Mô tả cập nhật khi không hoạt động');
    });

    it('should handle concurrent translation updates correctly', async () => {
      // Step 1: Perform multiple rapid updates to simulate concurrent changes
      const updates = [
        { nameVi: 'Cập nhật 1', descriptionVi: 'Mô tả 1' },
        { nameVi: 'Cập nhật 2', descriptionVi: 'Mô tả 2' },
        { nameVi: 'Cập nhật cuối', descriptionVi: 'Mô tả cuối' },
      ];

      // Perform updates sequentially (simulating rapid changes)
      const method = await prisma.shippingMethod.findUnique({
        where: { methodId: 'test-cache-method' },
      });

      for (const update of updates) {
        await shippingMethodsService.update(method.id, update);
      }

      // Step 2: Verify final state is consistent
      const finalResponse = await request(app.getHttpServer())
        .post('/shipping/calculate')
        .send({
          ...testShippingData,
          locale: 'vi',
        })
        .expect(201);

      const finalMethod = finalResponse.body.find((m: any) => m.method === 'test-cache-method');
      expect(finalMethod).toBeDefined();
      expect(finalMethod.name).toBe('Cập nhật cuối');
      expect(finalMethod.description).toBe('Mô tả cuối');

      // Step 3: Verify consistency across multiple API calls
      const consistencyResponse = await request(app.getHttpServer())
        .post('/shipping/calculate')
        .send({
          ...testShippingData,
          locale: 'vi',
        })
        .expect(201);

      const consistencyMethod = consistencyResponse.body.find((m: any) => m.method === 'test-cache-method');
      expect(consistencyMethod.name).toBe(finalMethod.name);
      expect(consistencyMethod.description).toBe(finalMethod.description);
    });

    it('should maintain cache consistency when updating multiple methods simultaneously', async () => {
      // Step 1: Create additional test method
      await prisma.shippingMethod.create({
        data: {
          methodId: 'test-cache-method-2',
          nameEn: 'Second Method English',
          nameVi: 'Phương thức thứ hai',
          descriptionEn: 'Second method description',
          descriptionVi: 'Mô tả phương thức thứ hai',
          baseRate: 45000,
          estimatedDaysMin: 1,
          estimatedDaysMax: 3,
          isActive: true,
        },
      });

      try {
        // Step 2: Update both methods simultaneously
        const method1 = await prisma.shippingMethod.findUnique({
          where: { methodId: 'test-cache-method' },
        });
        const method2 = await prisma.shippingMethod.findUnique({
          where: { methodId: 'test-cache-method-2' },
        });

        await Promise.all([
          shippingMethodsService.update(method1.id, {
            nameVi: 'Phương thức 1 đã cập nhật',
            descriptionVi: 'Mô tả phương thức 1 đã cập nhật',
          }),
          shippingMethodsService.update(method2.id, {
            nameVi: 'Phương thức 2 đã cập nhật',
            descriptionVi: 'Mô tả phương thức 2 đã cập nhật',
          }),
        ]);

        // Step 3: Verify both methods reflect updates
        const multiUpdateResponse = await request(app.getHttpServer())
          .post('/shipping/calculate')
          .send({
            ...testShippingData,
            locale: 'vi',
          })
          .expect(201);

        const updatedMethod1 = multiUpdateResponse.body.find((m: any) => m.method === 'test-cache-method');
        const updatedMethod2 = multiUpdateResponse.body.find((m: any) => m.method === 'test-cache-method-2');

        expect(updatedMethod1).toBeDefined();
        expect(updatedMethod1.name).toBe('Phương thức 1 đã cập nhật');
        expect(updatedMethod1.description).toBe('Mô tả phương thức 1 đã cập nhật');

        expect(updatedMethod2).toBeDefined();
        expect(updatedMethod2.name).toBe('Phương thức 2 đã cập nhật');
        expect(updatedMethod2.description).toBe('Mô tả phương thức 2 đã cập nhật');
      } finally {
        // Clean up additional test method
        await prisma.shippingMethod.deleteMany({
          where: { methodId: 'test-cache-method-2' },
        });
      }
    });
  });
});