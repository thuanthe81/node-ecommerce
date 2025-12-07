import { useTranslations } from 'next-intl';
import { ShippingMethodFormData } from '../types';

/**
 * Props for the BasicInfoSection component
 */
interface BasicInfoSectionProps {
  /** Current form data */
  formData: ShippingMethodFormData;
  /** Whether the form is in edit mode */
  isEdit: boolean;
  /** Handler for input changes */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * BasicInfoSection component for method ID, carrier, and display order
 *
 * Displays the basic configuration fields for a shipping method including:
 * - Method ID (immutable in edit mode)
 * - Carrier name
 * - Display order
 */
export function BasicInfoSection({ formData, isEdit, onChange }: BasicInfoSectionProps) {
  const t = useTranslations('admin.shippingMethods');

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        {t('basicInformation')}
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('methodId')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="methodId"
            value={formData.methodId}
            onChange={onChange}
            required
            disabled={isEdit}
            placeholder="standard-shipping"
            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              isEdit ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
          />
          <p className="mt-1 text-xs text-gray-500">
            {t('methodIdHelp')}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('carrier')}
          </label>
          <input
            type="text"
            name="carrier"
            value={formData.carrier}
            onChange={onChange}
            placeholder={t('carrierPlaceholder')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500">
            {t('carrierHelp')}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('displayOrder')}
          </label>
          <input
            type="number"
            name="displayOrder"
            value={formData.displayOrder}
            onChange={onChange}
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500">
            {t('displayOrderHelp')}
          </p>
        </div>
      </div>
    </div>
  );
}
