import { Metadata } from 'next';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import NewBlogPostContent from './NewBlogPostContent';

export const metadata: Metadata = {
  title: 'Create Blog Post - Admin',
  description: 'Create a new blog post',
};

export default async function NewBlogPostPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <AdminProtectedRoute locale={locale}>
      <AdminLayout>
        <NewBlogPostContent locale={locale} />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
