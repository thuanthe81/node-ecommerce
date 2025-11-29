/**
 * Order items list component
 *
 * @param props - Component props
 * @param props.items - Array of order items
 * @param props.locale - Current locale for formatting and navigation
 * @param props.t - Translation function
 */

import Link from 'next/link';
import { formatMoney } from '@/app/utils';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  total: number;
  sku: string;
  productNameEn: string;
  productNameVi: string;
  product: {
    slug: string;
    images?: Array<{ url: string }>;
  };
}

interface OrderItemsProps {
  items: OrderItem[];
  locale: string;
  t: (key: string) => string;
}

export function OrderItems({ items, locale, t }: OrderItemsProps) {
  const getProductName = (item: OrderItem) => {
    return locale === 'vi' ? item.productNameVi : item.productNameEn;
  };

  return (
    <div className="mb-6 p-4 sm:p-6">
      <h3
        id="order-items-heading"
        className="font-semibold text-lg sm:text-xl mb-4 text-gray-900"
      >
        {t('items')}
      </h3>
      <ul className="space-y-4 sm:space-y-6" aria-labelledby="order-items-heading">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-col sm:flex-row gap-4 pb-4 border-b border-gray-200 last:border-b-0"
          >
            {item.product?.images?.[0]?.url && (
              <img
                src={item.product.images[0].url}
                alt={`${getProductName(item)} product image`}
                className="w-full sm:w-24 sm:h-24 h-48 object-cover rounded-lg shadow-sm print:w-20 print:h-20"
              />
            )}
            <div className="flex-1 min-w-0">
              <Link
                href={`/${locale}/products/${item.product.slug}`}
                className="font-semibold text-base sm:text-lg text-gray-900 hover:text-blue-600 focus:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded transition-colors block mb-2 print:text-black print:no-underline"
              >
                {getProductName(item)}
              </Link>
              <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                <div>
                  <dt className="inline font-medium">{t('quantity')}:</dt>
                  <dd className="inline ml-1">{item.quantity}</dd>
                </div>
                <div>
                  <dt className="inline font-medium">SKU:</dt>
                  <dd className="inline ml-1">{item.sku}</dd>
                </div>
              </dl>
            </div>
            <div className="text-left sm:text-right flex sm:flex-col justify-between sm:justify-start gap-2">
              <div>
                <p className="text-sm text-gray-600 sm:hidden">Unit Price:</p>
                <p
                  className="font-semibold text-base sm:text-lg text-gray-900"
                  aria-label={`Unit price: ${formatMoney(item.price, locale)}`}
                >
                  {formatMoney(item.price, locale)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('subtotal')}:</p>
                <p
                  className="font-bold text-base sm:text-lg text-gray-900"
                  aria-label={`Item subtotal: ${formatMoney(item.total, locale)}`}
                >
                  {formatMoney(item.total, locale)}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
