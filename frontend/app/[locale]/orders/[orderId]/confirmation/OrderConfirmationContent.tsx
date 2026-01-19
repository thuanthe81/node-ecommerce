'use client';

import { useParams } from 'next/navigation';
import OrderDetailView from '@/components/OrderDetailView';
import { useEffect, useRef } from 'react';
import { useCart } from '@/contexts/CartContext';
import { getSession, clearSession } from '@/lib/checkout-session';

export default function OrderConfirmationContent() {
  const params = useParams();
  const orderId = params.orderId as string;
  const locale = params.locale as string;
  const { clearCart } = useCart();
  const hasRunRef = useRef(false);

  useEffect(() => {
    // Only run once on mount
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    // Get checkout session to determine source
    const session = getSession();
    console.log('[OrderConfirmation] Checkout session:', session);

    // Clear cart only for cart-based checkout
    // Skip cart clearing for Buy Now checkout (preserves cart items)
    if (!session || session.source === 'cart') {
      console.log('[OrderConfirmation] Cart-based checkout - clearing cart');
      clearCart();
    }

    // Always clear the checkout session after order confirmation
    clearSession();
    console.log('[OrderConfirmation] Checkout session cleared');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  return (
    <OrderDetailView
      orderId={orderId}
      locale={locale}
      showSuccessBanner={true}
      showBankTransferForPaidOrders={true}
    />
  );
}