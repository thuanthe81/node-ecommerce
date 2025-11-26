import { Metadata } from 'next';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import CustomerListContent from './CustomerListContent';

export const metadata: Metadata = {
  title: 'Customer Management - Admin',
  description: 'Manage customers',
};

export default function AdminCustomersPage({
  params,
}: {
  params: { locale: string };
}) {
  return (
    <AdminProtectedRoute locale={params.locale}>
      <AdminLayout>
        <CustomerListContent locale={params.locale} />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
