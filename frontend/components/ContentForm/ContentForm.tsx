'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import ImagePickerModal from '../ImagePickerModal';
import { ContentFormProps } from './types';
import { useContentForm } from './hooks/useContentForm';
import { ContentTypeSelector } from './components/ContentTypeSelector';
import { LanguageTabs } from './components/LanguageTabs';
import { ContentFields } from './components/ContentFields';
import { MediaSection } from './components/MediaSection';
import { ButtonTextSection } from './components/ButtonTextSection';
import { LayoutSection } from './components/LayoutSection';

/**
 * Form component for creating and editing content
 *
 * Supports multiple content types (PAGE, FAQ, BANNER, HOMEPAGE_SECTION)
 * with bilingual content (English and Vietnamese)
 *
 * @example
 * ```tsx
 * <ContentForm
 *   content={existingContent}
 *   onSubmit={handleSubmit}
 *   onCancel={handleCancel}
 * />
 * ```
 */
export default function ContentForm({
  content,
  onSubmit,
  onCancel,
  defaultType,
}: ContentFormProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [showImagePicker, setShowImagePicker] = useState(false);

  const {
    formData,
    validationErrors,
    activeTab,
    contentTypes,
    loading,
    error,
    previewMode,
    setActiveTab,
    setPreviewMode,
    setFormData,
    setValidationErrors,
    handleChange,
    handleTitleChange,
    handleImageSelect,
    handleSubmit,
    getTypeLabel,
  } = useContentForm(content, onSubmit, defaultType);

  const handleImagePickerSelect = (imageUrl: string, product?: any) => {
    handleImageSelect(imageUrl, product?.slug);
    setShowImagePicker(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {!defaultType && (
          <ContentTypeSelector
            value={formData.type}
            types={contentTypes}
            onChange={handleChange}
            getTypeLabel={getTypeLabel}
          />
        )}

        <div className={defaultType ? 'md:col-span-2' : ''}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('admin.slug')} {t('admin.required')}
          </label>
          <input
            type="text"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            required
            className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              validationErrors.slug ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={t('admin.slugPlaceholder')}
          />
          {validationErrors.slug && (
            <p className="text-sm text-red-600 mt-1">{validationErrors.slug}</p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            {t('admin.slugHintUrl', { slug: formData.slug })}
          </p>
        </div>
      </div>

      <LanguageTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <ContentFields
        activeTab={activeTab}
        titleEn={formData.titleEn}
        titleVi={formData.titleVi}
        contentEn={formData.contentEn}
        contentVi={formData.contentVi}
        validationErrors={validationErrors}
        previewMode={previewMode}
        onPreviewToggle={() => setPreviewMode(!previewMode)}
        onTitleChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const { name, value } = e.target;
          setFormData((prev) => ({
            ...prev,
            [name]: value,
            // Only auto-generate slug from English title when creating new content
            ...(name === 'titleEn' && !content ? { slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') } : {}),
          }));
          // Clear validation error for this field
          if (validationErrors[name]) {
            setValidationErrors((prev) => {
              const newErrors = { ...prev };
              delete newErrors[name];
              return newErrors;
            });
          }
        }}
        onContentChange={(html: string) => {
          const fieldName = activeTab === 'en' ? 'contentEn' : 'contentVi';
          setFormData((prev) => ({ ...prev, [fieldName]: html }));
          // Clear validation error for this field
          if (validationErrors[fieldName]) {
            setValidationErrors((prev) => {
              const newErrors = { ...prev };
              delete newErrors[fieldName];
              return newErrors;
            });
          }
        }}
      />

      <ButtonTextSection
        contentType={formData.type}
        activeTab={activeTab}
        buttonTextEn={formData.buttonTextEn}
        buttonTextVi={formData.buttonTextVi}
        validationErrors={validationErrors}
        onChange={handleChange}
      />

      <MediaSection
        contentType={formData.type}
        imageUrl={formData.imageUrl}
        linkUrl={formData.linkUrl}
        validationErrors={validationErrors}
        showImagePicker={showImagePicker}
        onChange={handleChange}
        onToggleImagePicker={() => setShowImagePicker(!showImagePicker)}
      />

      <LayoutSection
        contentType={formData.type}
        layout={formData.layout}
        validationErrors={validationErrors}
        onChange={handleChange}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('admin.displayOrder')}
          </label>
          <input
            type="number"
            name="displayOrder"
            value={formData.displayOrder}
            onChange={handleChange}
            min="0"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-500 mt-1">
            {t('admin.displayOrderHint')}
          </p>
        </div>

        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="isPublished"
              checked={formData.isPublished}
              onChange={handleChange}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              {t('admin.publishContent')}
            </span>
          </label>
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? t('admin.saving') : content ? t('admin.updateContent') : t('admin.createContent')}
        </button>
      </div>

      {/* Image Picker Modal */}
      <ImagePickerModal
        isOpen={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onSelectImage={handleImagePickerSelect}
        locale={locale}
      />
    </form>
  );
}