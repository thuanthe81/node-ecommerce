'use client';

import { useTranslations } from 'next-intl';
import { useShippingMethodForm } from './hooks/useShippingMethodForm';
import { BasicInfoSection } from './components/BasicInfoSection';
import { ContentFields } from './components/ContentFields';
import { LanguageTabs } from './components/LanguageTabs';
import { PricingSection } from './components/PricingSection';
import { RegionalPricingSection } from './components/RegionalPricingSection';
import { SettingsSection } from './components/SettingsSection';
import { FormActions } from './components/FormActions';
import { ShippingMethodFormProps } from './types';

/**
 * ShippingMethodForm component for creating and editing shipping methods
 *
 * Provides a comprehensive form for managing shipping methods with:
 * - Basic information (method ID, carrier, display order)
 * - Bilingual content (name and description in English and Vietnamese)
 * - Pricing configuration (base rate, weight-based pricing, free shipping threshold)
 * - Regional pricing (country/region specific rates)
 * - Active/inactive status
 *
 * @example
 * ```tsx
 * // Create mode
 * <ShippingMethodForm onSubmit={handleCreate} onCancel={handleCancel} />
 *
 * // Edit mode
 * <ShippingMethodForm
 *   initialData={existingMethod}
 *   onSubmit={handleUpdate}
 *   onCancel={handleCancel}
 *   isEdit={true}
 * />
 * ```
 */
export default function ShippingMethodForm({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false,
  isSubmitting = false,
}: ShippingMethodFormProps) {
  const t = useTranslations('admin.shippingMethods');

  const {
    formData,
    activeTab,
    setActiveTab,
    showBothLanguages,
    setShowBothLanguages,
    regionalPricing,
    handleInputChange,
    handleRegionalPricingAdd,
    handleRegionalPricingRemove,
    handleRegionalPricingChange,
    handleSubmit,
  } = useShippingMethodForm(initialData, isEdit, onSubmit);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <BasicInfoSection formData={formData} isEdit={isEdit} onChange={handleInputChange} />

      {/* Bilingual Content */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">{t('content')}</h2>
          <div className="flex items-center space-x-4">
            <label className="flex items-center text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showBothLanguages}
                onChange={(e) => setShowBothLanguages(e.target.checked)}
                className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              {t('showBothLanguages')}
            </label>
            {!showBothLanguages && <LanguageTabs activeTab={activeTab} onTabChange={setActiveTab} />}
          </div>
        </div>

        <ContentFields
          formData={formData}
          activeTab={activeTab}
          onChange={handleInputChange}
          showBothLanguages={showBothLanguages}
        />
      </div>

      {/* Pricing */}
      <PricingSection formData={formData} onChange={handleInputChange} />

      {/* Regional Pricing */}
      <RegionalPricingSection
        regionalPricing={regionalPricing}
        onAdd={handleRegionalPricingAdd}
        onRemove={handleRegionalPricingRemove}
        onChange={handleRegionalPricingChange}
      />

      {/* Settings */}
      <SettingsSection isActive={formData.isActive} onChange={handleInputChange} />

      {/* Form Actions */}
      <FormActions loading={isSubmitting} onCancel={onCancel} />
    </form>
  );
}
