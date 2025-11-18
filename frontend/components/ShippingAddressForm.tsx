'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { userApi } from '@/lib/user-api';
import { useAuth } from '@/contexts/AuthContext';

interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface ShippingAddressFormProps {
  onAddressSelect: (addressId: string) => void;
  onNewAddress: (address: Omit<Address, 'id' | 'isDefault'>) => void;
  selectedAddressId?: string;
}

interface FieldErrors {
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

interface TouchedFields {
  fullName: boolean;
  phone: boolean;
  addressLine1: boolean;
  city: boolean;
  state: boolean;
  postalCode: boolean;
}

export default function ShippingAddressForm({
  onAddressSelect,
  onNewAddress,
  selectedAddressId,
}: ShippingAddressFormProps) {
  const t = useTranslations();
  const { user } = useAuth();
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touchedFields, setTouchedFields] = useState<TouchedFields>({
    fullName: false,
    phone: false,
    addressLine1: false,
    city: false,
    state: false,
    postalCode: false,
  });
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Vietnam',
  });

  useEffect(() => {
    if (user) {
      loadSavedAddresses();
    } else {
      setShowNewAddressForm(true);
    }
  }, [user]);

  const loadSavedAddresses = async () => {
    try {
      setLoading(true);
      const addresses = await userApi.getAddresses();
      setSavedAddresses(addresses);

      // Auto-select default address
      const defaultAddress = addresses.find((addr) => addr.isDefault);
      if (defaultAddress && !selectedAddressId) {
        onAddressSelect(defaultAddress.id);
      }
    } catch (error) {
      console.error('Failed to load addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 2) return 'Full name must be at least 2 characters';
        return undefined;
      case 'phone':
        if (!value.trim()) return 'Phone number is required';
        if (!/^[\d\s\-\+\(\)]+$/.test(value)) return 'Please enter a valid phone number';
        if (value.replace(/\D/g, '').length < 10) return 'Phone number must be at least 10 digits';
        return undefined;
      case 'addressLine1':
        if (!value.trim()) return 'Address is required';
        if (value.trim().length < 5) return 'Address must be at least 5 characters';
        return undefined;
      case 'city':
        if (!value.trim()) return 'City is required';
        if (value.trim().length < 2) return 'City must be at least 2 characters';
        return undefined;
      case 'state':
        if (!value.trim()) return 'State/Province is required';
        return undefined;
      case 'postalCode':
        if (!value.trim()) return 'Postal code is required';
        if (!/^[\d\w\s\-]+$/.test(value)) return 'Please enter a valid postal code';
        return undefined;
      default:
        return undefined;
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts editing
    if (error) {
      setError(null);
    }

    // Clear success message when user starts editing
    if (successMessage) {
      setSuccessMessage(null);
    }

    // Validate field in real-time if it has been touched
    if (touchedFields[name as keyof TouchedFields]) {
      const fieldError = validateField(name, value);
      setFieldErrors((prev) => ({
        ...prev,
        [name]: fieldError,
      }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Mark field as touched
    setTouchedFields((prev) => ({
      ...prev,
      [name]: true,
    }));

    // Validate field on blur
    const fieldError = validateField(name, value);
    setFieldErrors((prev) => ({
      ...prev,
      [name]: fieldError,
    }));
  };

  const isFormValid = () => {
    // Check if all required fields are filled
    const allFieldsFilled =
      formData.fullName.trim() !== '' &&
      formData.phone.trim() !== '' &&
      formData.addressLine1.trim() !== '' &&
      formData.city.trim() !== '' &&
      formData.state.trim() !== '' &&
      formData.postalCode.trim() !== '';

    // Check if there are no validation errors
    const noErrors = Object.values(fieldErrors).every((error) => !error);

    return allFieldsFilled && noErrors;
  };

  const getFieldClassName = (fieldName: keyof TouchedFields) => {
    const baseClass = "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors";

    if (!touchedFields[fieldName]) {
      return `${baseClass} border-gray-300`;
    }

    if (fieldErrors[fieldName]) {
      return `${baseClass} border-red-500 bg-red-50`;
    }

    if (formData[fieldName]?.trim()) {
      return `${baseClass} border-green-500 bg-green-50`;
    }

    return `${baseClass} border-gray-300`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields before submission
    const errors: FieldErrors = {};
    Object.keys(formData).forEach((key) => {
      if (key !== 'addressLine2' && key !== 'country') {
        const error = validateField(key, formData[key as keyof typeof formData]);
        if (error) {
          errors[key as keyof FieldErrors] = error;
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setTouchedFields({
        fullName: true,
        phone: true,
        addressLine1: true,
        city: true,
        state: true,
        postalCode: true,
      });
      setError('Please fix the errors in the form before submitting.');
      return;
    }

    if (!isFormValid()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      // For authenticated users, save the address to their account
      if (user) {
        const newAddress = await userApi.createAddress(formData);

        // Add the new address to the saved addresses list
        setSavedAddresses((prev) => [...prev, newAddress]);

        // Auto-select the newly created address
        onAddressSelect(newAddress.id);

        // Show success message
        setSuccessMessage('Address saved successfully!');

        // Hide success message after 3 seconds and close form
        setTimeout(() => {
          setSuccessMessage(null);
          setShowNewAddressForm(false);
        }, 2000);

        // Reset form
        setFormData({
          fullName: '',
          phone: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'Vietnam',
        });

        // Reset validation states
        setFieldErrors({});
        setTouchedFields({
          fullName: false,
          phone: false,
          addressLine1: false,
          city: false,
          state: false,
          postalCode: false,
        });
      } else {
        // For guest users, just pass the data to parent
        onNewAddress(formData);

        // Show success message for guest users
        setSuccessMessage('Address information saved!');

        // Hide success message after 2 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 2000);
      }
    } catch (error: any) {
      console.error('Failed to save address:', error);

      // Set user-friendly error message
      const errorMessage = error?.response?.data?.message ||
                          t('checkout.addressSaveError') ||
                          'Failed to save address. Please try again.';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      {user && savedAddresses.length > 0 && !showNewAddressForm && (
        <div>
          <h3 className="text-lg font-semibold mb-4">{t('checkout.selectShippingAddress')}</h3>
          <div className="space-y-3">
            {savedAddresses.map((address) => (
              <label
                key={address.id}
                className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedAddressId === address.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  type="radio"
                  name="shippingAddress"
                  value={address.id}
                  checked={selectedAddressId === address.id}
                  onChange={() => onAddressSelect(address.id)}
                  className="mr-3"
                />
                <div className="inline-block">
                  <div className="font-semibold">{address.fullName}</div>
                  <div className="text-sm text-gray-600">
                    {address.addressLine1}
                    {address.addressLine2 && `, ${address.addressLine2}`}
                  </div>
                  <div className="text-sm text-gray-600">
                    {address.city}, {address.state} {address.postalCode}
                  </div>
                  <div className="text-sm text-gray-600">{address.phone}</div>
                  {address.isDefault && (
                    <span className="inline-block mt-1 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                      Default
                    </span>
                  )}
                </div>
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowNewAddressForm(true)}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            + {t('checkout.addNewAddress')}
          </button>
        </div>
      )}

      {(showNewAddressForm || !user || savedAddresses.length === 0) && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">{t('checkout.shippingAddress')}</h3>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start" role="alert">
              <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-start animate-fade-in" role="status">
              <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{successMessage}</span>
            </div>
          )}

          {isFormValid() && !error && !successMessage && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm flex items-start">
              <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>Form is complete and ready to submit</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('checkout.fullName')} *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                onBlur={handleBlur}
                required
                className={getFieldClassName('fullName')}
                aria-invalid={!!fieldErrors.fullName}
                aria-describedby={fieldErrors.fullName ? 'fullName-error' : undefined}
              />
              {touchedFields.fullName && fieldErrors.fullName && (
                <p id="fullName-error" className="mt-1 text-sm text-red-600 flex items-start" role="alert">
                  <svg className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.fullName}
                </p>
              )}
              {touchedFields.fullName && !fieldErrors.fullName && formData.fullName.trim() && (
                <p className="mt-1 text-sm text-green-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Valid
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('common.phone')} *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                onBlur={handleBlur}
                required
                className={getFieldClassName('phone')}
                aria-invalid={!!fieldErrors.phone}
                aria-describedby={fieldErrors.phone ? 'phone-error' : undefined}
              />
              {touchedFields.phone && fieldErrors.phone && (
                <p id="phone-error" className="mt-1 text-sm text-red-600 flex items-start" role="alert">
                  <svg className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.phone}
                </p>
              )}
              {touchedFields.phone && !fieldErrors.phone && formData.phone.trim() && (
                <p className="mt-1 text-sm text-green-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Valid
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('checkout.address')} 1 *
            </label>
            <input
              type="text"
              name="addressLine1"
              value={formData.addressLine1}
              onChange={handleInputChange}
              onBlur={handleBlur}
              required
              className={getFieldClassName('addressLine1')}
              aria-invalid={!!fieldErrors.addressLine1}
              aria-describedby={fieldErrors.addressLine1 ? 'addressLine1-error' : undefined}
            />
            {touchedFields.addressLine1 && fieldErrors.addressLine1 && (
              <p id="addressLine1-error" className="mt-1 text-sm text-red-600 flex items-start" role="alert">
                <svg className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {fieldErrors.addressLine1}
              </p>
            )}
            {touchedFields.addressLine1 && !fieldErrors.addressLine1 && formData.addressLine1.trim() && (
              <p className="mt-1 text-sm text-green-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Valid
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('checkout.address')} 2
            </label>
            <input
              type="text"
              name="addressLine2"
              value={formData.addressLine2}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
            <p className="mt-1 text-xs text-gray-500">Optional</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('checkout.city')} *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                onBlur={handleBlur}
                required
                className={getFieldClassName('city')}
                aria-invalid={!!fieldErrors.city}
                aria-describedby={fieldErrors.city ? 'city-error' : undefined}
              />
              {touchedFields.city && fieldErrors.city && (
                <p id="city-error" className="mt-1 text-sm text-red-600 flex items-start" role="alert">
                  <svg className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.city}
                </p>
              )}
              {touchedFields.city && !fieldErrors.city && formData.city.trim() && (
                <p className="mt-1 text-sm text-green-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Valid
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('checkout.stateOrProvince')} *
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                onBlur={handleBlur}
                required
                className={getFieldClassName('state')}
                aria-invalid={!!fieldErrors.state}
                aria-describedby={fieldErrors.state ? 'state-error' : undefined}
              />
              {touchedFields.state && fieldErrors.state && (
                <p id="state-error" className="mt-1 text-sm text-red-600 flex items-start" role="alert">
                  <svg className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.state}
                </p>
              )}
              {touchedFields.state && !fieldErrors.state && formData.state.trim() && (
                <p className="mt-1 text-sm text-green-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Valid
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('checkout.postalCode')} *
              </label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
                onBlur={handleBlur}
                required
                className={getFieldClassName('postalCode')}
                aria-invalid={!!fieldErrors.postalCode}
                aria-describedby={fieldErrors.postalCode ? 'postalCode-error' : undefined}
              />
              {touchedFields.postalCode && fieldErrors.postalCode && (
                <p id="postalCode-error" className="mt-1 text-sm text-red-600 flex items-start" role="alert">
                  <svg className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.postalCode}
                </p>
              )}
              {touchedFields.postalCode && !fieldErrors.postalCode && formData.postalCode.trim() && (
                <p className="mt-1 text-sm text-green-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Valid
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <button
              type="submit"
              disabled={!isFormValid() || submitting}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {submitting && (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {submitting ? t('checkout.saving') || 'Saving...' : t('checkout.saveAddress') || 'Save Address'}
            </button>

            {user && savedAddresses.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setShowNewAddressForm(false);
                  setError(null);
                  setSuccessMessage(null);
                  setFieldErrors({});
                  setTouchedFields({
                    fullName: false,
                    phone: false,
                    addressLine1: false,
                    city: false,
                    state: false,
                    postalCode: false,
                  });
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                ← {t('checkout.backToSavedAddress')}
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}