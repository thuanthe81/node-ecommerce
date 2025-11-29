/**
 * Props for the FormActions component
 */
interface FormActionsProps {
  /** Whether the form is currently submitting */
  loading: boolean;
  /** Current locale for translations */
  locale: string;
  /** Handler for cancel button */
  onCancel: () => void;
}

/**
 * FormActions component for form submission and cancellation
 *
 * Displays Cancel and Save buttons at the bottom of the form
 */
export function FormActions({ loading, locale, onCancel }: FormActionsProps) {
  return (
    <div className="flex justify-end space-x-3">
      <button
        type="button"
        onClick={onCancel}
        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
      >
        {locale === 'vi' ? 'Hủy' : 'Cancel'}
      </button>
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading
          ? locale === 'vi'
            ? 'Đang lưu...'
            : 'Saving...'
          : locale === 'vi'
          ? 'Lưu danh mục'
          : 'Save Category'}
      </button>
    </div>
  );
}
