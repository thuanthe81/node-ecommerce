import { LanguageTab } from '../types';

/**
 * Props for the LanguageTabs component
 */
interface LanguageTabsProps {
  /** Currently active tab */
  activeTab: LanguageTab;
  /** Handler for tab changes */
  onTabChange: (tab: LanguageTab) => void;
}

/**
 * LanguageTabs component for switching between English and Vietnamese content
 */
export function LanguageTabs({ activeTab, onTabChange }: LanguageTabsProps) {
  return (
    <div className="flex space-x-2">
      <button
        type="button"
        onClick={() => onTabChange('en')}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
          activeTab === 'en'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => onTabChange('vi')}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
          activeTab === 'vi'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        Tiếng Việt
      </button>
    </div>
  );
}
