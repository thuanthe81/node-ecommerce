'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import BlogPostForm from '@/components/BlogPostForm';
import { blogApi } from '@/lib/blog-api';
import { BlogPostFormData } from '@/components/BlogPostForm/types';

interface EditBlogPostContentProps {
  locale: string;
  postId: string;
}

export default function EditBlogPostContent({ locale, postId }: EditBlogPostContentProps) {
  const router = useRouter();
  const t = useTranslations('admin.blog');
  const [token, setToken] = useState<string | null>(null);
  const [blogPost, setBlogPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    if (!storedToken) {
      router.push(`/${locale}/login`);
      return;
    }
    setToken(storedToken);
  }, [locale, router]);

  useEffect(() => {
    const loadBlogPost = async () => {
      if (!token) return;

      try {
        setLoading(true);
        // We need to fetch the blog post by ID
        // Since we don't have a direct API for this, we'll need to add it
        // For now, let's use a workaround
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/content/${postId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to load blog post');
        }

        const data = await response.json();
        setBlogPost(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load blog post');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadBlogPost();
    }
  }, [token, postId]);

  const handleSubmit = async (data: BlogPostFormData) => {
    if (!token) return;

    await blogApi.updateBlogPost(
      postId,
      {
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
        categoryIds: data.categoryIds,
        displayOrder: data.displayOrder,
        isPublished: data.isPublished,
      }
    );

    router.push(`/${locale}/admin/blog`);
  };

  const handleCancel = () => {
    router.push(`/${locale}/admin/blog`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="ml-3 text-gray-600">{t('loading')}</p>
      </div>
    );
  }

  if (error || !blogPost) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error || t('postNotFound')}
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('editPost')}</h1>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <BlogPostForm
          blogPost={blogPost}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          locale={locale}
        />
      </div>
    </div>
  );
}