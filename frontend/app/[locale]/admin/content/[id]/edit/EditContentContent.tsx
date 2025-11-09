'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ContentForm from '@/components/ContentForm';
import {
  getContentById,
  updateContent,
  CreateContentData,
  Content,
} from '@/lib/content-api';

export default function EditContentContent() {
  const router = useRouter();
  const params = useParams();
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
      setError(err.message || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: CreateContentData) => {
    await updateContent(id, data);
    router.push('/admin/content');
  };

  const handleCancel = () => {
    router.push('/admin/content');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading content...</div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Content not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Edit Content</h1>
      <div className="bg-white shadow-md rounded-lg p-6">
        <ContentForm
          content={content}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
