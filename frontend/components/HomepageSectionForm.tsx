'use client';

import { useState, useEffect } from 'react';
import { Content, CreateContentData } from '@/lib/content-api';

interface HomepageSectionFormProps {
  section?: Content;
  onSubmit: (data: CreateContentData) => Promise<void>;
  onCancel: () => void;
  showPreview?: boolean;
  onPreviewDataChange?: (data: PreviewData) => void;
}

export interface PreviewData {
  layout: 'centered' | 'image-left' | 'image-right';
  titleEn: string;
  titleVi: string;
  contentEn: string;
  contentVi: string;
  buttonTextEn: string;
  buttonTextVi: string;
  buttonUrl: string;
  imageUrl: string;
}

export default function HomepageSectionForm({
  section,
  onSubmit,
  onCancel,
  showPreview = false,
  onPreviewDataChange,
}: HomepageSectionFormProps) {
  const [formData, setFormData] = useState<CreateContentData>({
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
  const [activeTab, setActiveTab] = useState<'en' | 'vi'>('en');

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
        layout: section.layout || 'centered',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!formData.titleEn || !formData.titleVi) {
      setError('Title is required in both languages');
      return;
    }

    if (!formData.contentEn || !formData.contentVi) {
      setError('Description is required in both languages');
      return;
    }

    if (!formData.buttonTextEn || !formData.buttonTextVi) {
      setError('Button text is required in both languages');
      return;
    }

    if (!formData.linkUrl) {
      setError('Button URL is required');
      return;
    }

    if (!formData.layout) {
      setError('Layout type is required');
      return;
    }

    // Validate image requirement based on layout
    if ((formData.layout === 'image-left' || formData.layout === 'image-right') && !formData.imageUrl) {
      setError('Image is required for image-left and image-right layouts');
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
      slug: !section ? generateSlug(value) : prev.slug,
    }));
  };

  const requiresImage = formData.layout === 'image-left' || formData.layout === 'image-right';

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
            Layout Type *
          </label>
          <select
            name="layout"
            value={formData.layout}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="centered">Centered (No Image)</option>
            <option value="image-left">Image Left</option>
            <option value="image-right">Image Right</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">
            {requiresImage ? 'Image required for this layout' : 'No image needed for centered layout'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Display Order *
          </label>
          <input
            type="number"
            name="displayOrder"
            value={formData.displayOrder}
            onChange={handleChange}
            min="0"
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-500 mt-1">
            Lower numbers appear first on homepage
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Slug *
        </label>
        <input
          type="text"
          name="slug"
          value={formData.slug}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="url-friendly-slug"
        />
        <p className="text-sm text-gray-500 mt-1">
          Auto-generated from English title, but can be customized
        </p>
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
            English Content
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
            Vietnamese Content
          </button>
        </nav>
      </div>

      {activeTab === 'en' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title (English) *
            </label>
            <input
              type="text"
              name="titleEn"
              value={formData.titleEn}
              onChange={handleTitleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter section title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (English) *
            </label>
            <textarea
              name="contentEn"
              value={formData.contentEn}
              onChange={handleChange}
              required
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter section description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Button Text (English) *
            </label>
            <input
              type="text"
              name="buttonTextEn"
              value={formData.buttonTextEn}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Shop Now"
            />
          </div>
        </div>
      )}

      {activeTab === 'vi' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title (Vietnamese) *
            </label>
            <input
              type="text"
              name="titleVi"
              value={formData.titleVi}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập tiêu đề phần"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Vietnamese) *
            </label>
            <textarea
              name="contentVi"
              value={formData.contentVi}
              onChange={handleChange}
              required
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập mô tả phần"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Button Text (Vietnamese) *
            </label>
            <input
              type="text"
              name="buttonTextVi"
              value={formData.buttonTextVi}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ví dụ: Mua Ngay"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Button URL *
          </label>
          <input
            type="url"
            name="linkUrl"
            value={formData.linkUrl}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://example.com/products"
          />
          <p className="text-sm text-gray-500 mt-1">
            Where the button should navigate to
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Image URL {requiresImage && '*'}
          </label>
          <input
            type="url"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            required={requiresImage}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://example.com/image.jpg"
          />
          <p className="text-sm text-gray-500 mt-1">
            {requiresImage ? 'Required for this layout' : 'Optional for centered layout'}
          </p>
        </div>
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
            Publish this section (make it visible on homepage)
          </span>
        </label>
      </div>

      <div className="flex justify-end space-x-4 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Saving...' : section ? 'Update Section' : 'Create Section'}
        </button>
      </div>
    </form>
  );
}
