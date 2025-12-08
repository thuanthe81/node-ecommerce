import { Metadata } from 'next';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import EditBlogPostContent from './EditBlogPostContent';

export const metadata: Metadata = {
  title: 'Edit Blog Post - Admin',
  description: 'Edit an existing blog post',
};

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  return (
    <AdminProtectedRoute locale={locale}>
      <AdminLayout>
        <EditBlogPostContent locale={locale} postId={id} />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
