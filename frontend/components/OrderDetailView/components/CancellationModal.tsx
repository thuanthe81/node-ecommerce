/**
 * CancellationModal Component
 *
 * A confirmation modal for order cancellation that explains consequences
 * and provides clear options to confirm or cancel the action.
 * Enhanced with comprehensive error handling and retry mechanisms.
 */

'use client';

import { useTranslations } from 'next-intl';
import { Order } from '@/lib/order-api';
import { formatMoney } from '@/app/utils';
import { Portal } from '@/components/Portal';

interface CancellationModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Handler to close the modal */
  onClose: () => void;
  /** Handler to confirm cancellation */
  onConfirm: () => Promise<void>;
  /** Handler to retry cancellation */
  onRetry?: () => Promise<void>;
  /** The order being cancelled */
  order: Order;
  /** Current locale for translations */
  locale: 'en' | 'vi';
  /** Whether cancellation is in progress */
  isLoading?: boolean;
  /** Error message if cancellation failed */
  error?: string | null;
  /** Whether the error is retryable */
  isRetryable?: boolean;
  /** Number of retry attempts made */
  retryCount?: number;
}

export function CancellationModal({
  isOpen,
  onClose,
  onConfirm,
  onRetry,
  order,
  locale,
  isLoading = false,
  error = null,
  isRetryable = false,
  retryCount = 0,
}: CancellationModalProps) {
  const t = useTranslations('orders');
  const tCommon = useTranslations('common');

  if (!isOpen) {
    return null;
  }

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (err) {
      // Error handling is managed by parent component
      console.error('Cancellation failed:', err);
    }
  };

  const handleRetry = async () => {
    if (onRetry && isRetryable) {
      try {
        await onRetry();
      } catch (err) {
        // Error handling is managed by parent component
        console.error('Retry cancellation failed:', err);
      }
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isLoading) {
      onClose();
    }
  };

  const showRetryButton = error && isRetryable && onRetry && retryCount < 3;

  return (
    <Portal>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={handleBackdropClick}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancellation-modal-title"
        aria-describedby="cancellation-modal-description"
      >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2
              id="cancellation-modal-title"
              className="text-lg font-semibold text-gray-900"
            >
              {t('cancellationConfirmTitle')}
            </h2>
            {!isLoading && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                aria-label={tCommon('cancel')}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-4">
          <div id="cancellation-modal-description" className="space-y-4">
            {/* Order Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">
                {t('orderNumber')}: {order.orderNumber}
              </h3>
              <p className="text-sm text-gray-600">
                {t('total')}: {formatMoney(order.total, locale)}
              </p>
            </div>

            {/* Confirmation Message */}
            {!error && (
              <p className="text-gray-700">
                {t('cancellationConfirmMessage')}
              </p>
            )}

            {/* Consequences */}
            {!error && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <svg
                    className="w-5 h-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm text-yellow-800">
                    {t('cancellationConsequences')}
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <svg
                    className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm text-red-800 mb-2">{error}</p>
                    {isRetryable && retryCount > 0 && (
                      <p className="text-xs text-red-600">
                        {t('retryAttempt', { count: retryCount })} / 3
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Retry suggestion for transient errors */}
            {error && isRetryable && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <svg
                    className="w-5 h-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm text-blue-800">
                    {t('transientError')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {error ? tCommon('close') : t('keepOrder')}
            </button>

            {/* Retry button for failed attempts */}
            {showRetryButton && (
              <button
                onClick={handleRetry}
                disabled={isLoading}
                className="w-full sm:w-auto px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {t('retryOperation')}
                  </>
                ) : (
                  t('retryOperation')
                )}
              </button>
            )}

            {/* Confirm cancellation button (only show if no error or not retryable) */}
            {(!error || !isRetryable) && (
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {t('cancelling')}
                  </>
                ) : (
                  t('confirmCancellation')
                )}
              </button>
            )}
          </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}