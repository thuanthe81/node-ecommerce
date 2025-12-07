import { useTranslations } from 'next-intl';

/**
 * Props for the SettingsSection component
 */
interface SettingsSectionProps {
  /** Whether the shipping method is active */
  isActive: boolean;
  /** Handler for checkbox changes */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * SettingsSection component for shipping method settings
 *
 * Displays the active/inactive checkbox for the shipping method
 */
export function SettingsSection({ isActive, onChange }: SettingsSectionProps) {
  const t = useTranslations('admin.shippingMethods');

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        {t('settings')}
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
          {t('activeMethod')}
        </span>
      </label>
      <p className="mt-2 text-xs text-gray-500">
        {t('activeMethodHelp')}
      </p>
    </div>
  );
}
