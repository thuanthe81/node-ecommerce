import { useState, useEffect, useCallback } from 'react';
import { userApi } from '@/lib/user-api';
import { Address } from '../types';

/**
 * Custom hook for fetching and managing saved addresses
 *
 * @param userId - Optional user ID to fetch addresses for
 * @param onAddressSelect - Callback to auto-select default address
 * @param selectedAddressId - Currently selected address ID
 *
 * @returns Saved addresses state and handlers
 *
 * @example
 * ```tsx
 * const {
 *   addresses,
 *   isLoading,
 *   error,
 *   refetch
 * } = useSavedAddresses(user?.id, onAddressSelect, selectedAddressId);
 * ```
 */
export function useSavedAddresses(
  userId?: string,
  onAddressSelect?: (addressId: string) => void,
  selectedAddressId?: string
) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches saved addresses from the API
   */
  const fetchAddresses = useCallback(async () => {
    if (!userId) {
      setAddresses([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const fetchedAddresses = await userApi.getAddresses();
      setAddresses(fetchedAddresses);

      // Auto-select default address if no address is currently selected
      if (onAddressSelect && !selectedAddressId) {
        const defaultAddress = fetchedAddresses.find((addr) => addr.isDefault);
        if (defaultAddress) {
          onAddressSelect(defaultAddress.id);
        }
      }
    } catch (err) {
      console.error('Failed to load addresses:', err);
      setError(err instanceof Error ? err.message : 'Failed to load addresses');
    } finally {
      setIsLoading(false);
    }
  }, [userId, onAddressSelect, selectedAddressId]);

  // Load addresses when userId changes
  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  return {
    addresses,
    isLoading,
    error,
    refetch: fetchAddresses,
  };
}
