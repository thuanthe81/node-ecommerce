'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ContentForm from '@/components/ContentForm';
import { SvgXEEE, SvgArrowLeftXXX, SvgExclamationCircle } from '@/components/Svgs';
import {
  Content,
  CreateContentData,
  getContentById,
  updateContent,
} from '@/lib/content-api';

export default function EditContentContent({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const data = await getContentById(params.id);
        setContent(data);
      } catch (err: any) {
        setError(err.message || 'Content not found');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [params.id]);

  const handleSubmit = async (data: CreateContentData) => {
    try {
      setSubmitError(null);
      await updateContent(params.id, data);
      router.push('/admin/content');
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to update content. Please try again.');
    }
  };

  const handleCancel = () => {
    router.push('/admin/content');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading content...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Content</h1>
          <p className="mt-1 text-sm text-gray-600">
            Unable to load the requested content
          </p>
        </div>

        {/* Error Message */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <SvgXEEE
                className="h-5 w-5 text-red-400"
                aria-hidden="true"
              />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div>
          <button
            onClick={() => router.push('/admin/content')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <SvgArrowLeftXXX
              className="mr-2 h-4 w-4"
              aria-hidden="true"
            />
            Back to Content List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Content</h1>
        <p className="mt-1 text-sm text-gray-600">
          Update content information and settings
        </p>
      </div>

      {/* Submit Error Message */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <SvgExclamationCircle
                className="h-5 w-5 text-red-400"
                aria-hidden="true"
              />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{submitError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <ContentForm
            content={content || undefined}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}