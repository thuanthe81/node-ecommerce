/**
 * Loading skeleton component displayed while order data is being fetched
 */

import { useTranslations } from 'next-intl';

export function LoadingState() {
  const t = useTranslations('orders');
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div
          className="animate-pulse"
          role="status"
          aria-live="polite"
          aria-label="Loading order details"
        >
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
          <span className="sr-only">{t('loadingOrder')}</span>
        </div>
      </div>
    </div>
  );
}
