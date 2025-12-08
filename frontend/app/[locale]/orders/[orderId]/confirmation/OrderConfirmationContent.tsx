'use client';

import { useParams } from 'next/navigation';
import OrderDetailView from '@/components/OrderDetailView';
import { useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';

export default function OrderConfirmationContent() {
  const params = useParams();
  const orderId = params.orderId as string;
  const locale = params.locale as string;
  const { clearCart } = useCart();

  useEffect(() => {
    // Clear cart
    clearCart();
  }, []);

  return (
    <OrderDetailView
      orderId={orderId}
      locale={locale}
      showSuccessBanner={true}
      showBankTransferForPaidOrders={true}
    />
  );
}