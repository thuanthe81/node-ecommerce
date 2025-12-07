import { ContentMedia } from '@/lib/content-media-api';

/**
 * Props for the MediaUploader component
 */
export interface MediaUploaderProps {
  /**
   * Callback when upload completes successfully
   */
  onUploadComplete: (media: ContentMedia) => void;

  /**
   * Callback when upload fails
   */
  onUploadError: (error: string) => void;

  /**
   * Current locale for translations
   */
  locale: string;
}

/**
 * Props for the UploadZone component
 */
export interface UploadZoneProps {
  isDragging: boolean;
  isUploading: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: () => void;
  locale: string;
}

/**
 * Props for the UploadProgress component
 */
export interface UploadProgressProps {
  locale: string;
}
