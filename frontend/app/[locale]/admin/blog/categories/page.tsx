import { Metadata } from 'next';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import CategoryManagementContent from './CategoryManagementContent';

export const metadata: Metadata = {
  title: 'Blog Categories - Admin',
  description: 'Manage blog categories',
};

export default async function BlogCategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <AdminProtectedRoute locale={locale}>
      <AdminLayout>
        <CategoryManagementContent locale={locale} />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
