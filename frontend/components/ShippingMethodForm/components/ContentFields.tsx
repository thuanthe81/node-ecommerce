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
  /** Whether to show both languages side by side (admin mode) */
  showBothLanguages?: boolean;
}

/**
 * ContentFields component for bilingual name and description
 *
 * Displays name and description fields for the currently active language tab
 * or both languages side by side for admin translation management
 */
export function ContentFields({ formData, activeTab, onChange, showBothLanguages = false }: ContentFieldsProps) {
  const t = useTranslations('admin.shippingMethods');

  // Helper function to get validation status for a field
  const getFieldValidationStatus = (enValue: string, viValue: string) => {
    const hasEn = enValue.trim().length > 0;
    const hasVi = viValue.trim().length > 0;

    if (hasEn && hasVi) return 'complete';
    if (hasEn || hasVi) return 'partial';
    return 'missing';
  };

  // Helper function to render validation indicator
  const renderValidationIndicator = (status: string) => {
    switch (status) {
      case 'complete':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            ✓ {t('allTranslationsComplete')}
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
            ⚠ {t('incompleteTranslations')}
          </span>
        );
      case 'missing':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
            ✗ {t('missingTranslation')}
          </span>
        );
      default:
        return null;
    }
  };

  if (showBothLanguages) {
    // Admin mode: Show both languages side by side
    const nameStatus = getFieldValidationStatus(formData.nameEn, formData.nameVi);
    const descriptionStatus = getFieldValidationStatus(formData.descriptionEn, formData.descriptionVi);

    return (
      <div className="space-y-6">
        {/* Name Fields */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              {t('name')} <span className="text-red-500">*</span>
            </label>
            {renderValidationIndicator(nameStatus)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                English
              </label>
              <input
                type="text"
                name="nameEn"
                value={formData.nameEn}
                onChange={onChange}
                required
                placeholder="Standard Shipping"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formData.nameEn.trim() ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                }`}
              />
              {!formData.nameEn.trim() && (
                <p className="text-xs text-red-600 mt-1">{t('missingEnglishTranslation')}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Tiếng Việt
              </label>
              <input
                type="text"
                name="nameVi"
                value={formData.nameVi}
                onChange={onChange}
                required
                placeholder="Vận chuyển tiêu chuẩn"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formData.nameVi.trim() ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                }`}
              />
              {!formData.nameVi.trim() && (
                <p className="text-xs text-red-600 mt-1">{t('missingVietnameseTranslation')}</p>
              )}
            </div>
          </div>
        </div>

        {/* Description Fields */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              {t('description')} <span className="text-red-500">*</span>
            </label>
            {renderValidationIndicator(descriptionStatus)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                English
              </label>
              <textarea
                name="descriptionEn"
                value={formData.descriptionEn}
                onChange={onChange}
                required
                rows={3}
                placeholder="Standard delivery within 3-5 business days"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formData.descriptionEn.trim() ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                }`}
              />
              {!formData.descriptionEn.trim() && (
                <p className="text-xs text-red-600 mt-1">{t('missingEnglishTranslation')}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Tiếng Việt
              </label>
              <textarea
                name="descriptionVi"
                value={formData.descriptionVi}
                onChange={onChange}
                required
                rows={3}
                placeholder="Giao hàng tiêu chuẩn trong 3-5 ngày làm việc"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formData.descriptionVi.trim() ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                }`}
              />
              {!formData.descriptionVi.trim() && (
                <p className="text-xs text-red-600 mt-1">{t('missingVietnameseTranslation')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Original tab mode: Show only active language
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
