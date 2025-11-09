'use client';

import { useState, useEffect } from 'react';
import { Content, CreateContentData } from '@/lib/content-api';

interface ContentFormProps {
  content?: Content;
  onSubmit: (data: CreateContentData) => Promise<void>;
  onCancel: () => void;
}

export default function ContentForm({ content, onSubmit, onCancel }: ContentFormProps) {
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'en' | 'vi'>('en');
  const [previewMode, setPreviewMode] = useState(false);

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
            Content Type *
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="PAGE">Page</option>
            <option value="FAQ">FAQ</option>
            <option value="BANNER">Banner</option>
          </select>
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
            Used in URL: /pages/{formData.slug}
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
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content (English) *
            </label>
            <div className="mb-2">
              <button
                type="button"
                onClick={() => setPreviewMode(!previewMode)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {previewMode ? 'Edit' : 'Preview'}
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
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="You can use HTML tags for formatting"
              />
            )}
            <p className="text-sm text-gray-500 mt-1">
              Supports HTML formatting
            </p>
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
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content (Vietnamese) *
            </label>
            <div className="mb-2">
              <button
                type="button"
                onClick={() => setPreviewMode(!previewMode)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {previewMode ? 'Edit' : 'Preview'}
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
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="You can use HTML tags for formatting"
              />
            )}
            <p className="text-sm text-gray-500 mt-1">
              Supports HTML formatting
            </p>
          </div>
        </div>
      )}

      {formData.type === 'BANNER' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image URL
            </label>
            <input
              type="url"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link URL
            </label>
            <input
              type="url"
              name="linkUrl"
              value={formData.linkUrl}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com/page"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Display Order
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
            Lower numbers appear first
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
              Publish this content
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
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Saving...' : content ? 'Update Content' : 'Create Content'}
        </button>
      </div>
    </form>
  );
}
