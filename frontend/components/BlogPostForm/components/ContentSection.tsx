/**
 * Content section with rich text editors for English and Vietnamese content
 */

import { useTranslations } from 'next-intl';
import { RichTextEditor } from '@/components/RichTextEditor';
import { BlogPostFormData, ValidationErrors } from '../types';

interface ContentSectionProps {
  formData: BlogPostFormData;
  activeTab: 'en' | 'vi';
  validationErrors: ValidationErrors;
  locale: string;
  onContentChange: (html: string, field: 'contentEn' | 'contentVi') => void;
}

export function ContentSection({
  formData,
  activeTab,
  validationErrors,
  locale,
  onContentChange,
}: ContentSectionProps) {
  const t = useTranslations('admin.blog');

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        {t('content')} ({activeTab === 'en' ? 'English' : 'Vietnamese'}) *
      </label>

      {activeTab === 'en' ? (
        <div>
          <RichTextEditor
            value={formData.contentEn}
            onChange={(html) => onContentChange(html, 'contentEn')}
            placeholder={t('contentPlaceholder')}
            locale={locale}
            hasError={!!validationErrors.contentEn}
          />
          {validationErrors.contentEn && (
            <p className="text-sm text-red-600 mt-1">{validationErrors.contentEn}</p>
          )}
        </div>
      ) : (
        <div>
          <RichTextEditor
            value={formData.contentVi}
            onChange={(html) => onContentChange(html, 'contentVi')}
            placeholder={t('contentPlaceholder')}
            locale={locale}
            hasError={!!validationErrors.contentVi}
          />
          {validationErrors.contentVi && (
            <p className="text-sm text-red-600 mt-1">{validationErrors.contentVi}</p>
          )}
        </div>
      )}
    </div>
  );
}
