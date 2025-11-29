import { useTranslations } from 'next-intl';

/**
 * Props for the ContentTypeSelector component
 */
interface ContentTypeSelectorProps {
  /** Current selected content type */
  value: string;
  /** Available content types */
  types: string[];
  /** Callback when type changes */
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  /** Function to convert type enum to readable label */
  getTypeLabel: (type: string) => string;
}

/**
 * Dropdown selector for content type
 *
 * @example
 * ```tsx
 * <ContentTypeSelector
 *   value={formData.type}
 *   types={contentTypes}
 *   onChange={handleChange}
 *   getTypeLabel={getTypeLabel}
 * />
 * ```
 */
export function ContentTypeSelector({
  value,
  types,
  onChange,
  getTypeLabel,
}: ContentTypeSelectorProps) {
  const t = useTranslations();

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {t('admin.contentType')} {t('admin.required')}
      </label>
      <select
        name="type"
        value={value}
        onChange={onChange}
        required
        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {types.map((type) => (
          <option key={type} value={type}>
            {getTypeLabel(type)}
          </option>
        ))}
      </select>
    </div>
  );
}
