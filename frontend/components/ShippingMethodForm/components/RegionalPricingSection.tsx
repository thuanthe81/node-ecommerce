import { useTranslations } from 'next-intl';
import { RegionalPricingEntry } from '../types';
import { SvgTrashEEE } from '@/components/Svgs';

/**
 * Props for the RegionalPricingSection component
 */
interface RegionalPricingSectionProps {
  /** Regional pricing entries */
  regionalPricing: RegionalPricingEntry[];
  /** Handler for adding a new entry */
  onAdd: () => void;
  /** Handler for removing an entry */
  onRemove: (id: string) => void;
  /** Handler for updating an entry */
  onChange: (id: string, field: 'countryOrRegion' | 'rate', value: string | number) => void;
}

/**
 * RegionalPricingSection component for managing country/region specific rates
 *
 * Allows administrators to define different base rates for specific countries or regions
 */
export function RegionalPricingSection({
  regionalPricing,
  onAdd,
  onRemove,
  onChange,
}: RegionalPricingSectionProps) {
  const t = useTranslations('admin.shippingMethods');

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">
          {t('regionalPricing')}
        </h2>
        <button
          type="button"
          onClick={onAdd}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t('addRegionalRate')}
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        {t('regionalPricingHelp')}
      </p>

      {regionalPricing.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          {t('noRegionalRates')}
        </div>
      ) : (
        <div className="space-y-3">
          {regionalPricing.map((entry) => (
            <div key={entry.id} className="flex gap-3 items-start">
              <div className="flex-1">
                <input
                  type="text"
                  value={entry.countryOrRegion}
                  onChange={(e) => onChange(entry.id, 'countryOrRegion', e.target.value)}
                  placeholder={t('countryOrRegionPlaceholder')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  value={entry.rate}
                  onChange={(e) => onChange(entry.id, 'rate', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  placeholder={t('ratePlaceholder')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="button"
                onClick={() => onRemove(entry.id)}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                aria-label={t('removeRegionalRate')}
              >
                <SvgTrashEEE
                  className="w-5 h-5"
                />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}