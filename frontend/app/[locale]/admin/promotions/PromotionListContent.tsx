'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import AdminLayout from '@/components/AdminLayout';
import { promotionApi, Promotion } from '@/lib/promotion-api';

export default function PromotionListContent({ locale }: { locale: string }) {
  const router = useRouter();
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const data = await promotionApi.getAll();
      setPromotions(data);
    } catch (err: any) {
      setError(err.response?.data?.message || t('failedLoadPromotions'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(t('confirmDeletePromotion', { code }))) {
      return;
    }

    try {
      await promotionApi.delete(id);
      setPromotions(promotions.filter(p => p.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || t('failedDeletePromotion'));
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Invalid date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (promotion: Promotion) => {
    const now = new Date();
    const startDate = new Date(promotion.startDate);
    const endDate = new Date(promotion.endDate);

    if (!promotion.isActive) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-700">{t('promotionStatusInactive')}</span>;
    }

    if (now < startDate) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-200 text-yellow-800">{t('promotionStatusScheduled')}</span>;
    }

    if (now > endDate) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-200 text-red-800">{t('promotionStatusExpired')}</span>;
    }

    if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-200 text-red-800">{t('promotionStatusLimitReached')}</span>;
    }

    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-200 text-green-800">{t('promotionStatusActive')}</span>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">{t('promotions')}</h1>
          <Link
            href={`/${locale}/admin/promotions/new`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {t('createPromotion')}
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">{t('loadingPromotions')}</p>
          </div>
        ) : promotions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">{t('noPromotionsFound')}</p>
            <Link
              href={`/${locale}/admin/promotions/new`}
              className="mt-4 inline-block text-blue-600 hover:text-blue-700"
            >
              {t('createFirstPromotion')}
            </Link>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('promotionCodeShort')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('promotionType')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('promotionValue')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('promotionUsage')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('promotionValidPeriod')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('status')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {promotions.map((promotion) => (
                  <tr key={promotion.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{promotion.code}</div>
                      {promotion.minOrderAmount && (
                        <div className="text-xs text-gray-500">
                          Min: ${promotion.minOrderAmount}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {promotion.type === 'PERCENTAGE' ? t('promotionTypePercentageShort') : t('promotionTypeFixedShort')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {promotion.type === 'PERCENTAGE' ? `${promotion.value}%` : `$${promotion.value}`}
                      </div>
                      {promotion.maxDiscountAmount && (
                        <div className="text-xs text-gray-500">
                          Max: ${promotion.maxDiscountAmount}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {promotion.usageCount} / {promotion.usageLimit || '∞'}
                      </div>
                      {promotion.perCustomerLimit && (
                        <div className="text-xs text-gray-500">
                          {promotion.perCustomerLimit} per customer
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{formatDate(promotion.startDate)}</div>
                      <div className="text-xs">to {formatDate(promotion.endDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(promotion)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/${locale}/admin/promotions/${promotion.id}/edit`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        {tCommon('edit')}
                      </Link>
                      <button
                        onClick={() => handleDelete(promotion.id, promotion.code)}
                        className="text-red-600 hover:text-red-900"
                      >
                        {tCommon('delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
