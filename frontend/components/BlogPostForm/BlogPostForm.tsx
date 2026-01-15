'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { BlogPostFormProps, BlogPostFormData, BlogCategory, ValidationErrors } from './types';
import { LanguageTabs } from './components/LanguageTabs';
import { BasicInfoSection } from './components/BasicInfoSection';
import { ContentSection } from './components/ContentSection';
import { CategorySelector } from './components/CategorySelector';
import { PublishingSection } from './components/PublishingSection';
import { FormActions } from './components/FormActions';
import ImagePickerModal from '../ImagePickerModal';
import { blogCategoryApi } from '@/lib/blog-category-api';

/**
 * Form component for creating and editing blog posts
 *
 * Supports bilingual content (English and Vietnamese) with rich text editing,
 * category management, and featured image selection.
 *
 * @example
 * ```tsx
 * <BlogPostForm
 *   blogPost={existingPost}
 *   onSubmit={handleSubmit}
 *   onCancel={handleCancel}
 *   locale="en"
 * />
 * ```
 */
export default function BlogPostForm({
  blogPost,
  onSubmit,
  onCancel,
  locale,
}: BlogPostFormProps) {
  const t = useTranslations('admin.blog');
  const tCommon = useTranslations('common');

  const [activeTab, setActiveTab] = useState<'en' | 'vi'>('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showBackgroundImagePicker, setShowBackgroundImagePicker] = useState(false);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const [formData, setFormData] = useState<BlogPostFormData>({
    titleEn: blogPost?.titleEn || '',
    titleVi: blogPost?.titleVi || '',
    slug: blogPost?.slug || '',
    excerptEn: blogPost?.excerptEn || '',
    excerptVi: blogPost?.excerptVi || '',
    contentEn: blogPost?.contentEn || '',
    contentVi: blogPost?.contentVi || '',
    authorName: blogPost?.authorName || '',
    imageUrl: blogPost?.imageUrl || '',
    imageBackground: blogPost?.imageBackground || '',
    categoryIds: blogPost?.blogCategories?.map((bc: any) => bc.category.id) || [],
    displayOrder: blogPost?.displayOrder || 0,
    isPublished: blogPost?.isPublished || false,
  });

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const data = await blogCategoryApi.getBlogCategories(locale);
        setCategories(data);
      } catch (err) {
        console.error('Failed to load categories:', err);
        setError(t('failedToLoadCategories'));
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, [locale, t]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) || 0 : value,
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // Auto-generate slug from English title when creating new post
      ...(name === 'titleEn' && !blogPost
        ? { slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }
        : {}),
    }));

    // Clear validation error
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleContentChange = (html: string, field: 'contentEn' | 'contentVi') => {
    setFormData((prev) => ({ ...prev, [field]: html }));

    // Clear validation error
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleImageSelect = (imageUrl: string) => {
    setFormData((prev) => ({ ...prev, imageUrl }));
    setShowImagePicker(false);

    // Clear validation error
    if (validationErrors.imageUrl) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.imageUrl;
        return newErrors;
      });
    }
  };

  const handleBackgroundImageSelect = (imageUrl: string) => {
    setFormData((prev) => ({ ...prev, imageBackground: imageUrl }));
    setShowBackgroundImagePicker(false);

    // Clear validation error
    if (validationErrors.imageBackground) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.imageBackground;
        return newErrors;
      });
    }
  };

  const handleClearBackgroundImage = () => {
    setFormData((prev) => ({ ...prev, imageBackground: '' }));
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }));
  };

  const validateUrl = (url: string): string | null => {
    if (!url) return null; // URL fields are optional

    // Check if it's a relative path (starts with / or ./)
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      return null;
    }

    // Otherwise, validate as absolute URL
    try {
      new URL(url);
      return null;
    } catch {
      return t('imageUrlError');
    }
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!formData.titleEn.trim()) errors.titleEn = t('titleRequired');
    if (!formData.titleVi.trim()) errors.titleVi = t('titleRequired');
    if (!formData.slug.trim()) errors.slug = t('slugRequired');
    if (!formData.excerptEn.trim()) errors.excerptEn = t('excerptRequired');
    if (!formData.excerptVi.trim()) errors.excerptVi = t('excerptRequired');
    if (!formData.contentEn.trim()) errors.contentEn = t('contentRequired');
    if (!formData.contentVi.trim()) errors.contentVi = t('contentRequired');
    if (!formData.authorName.trim()) errors.authorName = t('authorRequired');

    // Validate slug format
    if (formData.slug && !/^[a-z0-9-]+$/.test(formData.slug)) {
      errors.slug = t('slugFormatError');
    }

    // Validate image URLs (optional fields)
    if (formData.imageUrl) {
      const imageUrlError = validateUrl(formData.imageUrl);
      if (imageUrlError) errors.imageUrl = imageUrlError;
    }

    if (formData.imageBackground) {
      const backgroundImageError = validateUrl(formData.imageBackground);
      if (backgroundImageError) errors.imageBackground = backgroundImageError;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setError(t('validationError'));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || t('submitError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <LanguageTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <BasicInfoSection
        formData={formData}
        activeTab={activeTab}
        validationErrors={validationErrors}
        isEdit={!!blogPost}
        onTitleChange={handleTitleChange}
        onChange={handleChange}
      />

      <ContentSection
        formData={formData}
        activeTab={activeTab}
        validationErrors={validationErrors}
        locale={locale}
        onContentChange={handleContentChange}
      />

      <CategorySelector
        categories={categories}
        selectedCategoryIds={formData.categoryIds}
        loading={loadingCategories}
        locale={locale}
        onToggle={handleCategoryToggle}
      />

      <PublishingSection
        formData={formData}
        validationErrors={validationErrors}
        showImagePicker={showImagePicker}
        showBackgroundImagePicker={showBackgroundImagePicker}
        onToggleImagePicker={() => setShowImagePicker(!showImagePicker)}
        onToggleBackgroundImagePicker={() => setShowBackgroundImagePicker(!showBackgroundImagePicker)}
        onClearBackgroundImage={handleClearBackgroundImage}
        onChange={handleChange}
      />

      <FormActions
        loading={loading}
        isEdit={!!blogPost}
        onCancel={onCancel}
      />

      {/* Image Picker Modal */}
      <ImagePickerModal
        isOpen={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onSelectImage={handleImageSelect}
        locale={locale}
      />

      {/* Background Image Picker Modal */}
      <ImagePickerModal
        isOpen={showBackgroundImagePicker}
        onClose={() => setShowBackgroundImagePicker(false)}
        onSelectImage={handleBackgroundImageSelect}
        locale={locale}
      />
    </form>
  );
}
