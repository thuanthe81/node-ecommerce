import { useRef } from 'react';
import { ImageUploadZoneProps } from '../types';
import { SvgImageUpload } from '@/components/Svgs';

/**
 * ImageUploadZone component for drag-and-drop file upload
 *
 * Provides a visual drop zone for uploading images with support for
 * both drag-and-drop and click-to-browse functionality.
 *
 * @param props - Component props
 * @returns JSX element
 */
export function ImageUploadZone({
  onFilesSelected,
  locale,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
}: ImageUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={(e) => onFilesSelected(e.target.files)}
        className="hidden"
      />
      <div className="space-y-2">
        <SvgImageUpload
          className="mx-auto h-12 w-12 text-gray-400"
        />
        <div className="text-sm text-gray-600">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            {locale === 'vi' ? 'Tải lên file' : 'Upload files'}
          </button>
          {' ' + (locale === 'vi' ? 'hoặc kéo và thả' : 'or drag and drop')}
        </div>
        <p className="text-xs text-gray-500">
          {locale === 'vi'
            ? 'PNG, JPG, WebP tối đa 5MB'
            : 'PNG, JPG, WebP up to 5MB'}
        </p>
      </div>
    </div>
  );
}
