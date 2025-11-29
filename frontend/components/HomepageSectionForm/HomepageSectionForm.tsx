'use client';

import { HomepageSectionFormProps } from './types';
import { useHomepageSectionForm } from './hooks/useHomepageSectionForm';
import { LayoutSelector } from './components/LayoutSelector';
import { BasicFields } from './components/BasicFields';
import { LanguageTabs } from './components/LanguageTabs';
import { ContentFields } from './components/ContentFields';
import { MediaFields } from './components/MediaFields';
import { FormActions } from './components/FormActions';

/**
 * Form component for creating and editing homepage sections
 *
 * Provides a comprehensive interface for managing homepage section content
 * including layout selection, multilingual content, and media configuration.
 *
 * @param props - Component props
 *
 * @example
 * ```tsx
 * <HomepageSectionForm
 *   section={existingSection}
 *   onSubmit={handleSubmit}
 *   onCancel={handleCancel}
 *   showPreview={true}
 *   onPreviewDataChange={handlePreviewChange}
 * />
 * ```
 */
export default function HomepageSectionForm({
  section,
  onSubmit,
  onCancel,
  showPreview = false,
  onPreviewDataChange,
}: HomepageSectionFormProps) {
  const {
    formData,
    activeTab,
    loading,
    error,
    handleChange,
    handleTitleChange,
    handleSubmit,
    setActiveTab,
    requiresImage,
  } = useHomepageSectionForm({
    section,
    onSubmit,
    showPreview,
    onPreviewDataChange,
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LayoutSelector
          value={formData.layout}
          onChange={handleChange}
          requiresImage={requiresImage}
        />

        <BasicFields
          slug={formData.slug}
          displayOrder={formData.displayOrder}
          isPublished={formData.isPublished}
          isEdit={!!section}
          onChange={handleChange}
        />
      </div>

      <LanguageTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <ContentFields
        activeTab={activeTab}
        titleEn={formData.titleEn}
        titleVi={formData.titleVi}
        contentEn={formData.contentEn}
        contentVi={formData.contentVi}
        buttonTextEn={formData.buttonTextEn}
        buttonTextVi={formData.buttonTextVi}
        isEdit={!!section}
        onChange={handleChange}
        onTitleChange={handleTitleChange}
      />

      <MediaFields
        linkUrl={formData.linkUrl}
        imageUrl={formData.imageUrl}
        requiresImage={requiresImage}
        onChange={handleChange}
      />

      <FormActions loading={loading} isEdit={!!section} onCancel={onCancel} />
    </form>
  );
}
