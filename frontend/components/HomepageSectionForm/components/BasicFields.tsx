/**
 * Props for the BasicFields component
 */
interface BasicFieldsProps {
  /** Slug value */
  slug: string;
  /** Display order value */
  displayOrder: number;
  /** Whether section is published */
  isPublished: boolean;
  /** Whether editing existing section */
  isEdit: boolean;
  /** Callback when field changes */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Basic fields for homepage section form (slug, display order, published status)
 *
 * @param props - Component props
 */
export function BasicFields({
  slug,
  displayOrder,
  isPublished,
  isEdit,
  onChange,
}: BasicFieldsProps) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Display Order *
        </label>
        <input
          type="number"
          name="displayOrder"
          value={displayOrder}
          onChange={onChange}
          min="0"
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-sm text-gray-500 mt-1">
          Lower numbers appear first on homepage
        </p>
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Slug *
        </label>
        <input
          type="text"
          name="slug"
          value={slug}
          onChange={onChange}
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="url-friendly-slug"
        />
        <p className="text-sm text-gray-500 mt-1">
          Auto-generated from English title, but can be customized
        </p>
      </div>

      <div className="md:col-span-2">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            name="isPublished"
            checked={isPublished}
            onChange={onChange}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="ml-2 text-sm font-medium text-gray-700">
            Publish this section (make it visible on homepage)
          </span>
        </label>
      </div>
    </>
  );
}
