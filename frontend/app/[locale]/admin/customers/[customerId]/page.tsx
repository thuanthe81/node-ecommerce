import { Metadata } from 'next';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import CustomerDetailContent from './CustomerDetailContent';

export const metadata: Metadata = {
  title: 'Customer Details - Admin',
  description: 'View customer details and order history',
};

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ locale: string; customerId: string }>;
}) {
  const { locale, customerId } = await params;

  return (
    <AdminProtectedRoute locale={locale}>
      <AdminLayout>
        <CustomerDetailContent
          customerId={customerId}
          locale={locale}
        />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
