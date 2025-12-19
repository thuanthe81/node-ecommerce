/**
 * Custom hook for fetching and managing bank transfer settings
 *
 * @param order - The order object (null if not loaded yet)
 * @param showForPaidOrders - Whether to show bank transfer info for already paid orders
 * @returns Object containing bank settings, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { bankSettings, isLoading, error, refetch } = useBankSettings(order, true);
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage error={error} onRetry={refetch} />;
 * return <BankTransferInfo settings={bankSettings} />;
 * ```
 */

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { paymentSettingsApi, BankTransferSettings } from '@/lib/payment-settings-api';
import { Order } from '@/lib/order-api';

export function useBankSettings(
  order: Order | null,
  showForPaidOrders: boolean
) {
  const t = useTranslations('orders');
  const [bankSettings, setBankSettings] = useState<BankTransferSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBankSettings = useCallback(async () => {
    // Check if we should show bank transfer based on order status
    if (order && !showForPaidOrders) {
      const paidStatuses = ['DELIVERED', 'COMPLETED', 'PAID'];
      if (paidStatuses.includes(order.status)) {
        setIsLoading(false);
        return;
      }
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log('[useBankSettings] Fetching bank transfer settings');
      const settings = await paymentSettingsApi.getBankTransferSettings();
      console.log('[useBankSettings] Bank transfer settings fetched:', {
        hasAccountName: !!settings.accountName,
        hasAccountNumber: !!settings.accountNumber,
        hasBankName: !!settings.bankName,
        hasQrCode: !!settings.qrCodeUrl
      });
      setBankSettings(settings);
    } catch (err: any) {
      console.error('[useBankSettings] Error fetching bank transfer settings:', {
        status: err.response?.status,
        message: err.message,
        error: err.response?.data || err
      });

      if (err.response?.status === 404) {
        console.warn('[useBankSettings] Bank transfer settings not configured');
        setBankSettings({
          accountName: '',
          accountNumber: '',
          bankName: '',
          qrCodeUrl: null
        });
        setError(null);
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError(t('timeoutLoadingPaymentInstructions'));
      } else if (!navigator.onLine) {
        setError(t('networkLoadingPaymentInstructions'));
      } else {
        setError(t('failedLoadingPaymentInstructions'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [order, showForPaidOrders, t]);

  useEffect(() => {
    if (order) {
      fetchBankSettings();
    }
  }, [order, fetchBankSettings]);

  return {
    bankSettings,
    isLoading,
    error,
    refetch: fetchBankSettings,
  };
}
