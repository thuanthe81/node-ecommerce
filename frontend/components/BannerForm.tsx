'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Content, CreateContentData } from '@/lib/content-api';

interface BannerFormProps {
  banner?: Content;
  onSubmit: (data: CreateContentData) => Promise<void>;
  locale: string;
}

export default function BannerForm({ banner, onSubmit, locale }: BannerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const t = (key: string) => {
    // Simple translation helper for admin forms
    const translations: Record<string, Record<string, string>> = {
      en: {
        'admin.slug': 'Slug (URL identifier)',
        'admin.slugPlaceholder': 'summer-sale-2024',
        'admin.titleEnglish': 'Title (English)',
        'admin.titleVietnamese': 'Title (Vietnamese)',
        'admin.contentEnglish': 'Content (English)',
        'admin.contentVietnamese': 'Content (Vietnamese)',
        'admin.imageUrl': 'Image URL',
        'admin.imageUrlPlaceholder': 'https://example.com/banner.jpg',
        'admin.linkUrl': 'Link URL',
        'admin.linkUrlPlaceholder': 'https://example.com/sale',
        'admin.displayOrder': 'Display Order',
        'admin.displayOrderHint': 'Lower numbers appear first',
        'admin.published': 'Published (visible on website)',
        'admin.updateBanner': 'Update Banner',
        'admin.createBanner': 'Create Banner',
        'admin.failedSaveBanner': 'Failed to save banner',
        'common.saving': 'Saving...',
        'common.cancel': 'Cancel',
        'admin.required': '*',
      },
      vi: {
        'admin.slug': 'Slug (định danh URL)',
        'admin.slugPlaceholder': 'khuyen-mai-he-2024',
        'admin.titleEnglish': 'Tiêu đề (Tiếng Anh)',
        'admin.titleVietnamese': 'Tiêu đề (Tiếng Việt)',
        'admin.contentEnglish': 'Nội dung (Tiếng Anh)',
        'admin.contentVietnamese': 'Nội dung (Tiếng Việt)',
        'admin.imageUrl': 'URL hình ảnh',
        'admin.imageUrlPlaceholder': 'https://example.com/banner.jpg',
        'admin.linkUrl': 'URL liên kết',
        'admin.linkUrlPlaceholder': 'https://example.com/sale',
        'admin.displayOrder': 'Thứ tự hiển thị',
        'admin.displayOrderHint': 'Số nhỏ hơn xuất hiện trước',
        'admin.published': 'Đã xuất bản (hiển thị trên website)',
        'admin.updateBanner': 'Cập nhật Banner',
        'admin.createBanner': 'Tạo Banner',
        'admin.failedSaveBanner': 'Lưu banner thất bại',
        'common.saving': 'Đang lưu...',
        'common.cancel': 'Hủy',
        'admin.required': '*',
      },
    };
    return translations[locale]?.[key] || key;
  };

  const [formData, setFormData] = useState<CreateContentData>({
    slug: banner?.slug || '',
    type: 'BANNER',
    titleEn: banner?.titleEn || '',
    titleVi: banner?.titleVi || '',
    contentEn: banner?.contentEn || '',
    contentVi: banner?.contentVi || '',
    imageUrl: banner?.imageUrl || '',
    linkUrl: banner?.linkUrl || '',
    displayOrder: banner?.displayOrder || 0,
    isPublished: banner?.isPublished ?? false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await onSubmit(formData);
      router.push(`/${locale}/admin/banners`);
    } catch (err: any) {
      setError(err.response?.data?.message || t('admin.failedSaveBanner'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? 0 : parseInt(value),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Slug */}
        <div className="md:col-span-2">
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
            {t('admin.slug')} {t('admin.required')}
          </label>
          <input
            type="text"
            id="slug"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t('admin.slugPlaceholder')}
          />
        </div>

        {/* Title English */}
        <div>
          <label htmlFor="titleEn" className="block text-sm font-medium text-gray-700 mb-2">
            {t('admin.titleEnglish')} {t('admin.required')}
          </label>
          <input
            type="text"
            id="titleEn"
            name="titleEn"
            value={formData.titleEn}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Title Vietnamese */}
        <div>
          <label htmlFor="titleVi" className="block text-sm font-medium text-gray-700 mb-2">
            {t('admin.titleVietnamese')} {t('admin.required')}
          </label>
          <input
            type="text"
            id="titleVi"
            name="titleVi"
            value={formData.titleVi}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Content English */}
        <div>
          <label htmlFor="contentEn" className="block text-sm font-medium text-gray-700 mb-2">
            {t('admin.contentEnglish')} {t('admin.required')}
          </label>
          <textarea
            id="contentEn"
            name="contentEn"
            value={formData.contentEn}
            onChange={handleChange}
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Content Vietnamese */}
        <div>
          <label htmlFor="contentVi" className="block text-sm font-medium text-gray-700 mb-2">
            {t('admin.contentVietnamese')} {t('admin.required')}
          </label>
          <textarea
            id="contentVi"
            name="contentVi"
            value={formData.contentVi}
            onChange={handleChange}
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Image URL */}
        <div>
          <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
            {t('admin.imageUrl')}
          </label>
          <input
            type="url"
            id="imageUrl"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t('admin.imageUrlPlaceholder')}
          />
        </div>

        {/* Link URL */}
        <div>
          <label htmlFor="linkUrl" className="block text-sm font-medium text-gray-700 mb-2">
            {t('admin.linkUrl')}
          </label>
          <input
            type="url"
            id="linkUrl"
            name="linkUrl"
            value={formData.linkUrl}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t('admin.linkUrlPlaceholder')}
          />
        </div>

        {/* Display Order */}
        <div>
          <label htmlFor="displayOrder" className="block text-sm font-medium text-gray-700 mb-2">
            {t('admin.displayOrder')}
          </label>
          <input
            type="number"
            id="displayOrder"
            name="displayOrder"
            value={formData.displayOrder}
            onChange={handleChange}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">{t('admin.displayOrderHint')}</p>
        </div>
      </div>

      {/* Published Status */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="isPublished"
          name="isPublished"
          checked={formData.isPublished}
          onChange={handleChange}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-700">
          {t('admin.published')}
        </label>
      </div>

      {/* Form Actions */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? t('common.saving') : banner ? t('admin.updateBanner') : t('admin.createBanner')}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          {t('common.cancel')}
        </button>
      </div>
    </form>
  );
}
