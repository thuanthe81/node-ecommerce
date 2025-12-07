import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { contentMediaApi, ContentMedia } from '@/lib/content-media-api';

/**
 * Custom hook for managing media upload functionality
 *
 * @param onUploadComplete - Callback when upload completes successfully
 * @param onUploadError - Callback when upload fails
 * @param locale - Current locale for translations
 *
 * @returns Object containing upload state and handlers
 */
export function useMediaUpload(
  onUploadComplete: (media: ContentMedia) => void,
  onUploadError: (error: string) => void,
  locale: string
) {
  const t = useTranslations('admin.contentMedia');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate file type and size
  const validateFile = (file: File): string | null => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      return t('invalidFileType');
    }

    if (file.size > maxSize) {
      return t('fileTooLarge');
    }

    return null;
  };

  // Handle file upload
  const handleUpload = async (file: File) => {
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      onUploadError(validationError);
      return;
    }

    setIsUploading(true);

    try {
      const media = await contentMediaApi.upload(file);
      onUploadComplete(media);
    } catch (error: any) {
      const errorMessage = error.message || t('uploadError');
      onUploadError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file selection from input
  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    handleUpload(files[0]);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Handle drag leave
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleUpload(files[0]);
    }
  };

  // Trigger file input click
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return {
    isUploading,
    isDragging,
    fileInputRef,
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    triggerFileSelect,
  };
}
