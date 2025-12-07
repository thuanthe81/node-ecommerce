import { useTranslations } from 'next-intl';
import { ShippingMethodFormData } from '../types';

/**
 * Props for the PricingSection component
 */
interface PricingSectionProps {
  /** Current form data */
  formData: ShippingMethodFormData;
  /** Handler for input changes */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * PricingSection component for base rate, weight pricing, and estimated days
 *
 * Displays pricing configuration fields including:
 * - Base rate
 * - Weight threshold and rate
 * - Free shipping threshold
 * - Estimated delivery days (min and max)
 */
export function PricingSection({ formData, onChange }: PricingSectionProps) {
  const t = useTranslations('admin.shippingMethods');

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        {t('pricing')}
      </h2>

      <div className="space-y-4">
        {/* Base Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('baseRate')} <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="baseRate"
            value={formData.baseRate}
            onChange={onChange}
            required
            min="0"
            step="0.01"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500">
            {t('baseRateHelp')}
          </p>
        </div>

        {/* Estimated Delivery Days */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('estimatedDaysMin')} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="estimatedDaysMin"
              value={formData.estimatedDaysMin}
              onChange={onChange}
              required
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('estimatedDaysMax')} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="estimatedDaysMax"
              value={formData.estimatedDaysMax}
              onChange={onChange}
              required
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500">
          {t('estimatedDaysHelp')}
        </p>

        {/* Weight-Based Pricing */}
        <div className="border-t pt-4 mt-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            {t('weightBasedPricing')}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('weightThreshold')}
              </label>
              <input
                type="number"
                name="weightThreshold"
                value={formData.weightThreshold || ''}
                onChange={onChange}
                min="0"
                step="0.01"
                placeholder="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                {t('weightThresholdHelp')}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('weightRate')}
              </label>
              <input
                type="number"
                name="weightRate"
                value={formData.weightRate || ''}
                onChange={onChange}
                min="0"
                step="0.01"
                placeholder="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                {t('weightRateHelp')}
              </p>
            </div>
          </div>
        </div>

        {/* Free Shipping Threshold */}
        <div className="border-t pt-4 mt-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            {t('freeShipping')}
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('freeShippingThreshold')}
            </label>
            <input
              type="number"
              name="freeShippingThreshold"
              value={formData.freeShippingThreshold || ''}
              onChange={onChange}
              min="0"
              step="0.01"
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              {t('freeShippingThresholdHelp')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
