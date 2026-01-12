'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Promotion, CreatePromotionData } from '@/lib/promotion-api';

interface PromotionFormProps {
  promotion?: Promotion;
  onSubmit: (data: CreatePromotionData) => Promise<void>;
  locale: string;
}

export default function PromotionForm({ promotion, onSubmit, locale }: PromotionFormProps) {
  const router = useRouter();
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<CreatePromotionData>({
    code: promotion?.code || '',
    type: promotion?.type || 'PERCENTAGE',
    value: promotion?.value ? Number(promotion.value) : 0,
    minOrderAmount: promotion?.minOrderAmount ? Number(promotion.minOrderAmount) : undefined,
    maxDiscountAmount: promotion?.maxDiscountAmount ? Number(promotion.maxDiscountAmount) : undefined,
    usageLimit: promotion?.usageLimit ? Number(promotion.usageLimit) : undefined,
    perCustomerLimit: promotion?.perCustomerLimit ? Number(promotion.perCustomerLimit) : undefined,
    startDate: promotion?.startDate ? new Date(promotion.startDate).toISOString().slice(0, 16) : '',
    endDate: promotion?.endDate ? new Date(promotion.endDate).toISOString().slice(0, 16) : '',
    isActive: promotion?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Convert datetime-local to ISO string and ensure all numeric fields are numbers
      const submitData = {
        ...formData,
        code: formData.code.toUpperCase(),
        value: Number(formData.value),
        minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : undefined,
        maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : undefined,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
        perCustomerLimit: formData.perCustomerLimit ? Number(formData.perCustomerLimit) : undefined,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      };

      await onSubmit(submitData);
      router.push(`/${locale}/admin/promotions`);
    } catch (err: any) {
      setError(err.response?.data?.message || t('failedSavePromotion'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else if (type === 'number') {
      const numericValue = value === '' ? undefined : Number(value);
      setFormData(prev => ({
        ...prev,
        [name]: numericValue,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Promotion Code */}
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
            {t('promotionCode')} *
          </label>
          <input
            type="text"
            id="code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            placeholder={t('promotionCodePlaceholder')}
          />
          <p className="mt-1 text-sm text-gray-500">{t('promotionCodeUppercase')}</p>
        </div>

        {/* Discount Type */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
            {t('discountType')} *
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="PERCENTAGE">{t('discountTypePercentage')}</option>
            <option value="FIXED">{t('discountTypeFixed')}</option>
          </select>
        </div>

        {/* Discount Value */}
        <div>
          <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-2">
            {t('discountValue')} * {formData.type === 'PERCENTAGE' ? '(%)' : '(đ)'}
          </label>
          <input
            type="number"
            id="value"
            name="value"
            value={formData.value}
            onChange={handleChange}
            required
            min="0"
            max={formData.type === 'PERCENTAGE' ? '100' : undefined}
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Min Order Amount */}
        <div>
          <label htmlFor="minOrderAmount" className="block text-sm font-medium text-gray-700 mb-2">
            {t('minOrderAmount')}
          </label>
          <input
            type="number"
            id="minOrderAmount"
            name="minOrderAmount"
            value={formData.minOrderAmount || ''}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={tCommon('optional')}
          />
        </div>

        {/* Max Discount Amount */}
        {formData.type === 'PERCENTAGE' && (
          <div>
            <label htmlFor="maxDiscountAmount" className="block text-sm font-medium text-gray-700 mb-2">
              {t('maxDiscountAmount')}
            </label>
            <input
              type="number"
              id="maxDiscountAmount"
              name="maxDiscountAmount"
              value={formData.maxDiscountAmount || ''}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={tCommon('optional')}
            />
          </div>
        )}

        {/* Usage Limit */}
        <div>
          <label htmlFor="usageLimit" className="block text-sm font-medium text-gray-700 mb-2">
            {t('totalUsageLimit')}
          </label>
          <input
            type="number"
            id="usageLimit"
            name="usageLimit"
            value={formData.usageLimit || ''}
            onChange={handleChange}
            min="1"
            step="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t('promotionUnlimited')}
          />
        </div>

        {/* Per Customer Limit */}
        <div>
          <label htmlFor="perCustomerLimit" className="block text-sm font-medium text-gray-700 mb-2">
            {t('perCustomerLimit')}
          </label>
          <input
            type="number"
            id="perCustomerLimit"
            name="perCustomerLimit"
            value={formData.perCustomerLimit || ''}
            onChange={handleChange}
            min="1"
            step="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t('promotionUnlimited')}
          />
        </div>

        {/* Start Date */}
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
            {t('startDate')} *
          </label>
          <input
            type="datetime-local"
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* End Date */}
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
            {t('endDate')} *
          </label>
          <input
            type="datetime-local"
            id="endDate"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Active Status */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="isActive"
          name="isActive"
          checked={formData.isActive}
          onChange={handleChange}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
          {t('activePromotion')}
        </label>
      </div>

      {/* Form Actions */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? t('saving') : promotion ? t('updatePromotion') : t('createPromotion')}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          {tCommon('cancel')}
        </button>
      </div>
    </form>
  );
}