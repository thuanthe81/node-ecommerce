/**
 * Enhanced error state component with comprehensive error handling
 * Supports retry mechanisms, user-friendly messaging, and accessibility
 */

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { SvgRefresh, SvgClipboard, SvgShoppingBag } from '../../Svgs';
import { classifyError, shouldShowRetry, EnhancedError } from '@/lib/error-handling';

interface EnhancedErrorStateProps {
  error: any;
  locale: string;
  isAuthenticated: boolean;
  onRetry: () => void;
  isRetrying?: boolean;
}

export function EnhancedErrorState({
  error,
  locale,
  isAuthenticated,
  onRetry,
  isRetrying = false
}: EnhancedErrorStateProps) {
  const t = useTranslations('orders');
  const tCommon = useTranslations('common');

  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const [canRetryNow, setCanRetryNow] = useState(true);

  // Classify the error to get appropriate handling
  const errorDetails = error instanceof EnhancedError ? error : classifyError(error, locale as 'en' | 'vi');
  const showRetryButton = shouldShowRetry(errorDetails);

  // Handle rate limiting countdown
  useEffect(() => {
    if (errorDetails.code === 'RATE_LIMITED' && errorDetails.retryAfter) {
      setRetryCountdown(errorDetails.retryAfter);
      setCanRetryNow(false);

      const interval = setInterval(() => {
        setRetryCountdown(prev => {
          if (prev === null || prev <= 1) {
            setCanRetryNow(true);
            clearInterval(interval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [errorDetails.code, errorDetails.retryAfter]);

  const handleRetry = () => {
    if (canRetryNow && !isRetrying) {
      onRetry();
    }
  };

  const handleRefreshPage = () => {
    window.location.reload();
  };

  // Determine error type and appropriate messaging
  const isNotFound = errorDetails.code === 'NOT_FOUND';
  const isPermissionDenied = errorDetails.code === 'FORBIDDEN';
  const isSessionExpired = errorDetails.code === 'UNAUTHORIZED';
  const isNetworkError = errorDetails.code === 'NETWORK_OFFLINE';
  const isServerError = errorDetails.code === 'SERVER_ERROR';
  const isRateLimited = errorDetails.code === 'RATE_LIMITED';

  let errorTitle = errorDetails.userMessage;
  let errorDescription = '';
  let errorIcon = (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  );

  if (isNotFound) {
    errorTitle = t('orderNotFound');
    errorDescription = t('orderNotFoundDesc');
    errorIcon = (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    );
  } else if (isPermissionDenied) {
    errorTitle = t('permissionDenied');
    errorDescription = t('contactSupport');
    errorIcon = (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    );
  } else if (isSessionExpired) {
    errorTitle = t('sessionExpired');
    errorDescription = t('refreshPage');
    errorIcon = (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    );
  } else if (isNetworkError) {
    errorTitle = t('networkError');
    errorDescription = t('transientError');
    errorIcon = (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
      />
    );
  } else if (isServerError) {
    errorTitle = t('serverError');
    errorDescription = t('transientError');
  } else if (isRateLimited) {
    errorTitle = t('rateLimited');
    if (retryCountdown) {
      errorDescription = t('retryAfterDelay', { seconds: retryCountdown });
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div
          className={`border-2 rounded-xl shadow-lg p-8 text-center ${
            isServerError || isNetworkError
              ? 'bg-yellow-50 border-yellow-300'
              : 'bg-red-50 border-red-300'
          }`}
          role="alert"
          aria-live="assertive"
        >
          <svg
            className={`w-20 h-20 mx-auto mb-6 ${
              isServerError || isNetworkError ? 'text-yellow-500' : 'text-red-500'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            {errorIcon}
          </svg>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {errorTitle}
          </h1>

          {errorDescription && (
            <p className="text-lg text-gray-700 mb-6 max-w-2xl mx-auto">
              {errorDescription}
            </p>
          )}

          {/* Rate limiting countdown */}
          {isRateLimited && retryCountdown && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
              <p className="text-blue-800 font-medium">
                {t('retryIn', { seconds: retryCountdown })}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <nav className="flex gap-4 justify-center flex-wrap" aria-label="Error recovery actions">
            {/* Retry button */}
            {showRetryButton && (
              <button
                onClick={handleRetry}
                disabled={!canRetryNow || isRetrying}
                className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={isRetrying ? tCommon('loading') : t('retryOperation')}
              >
                {isRetrying ? (
                  <>
                    <svg
                      className="animate-spin w-5 h-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    {tCommon('loading')}
                  </>
                ) : (
                  <>
                    <SvgRefresh className="w-5 h-5" aria-hidden="true" />
                    {retryCountdown ? t('retryIn', { seconds: retryCountdown }) : t('retryOperation')}
                  </>
                )}
              </button>
            )}

            {/* Refresh page button for session expired */}
            {isSessionExpired && (
              <button
                onClick={handleRefreshPage}
                className="inline-flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg font-medium"
              >
                <SvgRefresh className="w-5 h-5" aria-hidden="true" />
                {t('refreshPage')}
              </button>
            )}

            {/* View all orders (for authenticated users) */}
            {isAuthenticated && !isSessionExpired && (
              <Link
                href={`/${locale}/account/orders`}
                className="inline-flex items-center gap-2 px-8 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg font-medium"
              >
                <SvgClipboard className="w-5 h-5" aria-hidden="true" />
                {t('viewAllOrders')}
              </Link>
            )}

            {/* Continue shopping */}
            <Link
              href={`/${locale}/products`}
              className="inline-flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg font-medium"
            >
              <SvgShoppingBag className="w-5 h-5" aria-hidden="true" />
              {t('continueShopping')}
            </Link>
          </nav>

          {/* Additional help text */}
          {(isServerError || isNetworkError) && (
            <p className="text-sm text-gray-600 mt-6">
              {t('contactSupport')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}