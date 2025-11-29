import { useState, useCallback } from 'react';
import { FieldErrors, TouchedFields } from '../types';
import { validateField } from '../utils/validation';

/**
 * Custom hook for managing address form state and validation
 *
 * @param initialData - Optional initial form data
 * @param t - Translation function for validation messages
 *
 * @returns Form state and handlers
 *
 * @example
 * ```tsx
 * const {
 *   formData,
 *   fieldErrors,
 *   touchedFields,
 *   isValid,
 *   handleChange,
 *   handleBlur,
 *   setFieldValue,
 *   resetForm
 * } = useAddressForm(undefined, t);
 * ```
 */
export function useAddressForm(
  initialData?: Partial<{
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }>,
  t?: (key: string) => string
) {
  const [formData, setFormData] = useState({
    fullName: initialData?.fullName || '',
    phone: initialData?.phone || '',
    addressLine1: initialData?.addressLine1 || '',
    addressLine2: initialData?.addressLine2 || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    postalCode: initialData?.postalCode || '',
    country: initialData?.country || 'VN',
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [touchedFields, setTouchedFields] = useState<TouchedFields>({
    fullName: false,
    phone: false,
    addressLine1: false,
    city: false,
    state: false,
    postalCode: false,
    country: false,
  });

  /**
   * Checks if the form is valid (all required fields filled and no errors)
   */
  const isValid = useCallback(() => {
    const allFieldsFilled =
      formData.fullName.trim() !== '' &&
      formData.phone.trim() !== '' &&
      formData.addressLine1.trim() !== '' &&
      formData.city.trim() !== '' &&
      formData.state.trim() !== '' &&
      formData.postalCode.trim() !== '' &&
      formData.country.trim() !== '';

    const noErrors = Object.values(fieldErrors).every((error) => !error);

    return allFieldsFilled && noErrors;
  }, [formData, fieldErrors]);

  /**
   * Handles input change events
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      // Automatically uppercase country code
      const processedValue = name === 'country' ? value.toUpperCase() : value;
      setFormData((prev) => ({ ...prev, [name]: processedValue }));

      // Validate field in real-time if it has been touched and translation function is available
      if (touchedFields[name as keyof TouchedFields] && t) {
        const fieldError = validateField(name, value, formData.country, t);
        setFieldErrors((prev) => ({
          ...prev,
          [name]: fieldError,
        }));
      }
    },
    [touchedFields, formData.country, t]
  );

  /**
   * Handles input blur events
   */
  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;

      // Mark field as touched
      setTouchedFields((prev) => ({
        ...prev,
        [name]: true,
      }));

      // Validate field on blur if translation function is available
      if (t) {
        const fieldError = validateField(name, value, formData.country, t);
        setFieldErrors((prev) => ({
          ...prev,
          [name]: fieldError,
        }));
      }
    },
    [formData.country, t]
  );

  /**
   * Sets a specific field value programmatically
   */
  const setFieldValue = useCallback((name: string, value: string) => {
    const processedValue = name === 'country' ? value.toUpperCase() : value;
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
  }, []);

  /**
   * Resets the form to initial state
   */
  const resetForm = useCallback(() => {
    setFormData({
      fullName: initialData?.fullName || '',
      phone: initialData?.phone || '',
      addressLine1: initialData?.addressLine1 || '',
      addressLine2: initialData?.addressLine2 || '',
      city: initialData?.city || '',
      state: initialData?.state || '',
      postalCode: initialData?.postalCode || '',
      country: initialData?.country || 'VN',
    });
    setFieldErrors({});
    setTouchedFields({
      fullName: false,
      phone: false,
      addressLine1: false,
      city: false,
      state: false,
      postalCode: false,
      country: false,
    });
  }, [initialData]);

  return {
    formData,
    fieldErrors,
    touchedFields,
    isValid: isValid(),
    handleChange,
    handleBlur,
    setFieldValue,
    resetForm,
  };
}
