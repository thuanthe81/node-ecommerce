import { LanguageTab } from '../types';

/**
 * Props for the LanguageTabs component
 */
interface LanguageTabsProps {
  /** Currently active tab */
  activeTab: LanguageTab;
  /** Callback when tab changes */
  onTabChange: (tab: LanguageTab) => void;
}

/**
 * Language tab switcher for English/Vietnamese content
 *
 * @param props - Component props
 */
export function LanguageTabs({ activeTab, onTabChange }: LanguageTabsProps) {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        <button
          type="button"
          onClick={() => onTabChange('en')}
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'en'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          English Content
        </button>
        <button
          type="button"
          onClick={() => onTabChange('vi')}
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'vi'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Vietnamese Content
        </button>
      </nav>
    </div>
  );
}
