import { useTranslations } from 'next-intl';
import { ValidationErrors } from '../types';

/**
 * Props for the LayoutSection component
 */
interface LayoutSectionProps {
  /** Content type */
  contentType: string;
  /** Layout value */
  layout: 'centered' | 'image-left' | 'image-right';
  /** Validation errors */
  validationErrors: ValidationErrors;
  /** Callback when field changes */
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

/**
 * Layout selector for homepage section content
 *
 * @example
 * ```tsx
 * <LayoutSection
 *   contentType={formData.type}
 *   layout={formData.layout}
 *   validationErrors={validationErrors}
 *   onChange={handleChange}
 * />
 * ```
 */
export function LayoutSection({
  contentType,
  layout,
  validationErrors,
  onChange,
}: LayoutSectionProps) {
  const t = useTranslations();

  // Only show layout section for HOMEPAGE_SECTION type
  if (contentType !== 'HOMEPAGE_SECTION') {
    return null;
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {t('admin.layout')}
      </label>
      <select
        name="layout"
        value={layout}
        onChange={onChange}
        className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          validationErrors.layout ? 'border-red-500' : 'border-gray-300'
        }`}
      >
        <option value="centered">{t('admin.layoutCentered')}</option>
        <option value="image-left">{t('admin.layoutImageLeft')}</option>
        <option value="image-right">{t('admin.layoutImageRight')}</option>
      </select>
      {validationErrors.layout && (
        <p className="text-sm text-red-600 mt-1">{validationErrors.layout}</p>
      )}
      <p className="text-sm text-gray-500 mt-1">{t('admin.layoutHint')}</p>
    </div>
  );
}
