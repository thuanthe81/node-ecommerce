'use client';

import { useRouter } from 'next/navigation';
import ContentForm from '@/components/ContentForm';
import { createContent, CreateContentData } from '@/lib/content-api';

export default function NewContentContent() {
  const router = useRouter();

  const handleSubmit = async (data: CreateContentData) => {
    await createContent(data);
    router.push('/admin/content');
  };

  const handleCancel = () => {
    router.push('/admin/content');
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Create New Content</h1>
      <div className="bg-white shadow-md rounded-lg p-6">
        <ContentForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  );
}
