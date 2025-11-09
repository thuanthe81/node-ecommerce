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
  const [isMobileCategoryOpen, setIsMobileCategoryOpen] = useState(false);

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
        {/* Desktop Navigation */}
        <ul className="hidden lg:flex space-x-6 py-3" role="menubar">
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
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors touch-manipulation"
                  role="menuitem"
                  aria-haspopup={hasChildren ? 'true' : undefined}
                  aria-expanded={hasChildren ? isOpen : undefined}
                  onKeyDown={(e) => handleKeyDown(e, category.id, hasChildren)}
                  tabIndex={0}
                  style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}
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
                            className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors touch-manipulation"
                            role="menuitem"
                            tabIndex={isOpen ? 0 : -1}
                            style={{ minHeight: '44px' }}
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

        {/* Mobile Category Dropdown */}
        <div className="lg:hidden py-3">
          <button
            onClick={() => setIsMobileCategoryOpen(!isMobileCategoryOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-md shadow-sm text-gray-700 hover:text-blue-600 transition-colors touch-manipulation"
            aria-expanded={isMobileCategoryOpen}
            aria-label={locale === 'vi' ? 'Chọn danh mục' : 'Select category'}
            style={{ minHeight: '44px' }}
          >
            <span className="font-medium">
              {locale === 'vi' ? 'Danh mục' : 'Categories'}
            </span>
            <svg
              className={`w-5 h-5 transition-transform ${isMobileCategoryOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isMobileCategoryOpen && (
            <div className="mt-2 bg-white rounded-md shadow-lg overflow-hidden">
              <ul className="py-2">
                {categories.map((category) => {
                  const hasChildren = category.children && category.children.length > 0;
                  const isCategoryOpen = openCategory === category.id;

                  return (
                    <li key={category.id}>
                      <div className="flex items-center">
                        <Link
                          href={`/${locale}/categories/${category.slug}`}
                          className="flex-1 px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors touch-manipulation"
                          onClick={() => setIsMobileCategoryOpen(false)}
                          style={{ minHeight: '44px' }}
                        >
                          {getCategoryName(category)}
                        </Link>
                        {hasChildren && (
                          <button
                            onClick={() => setOpenCategory(isCategoryOpen ? null : category.id)}
                            className="px-4 py-3 text-gray-500 hover:text-blue-600 transition-colors touch-manipulation"
                            aria-label={`${isCategoryOpen ? (locale === 'vi' ? 'Đóng' : 'Close') : (locale === 'vi' ? 'Mở' : 'Open')} ${getCategoryName(category)} ${locale === 'vi' ? 'danh mục con' : 'subcategories'}`}
                            aria-expanded={isCategoryOpen}
                            style={{ minWidth: '44px', minHeight: '44px' }}
                          >
                            <svg
                              className={`w-5 h-5 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}
                      </div>
                      {hasChildren && isCategoryOpen && (
                        <ul className="bg-gray-50 py-1">
                          {category.children!.map((child) => (
                            <li key={child.id}>
                              <Link
                                href={`/${locale}/categories/${child.slug}`}
                                className="block pl-8 pr-4 py-3 text-sm text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors touch-manipulation"
                                onClick={() => {
                                  setIsMobileCategoryOpen(false);
                                  setOpenCategory(null);
                                }}
                                style={{ minHeight: '44px' }}
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
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
