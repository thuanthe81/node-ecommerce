import { useState, useEffect } from 'react';
import { CreateContentData } from '@/lib/content-api';
import { HomepageSectionFormData, LanguageTab, PreviewData } from '../types';

/**
 * Props for the useHomepageSectionForm hook
 */
interface UseHomepageSectionFormProps {
  /** Existing section to edit (optional for create mode) */
  section?: {
    slug: string;
    titleEn: string;
    titleVi: string;
    contentEn: string;
    contentVi: string;
    imageUrl?: string;
    linkUrl?: string;
    buttonTextEn?: string;
    buttonTextVi?: string;
    layout?: string;
    displayOrder: number;
    isPublished: boolean;
  };
  /** Callback when form is submitted */
  onSubmit: (data: CreateContentData) => Promise<void>;
  /** Whether to show preview panel */
  showPreview?: boolean;
  /** Callback when preview data changes */
  onPreviewDataChange?: (data: PreviewData) => void;
}

/**
 * Custom hook for managing homepage section form state and logic
 *
 * @param props - Hook configuration
 * @returns Form state and handlers
 *
 * @example
 * ```tsx
 * const {
 *   formData,
 *   activeTab,
 *   loading,
 *   error,
 *   handleChange,
 *   handleTitleChange,
 *   handleSubmit,
 *   setActiveTab,
 *   requiresImage
 * } = useHomepageSectionForm({ section, onSubmit, showPreview, onPreviewDataChange });
 * ```
 */
export function useHomepageSectionForm({
  section,
  onSubmit,
  showPreview = false,
  onPreviewDataChange,
}: UseHomepageSectionFormProps) {
  const [formData, setFormData] = useState<HomepageSectionFormData>({
    slug: '',
    type: 'HOMEPAGE_SECTION',
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LanguageTab>('en');

  // Initialize form data from section prop
  useEffect(() => {
    if (section) {
      setFormData({
        slug: section.slug,
        type: 'HOMEPAGE_SECTION',
        titleEn: section.titleEn,
        titleVi: section.titleVi,
        contentEn: section.contentEn,
        contentVi: section.contentVi,
        imageUrl: section.imageUrl || '',
        linkUrl: section.linkUrl || '',
        buttonTextEn: section.buttonTextEn || '',
        buttonTextVi: section.buttonTextVi || '',
        layout: (section.layout as 'centered' | 'image-left' | 'image-right') || 'centered',
        displayOrder: section.displayOrder,
        isPublished: section.isPublished,
      });
    }
  }, [section]);

  // Notify parent of preview data changes
  useEffect(() => {
    if (showPreview && onPreviewDataChange) {
      onPreviewDataChange({
        layout: formData.layout || 'centered',
        titleEn: formData.titleEn,
        titleVi: formData.titleVi,
        contentEn: formData.contentEn,
        contentVi: formData.contentVi,
        buttonTextEn: formData.buttonTextEn || '',
        buttonTextVi: formData.buttonTextVi || '',
        buttonUrl: formData.linkUrl || '',
        imageUrl: formData.imageUrl || '',
      });
    }
  }, [
    formData.layout,
    formData.titleEn,
    formData.titleVi,
    formData.contentEn,
    formData.contentVi,
    formData.buttonTextEn,
    formData.buttonTextVi,
    formData.linkUrl,
    formData.imageUrl,
    showPreview,
    onPreviewDataChange,
  ]);

  /**
   * Generate URL-friendly slug from title
   */
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  /**
   * Handle generic form field changes
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : type === 'number'
          ? parseInt(value) || 0
          : value,
    }));
  };

  /**
   * Handle title change with auto-slug generation
   */
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      titleEn: value,
      slug: !section ? generateSlug(value) : prev.slug,
    }));
  };

  /**
   * Validate form data
   */
  const validateForm = (): string | null => {
    if (!formData.titleEn || !formData.titleVi) {
      return 'Title is required in both languages';
    }

    if (!formData.contentEn || !formData.contentVi) {
      return 'Description is required in both languages';
    }

    if (!formData.buttonTextEn || !formData.buttonTextVi) {
      return 'Button text is required in both languages';
    }

    if (!formData.linkUrl) {
      return 'Button URL is required';
    }

    if (!formData.layout) {
      return 'Layout type is required';
    }

    // Validate image requirement based on layout
    if ((formData.layout === 'image-left' || formData.layout === 'image-right') && !formData.imageUrl) {
      return 'Image is required for image-left and image-right layouts';
    }

    return null;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || 'Failed to save homepage section');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if current layout requires an image
   */
  const requiresImage = formData.layout === 'image-left' || formData.layout === 'image-right';

  return {
    formData,
    activeTab,
    loading,
    error,
    handleChange,
    handleTitleChange,
    handleSubmit,
    setActiveTab,
    requiresImage,
  };
}
