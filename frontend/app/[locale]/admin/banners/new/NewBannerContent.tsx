'use client';

import AdminLayout from '@/components/AdminLayout';
import BannerForm from '@/components/BannerForm';
import { contentApi, CreateContentData } from '@/lib/content-api';

export default function NewBannerContent({ locale }: { locale: string }) {
  const handleSubmit = async (data: CreateContentData) => {
    await contentApi.create(data);
  };

  return (
    <AdminLayout locale={locale}>
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Create Banner</h1>
        <div className="bg-white shadow-md rounded-lg p-6">
          <BannerForm onSubmit={handleSubmit} locale={locale} />
        </div>
      </div>
    </AdminLayout>
  );
}
