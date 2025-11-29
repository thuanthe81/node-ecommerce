/**
 * Props for the MediaFields component
 */
interface MediaFieldsProps {
  /** Button URL value */
  linkUrl: string;
  /** Image URL value */
  imageUrl: string;
  /** Whether image is required for current layout */
  requiresImage: boolean;
  /** Callback when field changes */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Media fields for homepage section (button URL and image URL)
 *
 * @param props - Component props
 */
export function MediaFields({
  linkUrl,
  imageUrl,
  requiresImage,
  onChange,
}: MediaFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Button URL *
        </label>
        <input
          type="url"
          name="linkUrl"
          value={linkUrl}
          onChange={onChange}
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="https://example.com/products"
        />
        <p className="text-sm text-gray-500 mt-1">
          Where the button should navigate to
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Image URL {requiresImage && '*'}
        </label>
        <input
          type="url"
          name="imageUrl"
          value={imageUrl}
          onChange={onChange}
          required={requiresImage}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="https://example.com/image.jpg"
        />
        <p className="text-sm text-gray-500 mt-1">
          {requiresImage ? 'Required for this layout' : 'Optional for centered layout'}
        </p>
      </div>
    </div>
  );
}
