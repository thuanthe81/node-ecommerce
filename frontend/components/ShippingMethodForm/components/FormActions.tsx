import { useTranslations } from 'next-intl';

/**
 * Props for the FormActions component
 */
interface FormActionsProps {
  /** Whether the form is currently submitting */
  loading: boolean;
  /** Handler for cancel button */
  onCancel: () => void;
}

/**
 * FormActions component for form submit and cancel buttons
 */
export function FormActions({ loading, onCancel }: FormActionsProps) {
  const t = useTranslations('admin.shippingMethods');

  return (
    <div className="flex justify-end space-x-4">
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {t('cancel')}
      </button>
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? t('saving') : t('save')}
      </button>
    </div>
  );
}
