import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ShippingMethod, CreateShippingMethodDto, UpdateShippingMethodDto } from '@/lib/shipping-method-api';
import { ShippingMethodFormData, LanguageTab } from '../types';
import { useRegionalPricing } from './useRegionalPricing';

/**
 * Custom hook for managing shipping method form state and operations
 *
 * @param initialData - Initial data for edit mode
 * @param isEdit - Whether the form is in edit mode
 * @param onSubmit - Callback when form is submitted
 * @returns Form state and handlers
 *
 * @example
 * ```tsx
 * const {
 *   formData,
 *   activeTab,
 *   setActiveTab,
 *   regionalPricing,
 *   handleInputChange,
 *   handleRegionalPricingAdd,
 *   handleRegionalPricingRemove,
 *   handleRegionalPricingChange,
 *   handleSubmit
 * } = useShippingMethodForm(initialData, isEdit, onSubmit);
 * ```
 */
export function useShippingMethodForm(
  initialData?: ShippingMethod,
  isEdit: boolean = false,
  onSubmit?: (data: CreateShippingMethodDto | UpdateShippingMethodDto) => Promise<void>
) {
  const t = useTranslations('admin.shippingMethods');
  const [activeTab, setActiveTab] = useState<LanguageTab>('en');
  const [formData, setFormData] = useState<ShippingMethodFormData>({
    methodId: initialData?.methodId || '',
    nameEn: initialData?.nameEn || '',
    nameVi: initialData?.nameVi || '',
    descriptionEn: initialData?.descriptionEn || '',
    descriptionVi: initialData?.descriptionVi || '',
    carrier: initialData?.carrier || '',
    baseRate: initialData?.baseRate || 0,
    estimatedDaysMin: initialData?.estimatedDaysMin || 1,
    estimatedDaysMax: initialData?.estimatedDaysMax || 3,
    weightThreshold: initialData?.weightThreshold || 0,
    weightRate: initialData?.weightRate || 0,
    freeShippingThreshold: initialData?.freeShippingThreshold || 0,
    regionalPricing: [], // Managed by useRegionalPricing hook
    isActive: initialData?.isActive ?? true,
    displayOrder: initialData?.displayOrder || 0,
  });

  const {
    regionalPricing,
    addEntry: handleRegionalPricingAdd,
    removeEntry: handleRegionalPricingRemove,
    updateEntry: handleRegionalPricingChange,
    toObject: regionalPricingToObject,
  } = useRegionalPricing(initialData?.regionalPricing);

  /**
   * Handle input changes for text, number, and checkbox fields
   */
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    setFormData({
      ...formData,
      [name]:
        type === 'number'
          ? parseFloat(value) || 0
          : type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : value,
    });
  };

  /**
   * Validate form data before submission
   */
  const validateForm = (): string | null => {
    // Required fields validation
    if (!formData.methodId.trim()) {
      return t('methodIdRequired') || 'Please enter method ID';
    }

    if (!formData.nameEn.trim() || !formData.nameVi.trim()) {
      return t('nameRequired') || 'Please enter name in both English and Vietnamese';
    }

    if (!formData.descriptionEn.trim() || !formData.descriptionVi.trim()) {
      return t('descriptionRequired') || 'Please enter description in both English and Vietnamese';
    }

    // Numeric validation (non-negative)
    if (formData.baseRate < 0) {
      return t('baseRateNonNegative') || 'Base rate cannot be negative';
    }

    if (formData.estimatedDaysMin < 0 || formData.estimatedDaysMax < 0) {
      return t('estimatedDaysNonNegative') || 'Estimated days cannot be negative';
    }

    if (formData.estimatedDaysMin > formData.estimatedDaysMax) {
      return t('minDaysLessThanMax') || 'Minimum days cannot be greater than maximum days';
    }

    if (formData.weightThreshold < 0 || formData.weightRate < 0) {
      return t('weightValuesNonNegative') || 'Weight threshold and rate cannot be negative';
    }

    if (formData.freeShippingThreshold < 0) {
      return t('freeShippingNonNegative') || 'Free shipping threshold cannot be negative';
    }

    if (formData.displayOrder < 0) {
      return t('displayOrderNonNegative') || 'Display order cannot be negative';
    }

    return null;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    if (!onSubmit) {
      return;
    }

    // Prepare data for API
    const dataToSend = {
      methodId: formData.methodId.trim(),
      nameEn: formData.nameEn.trim(),
      nameVi: formData.nameVi.trim(),
      descriptionEn: formData.descriptionEn.trim(),
      descriptionVi: formData.descriptionVi.trim(),
      carrier: formData.carrier.trim() || undefined,
      baseRate: formData.baseRate,
      estimatedDaysMin: formData.estimatedDaysMin,
      estimatedDaysMax: formData.estimatedDaysMax,
      weightThreshold: formData.weightThreshold || undefined,
      weightRate: formData.weightRate || undefined,
      freeShippingThreshold: formData.freeShippingThreshold || undefined,
      regionalPricing: regionalPricingToObject(),
      isActive: formData.isActive,
      displayOrder: formData.displayOrder,
    };

    if (isEdit) {
      // In edit mode, exclude methodId from update
      const { methodId, ...updateData } = dataToSend;
      await onSubmit(updateData);
    } else {
      // In create mode, include all fields
      await onSubmit(dataToSend);
    }
  };

  return {
    formData,
    activeTab,
    setActiveTab,
    regionalPricing,
    handleInputChange,
    handleRegionalPricingAdd,
    handleRegionalPricingRemove,
    handleRegionalPricingChange,
    handleSubmit,
  };
}
