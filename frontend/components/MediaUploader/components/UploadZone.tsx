import { useTranslations } from 'next-intl';
import { UploadZoneProps } from '../types';
import { SvgUpload } from '../../Svgs';

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
        <SvgUpload className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
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
