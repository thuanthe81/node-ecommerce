'use client';

import { useParams } from 'next/navigation';
import OrderDetailView from '@/components/OrderDetailView';

export default function OrderDetailContent() {
  const params = useParams();
  const orderId = params.orderId as string;
  const locale = params.locale as string;

  return (
    <OrderDetailView
      orderId={orderId}
      locale={locale}
      showSuccessBanner={false}
      showBankTransferForPaidOrders={false}
    />
  );
}
