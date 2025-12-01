'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import ContentForm from '@/components/ContentForm';
import { createContent, CreateContentData } from '@/lib/content-api';

interface NewContentContentProps {
  defaultType?: string;
}

export default function NewContentContent({ defaultType }: NewContentContentProps) {
  const router = useRouter();
  const t = useTranslations();

  const getListPath = () => {
    if (!defaultType) {
      return '/admin/content';
    }

    const typePathMap: Record<string, string> = {
      PAGE: '/admin/content/pages',
      FAQ: '/admin/content/faqs',
      BANNER: '/admin/content/banners',
      HOMEPAGE_SECTION: '/admin/content/homepage-sections',
    };

    return typePathMap[defaultType] || '/admin/content';
  };

  const handleSubmit = async (data: CreateContentData) => {
    await createContent(data);
    router.push(getListPath());
  };

  const handleCancel = () => {
    router.push(getListPath());
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('admin.createNewContent')}</h1>
      <div className="bg-white shadow-md rounded-lg p-6">
        <ContentForm onSubmit={handleSubmit} onCancel={handleCancel} defaultType={defaultType} />
      </div>
    </div>
  );
}
