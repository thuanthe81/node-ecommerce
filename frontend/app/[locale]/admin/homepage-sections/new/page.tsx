'use client';

import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import HomepageSectionFormWithPreview from '@/components/HomepageSectionFormWithPreview';
import { createContent, CreateContentData } from '@/lib/content-api';
import { useLocale } from 'next-intl';

export default function NewHomepageSectionPage() {
  const router = useRouter();
  const locale = useLocale();

  const handleSubmit = async (data: CreateContentData) => {
    try {
      await createContent(data);
      router.push('/admin/homepage-sections');
    } catch (error) {
      // Error is handled by the form component
      throw error;
    }
  };

  const handleCancel = () => {
    router.push('/admin/homepage-sections');
  };

  return (
    <AdminProtectedRoute locale={locale}>
      <AdminLayout>
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Create New Homepage Section</h1>
            <p className="text-gray-600 mt-2">
              Add a new content section to display on the homepage below the carousel.
            </p>
          </div>

          <HomepageSectionFormWithPreview onSubmit={handleSubmit} onCancel={handleCancel} />
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
