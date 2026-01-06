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
import { SvgCreditCard, SvgWarning, SvgRefresh, SvgInfo, SvgBankCard, SvgQrCode } from '../../Svgs';
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
          <SvgCreditCard
            className="w-6 h-6 sm:w-7 sm:h-7 text-white"
            aria-hidden="true"
          />
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
            <SvgWarning
              className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
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
                <SvgRefresh
                  className="w-4 h-4"
                  aria-hidden="true"
                />
                {t('tryAgain')}
              </button>
            </div>
          </div>
          <div className="bg-white border border-yellow-200 rounded p-4 mt-4">
            <p className="text-sm text-gray-700 flex items-start gap-2">
              <SvgInfo
                className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                aria-hidden="true"
              />
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
              <SvgBankCard
                className="w-6 h-6 text-blue-600"
                aria-hidden="true"
              />
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
                    <SvgQrCode
                      className="w-5 h-5 text-blue-600"
                      aria-hidden="true"
                    />
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
