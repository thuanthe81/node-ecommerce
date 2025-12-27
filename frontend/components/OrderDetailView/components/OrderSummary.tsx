/**
 * Order summary component displaying pricing breakdown
 *
 * @param props - Component props
 * @param props.order - The order object with pricing details
 * @param props.locale - Current locale for formatting
 */

import { useTranslations } from 'next-intl';
import { formatMoney } from '@/app/utils';
import { Order } from '@/lib/order-api';
import { getOrderStatusText, getPaymentStatusText, getPaymentMethodText } from '../utils/statusTranslations';

interface OrderSummaryProps {
  order: Order;
  locale: string;
}

export function OrderSummary({ order, locale }: OrderSummaryProps) {
  const t = useTranslations('orders');
  const tEmail = useTranslations('email');
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  return (
    <section
      className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-6 print:shadow-none print:border print:border-gray-300"
      aria-labelledby="order-details-heading"
    >
      <h2
        id="order-details-heading"
        className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-200"
      >
        {t('orderDetails')}
      </h2>

      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8 sm:p-2">
        <div className="bg-gray-50 rounded-lg p-4 print:bg-white print:border print:border-gray-300">
          <dt className="text-sm text-gray-600 mb-1 font-medium">{t('orderDate')}</dt>
          <dd className="text-base font-semibold text-gray-900">
            {formatDate(order.createdAt)}
          </dd>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 print:bg-white print:border print:border-gray-300">
          <dt className="text-sm text-gray-600 mb-1 font-medium">{t('status')}</dt>
          <dd className="text-base font-semibold text-gray-900">{getOrderStatusText(order.status, t, locale as 'en' | 'vi')}</dd>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 print:bg-white print:border print:border-gray-300">
          <dt className="text-sm text-gray-600 mb-1 font-medium">{t('paymentMethod')}</dt>
          <dd className="text-base font-semibold text-gray-900">{getPaymentMethodText(order.paymentMethod, tEmail)}</dd>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 print:bg-white print:border print:border-gray-300">
          <dt className="text-sm text-gray-600 mb-1 font-medium">{t('paymentStatus')}</dt>
          <dd className="text-base font-semibold text-gray-900">{getPaymentStatusText(order.paymentStatus, tEmail, locale as 'en' | 'vi')}</dd>
        </div>
      </dl>

      {/* Order Totals */}
      <div
        className="bg-gray-50 rounded-lg p-4 sm:p-6 mt-6 print:bg-white print:border print:border-gray-300"
        role="region"
        aria-labelledby="order-totals-heading"
      >
        <h3 id="order-totals-heading" className="sr-only">
          Order Totals
        </h3>
        <dl className="space-y-3">
          <div className="flex justify-between text-sm sm:text-base">
            <dt className="text-gray-700 font-medium">{t('subtotal')}</dt>
            <dd className="font-semibold text-gray-900">
              {formatMoney(order.subtotal, locale)}
            </dd>
          </div>
          <div className="flex justify-between text-sm sm:text-base">
            <dt className="text-gray-700 font-medium">{t('shipping')}</dt>
            <dd className="font-semibold text-gray-900">
              {formatMoney(order.shippingCost, locale)}
            </dd>
          </div>
          <div className="flex justify-between text-sm sm:text-base">
            <dt className="text-gray-700 font-medium">{t('tax')}</dt>
            <dd className="font-semibold text-gray-900">
              {formatMoney(order.taxAmount, locale)}
            </dd>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-sm sm:text-base text-green-700">
              <dt className="font-medium">{t('discount')}</dt>
              <dd className="font-semibold">-{formatMoney(order.discountAmount, locale)}</dd>
            </div>
          )}
          <div className="flex justify-between text-lg sm:text-xl lg:text-2xl font-bold border-t-2 border-gray-300 pt-3 mt-3">
            <dt className="text-gray-900">{t('total')}</dt>
            <dd className="text-blue-600">{formatMoney(order.total, locale)}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}