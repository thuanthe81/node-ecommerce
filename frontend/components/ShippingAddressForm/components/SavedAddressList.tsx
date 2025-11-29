import React from 'react';
import { Address } from '../types';
import { AddressCard } from './AddressCard';

/**
 * Props for the SavedAddressList component
 */
interface SavedAddressListProps {
  /** Array of saved addresses */
  addresses: Address[];
  /** Currently selected address ID */
  selectedId?: string;
  /** Callback when an address is selected */
  onSelect: (addressId: string) => void;
  /** Callback to show new address form */
  onAddNew: () => void;
  /** Translation function */
  t: (key: string) => string;
}

/**
 * Displays a list of saved addresses with selection capability
 *
 * Shows all saved addresses as selectable cards and provides
 * a button to add a new address.
 */
export function SavedAddressList({
  addresses,
  selectedId,
  onSelect,
  onAddNew,
  t,
}: SavedAddressListProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">
        {t('checkout.selectShippingAddress')}
      </h3>
      <div className="space-y-3">
        {addresses.map((address) => (
          <AddressCard
            key={address.id}
            address={address}
            isSelected={selectedId === address.id}
            onSelect={onSelect}
            t={t}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={onAddNew}
        className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
      >
        + {t('checkout.addNewAddress')}
      </button>
    </div>
  );
}
