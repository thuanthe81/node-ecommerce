/**
 * DeleteConfirmDialog Component
 * Modal dialog for confirming media item deletion
 */

import { useTranslations } from 'next-intl';
import { DeleteConfirmDialogProps } from '../types';
import { formatFileSize } from '../utils/formatters';

export function DeleteConfirmDialog({
  isOpen,
  item,
  onConfirm,
  onCancel,
  locale,
  deleting = false,
}: DeleteConfirmDialogProps) {
  const t = useTranslations('admin.contentMedia');

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('confirmDelete')}
        </h3>

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-4">
            {t('confirmDeleteMessage')}
          </p>

          {/* Media item preview */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3">
              <img
                src={item.url}
                alt={item.originalName}
                className="h-12 w-12 rounded object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.originalName}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(item.size)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? t('deleting') : t('delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
