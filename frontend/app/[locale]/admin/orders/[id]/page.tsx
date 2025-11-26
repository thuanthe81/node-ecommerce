import { Metadata } from 'next';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import OrderDetailContent from './OrderDetailContent';

export const metadata: Metadata = {
  title: 'Order Details - Admin',
  description: 'View and manage order details',
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  return (
    <AdminProtectedRoute locale={locale}>
      <AdminLayout>
        <OrderDetailContent locale={locale} orderId={id} />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
