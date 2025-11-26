'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Content, CreateContentData, getContentTypes } from '@/lib/content-api';

interface ContentFormProps {
  content?: Content;
  onSubmit: (data: CreateContentData) => Promise<void>;
  onCancel: () => void;
}

export default function ContentForm({ content, onSubmit, onCancel }: ContentFormProps) {
  const t = useTranslations();
  const [formData, setFormData] = useState<CreateContentData>({
    slug: '',
    type: 'PAGE',
    titleEn: '',
    titleVi: '',
    contentEn: '',
    contentVi: '',
    imageUrl: '',
    linkUrl: '',
    displayOrder: 0,
    isPublished: false,
  });
  const [contentTypes, setContentTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'en' | 'vi'>('en');
  const [previewMode, setPreviewMode] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadContentTypes();
  }, []);

  useEffect(() => {
    if (content) {
      setFormData({
        slug: content.slug,
        type: content.type,
        titleEn: content.titleEn,
        titleVi: content.titleVi,
        contentEn: content.contentEn,
        contentVi: content.contentVi,
        imageUrl: content.imageUrl || '',
        linkUrl: content.linkUrl || '',
        displayOrder: content.displayOrder,
        isPublished: content.isPublished,
      });
    }
  }, [content]);

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

  const getTypeLabel = (type: string) => {
    // Convert enum values to readable labels
    return type
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const validateSlug = (slug: string): string | null => {
    if (!slug) return t('admin.slugRequired');
    // Slug should only contain lowercase letters, numbers, and hyphens
    // Should not start or end with a hyphen
    const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      return t('admin.slugError');
    }
    return null;
  };

  const validateUrl = (url: string, fieldName: string): string | null => {
    if (!url) return null; // URL fields are optional
    try {
      new URL(url);
      return null;
    } catch {
      return fieldName === 'imageUrl' ? t('admin.imageUrlError') : t('admin.linkUrlError');
    }
  };

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
      const error = validateSlug(newValue);
      if (error) {
        setValidationErrors((prev) => ({ ...prev, slug: error }));
      }
    } else if ((name === 'imageUrl' || name === 'linkUrl') && typeof newValue === 'string') {
      const error = validateUrl(newValue, name === 'imageUrl' ? 'Image URL' : 'Link URL');
      if (error) {
        setValidationErrors((prev) => ({ ...prev, [name]: error }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    // Validate all fields before submission
    const errors: Record<string, string> = {};

    // Validate required fields
    if (!formData.slug) errors.slug = t('admin.slugRequired');
    if (!formData.titleEn) errors.titleEn = t('admin.titleEnglishRequired');
    if (!formData.titleVi) errors.titleVi = t('admin.titleVietnameseRequired');
    if (!formData.contentEn) errors.contentEn = t('admin.titleEnglishRequired');
    if (!formData.contentVi) errors.contentVi = t('admin.titleVietnameseRequired');

    // Validate slug format
    if (formData.slug) {
      const slugError = validateSlug(formData.slug);
      if (slugError) errors.slug = slugError;
    }

    // Validate URL fields if they have values
    if (formData.imageUrl) {
      const urlError = validateUrl(formData.imageUrl, 'Image URL');
      if (urlError) errors.imageUrl = urlError;
    }
    if (formData.linkUrl) {
      const urlError = validateUrl(formData.linkUrl, 'Link URL');
      if (urlError) errors.linkUrl = urlError;
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError(t('admin.fixValidationErrors'));
      return;
    }

    setLoading(true);

    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || 'Failed to save content');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      titleEn: value,
      slug: !content ? generateSlug(value) : prev.slug,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('admin.contentType')} {t('admin.required')}
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {contentTypes.map((type) => (
              <option key={type} value={type}>
                {getTypeLabel(type)}
              </option>
            ))}
          </select>
        </div>

        <div>
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

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            type="button"
            onClick={() => setActiveTab('en')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'en'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('admin.englishContent')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vi')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'vi'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('admin.vietnameseContent')}
          </button>
        </nav>
      </div>

      {activeTab === 'en' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.titleEnglish')} {t('admin.required')}
            </label>
            <input
              type="text"
              name="titleEn"
              value={formData.titleEn}
              onChange={handleTitleChange}
              required
              className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                validationErrors.titleEn ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {validationErrors.titleEn && (
              <p className="text-sm text-red-600 mt-1">{validationErrors.titleEn}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.contentEnglish')} {t('admin.required')}
            </label>
            <div className="mb-2">
              <button
                type="button"
                onClick={() => setPreviewMode(!previewMode)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {previewMode ? t('common.edit') : t('admin.preview')}
              </button>
            </div>
            {previewMode ? (
              <div
                className="w-full border border-gray-300 rounded-lg px-4 py-2 min-h-[300px] prose max-w-none"
                dangerouslySetInnerHTML={{ __html: formData.contentEn }}
              />
            ) : (
              <textarea
                name="contentEn"
                value={formData.contentEn}
                onChange={handleChange}
                required
                rows={12}
                className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm ${
                  validationErrors.contentEn ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={t('admin.htmlPlaceholder')}
              />
            )}
            {validationErrors.contentEn && (
              <p className="text-sm text-red-600 mt-1">{validationErrors.contentEn}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              {t('admin.supportsHtml')}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'vi' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.titleVietnamese')} {t('admin.required')}
            </label>
            <input
              type="text"
              name="titleVi"
              value={formData.titleVi}
              onChange={handleChange}
              required
              className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                validationErrors.titleVi ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {validationErrors.titleVi && (
              <p className="text-sm text-red-600 mt-1">{validationErrors.titleVi}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.contentVietnamese')} {t('admin.required')}
            </label>
            <div className="mb-2">
              <button
                type="button"
                onClick={() => setPreviewMode(!previewMode)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {previewMode ? t('common.edit') : t('admin.preview')}
              </button>
            </div>
            {previewMode ? (
              <div
                className="w-full border border-gray-300 rounded-lg px-4 py-2 min-h-[300px] prose max-w-none"
                dangerouslySetInnerHTML={{ __html: formData.contentVi }}
              />
            ) : (
              <textarea
                name="contentVi"
                value={formData.contentVi}
                onChange={handleChange}
                required
                rows={12}
                className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm ${
                  validationErrors.contentVi ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={t('admin.htmlPlaceholder')}
              />
            )}
            {validationErrors.contentVi && (
              <p className="text-sm text-red-600 mt-1">{validationErrors.contentVi}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              {t('admin.supportsHtml')}
            </p>
          </div>
        </div>
      )}

      {formData.type === 'BANNER' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.imageUrl')}
            </label>
            <input
              type="url"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                validationErrors.imageUrl ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={t('admin.imageUrlPlaceholder')}
            />
            {validationErrors.imageUrl && (
              <p className="text-sm text-red-600 mt-1">{validationErrors.imageUrl}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.linkUrl')}
            </label>
            <input
              type="url"
              name="linkUrl"
              value={formData.linkUrl}
              onChange={handleChange}
              className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                validationErrors.linkUrl ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={t('admin.linkUrlPlaceholder')}
            />
            {validationErrors.linkUrl && (
              <p className="text-sm text-red-600 mt-1">{validationErrors.linkUrl}</p>
            )}
          </div>
        </div>
      )}

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
    </form>
  );
}
