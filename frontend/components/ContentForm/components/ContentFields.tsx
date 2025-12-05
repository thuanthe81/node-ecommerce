import { useTranslations, useLocale } from 'next-intl';
import { LanguageTab, ValidationErrors } from '../types';
import { RichTextEditor } from '../../RichTextEditor';

/**
 * Props for the ContentFields component
 */
interface ContentFieldsProps {
  /** Current language tab */
  activeTab: LanguageTab;
  /** Title value for English */
  titleEn: string;
  /** Title value for Vietnamese */
  titleVi: string;
  /** Content value for English */
  contentEn: string;
  /** Content value for Vietnamese */
  contentVi: string;
  /** Validation errors */
  validationErrors: ValidationErrors;
  /** Preview mode flag */
  previewMode: boolean;
  /** Callback when preview mode toggles */
  onPreviewToggle: () => void;
  /** Callback when title changes */
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Callback when content changes */
  onContentChange: (html: string) => void;
}

/**
 * Title and content input fields for the active language
 *
 * @example
 * ```tsx
 * <ContentFields
 *   activeTab={activeTab}
 *   titleEn={formData.titleEn}
 *   titleVi={formData.titleVi}
 *   contentEn={formData.contentEn}
 *   contentVi={formData.contentVi}
 *   validationErrors={validationErrors}
 *   previewMode={previewMode}
 *   onPreviewToggle={() => setPreviewMode(!previewMode)}
 *   onTitleChange={handleTitleChange}
 *   onContentChange={handleChange}
 * />
 * ```
 */
export function ContentFields({
  activeTab,
  titleEn,
  titleVi,
  contentEn,
  contentVi,
  validationErrors,
  previewMode,
  onPreviewToggle,
  onTitleChange,
  onContentChange,
}: ContentFieldsProps) {
  const t = useTranslations();
  const locale = useLocale();

  const isEnglish = activeTab === 'en';
  const titleValue = isEnglish ? titleEn : titleVi;
  const contentValue = isEnglish ? contentEn : contentVi;
  const titleName = isEnglish ? 'titleEn' : 'titleVi';
  const contentName = isEnglish ? 'contentEn' : 'contentVi';
  const titleLabel = isEnglish ? t('admin.titleEnglish') : t('admin.titleVietnamese');
  const contentLabel = isEnglish ? t('admin.contentEnglish') : t('admin.contentVietnamese');

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {titleLabel} {t('admin.required')}
        </label>
        <input
          type="text"
          name={titleName}
          value={titleValue}
          onChange={onTitleChange}
          required
          className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            validationErrors[titleName] ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {validationErrors[titleName] && (
          <p className="text-sm text-red-600 mt-1">{validationErrors[titleName]}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {contentLabel} {t('admin.required')}
        </label>
        <div className="mb-2">
          <button
            type="button"
            onClick={onPreviewToggle}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {previewMode ? t('common.edit') : t('admin.preview')}
          </button>
        </div>
        <RichTextEditor
          value={contentValue}
          onChange={onContentChange}
          readOnly={previewMode}
          showToolbar={!previewMode}
          placeholder={t('admin.htmlPlaceholder')}
          locale={locale}
          hasError={!!validationErrors[contentName]}
        />
        {validationErrors[contentName] && (
          <p className="text-sm text-red-600 mt-1">{validationErrors[contentName]}</p>
        )}
        <p className="text-sm text-gray-500 mt-1">
          {t('admin.supportsHtml')}
        </p>
      </div>
    </div>
  );
}
