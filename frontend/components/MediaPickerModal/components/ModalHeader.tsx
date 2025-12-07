/**
 * ModalHeader Component
 * Header section of the MediaPickerModal with title, search, and close button
 */

'use client';

import { useTranslations } from 'next-intl';
import { ModalHeaderProps } from '../types';
import { SvgClose } from '../../Svgs';

export function ModalHeader({
  searchQuery,
  onSearchChange,
  onSearch,
  onClearSearch,
  onClose,
  locale,
}: ModalHeaderProps) {
  const t = useTranslations('admin.contentMedia');

  return (
    <div className="px-6 py-4 border-b border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 id="media-picker-title" className="text-lg font-medium text-gray-900">
          {t('title')}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          aria-label={t('cancel')}
        >
          <SvgClose className="h-6 w-6" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSearch();
              }
            }}
            placeholder={t('searchPlaceholder')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label={t('searchPlaceholder')}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={onClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label={t('clearSearch')}
            >
              <SvgClose className="h-5 w-5" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onSearch}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {t('search')}
        </button>
      </div>
    </div>
  );
}
