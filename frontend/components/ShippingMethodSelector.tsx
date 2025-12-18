'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { formatMoney } from '@/app/utils';
import { shippingApi, ShippingRate, CalculateShippingData } from '@/lib/shipping-api';

interface ShippingMethodSelectorProps {
  selectedMethod: string;
  onMethodSelect: (methodId: string) => void;
  onRatesCalculated?: (rates: ShippingRate[]) => void;
  shippingAddress?: {
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  cartItems?: Array<{
    product: {
      id: string;
      weight?: number;
    };
    quantity: number;
  }>;
  orderValue?: number;
  locale?: string; // Current user locale
}

export default function ShippingMethodSelector({
  selectedMethod,
  onMethodSelect,
  onRatesCalculated,
  shippingAddress,
  cartItems = [],
  orderValue = 0,
  locale: propLocale,
}: ShippingMethodSelectorProps) {
  const currentLocale = useLocale();
  const locale = propLocale || currentLocale; // Use prop locale or fallback to current locale
  const t = useTranslations('checkout');
  const tCommon = useTranslations('common');

  const [shippingMethods, setShippingMethods] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localeLoading, setLocaleLoading] = useState(false);
  const [localeSwitchError, setLocaleSwitchError] = useState<string | null>(null);

  // Helper function to get localized text with fallback
  const getLocalizedText = (method: ShippingRate, field: 'name' | 'description'): string => {
    if (locale === 'vi') {
      const viText = field === 'name' ? method.nameVi : method.descriptionVi;
      // Fallback to English if Vietnamese text is missing or empty
      if (viText && viText.trim()) {
        return viText;
      }
    }

    // Default to English
    const enText = field === 'name' ? method.nameEn : method.descriptionEn;
    return enText || '';
  };

  useEffect(() => {
    const fetchShippingRates = async () => {
      // If no shipping address provided, we can't calculate rates yet
      if (!shippingAddress) {
        setLoading(false);
        setLocaleLoading(false);
        return;
      }

      // If we already have methods and this is just a locale change, use locale loading
      const isLocaleSwitch = shippingMethods.length > 0;
      if (isLocaleSwitch) {
        setLocaleLoading(true);
        setLocaleSwitchError(null); // Clear previous locale switch errors
      } else {
        setLoading(true);
        setError(null); // Clear general errors for initial load
      }

      try {
        // Prepare items for shipping calculation
        const items = cartItems.map(item => ({
          weight: item.product.weight || 0.5, // Default weight if not specified
          quantity: item.quantity,
        }));

        const calculateData: CalculateShippingData = {
          destinationCity: shippingAddress.city,
          destinationState: shippingAddress.state,
          destinationPostalCode: shippingAddress.postalCode,
          destinationCountry: shippingAddress.country,
          items,
          orderValue,
          locale: locale as 'en' | 'vi', // Pass locale to shipping calculation API
        };

        const rates = await shippingApi.calculateShipping(calculateData);

        if (rates.length === 0) {
          setError(t('noShippingMethodsAvailable'));
          setShippingMethods([]);
          if (onRatesCalculated) {
            onRatesCalculated([]);
          }
        } else {
          setShippingMethods(rates);
          if (onRatesCalculated) {
            onRatesCalculated(rates);
          }
          // Auto-select first method if none selected
          if (!selectedMethod && rates.length > 0) {
            onMethodSelect(rates[0].method);
          }
        }
      } catch (err: any) {
        console.error('Failed to fetch shipping rates:', err);

        const isLocaleSwitch = shippingMethods.length > 0;
        if (isLocaleSwitch) {
          // For locale switching errors, maintain current display and show warning
          setLocaleSwitchError(t('localeSwitchError'));
          // Auto-clear the error after 5 seconds
          setTimeout(() => {
            setLocaleSwitchError(null);
          }, 5000);
          // Don't clear existing shipping methods or call onRatesCalculated
        } else {
          // For initial load errors, show full error state
          setError(err.response?.data?.message || t('shippingCalculationError'));
          setShippingMethods([]);
          if (onRatesCalculated) {
            onRatesCalculated([]);
          }
        }
      } finally {
        setLoading(false);
        setLocaleLoading(false);
      }
    };

    fetchShippingRates();
  }, [shippingAddress, cartItems, orderValue, locale]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">
          {t('shippingMethod')}
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">{tCommon('loading')}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">
          {t('shippingMethod')}
        </h3>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (shippingMethods.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">
          {t('shippingMethod')}
        </h3>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700">{t('noShippingMethodsAvailable')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          {t('shippingMethod')}
        </h3>
        {localeLoading && (
          <div className="flex items-center text-sm text-gray-600">
            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            {tCommon('loading')}
          </div>
        )}
      </div>

      {localeSwitchError && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <svg
              className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <p className="text-sm text-yellow-700">{localeSwitchError}</p>
          </div>
        </div>
      )}

      <div className={`space-y-3 ${localeLoading ? 'opacity-50 pointer-events-none' : ''}`}>
        {shippingMethods.map((method) => (
          <label
            key={method.method}
            className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedMethod === method.method
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="radio"
                  name="shippingMethod"
                  value={method.method}
                  checked={selectedMethod === method.method}
                  onChange={() => onMethodSelect(method.method)}
                  className="mr-3"
                />
                <div>
                  <div className="font-semibold">
                    {getLocalizedText(method, 'name')}
                    {method.isFreeShipping && (
                      <span className="ml-2 text-green-600 text-sm">
                        ({t('freeShipping')})
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {getLocalizedText(method, 'description')}
                  </div>
                  {method.carrier && (
                    <div className="text-xs text-gray-500 mt-1">
                      {method.carrier}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">
                  {method.isFreeShipping ? (
                    <span className="text-green-600">{t('freeShipping')}</span>
                  ) : (
                    formatMoney(method.cost)
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {method.estimatedDays}
                </div>
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}