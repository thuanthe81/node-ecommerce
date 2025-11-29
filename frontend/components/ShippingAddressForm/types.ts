/**
 * Address data structure for shipping addresses
 */
export interface Address {
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

/**
 * Field-level validation errors
 */
export interface FieldErrors {
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

/**
 * Tracks which fields have been touched by the user
 */
export interface TouchedFields {
  fullName: boolean;
  phone: boolean;
  addressLine1: boolean;
  city: boolean;
  state: boolean;
  postalCode: boolean;
  country: boolean;
}

/**
 * Props for the ShippingAddressForm component
 */
export interface ShippingAddressFormProps {
  onAddressSelect: (addressId: string) => void;
  onNewAddress: (address: Omit<Address, 'id' | 'isDefault'>) => void;
  selectedAddressId?: string;
}
