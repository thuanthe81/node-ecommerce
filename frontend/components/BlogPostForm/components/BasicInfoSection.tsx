/**
 * Basic information section for blog post form
 * Includes title, slug, excerpt, and author fields
 */

import { useTranslations } from 'next-intl';
import { BlogPostFormData, ValidationErrors } from '../types';

interface BasicInfoSectionProps {
  formData: BlogPostFormData;
  activeTab: 'en' | 'vi';
  validationErrors: ValidationErrors;
  isEdit: boolean;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export function BasicInfoSection({
  formData,
  activeTab,
  validationErrors,
  isEdit,
  onTitleChange,
  onChange,
}: BasicInfoSectionProps) {
  const t = useTranslations('admin.blog');
  const tAdmin = useTranslations('admin');

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('title')} ({activeTab === 'en' ? 'English' : 'Vietnamese'}) *
        </label>
        <input
          type="text"
          name={activeTab === 'en' ? 'titleEn' : 'titleVi'}
          value={activeTab === 'en' ? formData.titleEn : formData.titleVi}
          onChange={onTitleChange}
          required
          className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            validationErrors[activeTab === 'en' ? 'titleEn' : 'titleVi']
              ? 'border-red-500'
              : 'border-gray-300'
          }`}
          placeholder={t('titlePlaceholder')}
        />
        {validationErrors[activeTab === 'en' ? 'titleEn' : 'titleVi'] && (
          <p className="text-sm text-red-600 mt-1">
            {validationErrors[activeTab === 'en' ? 'titleEn' : 'titleVi']}
          </p>
        )}
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('slug')} *
        </label>
        <input
          type="text"
          name="slug"
          value={formData.slug}
          onChange={onChange}
          required
          className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            validationErrors.slug ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="my-blog-post-slug"
        />
        {validationErrors.slug && (
          <p className="text-sm text-red-600 mt-1">{validationErrors.slug}</p>
        )}
        <p className="text-sm text-gray-500 mt-1">
          {tAdmin('slugHintUrl', { slug: formData.slug })}
        </p>
      </div>

      {/* Excerpt */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('excerpt')} ({activeTab === 'en' ? 'English' : 'Vietnamese'}) *
        </label>
        <textarea
          name={activeTab === 'en' ? 'excerptEn' : 'excerptVi'}
          value={activeTab === 'en' ? formData.excerptEn : formData.excerptVi}
          onChange={onChange}
          required
          rows={3}
          className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            validationErrors[activeTab === 'en' ? 'excerptEn' : 'excerptVi']
              ? 'border-red-500'
              : 'border-gray-300'
          }`}
          placeholder={t('excerptPlaceholder')}
        />
        {validationErrors[activeTab === 'en' ? 'excerptEn' : 'excerptVi'] && (
          <p className="text-sm text-red-600 mt-1">
            {validationErrors[activeTab === 'en' ? 'excerptEn' : 'excerptVi']}
          </p>
        )}
        <p className="text-sm text-gray-500 mt-1">{t('excerptHint')}</p>
      </div>

      {/* Author */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('author')} *
        </label>
        <input
          type="text"
          name="authorName"
          value={formData.authorName}
          onChange={onChange}
          required
          className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            validationErrors.authorName ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder={t('authorPlaceholder')}
        />
        {validationErrors.authorName && (
          <p className="text-sm text-red-600 mt-1">{validationErrors.authorName}</p>
        )}
      </div>
    </div>
  );
}
