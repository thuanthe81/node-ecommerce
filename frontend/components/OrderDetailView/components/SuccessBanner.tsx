/**
 * Success banner component displayed after successful order placement
 *
 * @param props - Component props
 * @param props.orderNumber - The order number to display
 */

import { useTranslations } from 'next-intl';

interface SuccessBannerProps {
  orderNumber: string;
}

export function SuccessBanner({ orderNumber }: SuccessBannerProps) {
  const t = useTranslations('orders');
  return (
    <div
      className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl shadow-lg p-6 sm:p-8 mb-6 sm:mb-8 text-center print:border print:border-gray-800 print:shadow-none"
      role="status"
      aria-live="polite"
    >
      <div
        className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-green-500 rounded-full mb-4 shadow-md"
        aria-hidden="true"
      >
        <svg
          className="w-10 h-10 sm:w-12 sm:h-12 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 print:text-3xl">
        {t('successTitle')}
      </h1>
      <p className="text-lg sm:text-xl text-gray-700 font-semibold">
        {t('orderNumber')} <span className="text-green-700">#{orderNumber}</span>
      </p>
    </div>
  );
}
