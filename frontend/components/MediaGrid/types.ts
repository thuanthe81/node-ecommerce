/**
 * MediaGrid Component Types
 * Type definitions for the MediaGrid component and its sub-components
 */

import { ContentMedia } from '@/lib/content-media-api';

/**
 * Props for the MediaGrid component
 */
export interface MediaGridProps {
  /** Array of media items to display */
  items: ContentMedia[];
  /** Callback when a media item is deleted */
  onDelete: (id: string) => void;
  /** Callback when a media URL is copied */
  onCopyUrl: (url: string) => void;
  /** Current locale for translations */
  locale: string;
  /** Loading state */
  loading?: boolean;
}

/**
 * Props for the MediaGridItem component
 */
export interface MediaGridItemProps {
  /** Media item to display */
  item: ContentMedia;
  /** Callback when delete button is clicked */
  onDelete: (id: string) => void;
  /** Callback when copy URL button is clicked */
  onCopyUrl: (url: string) => void;
  /** Current locale for translations */
  locale: string;
}

/**
 * Props for the DeleteConfirmDialog component
 */
export interface DeleteConfirmDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Media item to delete */
  item: ContentMedia | null;
  /** Callback when delete is confirmed */
  onConfirm: () => void;
  /** Callback when delete is cancelled */
  onCancel: () => void;
  /** Current locale for translations */
  locale: string;
  /** Loading state during deletion */
  deleting?: boolean;
}
