import apiClient from './api-client';

export interface AnalyticsEvent {
  eventType: 'PAGE_VIEW' | 'PRODUCT_VIEW' | 'ADD_TO_CART' | 'PURCHASE' | 'SEARCH';
  sessionId: string;
  productId?: string;
  orderId?: string;
  metadata?: Record<string, any>;
}

export interface AnalyticsQuery {
  startDate?: string;
  endDate?: string;
  eventType?: string;
  productId?: string;
}

export interface DashboardMetrics {
  overview: {
    totalPageViews: number;
    totalProductViews: number;
    totalAddToCarts: number;
    totalPurchases: number;
    totalSearches: number;
  };
  revenue: {
    totalRevenue: number;
    totalOrders: number;
  };
  topProducts: Array<{
    productId: string;
    nameEn: string;
    nameVi: string;
    views: number;
    purchases: number;
  }>;
  lowStockProducts: Array<{
    id: string;
    nameEn: string;
    nameVi: string;
    sku: string;
    stockQuantity: number;
    lowStockThreshold: number;
  }>;
  cartAbandonment: {
    addToCartCount: number;
    purchaseCount: number;
    abandonmentRate: number;
  };
}

export interface SalesReport {
  totalRevenue: number;
  dailySales: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  weeklySales: Array<{
    week: string;
    revenue: number;
    orders: number;
  }>;
  monthlySales: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
}

export interface ProductPerformance {
  productId: string;
  views: number;
  addToCarts: number;
  purchases: number;
  conversionRate: number;
}

export const trackEvent = async (event: AnalyticsEvent): Promise<void> => {
  await apiClient.post('/analytics/events', event);
};

export const getDashboardMetrics = async (
  query?: AnalyticsQuery,
): Promise<DashboardMetrics> => {
  const response = await apiClient.get('/analytics/dashboard', {
    params: query,
  });
  return response.data;
};

export const getSalesReport = async (
  query?: AnalyticsQuery,
): Promise<SalesReport> => {
  const response = await apiClient.get('/analytics/sales', {
    params: query,
  });
  return response.data;
};

export const getProductPerformance = async (
  productId: string,
  query?: AnalyticsQuery,
): Promise<ProductPerformance> => {
  const response = await apiClient.get(
    `/analytics/products/${productId}/performance`,
    {
      params: query,
    },
  );
  return response.data;
};
