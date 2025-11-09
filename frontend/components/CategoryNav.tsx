'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Category } from '@/lib/category-api';
import { useCategories } from '@/hooks/useCategories';

export default function CategoryNav() {
  const locale = useLocale();
  const { categories, isLoading } = useCategories();
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const getCategoryName = (category: Category) => {
    return locale === 'vi' ? category.nameVi : category.nameEn;
  };

  if (isLoading) {
    return (
      <nav className="bg-gray-100 border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="animate-pulse flex space-x-4">
            <div className="h-4 bg-gray-300 rounded w-20"></div>
            <div className="h-4 bg-gray-300 rounded w-20"></div>
            <div className="h-4 bg-gray-300 rounded w-20"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-gray-100 border-b">
      <div className="container mx-auto px-4">
        <ul className="flex space-x-6 py-3">
          {categories.map((category) => (
            <li
              key={category.id}
              className="relative group"
              onMouseEnter={() => setOpenCategory(category.id)}
              onMouseLeave={() => setOpenCategory(null)}
            >
              <Link
                href={`/${locale}/categories/${category.slug}`}
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                {getCategoryName(category)}
                {category.children && category.children.length > 0 && (
                  <svg
                    className="inline-block ml-1 w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                )}
              </Link>

              {/* Dropdown menu for subcategories */}
              {category.children && category.children.length > 0 && (
                <div
                  className={`absolute left-0 mt-2 w-56 bg-white rounded-md shadow-lg z-50 transition-all duration-200 ${
                    openCategory === category.id
                      ? 'opacity-100 visible'
                      : 'opacity-0 invisible'
                  }`}
                >
                  <ul className="py-2">
                    {category.children.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={`/${locale}/categories/${child.slug}`}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                        >
                          {getCategoryName(child)}
                          {child._count && child._count.products > 0 && (
                            <span className="ml-2 text-xs text-gray-500">
                              ({child._count.products})
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
