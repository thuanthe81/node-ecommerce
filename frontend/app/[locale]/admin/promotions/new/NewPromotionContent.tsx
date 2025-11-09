'use client';

import AdminLayout from '@/components/AdminLayout';
import PromotionForm from '@/components/PromotionForm';
import { promotionApi, CreatePromotionData } from '@/lib/promotion-api';

export default function NewPromotionContent({ locale }: { locale: string }) {
  const handleSubmit = async (data: CreatePromotionData) => {
    await promotionApi.create(data);
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Create Promotion</h1>
        <div className="bg-white shadow-md rounded-lg p-6">
          <PromotionForm onSubmit={handleSubmit} locale={locale} />
        </div>
      </div>
    </AdminLayout>
  );
}
