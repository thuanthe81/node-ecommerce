import { useState, useEffect, useCallback, useRef } from 'react';
import { getDashboardMetrics } from '@/lib/analytics-api';
import { productApi } from '@/lib/product-api';
import { userApi } from '@/lib/user-api';

// Define the state interface for each individual stat
interface StatState {
  value: number | null;
  loading: boolean;
  error: string | null;
}

// Define the complete dashboard stats interface
export interface DashboardStats {
  revenue: StatState;
  orders: StatState;
  products: StatState;
  customers: StatState;
}

// Define the return type of the hook
export interface UseDashboardStatsReturn {
  stats: DashboardStats;
  retryRevenue: () => void;
  retryOrders: () => void;
  retryProducts: () => void;
  retryCustomers: () => void;
}

export function useDashboardStats(): UseDashboardStatsReturn {
  // Initialize state with all stats loading and values null
  const [stats, setStats] = useState<DashboardStats>({
    revenue: {
      value: null,
      loading: true,
      error: null,
    },
    orders: {
      value: null,
      loading: true,
      error: null,
    },
    products: {
      value: null,
      loading: true,
      error: null,
    },
    customers: {
      value: null,
      loading: true,
      error: null,
    },
  });

  // Individual state update functions for each stat
  const updateRevenue = useCallback((update: Partial<StatState>) => {
    setStats((prev) => ({
      ...prev,
      revenue: { ...prev.revenue, ...update },
    }));
  }, []);

  const updateOrders = useCallback((update: Partial<StatState>) => {
    setStats((prev) => ({
      ...prev,
      orders: { ...prev.orders, ...update },
    }));
  }, []);

  const updateProducts = useCallback((update: Partial<StatState>) => {
    setStats((prev) => ({
      ...prev,
      products: { ...prev.products, ...update },
    }));
  }, []);

  const updateCustomers = useCallback((update: Partial<StatState>) => {
    setStats((prev) => ({
      ...prev,
      customers: { ...prev.customers, ...update },
    }));
  }, []);

  // Fetch individual stats with error handling
  const fetchRevenue = useCallback(async () => {
    updateRevenue({ loading: true, error: null });
    try {
      const data = await getDashboardMetrics();
      updateRevenue({ value: data.revenue.totalRevenue, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load revenue data';
      console.error('[Dashboard Stats] Failed to fetch revenue:', errorMessage);
      updateRevenue({ loading: false, error: errorMessage });
    }
  }, [updateRevenue]);

  const fetchOrders = useCallback(async () => {
    updateOrders({ loading: true, error: null });
    try {
      const data = await getDashboardMetrics();
      updateOrders({ value: data.revenue.totalOrders, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load orders data';
      console.error('[Dashboard Stats] Failed to fetch orders:', errorMessage);
      updateOrders({ loading: false, error: errorMessage });
    }
  }, [updateOrders]);

  const fetchProducts = useCallback(async () => {
    updateProducts({ loading: true, error: null });
    try {
      const data = await productApi.getProductCount();
      updateProducts({ value: data.count, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load products data';
      console.error('[Dashboard Stats] Failed to fetch products:', errorMessage);
      updateProducts({ loading: false, error: errorMessage });
    }
  }, [updateProducts]);

  const fetchCustomers = useCallback(async () => {
    updateCustomers({ loading: true, error: null });
    try {
      const data = await userApi.getCustomerCount();
      updateCustomers({ value: data.count, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load customers data';
      console.error('[Dashboard Stats] Failed to fetch customers:', errorMessage);
      updateCustomers({ loading: false, error: errorMessage });
    }
  }, [updateCustomers]);

  // Fetch all stats in parallel
  const fetchAllStats = useCallback(async () => {
    await Promise.all([
      fetchRevenue(),
      fetchOrders(),
      fetchProducts(),
      fetchCustomers(),
    ]);
  }, [fetchRevenue, fetchOrders, fetchProducts, fetchCustomers]);

  // Retry functions that clear error and re-fetch
  const retryRevenue = useCallback(() => {
    fetchRevenue();
  }, [fetchRevenue]);

  const retryOrders = useCallback(() => {
    fetchOrders();
  }, [fetchOrders]);

  const retryProducts = useCallback(() => {
    fetchProducts();
  }, [fetchProducts]);

  const retryCustomers = useCallback(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Auto-refresh with 5-minute interval
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initial fetch on mount
    fetchAllStats();

    // Set up 5-minute interval timer (300000 ms = 5 minutes)
    refreshIntervalRef.current = setInterval(() => {
      fetchAllStats();
    }, 300000);

    // Cleanup: clear timer on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [fetchAllStats]);

  return {
    stats,
    retryRevenue,
    retryOrders,
    retryProducts,
    retryCustomers,
  };
}
