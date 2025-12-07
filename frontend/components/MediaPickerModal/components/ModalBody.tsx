/**
 * ModalBody Component
 * Body section of the MediaPickerModal displaying media items in a grid
 */

'use client';

import { useTranslations } from 'next-intl';
import { ModalBodyProps } from '../types';
import Image from 'next/image';

export function ModalBody({
  items,
  loading,
  searchQuery,
  onSelectMedia,
  locale,
}: ModalBodyProps) {
  const t = useTranslations('admin.contentMedia');

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('loading')}</p>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchQuery ? t('noResults') : t('noMediaItems')}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery ? t('noResultsMessage') : t('uploadFirstMedia')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectMedia(item.url)}
              className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-all group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={`Select ${item.originalName}`}
            >
              <img
                src={item.url}
                alt={item.originalName}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-100 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-xs truncate">{item.originalName}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}