import React from 'react';
import { FieldErrors, TouchedFields } from '../types';
import { FormField } from './FormField';
import { SvgXCircle, SvgCheckCircle } from '@/components/Svgs';

/**
 * Props for the NewAddressForm component
 */
interface NewAddressFormProps {
  /** Form data values */
  formData: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  /** Field validation errors */
  errors: FieldErrors;
  /** Fields that have been touched */
  touched: TouchedFields;
  /** Whether the form is valid */
  isValid: boolean;
  /** General error message */
  error?: string | null;
  /** Change event handler */
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  /** Blur event handler */
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  /** Translation function */
  t: (key: string) => string;
}

/**
 * Form for entering a new shipping address
 *
 * Displays all required and optional fields for creating a new address,
 * with real-time validation feedback.
 */
export function NewAddressForm({
  formData,
  errors,
  touched,
  isValid,
  error,
  onChange,
  onBlur,
  t,
}: NewAddressFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">{t('checkout.shippingAddress')}</h3>

      {error && (
        <div
          className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start"
          role="alert"
        >
          <SvgXCircle
            className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
          />
          <span>{error}</span>
        </div>
      )}

      {isValid && !error && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-start">
          <SvgCheckCircle
            className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
          />
          <span>{t('form.addressReady')}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label={t('checkout.fullName')}
          name="fullName"
          value={formData.fullName}
          error={errors.fullName}
          touched={touched.fullName}
          required
          onChange={onChange}
          onBlur={onBlur}
        />

        <FormField
          label={t('common.phone')}
          name="phone"
          type="tel"
          value={formData.phone}
          error={errors.phone}
          touched={touched.phone}
          required
          onChange={onChange}
          onBlur={onBlur}
        />
      </div>

      <FormField
        label={`${t('checkout.address')} 1`}
        name="addressLine1"
        value={formData.addressLine1}
        error={errors.addressLine1}
        touched={touched.addressLine1}
        required
        onChange={onChange}
        onBlur={onBlur}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('checkout.address')} 2
        </label>
        <input
          type="text"
          name="addressLine2"
          value={formData.addressLine2}
          onChange={onChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        />
        <p className="mt-1 text-xs text-gray-500">{t('common.optional')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          label={t('checkout.city')}
          name="city"
          value={formData.city}
          error={errors.city}
          touched={touched.city}
          required
          onChange={onChange}
          onBlur={onBlur}
        />

        <FormField
          label={t('checkout.stateOrProvince')}
          name="state"
          value={formData.state}
          error={errors.state}
          touched={touched.state}
          required
          onChange={onChange}
          onBlur={onBlur}
        />

        <FormField
          label={t('checkout.postalCode')}
          name="postalCode"
          value={formData.postalCode}
          error={errors.postalCode}
          touched={touched.postalCode}
          required
          onChange={onChange}
          onBlur={onBlur}
        />
      </div>

      <FormField
        label={t('form.countryCodeLabel')}
        name="country"
        value={formData.country}
        error={errors.country}
        touched={touched.country}
        required
        maxLength={2}
        placeholder={t('form.countryCodePlaceholder')}
        hint={t('form.countryCodeHint')}
        style={{ textTransform: 'uppercase' }}
        onChange={onChange}
        onBlur={onBlur}
      />
    </div>
  );
}
