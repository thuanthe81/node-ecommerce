/**
 * useMediaPicker Hook
 * Manages state and logic for the MediaPickerModal component
 */

import { useState, useEffect, useCallback } from 'react';
import { contentMediaApi, ContentMedia } from '@/lib/content-media-api';

const ITEMS_PER_PAGE = 20;

export function useMediaPicker(
  isOpen: boolean,
  onSelectMedia: (url: string) => void,
  onClose: () => void
) {
  const [items, setItems] = useState<ContentMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  /**
   * Load media items from API
   */
  const loadMedia = useCallback(async (search?: string, page: number = 1) => {
    try {
      setLoading(true);
      const response = await contentMediaApi.getAll(
        search || undefined,
        page,
        ITEMS_PER_PAGE
      );
      setItems(response.items);
      setTotalPages(response.totalPages);
      setTotalItems(response.total);
      setCurrentPage(response.page);
    } catch (error) {
      console.error('Failed to load media:', error);
      setItems([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load media when modal opens
   */
  useEffect(() => {
    if (isOpen) {
      loadMedia(searchQuery, currentPage);
    }
  }, [isOpen, loadMedia]);

  /**
   * Handle search submission
   */
  const handleSearch = useCallback(() => {
    setCurrentPage(1);
    loadMedia(searchQuery, 1);
  }, [searchQuery, loadMedia]);

  /**
   * Handle search clear
   */
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setCurrentPage(1);
    loadMedia('', 1);
  }, [loadMedia]);

  /**
   * Handle page change
   */
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    loadMedia(searchQuery, page);
  }, [searchQuery, loadMedia]);

  /**
   * Handle media selection
   */
  const handleSelectMedia = useCallback((url: string) => {
    onSelectMedia(url);
    onClose();
    // Reset state after closing
    setSearchQuery('');
    setCurrentPage(1);
  }, [onSelectMedia, onClose]);

  return {
    items,
    loading,
    searchQuery,
    currentPage,
    totalPages,
    totalItems,
    setSearchQuery,
    handleSearch,
    handleClearSearch,
    handlePageChange,
    handleSelectMedia,
  };
}
