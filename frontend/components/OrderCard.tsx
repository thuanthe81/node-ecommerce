'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Order } from '@/lib/order-api';
import { formatMoney } from '@/app/utils';
import { getOrderStatusText } from './OrderDetailView/utils/statusTranslations';

interface OrderCardProps {
  order: Order;
  locale: string;
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
} as const;

export default function OrderCard({ order, locale }: OrderCardProps) {
  const t = useTranslations('orders');
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  const getProductName = (item: any) => {
    return locale === 'vi' ? item.productNameVi : item.productNameEn;
  };

  const statusColor = statusColors[order.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';

  return (
    <article className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold text-gray-900">
            {locale === 'vi' ? 'Đơn hàng' : 'Order'} #{order.orderNumber}
          </h3>
          <p className="text-sm text-gray-500">
            {formatDate(order.createdAt)}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}
          aria-label={`${t('status')}: ${getOrderStatusText(order.status, t)}`}
        >
          {getOrderStatusText(order.status, t)}
        </span>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center space-x-2">
          {order.items.slice(0, 3).map((item, idx) => (
            <img
              key={idx}
              src={item.product?.images?.[0]?.url || '/placeholder-product.png'}
              alt={getProductName(item)}
              className="w-12 h-12 object-cover rounded"
            />
          ))}
          {order.items.length > 3 && (
            <span className="text-sm text-gray-500">
              +{order.items.length - 3} {locale === 'vi' ? 'sản phẩm' : 'more'}
            </span>
          )}
        </div>

        <div className="text-right">
          <p className="font-semibold text-gray-900">
            {formatMoney(order.total, locale)}
          </p>
          <Link
            href={`/${locale}/orders/${order.id}`}
            className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
            aria-label={`${locale === 'vi' ? 'Xem chi tiết đơn hàng' : 'View order details'} #${order.orderNumber}`}
          >
            {locale === 'vi' ? 'Xem chi tiết' : 'View Details'} →
          </Link>
        </div>
      </div>
    </article>
  );
}
