/**
 * CancelButton Component
 *
 * A reusable cancel button that determines visibility based on order status
 * and user permissions. Only shows for orders that can be cancelled.
 */

'use client';

import { useTranslations } from 'next-intl';
import { ConstantUtils } from '@alacraft/shared';
import { Order } from '@/lib/order-api';
import { SvgXEEE } from '../../Svgs';

interface CancelButtonProps {
  /** The order to potentially cancel */
  order: Order;
  /** Handler called when cancel button is clicked */
  onCancel: () => void;
  /** Whether the button should be disabled */
  disabled?: boolean;
  /** Current locale for translations */
  locale: 'en' | 'vi';
}

/**
 * Determines if an order can be cancelled based on its status
 */
function canCancelOrder(order: Order): boolean {
  return ConstantUtils.isOrderCancellable(order.status);
}

export function CancelButton({ order, onCancel, disabled = false, locale }: CancelButtonProps) {
  const t = useTranslations('orders');

  // Don't render if order cannot be cancelled
  if (!canCancelOrder(order)) {
    return null;
  }

  return (
    <button
      onClick={onCancel}
      disabled={disabled}
      className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:bg-red-700 active:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md"
      aria-label={t('cancelOrderButton')}
    >
      <SvgXEEE className="w-5 h-5" aria-hidden="true" />
      {t('cancelOrderButton')}
    </button>
  );
}