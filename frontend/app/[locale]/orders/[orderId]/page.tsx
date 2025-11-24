import { Metadata } from 'next';
import OrderDetailContent from './OrderDetailContent';

export const metadata: Metadata = {
  title: 'Order Details',
  description: 'View your order details',
};

export default function OrderDetailPage() {
  return <OrderDetailContent />;
}
