/**
 * Publishing section with featured image, display order, and publish toggle
 */

import { useTranslations } from 'next-intl';
import { BlogPostFormData, ValidationErrors } from '../types';

interface PublishingSectionProps {
  formData: BlogPostFormData;
  validationErrors: ValidationErrors;
  showImagePicker: boolean;
  onToggleImagePicker: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function PublishingSection({
  formData,
  validationErrors,
  showImagePicker,
  onToggleImagePicker,
  onChange,
}: PublishingSectionProps) {
  const t = useTranslations('admin.blog');
  const tAdmin = useTranslations('admin');

  return (
    <div className="space-y-6">
      {/* Featured Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('featuredImage')}
        </label>
        <div className="flex items-start space-x-4">
          {formData.imageUrl && (
            <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
              <img
                src={formData.imageUrl}
                alt="Featured"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <button
            type="button"
            onClick={onToggleImagePicker}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            {formData.imageUrl ? t('changeImage') : t('selectImage')}
          </button>
        </div>
        {validationErrors.imageUrl && (
          <p className="text-sm text-red-600 mt-1">{validationErrors.imageUrl}</p>
        )}
      </div>

      {/* Display Order and Published */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {tAdmin('displayOrder')}
          </label>
          <input
            type="number"
            name="displayOrder"
            value={formData.displayOrder}
            onChange={onChange}
            min="0"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-500 mt-1">{tAdmin('displayOrderHint')}</p>
        </div>

        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="isPublished"
              checked={formData.isPublished}
              onChange={onChange}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              {t('published')}
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
