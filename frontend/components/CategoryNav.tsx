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

  const handleKeyDown = (e: React.KeyboardEvent, categoryId: string, hasChildren: boolean | undefined) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (hasChildren) {
        e.preventDefault();
        setOpenCategory(openCategory === categoryId ? null : categoryId);
      }
    } else if (e.key === 'Escape') {
      setOpenCategory(null);
    }
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
    <nav className="bg-gray-100 border-b" aria-label={locale === 'vi' ? 'Danh mục sản phẩm' : 'Product categories'}>
      <div className="container mx-auto px-4">
        <ul className="flex space-x-6 py-3" role="menubar">
          {categories.map((category) => {
            const hasChildren = category.children && category.children.length > 0;
            const isOpen = openCategory === category.id;

            return (
              <li
                key={category.id}
                className="relative group"
                onMouseEnter={() => setOpenCategory(category.id)}
                onMouseLeave={() => setOpenCategory(null)}
                role="none"
              >
                <Link
                  href={`/${locale}/categories/${category.slug}`}
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                  role="menuitem"
                  aria-haspopup={hasChildren ? 'true' : undefined}
                  aria-expanded={hasChildren ? isOpen : undefined}
                  onKeyDown={(e) => handleKeyDown(e, category.id, hasChildren)}
                  tabIndex={0}
                >
                  {getCategoryName(category)}
                  {hasChildren && (
                    <svg
                      className="inline-block ml-1 w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
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
                {hasChildren && (
                  <div
                    className={`absolute left-0 mt-2 w-56 bg-white rounded-md shadow-lg z-50 transition-all duration-200 ${
                      isOpen
                        ? 'opacity-100 visible'
                        : 'opacity-0 invisible'
                    }`}
                    role="menu"
                    aria-label={`${getCategoryName(category)} ${locale === 'vi' ? 'danh mục con' : 'subcategories'}`}
                  >
                    <ul className="py-2" role="none">
                      {category.children!.map((child) => (
                        <li key={child.id} role="none">
                          <Link
                            href={`/${locale}/categories/${child.slug}`}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                            role="menuitem"
                            tabIndex={isOpen ? 0 : -1}
                          >
                            {getCategoryName(child)}
                            {child._count && child._count.products > 0 && (
                              <span className="ml-2 text-xs text-gray-500" aria-label={`${child._count.products} ${locale === 'vi' ? 'sản phẩm' : 'products'}`}>
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
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
