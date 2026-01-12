'use client';

import { useTranslations } from 'next-intl';
import { useCart } from '@/contexts/CartContext';
import { useEffect } from 'react';
import { SvgSpinner, SvgCheckCircleXXX, SvgXEEE, SvgExclamationTriangleXXX } from '@/components/Svgs';

export default function CartSyncNotification() {
  const t = useTranslations('cart');
  const { syncing, syncResults, error, retrySyncFailedItems, clearSyncResults } = useCart();

  // Auto-dismiss success message after 5 seconds
  useEffect(() => {
    if (syncResults && syncResults.length > 0 && !error) {
      const allSuccess = syncResults.every(r => r.success);
      if (allSuccess) {
        const timer = setTimeout(() => {
          clearSyncResults();
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [syncResults, error, clearSyncResults]);

  // Don't render if no sync activity
  if (!syncing && !syncResults) {
    return null;
  }

  // Syncing in progress
  if (syncing) {
    return (
      <div className="fixed top-4 right-4 z-50 max-w-md animate-fade-in">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <SvgSpinner
                className="animate-spin h-5 w-5 text-blue-600"
                aria-hidden="true"
              />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800">{t('syncingCart')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Sync completed - show results
  if (syncResults && syncResults.length > 0) {
    const successCount = syncResults.filter(r => r.success).length;
    const failureCount = syncResults.filter(r => !r.success).length;
    const totalCount = syncResults.length;

    // All items synced successfully
    if (failureCount === 0) {
      return (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-fade-in">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <SvgCheckCircleXXX
                  className="h-5 w-5 text-green-600"
                  aria-hidden="true"
                />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-green-800">{t('syncSuccess')}</p>
              </div>
              <button
                onClick={clearSyncResults}
                className="ml-3 flex-shrink-0 text-green-600 hover:text-green-800"
                aria-label="Dismiss"
              >
                <SvgXEEE
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Partial or complete failure
    const failedItems = syncResults.filter(r => !r.success);
    const successItems = syncResults.filter(r => r.success);

    return (
      <div className="fixed top-4 right-4 z-50 max-w-md animate-fade-in">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <SvgExclamationTriangleXXX
                className="h-5 w-5 text-yellow-600"
                aria-hidden="true"
              />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                {successCount > 0
                  ? t('syncPartialSuccess', { successCount, totalCount })
                  : t('syncError')}
              </h3>

              {successItems.length > 0 && (
                <div className="mt-2 text-sm text-yellow-700">
                  <p className="font-medium">{t('syncSuccessItems')}</p>
                  <ul className="list-disc list-inside mt-1">
                    {successItems.map((item) => (
                      <li key={item.productId}>{item.productId}</li>
                    ))}
                  </ul>
                </div>
              )}

              {failedItems.length > 0 && (
                <div className="mt-2 text-sm text-yellow-700">
                  <p className="font-medium">{t('syncFailedItems')}</p>
                  <ul className="list-disc list-inside mt-1">
                    {failedItems.map((item) => (
                      <li key={item.productId}>
                        {item.productId}: {item.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-3 flex gap-2">
                <button
                  onClick={retrySyncFailedItems}
                  className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
                >
                  {t('syncRetry')}
                </button>
                <button
                  onClick={clearSyncResults}
                  className="text-sm font-medium text-yellow-600 hover:text-yellow-700"
                >
                  {t('common.dismiss')}
                </button>
              </div>
            </div>
            <button
              onClick={clearSyncResults}
              className="ml-3 flex-shrink-0 text-yellow-600 hover:text-yellow-800"
              aria-label="Dismiss"
            >
              <SvgXEEE
                className="h-5 w-5"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}