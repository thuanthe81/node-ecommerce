'use client';

import { useTranslations } from 'next-intl';
import { useCart } from '@/contexts/CartContext';
import { useEffect } from 'react';

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
              <svg
                className="animate-spin h-5 w-5 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
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
                <svg
                  className="h-5 w-5 text-green-600"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-green-800">{t('syncSuccess')}</p>
              </div>
              <button
                onClick={clearSyncResults}
                className="ml-3 flex-shrink-0 text-green-600 hover:text-green-800"
                aria-label="Dismiss"
              >
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
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
              <svg
                className="h-5 w-5 text-yellow-600"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
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
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
