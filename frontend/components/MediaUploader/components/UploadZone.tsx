import { useTranslations } from 'next-intl';
import { UploadZoneProps } from '../types';

/**
 * UploadZone component for drag-and-drop file upload
 *
 * Provides a visual drop zone for uploading images with support for
 * both drag-and-drop and click-to-browse functionality.
 *
 * @param props - Component props
 * @returns JSX element
 */
export function UploadZone({
  isDragging,
  isUploading,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
  locale,
}: UploadZoneProps) {
  const t = useTranslations('admin.contentMedia');
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
      } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <div className="space-y-2">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="text-sm text-gray-600">
          <button
            type="button"
            onClick={onFileSelect}
            disabled={isUploading}
            className="font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('uploadFile')}
          </button>
          {' ' + t('dragAndDrop')}
        </div>
        <p className="text-xs text-gray-500">{t('fileTypeHint')}</p>
      </div>
    </div>
  );
}
