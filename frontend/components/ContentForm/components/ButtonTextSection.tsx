import { useTranslations } from 'next-intl';
import { LanguageTab, ValidationErrors } from '../types';

/**
 * Props for the ButtonTextSection component
 */
interface ButtonTextSectionProps {
  /** Content type */
  contentType: string;
  /** Active language tab */
  activeTab: LanguageTab;
  /** Button text in English */
  buttonTextEn: string;
  /** Button text in Vietnamese */
  buttonTextVi: string;
  /** Validation errors */
  validationErrors: ValidationErrors;
  /** Callback when field changes */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Button text input field for homepage section content (respects active language tab)
 *
 * @example
 * ```tsx
 * <ButtonTextSection
 *   contentType={formData.type}
 *   activeTab={activeTab}
 *   buttonTextEn={formData.buttonTextEn}
 *   buttonTextVi={formData.buttonTextVi}
 *   validationErrors={validationErrors}
 *   onChange={handleChange}
 * />
 * ```
 */
export function ButtonTextSection({
  contentType,
  activeTab,
  buttonTextEn,
  buttonTextVi,
  validationErrors,
  onChange,
}: ButtonTextSectionProps) {
  const t = useTranslations();

  // Only show button text section for HOMEPAGE_SECTION type
  if (contentType !== 'HOMEPAGE_SECTION') {
    return null;
  }

  const isEnglish = activeTab === 'en';
  const buttonTextValue = isEnglish ? buttonTextEn : buttonTextVi;
  const buttonTextName = isEnglish ? 'buttonTextEn' : 'buttonTextVi';
  const buttonTextLabel = isEnglish
    ? t('admin.buttonTextEnglish')
    : t('admin.buttonTextVietnamese');

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {buttonTextLabel}
      </label>
      <input
        type="text"
        name={buttonTextName}
        value={buttonTextValue}
        onChange={onChange}
        className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          validationErrors[buttonTextName] ? 'border-red-500' : 'border-gray-300'
        }`}
        placeholder={t('admin.buttonTextPlaceholder')}
      />
      {validationErrors[buttonTextName] && (
        <p className="text-sm text-red-600 mt-1">{validationErrors[buttonTextName]}</p>
      )}
      <p className="text-sm text-gray-500 mt-1">{t('admin.buttonTextHint')}</p>
    </div>
  );
}
