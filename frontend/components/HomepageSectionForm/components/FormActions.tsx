/**
 * Props for the FormActions component
 */
interface FormActionsProps {
  /** Whether form is currently submitting */
  loading: boolean;
  /** Whether editing existing section */
  isEdit: boolean;
  /** Callback when cancel is clicked */
  onCancel: () => void;
}

/**
 * Form action buttons (Cancel and Submit)
 *
 * @param props - Component props
 */
export function FormActions({ loading, isEdit, onCancel }: FormActionsProps) {
  return (
    <div className="flex justify-end space-x-4 pt-6 border-t">
      <button
        type="button"
        onClick={onCancel}
        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Saving...' : isEdit ? 'Update Section' : 'Create Section'}
      </button>
    </div>
  );
}
