import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AnalyticsService } from '../src/analytics/analytics.service';

describe('Analytics Enum Fix (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    prisma = app.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Analytics Service Direct Testing', () => {
    it('should execute raw SQL queries with proper enum casting', async () => {
      const analyticsService = app.get<AnalyticsService>(AnalyticsService);

      // Test the methods that were fixed with enum casting
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      // These should not throw enum casting errors
      // The key test is that these don't fail with PostgreSQL enum casting errors
      await expect(analyticsService.getDailySales(startDate, endDate)).resolves.toBeDefined();
      await expect(analyticsService.getWeeklySales(startDate, endDate)).resolves.toBeDefined();
      await expect(analyticsService.getMonthlySales(startDate, endDate)).resolves.toBeDefined();
      await expect(analyticsService.getTopProducts(startDate, endDate, 10)).resolves.toBeDefined();
    });

    it('should return proper data structure from analytics methods', async () => {
      const analyticsService = app.get<AnalyticsService>(AnalyticsService);

      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      // Test that the methods return the expected data structures
      const dailySales = await analyticsService.getDailySales(startDate, endDate);
      expect(Array.isArray(dailySales)).toBe(true);

      const weeklySales = await analyticsService.getWeeklySales(startDate, endDate);
      expect(Array.isArray(weeklySales)).toBe(true);

      const monthlySales = await analyticsService.getMonthlySales(startDate, endDate);
      expect(Array.isArray(monthlySales)).toBe(true);

      const topProducts = await analyticsService.getTopProducts(startDate, endDate, 10);
      expect(Array.isArray(topProducts)).toBe(true);
    });
  });
});