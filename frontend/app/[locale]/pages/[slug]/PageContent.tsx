'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getContentBySlug, Content } from '@/lib/content-api';

export default function PageContent() {
  const params = useParams();
  const slug = params.slug as string;
  const locale = params.locale as string;

  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadContent();
  }, [slug]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const data = await getContentBySlug(slug);
      setContent(data);
    } catch (err: any) {
      setError(err.message || 'Page not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1>
          <p className="text-gray-600 mb-8">{error || 'The page you are looking for does not exist.'}</p>
          <a href={`/${locale}`} className="text-blue-600 hover:text-blue-800">
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  const title = locale === 'vi' ? content.titleVi : content.titleEn;
  const contentText = locale === 'vi' ? content.contentVi : content.contentEn;

  return (
    <div className="container mx-auto px-4 py-16">
      <article className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">{title}</h1>
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: contentText }}
        />
      </article>
    </div>
  );
}
