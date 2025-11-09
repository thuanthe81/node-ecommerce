import { Metadata } from 'next';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import OrderListContent from './OrderListContent';

export const metadata: Metadata = {
  title: 'Order Management - Admin',
  description: 'Manage customer orders',
};

export default function AdminOrdersPage({
  params,
}: {
  params: { locale: string };
}) {
  return (
    <AdminProtectedRoute locale={params.locale}>
      <AdminLayout>
        <OrderListContent locale={params.locale} />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
