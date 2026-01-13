'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import BlogPostForm from '@/components/BlogPostForm';
import { blogApi } from '@/lib/blog-api';
import { BlogPostFormData } from '@/components/BlogPostForm/types';

export default function NewBlogPostContent({ locale }: { locale: string }) {
  const router = useRouter();
  const t = useTranslations('admin.blog');
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    if (!storedToken) {
      router.push(`/${locale}/login`);
      return;
    }
    setToken(storedToken);
  }, [locale, router]);

  const handleSubmit = async (data: BlogPostFormData) => {
    if (!token) return;

    await blogApi.createBlogPost({
      type: 'BLOG',
      slug: data.slug,
      titleEn: data.titleEn,
      titleVi: data.titleVi,
      contentEn: data.contentEn,
      contentVi: data.contentVi,
      excerptEn: data.excerptEn,
      excerptVi: data.excerptVi,
      authorName: data.authorName,
      imageUrl: data.imageUrl,
      imageBackground: data.imageBackground,
      categoryIds: data.categoryIds,
      displayOrder: data.displayOrder,
      isPublished: data.isPublished,
    });

    router.push(`/${locale}/admin/blog`);
  };

  const handleCancel = () => {
    router.push(`/${locale}/admin/blog`);
  };

  if (!token) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('createPost')}</h1>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <BlogPostForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          locale={locale}
        />
      </div>
    </div>
  );
}