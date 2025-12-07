'use client';

import { useTranslations } from 'next-intl';
import { MediaUploaderProps } from './types';
import { useMediaUpload } from './hooks/useMediaUpload';
import { UploadZone } from './components/UploadZone';
import { UploadProgress } from './components/UploadProgress';

/**
 * MediaUploader component for uploading images to the content media library
 *
 * Provides a drag-and-drop interface for uploading images with client-side
 * validation for file type and size. Shows upload progress and handles
 * success and error states.
 *
 * Features:
 * - Drag-and-drop support
 * - Click to browse file selection
 * - Client-side validation (file type and size)
 * - Upload progress indicator
 * - Error handling
 *
 * @param props - Component props
 * @returns JSX element
 *
 * @example
 * ```tsx
 * <MediaUploader
 *   onUploadComplete={(media) => console.log('Uploaded:', media)}
 *   onUploadError={(error) => console.error('Error:', error)}
 *   locale="en"
 * />
 * ```
 */
export function MediaUploader({
  onUploadComplete,
  onUploadError,
  locale,
}: MediaUploaderProps) {
  const t = useTranslations('admin.contentMedia');
  const {
    isUploading,
    isDragging,
    fileInputRef,
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    triggerFileSelect,
  } = useMediaUpload(onUploadComplete, onUploadError, locale);

  return (
    <div className="w-full">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        aria-label={t('selectImageFile')}
      />

      {/* Upload zone */}
      <UploadZone
        isDragging={isDragging}
        isUploading={isUploading}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onFileSelect={triggerFileSelect}
        locale={locale}
      />

      {/* Upload progress */}
      {isUploading && <UploadProgress locale={locale} />}
    </div>
  );
}
