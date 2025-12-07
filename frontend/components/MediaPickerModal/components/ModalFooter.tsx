/**
 * ModalFooter Component
 * Footer section of the MediaPickerModal with pagination and close button
 */

'use client';

import { useTranslations } from 'next-intl';
import { ModalFooterProps } from '../types';

export function ModalFooter({
  totalItems,
  currentPage,
  totalPages,
  onPageChange,
  onClose,
  locale,
}: ModalFooterProps) {
  const t = useTranslations('admin.contentMedia');

  return (
    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
      <div className="flex justify-between items-center">
        {/* Item count and pagination */}
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-600">
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </p>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={t('previous')}
              >
                {t('previous')}
              </button>

              <span className="text-sm text-gray-600">
                {t('page')} {currentPage} {t('of')} {totalPages}
              </span>

              <button
                type="button"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={t('next')}
              >
                {t('next')}
              </button>
            </div>
          )}
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {t('cancel')}
        </button>
      </div>
    </div>
  );
}
