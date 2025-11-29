import { LayoutType } from '../types';

/**
 * Props for the LayoutSelector component
 */
interface LayoutSelectorProps {
  /** Current layout value */
  value: LayoutType;
  /** Callback when layout changes */
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  /** Whether image is required for current layout */
  requiresImage: boolean;
}

/**
 * Layout selector dropdown for homepage sections
 *
 * Allows users to choose between centered, image-left, and image-right layouts
 *
 * @param props - Component props
 */
export function LayoutSelector({ value, onChange, requiresImage }: LayoutSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Layout Type *
      </label>
      <select
        name="layout"
        value={value}
        onChange={onChange}
        required
        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="centered">Centered (No Image)</option>
        <option value="image-left">Image Left</option>
        <option value="image-right">Image Right</option>
      </select>
      <p className="text-sm text-gray-500 mt-1">
        {requiresImage ? 'Image required for this layout' : 'No image needed for centered layout'}
      </p>
    </div>
  );
}
