/**
 * Order header component displaying order number and date
 *
 * @param props - Component props
 * @param props.orderNumber - The order number
 * @param props.createdAt - The order creation date
 * @param props.locale - Current locale for date formatting
 */

import { useTranslations } from 'next-intl';

interface OrderHeaderProps {
  orderNumber: string;
  createdAt: string;
  locale: string;
}

export function OrderHeader({ orderNumber, createdAt, locale }: OrderHeaderProps) {
  const t = useTranslations('orders');
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
    <div className="mb-6 sm:mb-8">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
        {t('orderNumber')} #{orderNumber}
      </h1>
      <p className="text-base sm:text-lg text-gray-600">
        {formatDate(createdAt)}
      </p>
    </div>
  );
}
