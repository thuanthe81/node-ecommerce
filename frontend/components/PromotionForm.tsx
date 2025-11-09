'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Promotion, CreatePromotionData } from '@/lib/promotion-api';

interface PromotionFormProps {
  promotion?: Promotion;
  onSubmit: (data: CreatePromotionData) => Promise<void>;
  locale: string;
}

export default function PromotionForm({ promotion, onSubmit, locale }: PromotionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<CreatePromotionData>({
    code: promotion?.code || '',
    type: promotion?.type || 'PERCENTAGE',
    value: promotion?.value || 0,
    minOrderAmount: promotion?.minOrderAmount || undefined,
    maxDiscountAmount: promotion?.maxDiscountAmount || undefined,
    usageLimit: promotion?.usageLimit || undefined,
    perCustomerLimit: promotion?.perCustomerLimit || undefined,
    startDate: promotion?.startDate ? new Date(promotion.startDate).toISOString().slice(0, 16) : '',
    endDate: promotion?.endDate ? new Date(promotion.endDate).toISOString().slice(0, 16) : '',
    isActive: promotion?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Convert datetime-local to ISO string
      const submitData = {
        ...formData,
        code: formData.code.toUpperCase(),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      };

      await onSubmit(submitData);
      router.push(`/${locale}/admin/promotions`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save promotion');
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
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? undefined : parseFloat(value),
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
            Promotion Code *
          </label>
          <input
            type="text"
            id="code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            placeholder="SUMMER2024"
          />
          <p className="mt-1 text-sm text-gray-500">Code will be converted to uppercase</p>
        </div>

        {/* Discount Type */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
            Discount Type *
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="PERCENTAGE">Percentage (%)</option>
            <option value="FIXED">Fixed Amount ($)</option>
          </select>
        </div>

        {/* Discount Value */}
        <div>
          <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-2">
            Discount Value * {formData.type === 'PERCENTAGE' ? '(%)' : '($)'}
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
            Minimum Order Amount ($)
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
            placeholder="Optional"
          />
        </div>

        {/* Max Discount Amount */}
        {formData.type === 'PERCENTAGE' && (
          <div>
            <label htmlFor="maxDiscountAmount" className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Discount Amount ($)
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
              placeholder="Optional"
            />
          </div>
        )}

        {/* Usage Limit */}
        <div>
          <label htmlFor="usageLimit" className="block text-sm font-medium text-gray-700 mb-2">
            Total Usage Limit
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
            placeholder="Unlimited"
          />
        </div>

        {/* Per Customer Limit */}
        <div>
          <label htmlFor="perCustomerLimit" className="block text-sm font-medium text-gray-700 mb-2">
            Per Customer Limit
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
            placeholder="Unlimited"
          />
        </div>

        {/* Start Date */}
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
            Start Date *
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
            End Date *
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
          Active (customers can use this promotion)
        </label>
      </div>

      {/* Form Actions */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : promotion ? 'Update Promotion' : 'Create Promotion'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
