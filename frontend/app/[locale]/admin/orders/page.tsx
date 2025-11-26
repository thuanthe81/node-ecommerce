import { Metadata } from 'next';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import OrderListContent from './OrderListContent';

export const metadata: Metadata = {
  title: 'Order Management - Admin',
  description: 'Manage customer orders',
};

export default async function AdminOrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <AdminProtectedRoute locale={locale}>
      <AdminLayout>
        <OrderListContent locale={locale} />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
