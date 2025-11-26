import { Metadata } from 'next';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import CustomerDetailContent from './CustomerDetailContent';

export const metadata: Metadata = {
  title: 'Customer Details - Admin',
  description: 'View customer details and order history',
};

export default function AdminCustomerDetailPage({
  params,
}: {
  params: { locale: string; customerId: string };
}) {
  return (
    <AdminProtectedRoute locale={params.locale}>
      <AdminLayout>
        <CustomerDetailContent
          customerId={params.customerId}
          locale={params.locale}
        />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
