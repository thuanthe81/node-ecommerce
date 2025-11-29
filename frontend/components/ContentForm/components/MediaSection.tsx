import { useTranslations } from 'next-intl';
import { ValidationErrors } from '../types';

/**
 * Props for the MediaSection component
 */
interface MediaSectionProps {
  /** Content type */
  contentType: string;
  /** Image URL value */
  imageUrl: string;
  /** Link URL value */
  linkUrl: string;
  /** Validation errors */
  validationErrors: ValidationErrors;
  /** Whether image picker is shown */
  showImagePicker: boolean;
  /** Callback when field changes */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Callback to toggle image picker */
  onToggleImagePicker: () => void;
}

/**
 * Image and link URL input fields for banner and homepage section content
 *
 * @example
 * ```tsx
 * <MediaSection
 *   contentType={formData.type}
 *   imageUrl={formData.imageUrl}
 *   linkUrl={formData.linkUrl}
 *   validationErrors={validationErrors}
 *   showImagePicker={showImagePicker}
 *   onChange={handleChange}
 *   onToggleImagePicker={() => setShowImagePicker(!showImagePicker)}
 * />
 * ```
 */
export function MediaSection({
  contentType,
  imageUrl,
  linkUrl,
  validationErrors,
  showImagePicker,
  onChange,
  onToggleImagePicker,
}: MediaSectionProps) {
  const t = useTranslations();

  // Only show media section for BANNER and HOMEPAGE_SECTION types
  if (contentType !== 'BANNER' && contentType !== 'HOMEPAGE_SECTION') {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('admin.imageUrl')}
        </label>
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              name="imageUrl"
              value={imageUrl}
              onChange={onChange}
              className={`flex-1 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                validationErrors.imageUrl ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={t('admin.imageUrlPlaceholder')}
            />
            <button
              type="button"
              onClick={onToggleImagePicker}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {showImagePicker ? 'Hide' : 'Pick from Products'}
            </button>
          </div>
          {validationErrors.imageUrl && (
            <p className="text-sm text-red-600">{validationErrors.imageUrl}</p>
          )}
          {imageUrl && (
            <div className="mt-2">
              <img
                src={imageUrl}
                alt="Preview"
                className="h-32 w-auto object-cover rounded border border-gray-300"
              />
            </div>
          )}
        </div>
      </div>
      {contentType === 'BANNER' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('admin.linkUrl')}
          </label>
          <input
            type="text"
            name="linkUrl"
            value={linkUrl}
            onChange={onChange}
            className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              validationErrors.linkUrl ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={t('admin.linkUrlPlaceholder')}
          />
          {validationErrors.linkUrl && (
            <p className="text-sm text-red-600 mt-1">{validationErrors.linkUrl}</p>
          )}
        </div>
      )}
    </div>
  );
}
