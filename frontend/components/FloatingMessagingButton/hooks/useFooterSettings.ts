/**
 * useFooterSettings Hook
 * Fetches footer settings from API on mount and manages loading/error states
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { footerSettingsApi, FooterSettings } from '@/lib/footer-settings-api';
import { UseFooterSettingsReturn } from '../types';

/**
 * Custom hook to fetch and manage footer settings
 * Fetches data on mount and provides refetch capability
 *
 * @returns {UseFooterSettingsReturn} Footer settings data, loading state, error, and refetch function
 */
export function useFooterSettings(): UseFooterSettingsReturn {
  const [footerSettings, setFooterSettings] = useState<FooterSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFooterSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await footerSettingsApi.getFooterSettings();
      setFooterSettings(data);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to fetch footer settings');
      console.error('[FloatingMessagingButton] Error fetching footer settings:', errorObj);
      setError(errorObj);
      setFooterSettings(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch footer settings on mount
  useEffect(() => {
    fetchFooterSettings();
  }, [fetchFooterSettings]);

  return {
    footerSettings,
    isLoading,
    error,
    refetch: fetchFooterSettings,
  };
}
