import { Metadata } from 'next';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import CustomerListContent from './CustomerListContent';

export const metadata: Metadata = {
  title: 'Customer Management - Admin',
  description: 'Manage customers',
};

export default async function AdminCustomersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <AdminProtectedRoute locale={locale}>
      <AdminLayout>
        <CustomerListContent locale={locale} />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
