/**
 * Form action buttons (Cancel and Submit)
 */

import { useTranslations } from 'next-intl';

interface FormActionsProps {
  loading: boolean;
  isEdit: boolean;
  onCancel: () => void;
}

export function FormActions({ loading, isEdit, onCancel }: FormActionsProps) {
  const t = useTranslations('admin.blog');
  const tCommon = useTranslations('common');
  const tAdmin = useTranslations('admin');

  return (
    <div className="flex justify-end space-x-4 pt-6 border-t">
      <button
        type="button"
        onClick={onCancel}
        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
      >
        {tCommon('cancel')}
      </button>
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? tAdmin('saving') : isEdit ? t('editPost') : t('createPost')}
      </button>
    </div>
  );
}
