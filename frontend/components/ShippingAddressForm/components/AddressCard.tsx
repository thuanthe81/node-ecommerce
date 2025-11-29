import React from 'react';
import { Address } from '../types';

/**
 * Props for the AddressCard component
 */
interface AddressCardProps {
  /** Address data to display */
  address: Address;
  /** Whether this address is currently selected */
  isSelected: boolean;
  /** Callback when address is selected */
  onSelect: (addressId: string) => void;
  /** Translation function */
  t: (key: string) => string;
}

/**
 * Displays a single address card with selection radio button
 *
 * Shows address details including name, address lines, city/state/postal code,
 * phone number, and default badge if applicable.
 */
export function AddressCard({ address, isSelected, onSelect, t }: AddressCardProps) {
  return (
    <label
      className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
        isSelected
          ? 'border-blue-600 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      <input
        type="radio"
        name="shippingAddress"
        value={address.id}
        checked={isSelected}
        onChange={() => onSelect(address.id)}
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
            {t('form.default')}
          </span>
        )}
      </div>
    </label>
  );
}
