/**
 * Props for the SettingsSection component
 */
interface SettingsSectionProps {
  /** Whether the category is active */
  isActive: boolean;
  /** Current locale for translations */
  locale: string;
  /** Handler for checkbox changes */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * SettingsSection component for category settings
 *
 * Displays the active/inactive checkbox for the category
 */
export function SettingsSection({ isActive, locale, onChange }: SettingsSectionProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        {locale === 'vi' ? 'Cài đặt' : 'Settings'}
      </h2>

      <label className="flex items-center">
        <input
          type="checkbox"
          name="isActive"
          checked={isActive}
          onChange={onChange}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <span className="ml-2 text-sm text-gray-700">
          {locale === 'vi' ? 'Kích hoạt danh mục' : 'Active category'}
        </span>
      </label>
    </div>
  );
}
