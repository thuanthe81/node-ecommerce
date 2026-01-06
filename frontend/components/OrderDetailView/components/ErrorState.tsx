/**
 * Error state component displayed when order loading fails
 *
 * @param props - Component props
 * @param props.error - The error message to display
 * @param props.locale - Current locale for navigation links
 * @param props.isAuthenticated - Whether the user is authenticated
 * @param props.onRetry - Callback function to retry loading the order
 */

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { SvgRefresh, SvgClipboard, SvgShoppingBag, SvgExclamationCircleLarge } from '../../Svgs';

interface ErrorStateProps {
  error: string;
  locale: string;
  isAuthenticated: boolean;
  onRetry: () => void;
}

export function ErrorState({ error, locale, isAuthenticated, onRetry }: ErrorStateProps) {
  const t = useTranslations('orders');
  const isNotFound = error === 'Order not found';
  const isPermissionDenied = error.includes('permission');
  const isTimeout = error.includes('timeout') || error.includes('timed out');
  const isNetworkError = error.includes('internet') || error.includes('network');

  let errorTitle = error;
  let errorDescription = t('loadingError');

  if (isNotFound) {
    errorTitle = t('orderNotFound');
    errorDescription = t('orderNotFoundDesc');
  } else if (isPermissionDenied) {
    errorTitle = t('permissionDenied');
    errorDescription = t('contactSupport');
  } else if (isTimeout) {
    errorTitle = t('timeoutError');
    errorDescription = t('contactSupport');
  } else if (isNetworkError) {
    errorTitle = t('networkError');
    errorDescription = '';
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div
          className="bg-red-50 border-2 border-red-300 rounded-xl shadow-lg p-8 text-center"
          role="alert"
          aria-live="assertive"
        >
          <SvgExclamationCircleLarge
            className="w-20 h-20 text-red-500 mx-auto mb-6"
            aria-hidden="true"
          />
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {errorTitle}
          </h1>
          {errorDescription && (
            <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
              {errorDescription}
            </p>
          )}
          <nav className="flex gap-4 justify-center flex-wrap" aria-label="Error recovery actions">
            {!isNotFound && !isPermissionDenied && (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg font-medium"
                aria-label="Retry loading order"
              >
                <SvgRefresh className="w-5 h-5" aria-hidden="true" />
                {t('tryAgain')}
              </button>
            )}
            {isAuthenticated && (
              <Link
                href={`/${locale}/account/orders`}
                className="inline-flex items-center gap-2 px-8 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg font-medium"
              >
                <SvgClipboard className="w-5 h-5" aria-hidden="true" />
                {t('viewAllOrders')}
              </Link>
            )}
            <Link
              href={`/${locale}/products`}
              className="inline-flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg font-medium"
            >
              <SvgShoppingBag className="w-5 h-5" aria-hidden="true" />
              {t('continueShopping')}
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}
