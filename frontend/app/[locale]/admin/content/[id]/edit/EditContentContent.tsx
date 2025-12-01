'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import ContentForm from '@/components/ContentForm';
import {
  getContentById,
  updateContent,
  CreateContentData,
  Content,
} from '@/lib/content-api';

interface EditContentContentProps {
  contentType?: string;
}

export default function EditContentContent({ contentType }: EditContentContentProps) {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations();
  const id = params.id as string;

  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadContent();
  }, [id]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const data = await getContentById(id);
      setContent(data);
    } catch (err: any) {
      setError(err.message || t('admin.failedLoadContent'));
    } finally {
      setLoading(false);
    }
  };

  const getListPath = () => {
    // Use contentType from props if available, otherwise from loaded content
    const type = contentType || content?.type;

    if (!type) {
      return '/admin/content';
    }

    const typePathMap: Record<string, string> = {
      PAGE: '/admin/content/pages',
      FAQ: '/admin/content/faqs',
      BANNER: '/admin/content/banners',
      HOMEPAGE_SECTION: '/admin/content/homepage-sections',
    };

    return typePathMap[type] || '/admin/content';
  };

  const handleSubmit = async (data: CreateContentData) => {
    await updateContent(id, data);
    router.push(getListPath());
  };

  const handleCancel = () => {
    router.push(getListPath());
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-lg">{t('admin.loadingContent')}</div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error || t('admin.contentNotFound')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('admin.editContent')}</h1>
      <div className="bg-white shadow-md rounded-lg p-6">
        <ContentForm
          content={content}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          defaultType={contentType}
        />
      </div>
    </div>
  );
}
