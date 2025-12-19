/**
 * Custom hook for fetching and managing order data
 *
 * @param orderId - The ID of the order to fetch
 * @returns Object containing order data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { order, isLoading, error, refetch } = useOrderData(orderId);
 *
 * if (isLoading) return <LoadingState />;
 * if (error) return <ErrorState error={error} onRetry={refetch} />;
 * return <OrderDetails order={order} />;
 * ```
 */

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { orderApi, Order } from '@/lib/order-api';

export function useOrderData(orderId: string) {
  const t = useTranslations('orders');
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      console.error('[useOrderData] No order ID provided');
      setError('Invalid order ID');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log('[useOrderData] Fetching order:', orderId);
      const orderData = await orderApi.getOrder(orderId);
      console.log('[useOrderData] Order fetched successfully:', orderData.orderNumber);
      setOrder(orderData);
    } catch (err: any) {
      console.error('[useOrderData] Error fetching order:', {
        orderId,
        status: err.response?.status,
        message: err.message,
        error: err.response?.data || err
      });

      if (err.response?.status === 404) {
        setError(t('orderNotFound'));
      } else if (err.response?.status === 403) {
        setError(t('permissionViewOrder'));
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError(t('timeoutError'));
      } else if (!navigator.onLine) {
        setError(t('networkError'));
      } else {
        setError(t('loadOrderFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [orderId, t]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return {
    order,
    isLoading,
    error,
    refetch: fetchOrder,
  };
}
