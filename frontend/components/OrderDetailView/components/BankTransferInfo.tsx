/**
 * Bank transfer information component displaying payment instructions
 *
 * @param props - Component props
 * @param props.bankSettings - Bank transfer settings
 * @param props.order - The order object
 * @param props.locale - Current locale for formatting
 * @param props.isLoading - Whether settings are loading
 * @param props.error - Error message if loading failed
 * @param props.onRetry - Callback to retry loading settings
 */

import { useTranslations } from 'next-intl';
import { formatMoney } from '@/app/utils';
import { BankTransferSettings } from '@/lib/payment-settings-api';
import { Order } from '@/lib/order-api';

interface BankTransferInfoProps {
  bankSettings: BankTransferSettings | null;
  order: Order;
  locale: string;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function BankTransferInfo({
  bankSettings,
  order,
  locale,
  isLoading,
  error,
  onRetry,
}: BankTransferInfoProps) {
  const t = useTranslations('orders');
  return (
    <section
      className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 border-2 border-blue-300 rounded-xl shadow-xl p-6 sm:p-8 mb-6 print:bg-white print:border print:border-gray-800 print:shadow-none"
      aria-labelledby="payment-instructions-heading"
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-full flex items-center justify-center"
          aria-hidden="true"
        >
          <svg
            className="w-6 h-6 sm:w-7 sm:h-7 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h2
          id="payment-instructions-heading"
          className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900"
        >
          {t('paymentInstructions')}
        </h2>
      </div>

      <div
        className="bg-blue-100 border-l-4 border-blue-600 rounded-r-lg p-4 mb-6 print:bg-white print:border print:border-gray-600"
        role="note"
        aria-label="Payment notice"
      >
        <p className="text-gray-800 text-sm sm:text-base leading-relaxed">
          {t('paymentNotice')}
        </p>
      </div>

      {isLoading ? (
        <div
          className="animate-pulse"
          role="status"
          aria-label="Loading payment instructions"
        >
          <div className="h-4 bg-blue-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-blue-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-blue-200 rounded w-2/3"></div>
          <span className="sr-only">{t('loadingPaymentInstructions')}</span>
        </div>
      ) : error ? (
        <div
          className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 shadow-md"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start gap-3 mb-4">
            <svg
              className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900 mb-2 text-lg">
                {t('paymentInstructionsUnavailable')}
              </h3>
              <p className="text-yellow-800 mb-3">{error}</p>
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 focus:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors font-medium text-sm shadow-sm"
                aria-label="Retry loading payment instructions"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {t('tryAgain')}
              </button>
            </div>
          </div>
          <div className="bg-white border border-yellow-200 rounded p-4 mt-4">
            <p className="text-sm text-gray-700 flex items-start gap-2">
              <svg
                className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{t('paymentEmailNotice')}</span>
            </p>
          </div>
        </div>
      ) : bankSettings &&
        (bankSettings.accountName || bankSettings.accountNumber || bankSettings.bankName) ? (
        <>
          <div
            className="bg-white rounded-xl shadow-lg border-2 border-blue-200 p-6 sm:p-8 mb-6 print:border print:border-gray-800"
            role="region"
            aria-labelledby="bank-details-heading"
          >
            <div className="flex items-center gap-2 mb-6">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              <h3
                id="bank-details-heading"
                className="font-bold text-lg sm:text-xl text-gray-900"
              >
                {t('bankDetails')}
              </h3>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 mb-6">
              <dl className="space-y-4 flex-1">
                {bankSettings.accountName && (
                  <div className="bg-gray-50 rounded-lg p-4 print:bg-white print:border print:border-gray-300">
                    <dt className="text-sm font-medium text-gray-600 mb-1">
                      {t('accountName')}
                    </dt>
                    <dd className="text-base sm:text-lg font-semibold text-gray-900">
                      {bankSettings.accountName}
                    </dd>
                  </div>
                )}
                {bankSettings.accountNumber && (
                  <div className="bg-gray-50 rounded-lg p-4 print:bg-white print:border print:border-gray-300">
                    <dt className="text-sm font-medium text-gray-600 mb-1">
                      {t('accountNumber')}
                    </dt>
                    <dd className="text-base sm:text-lg font-bold text-gray-900 font-mono tracking-wider">
                      {bankSettings.accountNumber}
                    </dd>
                  </div>
                )}
                {bankSettings.bankName && (
                  <div className="bg-gray-50 rounded-lg p-4 print:bg-white print:border print:border-gray-300">
                    <dt className="text-sm font-medium text-gray-600 mb-1">
                      {t('bankName')}
                    </dt>
                    <dd className="text-base sm:text-lg font-semibold text-gray-900">
                      {bankSettings.bankName}
                    </dd>
                  </div>
                )}
              </dl>

              {bankSettings.qrCodeUrl && (
                <div
                  className="flex flex-col items-center justify-center lg:w-64 flex-shrink-0"
                  role="region"
                  aria-labelledby="qr-code-heading"
                >
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                      />
                    </svg>
                    <h3
                      id="qr-code-heading"
                      className="font-bold text-base sm:text-lg text-gray-900"
                    >
                      {t('scanToPay')}
                    </h3>
                  </div>
                  <div className="inline-block bg-white p-3 rounded-lg shadow-inner border-2 border-gray-200 print:border-gray-800">
                    <img
                      src={bankSettings.qrCodeUrl}
                      alt={`${t('qrCodeAlt')} for payment of ${formatMoney(order.total, locale)} to ${bankSettings.accountName || 'merchant account'}`}
                      className="w-40 h-40 sm:w-44 sm:h-44 lg:w-48 lg:h-48 object-contain print:w-40 print:h-40"
                      style={{ imageRendering: 'crisp-edges' }}
                    />
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mt-3 font-medium text-center">
                    {t('qrHint')}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg p-5 sm:p-6 shadow-md print:bg-white print:border-2 print:border-gray-800">
              <dt className="text-sm font-medium text-blue-100 mb-2 print:text-gray-700">
                {t('amountToTransfer')}
              </dt>
              <dd className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white print:text-gray-900">
                {formatMoney(order.total, locale)}
              </dd>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <p className="text-gray-700">{t('paymentEmailNotice')}</p>
        </div>
      )}
    </section>
  );
}
