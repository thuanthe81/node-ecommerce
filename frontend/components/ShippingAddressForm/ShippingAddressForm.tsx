'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { ShippingAddressFormProps } from './types';
import { useAddressForm } from './hooks/useAddressForm';
import { useSavedAddresses } from './hooks/useSavedAddresses';
import { SavedAddressList } from './components/SavedAddressList';
import { NewAddressForm } from './components/NewAddressForm';

/**
 * ShippingAddressForm component for checkout process
 *
 * Allows users to select from saved addresses or enter a new address.
 * For authenticated users, displays saved addresses with option to add new.
 * For guest users, shows only the new address form.
 *
 * Features:
 * - Real-time validation with visual feedback
 * - Auto-selection of default address
 * - Automatic address updates when form becomes valid
 * - Support for both authenticated and guest users
 */
export default function ShippingAddressForm({
  onAddressSelect,
  onNewAddress,
  selectedAddressId,
}: ShippingAddressFormProps) {
  const t = useTranslations();
  const { user } = useAuth();
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track the last address data we sent to prevent infinite loops
  const lastSentAddressRef = useRef<string | null>(null);

  // Use custom hooks for form management and saved addresses
  const {
    formData,
    fieldErrors,
    touchedFields,
    isValid,
    handleChange,
    handleBlur,
    resetForm,
  } = useAddressForm(undefined, t);

  const { addresses: savedAddresses, isLoading } = useSavedAddresses(
    user?.id,
    onAddressSelect,
    selectedAddressId
  );

  // Show new address form for guests or when no saved addresses exist
  useEffect(() => {
    if (!user || savedAddresses.length === 0) {
      setShowNewAddressForm(true);
    }
  }, [user, savedAddresses.length]);

  // Real-time address updates when form becomes valid
  useEffect(() => {
    // Create a unique key for the current form data to prevent duplicate calls
    const currentAddressKey = JSON.stringify(formData);

    console.log('[ShippingAddressForm] Form validation check:', {
      isValid,
      user: !!user,
      showNewAddressForm,
      formData,
      fieldErrors,
      lastSentKey: lastSentAddressRef.current,
      currentKey: currentAddressKey,
    });

    if (isValid) {
      // Check if we've already sent this exact address data
      if (lastSentAddressRef.current === currentAddressKey) {
        console.log('[ShippingAddressForm] Skipping - already sent this address data');
        return;
      }

      // For guest users, always update the address
      if (!user) {
        console.log('[ShippingAddressForm] Calling onNewAddress for guest user');
        lastSentAddressRef.current = currentAddressKey;
        onNewAddress(formData);
      }
      // For authenticated users in new address mode, update the address
      else if (showNewAddressForm) {
        console.log(
          '[ShippingAddressForm] Calling onNewAddress for authenticated user (new address mode)'
        );
        lastSentAddressRef.current = currentAddressKey;
        onNewAddress(formData);
      }
    }
  }, [formData, fieldErrors, user, showNewAddressForm, onNewAddress, isValid]);

  const handleAddNewClick = () => {
    setShowNewAddressForm(true);
  };

  const handleBackToSavedClick = () => {
    setShowNewAddressForm(false);
    setError(null);
    resetForm();
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    handleChange(e);
    // Clear error when user starts editing
    if (error) {
      setError(null);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      {user && savedAddresses.length > 0 && !showNewAddressForm && (
        <SavedAddressList
          addresses={savedAddresses}
          selectedId={selectedAddressId}
          onSelect={onAddressSelect}
          onAddNew={handleAddNewClick}
          t={t}
        />
      )}

      {(showNewAddressForm || !user || savedAddresses.length === 0) && (
        <>
          <NewAddressForm
            formData={formData}
            errors={fieldErrors}
            touched={touchedFields}
            isValid={isValid}
            error={error}
            onChange={handleInputChange}
            onBlur={handleBlur}
            t={t}
          />

          {user && savedAddresses.length > 0 && (
            <div className="mt-6">
              <button
                type="button"
                onClick={handleBackToSavedClick}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                ← {t('checkout.backToSavedAddress')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
