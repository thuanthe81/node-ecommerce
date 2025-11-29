'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ImagePickerModal from '../ImagePickerModal';
import { useCategoryForm } from './hooks/useCategoryForm';
import { BasicFields } from './components/BasicFields';
import { ContentFields } from './components/ContentFields';
import { LanguageTabs } from './components/LanguageTabs';
import { ImageSection } from './components/ImageSection';
import { SettingsSection } from './components/SettingsSection';
import { FormActions } from './components/FormActions';
import { CategoryFormProps } from './types';

/**
 * CategoryForm component for creating and editing categories
 *
 * Provides a comprehensive form for managing product categories with:
 * - Basic information (slug, parent category, display order)
 * - Bilingual content (name and description in English and Vietnamese)
 * - Image management (edit mode only)
 * - Active/inactive status
 *
 * @example
 * ```tsx
 * // Create mode
 * <CategoryForm locale="en" />
 *
 * // Edit mode
 * <CategoryForm locale="en" category={existingCategory} isEdit={true} />
 * ```
 */
export default function CategoryForm({ locale, category, isEdit = false }: CategoryFormProps) {
  const router = useRouter();
  const [showImagePicker, setShowImagePicker] = useState(false);

  const {
    formData,
    loading,
    categories,
    activeTab,
    setActiveTab,
    handleInputChange,
    handleImageSelect,
    handleImageClear,
    handleSubmit,
  } = useCategoryForm(locale, category, isEdit);

  const handleImageSelectAndClose = (imageUrl: string) => {
    handleImageSelect(imageUrl);
    setShowImagePicker(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <BasicFields
        formData={formData}
        categories={categories}
        locale={locale}
        onChange={handleInputChange}
      />

      {/* Bilingual Content */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">
            {locale === 'vi' ? 'Nội dung' : 'Content'}
          </h2>
          <LanguageTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <ContentFields
          formData={formData}
          activeTab={activeTab}
          locale={locale}
          onChange={handleInputChange}
        />
      </div>

      {/* Image - Only show in edit mode */}
      {isEdit && (
        <ImageSection
          imageUrl={formData.imageUrl}
          locale={locale}
          onOpenPicker={() => setShowImagePicker(true)}
          onClearImage={handleImageClear}
        />
      )}

      {/* Settings */}
      <SettingsSection
        isActive={formData.isActive ?? true}
        locale={locale}
        onChange={handleInputChange}
      />

      {/* Form Actions */}
      <FormActions loading={loading} locale={locale} onCancel={() => router.back()} />

      {/* Image Picker Modal */}
      <ImagePickerModal
        isOpen={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onSelectImage={handleImageSelectAndClose}
        locale={locale}
      />
    </form>
  );
}
