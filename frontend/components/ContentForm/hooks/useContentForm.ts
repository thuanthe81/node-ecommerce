import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Content, CreateContentData, getContentTypes } from '@/lib/content-api';
import { ContentFormData, LanguageTab, ValidationErrors } from '../types';
import { validateSlug, validateUrl, validateContentForm } from '../utils/validation';

/**
 * Custom hook for managing content form state and validation
 *
 * @param initialContent - Optional existing content to edit
 * @returns Form state and handlers
 *
 * @example
 * ```typescript
 * const {
 *   formData,
 *   validationErrors,
 *   activeTab,
 *   contentTypes,
 *   loading,
 *   error,
 *   previewMode,
 *   setActiveTab,
 *   setPreviewMode,
 *   handleChange,
 *   handleTitleChange,
 *   handleSubmit,
 *   getTypeLabel
 * } = useContentForm(content);
 * ```
 */
export function useContentForm(
  initialContent?: Content,
  onSubmit?: (data: CreateContentData) => Promise<void>,
  defaultType?: string
) {
  const t = useTranslations();

  const [formData, setFormData] = useState<ContentFormData>({
    slug: '',
    type: (defaultType as any) || 'PAGE',
    titleEn: '',
    titleVi: '',
    contentEn: '',
    contentVi: '',
    imageUrl: '',
    linkUrl: '',
    buttonTextEn: '',
    buttonTextVi: '',
    layout: 'centered',
    displayOrder: 0,
    isPublished: false,
  });

  const [contentTypes, setContentTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LanguageTab>('en');
  const [previewMode, setPreviewMode] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Load content types on mount
  useEffect(() => {
    loadContentTypes();
  }, []);

  // Initialize form data from existing content
  useEffect(() => {
    if (initialContent) {
      setFormData({
        slug: initialContent.slug,
        type: initialContent.type,
        titleEn: initialContent.titleEn,
        titleVi: initialContent.titleVi,
        contentEn: initialContent.contentEn,
        contentVi: initialContent.contentVi,
        imageUrl: initialContent.imageUrl || '',
        linkUrl: initialContent.linkUrl || '',
        buttonTextEn: initialContent.buttonTextEn || '',
        buttonTextVi: initialContent.buttonTextVi || '',
        layout: initialContent.layout || 'centered',
        displayOrder: initialContent.displayOrder,
        isPublished: initialContent.isPublished,
      });
    }
  }, [initialContent]);

  /**
   * Loads available content types from the API
   */
  const loadContentTypes = async () => {
    try {
      const types = await getContentTypes();
      setContentTypes(types);
    } catch (err: any) {
      console.error('Failed to load content types:', err);
      // Fallback to default types if fetch fails
      setContentTypes(['PAGE', 'FAQ', 'BANNER', 'HOMEPAGE_SECTION']);
    }
  };

  /**
   * Converts content type enum to readable label
   */
  const getTypeLabel = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  /**
   * Generates a URL-friendly slug from a title
   */
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  /**
   * Handles changes to form fields
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox'
      ? (e.target as HTMLInputElement).checked
      : type === 'number'
      ? parseInt(value) || 0
      : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Validate on change for specific fields
    if (name === 'slug' && typeof newValue === 'string') {
      const error = validateSlug(newValue, t);
      if (error) {
        setValidationErrors((prev) => ({ ...prev, slug: error }));
      }
    } else if ((name === 'imageUrl' || name === 'linkUrl') && typeof newValue === 'string') {
      const error = validateUrl(newValue, name === 'imageUrl' ? 'imageUrl' : 'linkUrl', t);
      if (error) {
        setValidationErrors((prev) => ({ ...prev, [name]: error }));
      }
    }
  };

  /**
   * Handles changes to the title field with auto-slug generation
   */
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      titleEn: value,
      slug: !initialContent ? generateSlug(value) : prev.slug,
    }));
  };

  /**
   * Handles image selection from the image picker
   */
  const handleImageSelect = (imageUrl: string, productSlug?: string) => {
    setFormData((prev) => {
      const updates: Partial<ContentFormData> = { imageUrl };

      // For HOMEPAGE_SECTION, also set linkUrl to product page
      if (prev.type === 'HOMEPAGE_SECTION' && productSlug) {
        updates.linkUrl = `/products/${productSlug}`;
      }

      return { ...prev, ...updates };
    });

    // Clear validation errors for imageUrl and linkUrl
    if (validationErrors.imageUrl || validationErrors.linkUrl) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.imageUrl;
        delete newErrors.linkUrl;
        return newErrors;
      });
    }
  };

  /**
   * Handles form submission with validation
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    // Validate all fields before submission
    const errors = validateContentForm(formData, t);

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError(t('admin.fixValidationErrors'));
      return;
    }

    if (!onSubmit) return;

    setLoading(true);

    try {
      // Prepare submission data - exclude fields based on content type
      const submissionData: CreateContentData = { ...formData };

      // linkUrl is used by both BANNER and HOMEPAGE_SECTION
      if (formData.type !== 'BANNER' && formData.type !== 'HOMEPAGE_SECTION') {
        delete submissionData.linkUrl;
      }

      // buttonText and layout are only for HOMEPAGE_SECTION
      if (formData.type !== 'HOMEPAGE_SECTION') {
        delete submissionData.buttonTextEn;
        delete submissionData.buttonTextVi;
        delete submissionData.layout;
      }

      await onSubmit(submissionData);
    } catch (err: any) {
      setError(err.message || 'Failed to save content');
    } finally {
      setLoading(false);
    }
  };

  return {
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
  };
}
