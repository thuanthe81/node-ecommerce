import { useState } from 'react';
import { RegionalPricingEntry } from '../types';

/**
 * Custom hook for managing regional pricing entries
 *
 * @param initialPricing - Initial regional pricing object
 * @returns Regional pricing state and handlers
 *
 * @example
 * ```tsx
 * const {
 *   regionalPricing,
 *   addEntry,
 *   removeEntry,
 *   updateEntry,
 *   toObject
 * } = useRegionalPricing(shippingMethod?.regionalPricing);
 * ```
 */
export function useRegionalPricing(initialPricing?: Record<string, number> | null) {
  // Convert initial object to array of entries
  const initialEntries: RegionalPricingEntry[] = initialPricing
    ? Object.entries(initialPricing).map(([countryOrRegion, rate]) => ({
        id: Math.random().toString(36).substr(2, 9),
        countryOrRegion,
        rate,
      }))
    : [];

  const [regionalPricing, setRegionalPricing] = useState<RegionalPricingEntry[]>(initialEntries);

  /**
   * Add a new regional pricing entry
   */
  const addEntry = () => {
    const newEntry: RegionalPricingEntry = {
      id: Math.random().toString(36).substr(2, 9),
      countryOrRegion: '',
      rate: 0,
    };
    setRegionalPricing([...regionalPricing, newEntry]);
  };

  /**
   * Remove a regional pricing entry by ID
   */
  const removeEntry = (id: string) => {
    setRegionalPricing(regionalPricing.filter((entry) => entry.id !== id));
  };

  /**
   * Update a regional pricing entry field
   */
  const updateEntry = (id: string, field: 'countryOrRegion' | 'rate', value: string | number) => {
    setRegionalPricing(
      regionalPricing.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };

  /**
   * Convert regional pricing array to object format for API
   * Filters out entries with empty country/region names
   */
  const toObject = (): Record<string, number> | undefined => {
    const filtered = regionalPricing.filter((entry) => entry.countryOrRegion.trim() !== '');
    if (filtered.length === 0) return undefined;

    return filtered.reduce((acc, entry) => {
      acc[entry.countryOrRegion.trim()] = entry.rate;
      return acc;
    }, {} as Record<string, number>);
  };

  return {
    regionalPricing,
    addEntry,
    removeEntry,
    updateEntry,
    toObject,
  };
}
