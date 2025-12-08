/**
 * Language tabs component for switching between English and Vietnamese content
 */

import { useTranslations } from 'next-intl';

interface LanguageTabsProps {
  activeTab: 'en' | 'vi';
  onTabChange: (tab: 'en' | 'vi') => void;
}

export function LanguageTabs({ activeTab, onTabChange }: LanguageTabsProps) {
  const t = useTranslations('admin');

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
          {t('english')}
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
          {t('vietnamese')}
        </button>
      </nav>
    </div>
  );
}
