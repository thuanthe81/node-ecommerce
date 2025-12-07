import { useTranslations } from 'next-intl';
import { ShippingMethodFormData, LanguageTab } from '../types';

/**
 * Props for the ContentFields component
 */
interface ContentFieldsProps {
  /** Current form data */
  formData: ShippingMethodFormData;
  /** Active language tab */
  activeTab: LanguageTab;
  /** Handler for input changes */
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

/**
 * ContentFields component for bilingual name and description
 *
 * Displays name and description fields for the currently active language tab
 */
export function ContentFields({ formData, activeTab, onChange }: ContentFieldsProps) {
  const t = useTranslations('admin.shippingMethods');

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('name')} ({activeTab.toUpperCase()}) <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name={activeTab === 'en' ? 'nameEn' : 'nameVi'}
          value={activeTab === 'en' ? formData.nameEn : formData.nameVi}
          onChange={onChange}
          required
          placeholder={t('namePlaceholder')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('description')} ({activeTab.toUpperCase()}) <span className="text-red-500">*</span>
        </label>
        <textarea
          name={activeTab === 'en' ? 'descriptionEn' : 'descriptionVi'}
          value={activeTab === 'en' ? formData.descriptionEn : formData.descriptionVi}
          onChange={onChange}
          required
          rows={3}
          placeholder={t('descriptionPlaceholder')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
}
