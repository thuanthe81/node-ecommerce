/**
 * Category selector component for blog posts
 * Allows multi-select of blog categories
 */

import { useTranslations } from 'next-intl';
import { BlogCategory } from '../types';

interface CategorySelectorProps {
  categories: BlogCategory[];
  selectedCategoryIds: string[];
  loading: boolean;
  locale: string;
  onToggle: (categoryId: string) => void;
}

export function CategorySelector({
  categories,
  selectedCategoryIds,
  loading,
  locale,
  onToggle,
}: CategorySelectorProps) {
  const t = useTranslations('admin.blog');

  if (loading) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {t('categories')}
        </label>
        <div className="text-sm text-gray-500">{t('loadingCategories')}</div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {t('categories')}
        </label>
        <div className="text-sm text-gray-500">{t('noCategories')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {t('categories')}
      </label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {categories.map((category) => (
          <label
            key={category.id}
            className="flex items-center space-x-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50"
          >
            <input
              type="checkbox"
              checked={selectedCategoryIds.includes(category.id)}
              onChange={() => onToggle(category.id)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              {locale === 'vi' ? category.nameVi : category.nameEn}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
