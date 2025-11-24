'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import HomepageSectionFormWithPreview from '@/components/HomepageSectionFormWithPreview';
import { getContentById, updateContent, CreateContentData, Content } from '@/lib/content-api';
import { useLocale } from 'next-intl';

export default function EditHomepageSectionPage() {
  const router = useRouter();
  const params = useParams();
  const locale = useLocale();
  const id = params.id as string;

  const [section, setSection] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSection();
  }, [id]);

  const loadSection = async () => {
    try {
      setLoading(true);
      const data = await getContentById(id);

      // Verify it's a homepage section
      if (data.type !== 'HOMEPAGE_SECTION') {
        setError('This content is not a homepage section');
        return;
      }

      setSection(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load homepage section');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: CreateContentData) => {
    try {
      await updateContent(id, data);
      router.push('/admin/homepage-sections');
    } catch (error) {
      // Error is handled by the form component
      throw error;
    }
  };

  const handleCancel = () => {
    router.push('/admin/homepage-sections');
  };

  if (loading) {
    return (
      <AdminProtectedRoute locale={locale}>
        <AdminLayout>
          <div className="flex justify-center items-center min-h-screen">
            <div className="text-lg">Loading homepage section...</div>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    );
  }

  if (error || !section) {
    return (
      <AdminProtectedRoute locale={locale}>
        <AdminLayout>
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error || 'Homepage section not found'}
            </div>
            <button
              onClick={() => router.push('/admin/homepage-sections')}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              ← Back to Homepage Sections
            </button>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    );
  }

  return (
    <AdminProtectedRoute locale={locale}>
      <AdminLayout>
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Edit Homepage Section</h1>
            <p className="text-gray-600 mt-2">
              Update the content section displayed on the homepage.
            </p>
          </div>

          <HomepageSectionFormWithPreview
            section={section}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
