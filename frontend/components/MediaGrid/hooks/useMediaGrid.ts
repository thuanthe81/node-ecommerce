/**
 * useMediaGrid Hook
 * Custom hook for managing MediaGrid state and interactions
 */

import { useState } from 'react';
import { ContentMedia } from '@/lib/content-media-api';

export function useMediaGrid() {
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<ContentMedia | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  /**
   * Open delete confirmation dialog
   */
  const openDeleteConfirm = (item: ContentMedia) => {
    setDeleteConfirmItem(item);
  };

  /**
   * Close delete confirmation dialog
   */
  const closeDeleteConfirm = () => {
    setDeleteConfirmItem(null);
    setDeleting(false);
  };

  /**
   * Handle URL copy with feedback
   */
  const handleCopyUrl = (url: string) => {
    setCopiedUrl(url);
    // Clear the copied state after 2 seconds
    setTimeout(() => {
      setCopiedUrl(null);
    }, 2000);
  };

  return {
    deleteConfirmItem,
    deleting,
    setDeleting,
    copiedUrl,
    openDeleteConfirm,
    closeDeleteConfirm,
    handleCopyUrl,
  };
}
