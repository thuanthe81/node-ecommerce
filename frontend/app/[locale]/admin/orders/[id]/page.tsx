import { Metadata } from 'next';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import OrderDetailContent from './OrderDetailContent';

export const metadata: Metadata = {
  title: 'Order Details - Admin',
  description: 'View and manage order details',
};

export default function AdminOrderDetailPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  return (
    <AdminProtectedRoute locale={params.locale}>
      <AdminLayout>
        <OrderDetailContent locale={params.locale} orderId={params.id} />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
