'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import AdminLayout from '@/components/AdminLayout';
import PromotionForm from '@/components/PromotionForm';
import { promotionApi, Promotion, CreatePromotionData } from '@/lib/promotion-api';

export default function EditPromotionContent({
  locale,
  promotionId
}: {
  locale: string;
  promotionId: string;
}) {
  const t = useTranslations('admin');
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPromotion();
  }, [promotionId]);

  const loadPromotion = async () => {
    try {
      setLoading(true);
      const data = await promotionApi.getById(promotionId);
      setPromotion(data);
    } catch (err: any) {
      setError(err.response?.data?.message || t('failedLoadPromotions'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: CreatePromotionData) => {
    await promotionApi.update(promotionId, data);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">{t('loadingPromotion')}</p>
        </div>
      </AdminLayout>
    );
  }

  if (error || !promotion) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || t('promotionNotFound')}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('editPromotion')}</h1>

        {/* Usage Statistics */}
        {promotion.orders && promotion.orders.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">{t('usageStatistics')}</h2>
            <p className="text-sm text-blue-800 mb-3">
              {t('promotionUsedTimes', { count: promotion.usageCount })}
            </p>
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-900">{t('recentOrders')}</p>
              {promotion.orders.slice(0, 5).map((order) => (
                <div key={order.id} className="text-sm text-blue-800">
                  Order #{order.orderNumber} - ${order.total} - {new Date(order.createdAt).toLocaleDateString(locale)}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white shadow-md rounded-lg p-6">
          <PromotionForm
            promotion={promotion}
            onSubmit={handleSubmit}
            locale={locale}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
