import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnalyticsEventDto } from './dto/create-analytics-event.dto';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { AnalyticsEventType } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async trackEvent(
    createEventDto: CreateAnalyticsEventDto,
    userId?: string,
  ) {
    return this.prisma.analyticsEvent.create({
      data: {
        ...createEventDto,
        userId,
      },
    });
  }

  async getDashboardMetrics(query: AnalyticsQueryDto) {
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
    const endDate = query.endDate ? new Date(query.endDate) : new Date();

    const [
      totalPageViews,
      totalProductViews,
      totalAddToCarts,
      totalPurchases,
      totalSearches,
      revenueData,
      topProducts,
      lowStockProducts,
      cartAbandonmentData,
    ] = await Promise.all([
      this.getEventCount(AnalyticsEventType.PAGE_VIEW, startDate, endDate),
      this.getEventCount(AnalyticsEventType.PRODUCT_VIEW, startDate, endDate),
      this.getEventCount(AnalyticsEventType.ADD_TO_CART, startDate, endDate),
      this.getEventCount(AnalyticsEventType.PURCHASE, startDate, endDate),
      this.getEventCount(AnalyticsEventType.SEARCH, startDate, endDate),
      this.getRevenueData(startDate, endDate),
      this.getTopProducts(startDate, endDate, 10),
      this.getLowStockProducts(10),
      this.getCartAbandonmentRate(startDate, endDate),
    ]);

    return {
      overview: {
        totalPageViews,
        totalProductViews,
        totalAddToCarts,
        totalPurchases,
        totalSearches,
      },
      revenue: revenueData,
      topProducts,
      lowStockProducts,
      cartAbandonment: cartAbandonmentData,
    };
  }

  async getSalesReport(query: AnalyticsQueryDto) {
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = query.endDate ? new Date(query.endDate) : new Date();

    const [dailySales, weeklySales, monthlySales, totalRevenue] =
      await Promise.all([
        this.getDailySales(startDate, endDate),
        this.getWeeklySales(startDate, endDate),
        this.getMonthlySales(startDate, endDate),
        this.getTotalRevenue(startDate, endDate),
      ]);

    return {
      totalRevenue,
      dailySales,
      weeklySales,
      monthlySales,
    };
  }

  async getProductPerformance(productId: string, query: AnalyticsQueryDto) {
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = query.endDate ? new Date(query.endDate) : new Date();

    const [views, addToCarts, purchases] = await Promise.all([
      this.prisma.analyticsEvent.count({
        where: {
          eventType: AnalyticsEventType.PRODUCT_VIEW,
          productId,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      this.prisma.analyticsEvent.count({
        where: {
          eventType: AnalyticsEventType.ADD_TO_CART,
          productId,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      this.prisma.orderItem.aggregate({
        where: {
          productId,
          order: {
            createdAt: { gte: startDate, lte: endDate },
            paymentStatus: 'PAID',
          },
        },
        _sum: { quantity: true },
      }),
    ]);

    const conversionRate = views > 0 ? (purchases._sum.quantity || 0) / views : 0;

    return {
      productId,
      views,
      addToCarts,
      purchases: purchases._sum.quantity || 0,
      conversionRate: Math.round(conversionRate * 10000) / 100, // Percentage with 2 decimals
    };
  }

  private async getEventCount(
    eventType: AnalyticsEventType,
    startDate: Date,
    endDate: Date,
  ) {
    return this.prisma.analyticsEvent.count({
      where: {
        eventType,
        createdAt: { gte: startDate, lte: endDate },
      },
    });
  }

  private async getRevenueData(startDate: Date, endDate: Date) {
    const orders = await this.prisma.order.aggregate({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        paymentStatus: 'PAID',
      },
      _sum: { total: true },
      _count: true,
    });

    return {
      totalRevenue: orders._sum.total || 0,
      totalOrders: orders._count,
    };
  }

  private async getDailySales(startDate: Date, endDate: Date) {
    const sales = await this.prisma.$queryRaw<
      Array<{ date: Date; revenue: number; orders: number }>
    >`
      SELECT 
        DATE(created_at) as date,
        SUM(total)::numeric as revenue,
        COUNT(*)::int as orders
      FROM orders
      WHERE created_at >= ${startDate}
        AND created_at <= ${endDate}
        AND payment_status = 'PAID'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    return sales.map((s) => ({
      date: s.date,
      revenue: Number(s.revenue),
      orders: s.orders,
    }));
  }

  private async getWeeklySales(startDate: Date, endDate: Date) {
    const sales = await this.prisma.$queryRaw<
      Array<{ week: string; revenue: number; orders: number }>
    >`
      SELECT 
        TO_CHAR(created_at, 'IYYY-IW') as week,
        SUM(total)::numeric as revenue,
        COUNT(*)::int as orders
      FROM orders
      WHERE created_at >= ${startDate}
        AND created_at <= ${endDate}
        AND payment_status = 'PAID'
      GROUP BY TO_CHAR(created_at, 'IYYY-IW')
      ORDER BY week ASC
    `;

    return sales.map((s) => ({
      week: s.week,
      revenue: Number(s.revenue),
      orders: s.orders,
    }));
  }

  private async getMonthlySales(startDate: Date, endDate: Date) {
    const sales = await this.prisma.$queryRaw<
      Array<{ month: string; revenue: number; orders: number }>
    >`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        SUM(total)::numeric as revenue,
        COUNT(*)::int as orders
      FROM orders
      WHERE created_at >= ${startDate}
        AND created_at <= ${endDate}
        AND payment_status = 'PAID'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month ASC
    `;

    return sales.map((s) => ({
      month: s.month,
      revenue: Number(s.revenue),
      orders: s.orders,
    }));
  }

  private async getTotalRevenue(startDate: Date, endDate: Date) {
    const result = await this.prisma.order.aggregate({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        paymentStatus: 'PAID',
      },
      _sum: { total: true },
    });

    return result._sum.total || 0;
  }

  private async getTopProducts(
    startDate: Date,
    endDate: Date,
    limit: number,
  ) {
    const topProducts = await this.prisma.$queryRaw<
      Array<{
        product_id: string;
        name_en: string;
        name_vi: string;
        views: number;
        purchases: number;
      }>
    >`
      SELECT 
        p.id as product_id,
        p.name_en,
        p.name_vi,
        COUNT(DISTINCT ae.id) as views,
        COALESCE(SUM(oi.quantity), 0)::int as purchases
      FROM products p
      LEFT JOIN analytics_events ae ON ae.product_id = p.id 
        AND ae.event_type = 'PRODUCT_VIEW'
        AND ae.created_at >= ${startDate}
        AND ae.created_at <= ${endDate}
      LEFT JOIN order_items oi ON oi.product_id = p.id
      LEFT JOIN orders o ON o.id = oi.order_id 
        AND o.payment_status = 'PAID'
        AND o.created_at >= ${startDate}
        AND o.created_at <= ${endDate}
      GROUP BY p.id, p.name_en, p.name_vi
      ORDER BY purchases DESC, views DESC
      LIMIT ${limit}
    `;

    return topProducts.map((p) => ({
      productId: p.product_id,
      nameEn: p.name_en,
      nameVi: p.name_vi,
      views: Number(p.views),
      purchases: p.purchases,
    }));
  }

  private async getLowStockProducts(limit: number) {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        stockQuantity: {
          lte: this.prisma.product.fields.lowStockThreshold,
        },
      },
      select: {
        id: true,
        nameEn: true,
        nameVi: true,
        sku: true,
        stockQuantity: true,
        lowStockThreshold: true,
      },
      orderBy: {
        stockQuantity: 'asc',
      },
      take: limit,
    });

    return products;
  }

  private async getCartAbandonmentRate(startDate: Date, endDate: Date) {
    const [addToCartCount, purchaseCount] = await Promise.all([
      this.prisma.analyticsEvent.count({
        where: {
          eventType: AnalyticsEventType.ADD_TO_CART,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      this.prisma.analyticsEvent.count({
        where: {
          eventType: AnalyticsEventType.PURCHASE,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
    ]);

    const abandonmentRate =
      addToCartCount > 0
        ? ((addToCartCount - purchaseCount) / addToCartCount) * 100
        : 0;

    return {
      addToCartCount,
      purchaseCount,
      abandonmentRate: Math.round(abandonmentRate * 100) / 100,
    };
  }
}
