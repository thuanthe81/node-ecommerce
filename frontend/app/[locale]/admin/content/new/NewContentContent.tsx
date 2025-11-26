'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import ContentForm from '@/components/ContentForm';
import { createContent, CreateContentData } from '@/lib/content-api';

export default function NewContentContent() {
  const router = useRouter();
  const t = useTranslations();

  const handleSubmit = async (data: CreateContentData) => {
    await createContent(data);
    router.push('/admin/content');
  };

  const handleCancel = () => {
    router.push('/admin/content');
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">{t('admin.createNewContent')}</h1>
      <div className="bg-white shadow-md rounded-lg p-6">
        <ContentForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  );
}
