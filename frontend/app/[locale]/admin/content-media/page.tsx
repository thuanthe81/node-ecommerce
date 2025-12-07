'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import { MediaUploader } from '@/components/MediaUploader';
import { MediaGrid } from '@/components/MediaGrid';
import { contentMediaApi, ContentMedia } from '@/lib/content-media-api';
import { SvgChevronLeftSolid, SvgChevronRightSolid } from '@/components/Svgs';

/**
 * ContentMediaPage Component
 * Main admin page for managing content media library
 *
 * Features:
 * - Upload new media files
 * - View media in responsive grid
 * - Search and filter media
 * - Pagination
 * - Delete media items
 * - Copy media URLs
 */
export default function ContentMediaPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('admin.contentMedia');

  // State management
  const [mediaItems, setMediaItems] = useState<ContentMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSearch, setCurrentSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 20;

  // Load media items
  useEffect(() => {
    loadMedia();
  }, [page, currentSearch]);

  /**
   * Load media items from API
   */
  const loadMedia = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await contentMediaApi.getAll(
        currentSearch || undefined,
        page,
        ITEMS_PER_PAGE
      );
      setMediaItems(response.items);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (err: any) {
      console.error('Failed to load media:', err);
      setError(err.message || t('loadError'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle search form submission
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentSearch(searchQuery);
    setPage(1); // Reset to first page on new search
  };

  /**
   * Clear search and show all items
   */
  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentSearch('');
    setPage(1);
  };

  /**
   * Handle successful upload
   */
  const handleUploadComplete = (media: ContentMedia) => {
    // Show success message
    setSuccessMessage(t('uploadSuccess'));
    setTimeout(() => setSuccessMessage(null), 3000);

    // Reload media list to show new item
    loadMedia();
  };

  /**
   * Handle upload error
   */
  const handleUploadError = (errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(null), 5000);
  };

  /**
   * Handle media deletion
   */
  const handleDelete = async (id: string) => {
    try {
      await contentMediaApi.delete(id);

      // Show success message
      setSuccessMessage(t('deleteSuccess'));
      setTimeout(() => setSuccessMessage(null), 3000);

      // Remove from local state
      setMediaItems((prev) => prev.filter((item) => item.id !== id));

      // Reload to ensure accurate pagination
      loadMedia();
    } catch (err: any) {
      console.error('Failed to delete media:', err);
      setError(err.message || t('deleteError'));
      setTimeout(() => setError(null), 5000);
    }
  };

  /**
   * Handle URL copy
   */
  const handleCopyUrl = (url: string) => {
    // Show success message
    setSuccessMessage(t('urlCopied'));
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  /**
   * Navigate to previous page
   */
  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  /**
   * Navigate to next page
   */
  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  return (
    <AdminProtectedRoute locale={locale}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
            <p className="mt-1 text-sm text-gray-600">{t('description')}</p>
          </div>

          {/* Success/Error Messages */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Upload Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <MediaUploader
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              locale={locale}
            />
          </div>

          {/* Search Section */}
          <div className="bg-white shadow rounded-lg p-4">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('search')}
              </button>
              {currentSearch && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {t('clearSearch')}
                </button>
              )}
            </form>
          </div>

          {/* Media Grid Section */}
          <div className="bg-white shadow rounded-lg p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">{t('loading')}</p>
              </div>
            ) : mediaItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  {currentSearch ? t('noResults') : t('noMediaItems')}
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  {currentSearch ? t('noResultsMessage') : t('uploadFirstMedia')}
                </p>
              </div>
            ) : (
              <MediaGrid
                items={mediaItems}
                onDelete={handleDelete}
                onCopyUrl={handleCopyUrl}
                locale={locale}
                loading={false}
              />
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && !loading && (
            <div className="bg-white shadow rounded-lg px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={handlePreviousPage}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('previous')}
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={page === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('next')}
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    {t('page')} {page} {t('of')} {totalPages}
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={handlePreviousPage}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={t('previous')}
                    >
                      <span className="sr-only">{t('previous')}</span>
                      <SvgChevronLeftSolid className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleNextPage}
                      disabled={page === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={t('next')}
                    >
                      <span className="sr-only">{t('next')}</span>
                      <SvgChevronRightSolid className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
