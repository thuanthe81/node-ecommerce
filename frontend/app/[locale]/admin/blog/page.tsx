import { Metadata } from 'next';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import BlogListContent from './BlogListContent';

export const metadata: Metadata = {
  title: 'Blog Management - Admin',
  description: 'Manage blog posts and categories',
};

export default async function AdminBlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <AdminProtectedRoute locale={locale}>
      <AdminLayout>
        <BlogListContent locale={locale} />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
