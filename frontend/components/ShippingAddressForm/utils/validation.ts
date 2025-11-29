import { FieldErrors } from '../types';

/**
 * Validates a full name field
 * @param name - The full name to validate
 * @param t - Translation function for error messages
 * @returns Error message if invalid, null if valid
 */
export function validateFullName(name: string, t: (key: string) => string): string | null {
  if (!name.trim()) {
    return t('validation.fullNameRequired');
  }
  if (name.trim().length < 2) {
    return t('validation.fullNameMinLength');
  }
  return null;
}

/**
 * Validates a phone number field
 * @param phone - The phone number to validate
 * @param t - Translation function for error messages
 * @returns Error message if invalid, null if valid
 */
export function validatePhone(phone: string, t: (key: string) => string): string | null {
  if (!phone.trim()) {
    return t('validation.phoneRequired');
  }
  if (!/^[\d\s\-\+\(\)]+$/.test(phone)) {
    return t('validation.phoneInvalid');
  }
  if (phone.replace(/\D/g, '').length < 10) {
    return t('validation.phoneMinDigits');
  }
  return null;
}

/**
 * Validates an address line field
 * @param address - The address line to validate
 * @param t - Translation function for error messages
 * @returns Error message if invalid, null if valid
 */
export function validateAddressLine(address: string, t: (key: string) => string): string | null {
  if (!address.trim()) {
    return t('validation.addressRequired');
  }
  if (address.trim().length < 5) {
    return t('validation.addressMinLength');
  }
  return null;
}

/**
 * Validates a city field
 * @param city - The city name to validate
 * @param t - Translation function for error messages
 * @returns Error message if invalid, null if valid
 */
export function validateCity(city: string, t: (key: string) => string): string | null {
  if (!city.trim()) {
    return t('validation.cityRequired');
  }
  if (city.trim().length < 2) {
    return t('validation.cityMinLength');
  }
  return null;
}

/**
 * Validates a state/province field
 * @param state - The state or province to validate
 * @param t - Translation function for error messages
 * @returns Error message if invalid, null if valid
 */
export function validateState(state: string, t: (key: string) => string): string | null {
  if (!state.trim()) {
    return t('validation.stateRequired');
  }
  return null;
}

/**
 * Validates a postal code field
 * @param postalCode - The postal code to validate
 * @param country - The country code (currently unused but available for country-specific validation)
 * @param t - Translation function for error messages
 * @returns Error message if invalid, null if valid
 */
export function validatePostalCode(
  postalCode: string,
  country: string,
  t: (key: string) => string
): string | null {
  if (!postalCode.trim()) {
    return t('validation.postalCodeRequired');
  }
  if (!/^[\d\w\s\-]+$/.test(postalCode)) {
    return t('validation.postalCodeInvalid');
  }
  return null;
}

/**
 * Validates a country code field
 * @param country - The country code to validate (should be 2-letter ISO code)
 * @param t - Translation function for error messages
 * @returns Error message if invalid, null if valid
 */
export function validateCountry(country: string, t: (key: string) => string): string | null {
  if (!country.trim()) {
    return t('validation.countryCodeRequired');
  }
  if (country.trim().length !== 2) {
    return t('validation.countryCodeLength');
  }
  if (!/^[A-Z]{2}$/i.test(country.trim())) {
    return t('validation.countryCodeFormat');
  }
  return null;
}

/**
 * Validates all fields in an address form
 * @param formData - The form data to validate
 * @param t - Translation function for error messages
 * @returns Object containing field errors, empty if all valid
 */
export function validateForm(
  formData: {
    fullName: string;
    phone: string;
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  },
  t: (key: string) => string
): FieldErrors {
  const errors: FieldErrors = {};

  const fullNameError = validateFullName(formData.fullName, t);
  if (fullNameError) errors.fullName = fullNameError;

  const phoneError = validatePhone(formData.phone, t);
  if (phoneError) errors.phone = phoneError;

  const addressError = validateAddressLine(formData.addressLine1, t);
  if (addressError) errors.addressLine1 = addressError;

  const cityError = validateCity(formData.city, t);
  if (cityError) errors.city = cityError;

  const stateError = validateState(formData.state, t);
  if (stateError) errors.state = stateError;

  const postalCodeError = validatePostalCode(formData.postalCode, formData.country, t);
  if (postalCodeError) errors.postalCode = postalCodeError;

  const countryError = validateCountry(formData.country, t);
  if (countryError) errors.country = countryError;

  return errors;
}

/**
 * Validates a single field by name
 * @param name - The field name to validate
 * @param value - The field value to validate
 * @param country - The country code (used for postal code validation)
 * @param t - Translation function for error messages
 * @returns Error message if invalid, undefined if valid
 */
export function validateField(
  name: string,
  value: string,
  country: string,
  t: (key: string) => string
): string | undefined {
  switch (name) {
    case 'fullName':
      return validateFullName(value, t) || undefined;
    case 'phone':
      return validatePhone(value, t) || undefined;
    case 'addressLine1':
      return validateAddressLine(value, t) || undefined;
    case 'city':
      return validateCity(value, t) || undefined;
    case 'state':
      return validateState(value, t) || undefined;
    case 'postalCode':
      return validatePostalCode(value, country, t) || undefined;
    case 'country':
      return validateCountry(value, t) || undefined;
    default:
      return undefined;
  }
}
