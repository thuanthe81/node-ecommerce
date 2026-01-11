'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { categoryApi } from '@/lib/category-api';
import { SvgSearch } from './Svgs';
import Dropdown, { type DropdownOption } from './Dropdown';

interface Category {
  id: string;
  slug: string;
  nameEn: string;
  nameVi: string;
}

interface SearchFilterBarProps {
  className?: string;
}

export default function SearchFilterBar({ className = '' }: SearchFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('common');

  // Internal state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState(searchParams.get('categoryId') || '');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const didMountRef = useRef(false);
  const isInitialMount = useRef(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const announcementRef = useRef<HTMLDivElement>(null);

  // Prepare dropdown options
  const categoryOptions: DropdownOption[] = [
    {
      value: '',
      label: isLoading
        ? t('loading')
        : categoryError
        ? t('unavailable')
        : t('allCategories')
    },
    ...categories.map(cat => ({
      value: cat.id,
      label: locale === 'vi' ? cat.nameVi : cat.nameEn
    }))
  ];

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        setCategoryError(null);
        const data = await categoryApi.getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategoryError(t('errorLoadingCategories'));
      } finally {
        setIsLoading(false);
      }
    };

    if (didMountRef.current) return;
    didMountRef.current = true;
    fetchCategories();
  }, [locale]);

  // Hydrate state from URL parameters when they change
  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');

    // Validate categoryId from URL against available categories
    const categoryIdFromUrl = searchParams.get('categoryId') || '';
    if (categoryIdFromUrl && categories.length > 0) {
      // Check if the categoryId exists in the available categories
      const isValidCategory = categories.some(cat => cat.id === categoryIdFromUrl);
      if (isValidCategory) {
        setSelectedCategoryId(categoryIdFromUrl);
      } else {
        // Invalid categoryId - ignore it and clear selection
        console.warn(`Invalid categoryId in URL: ${categoryIdFromUrl}`);
        setSelectedCategoryId('');
      }
    } else {
      setSelectedCategoryId(categoryIdFromUrl);
    }
  }, [searchParams, categories]);

  // Auto-update URL only when category changes
  useEffect(() => {
    // Skip URL update on initial mount (hydration already handled)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Only auto-update when category changes, not search query
    updateURL();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId]);

  const updateURL = () => {
    const params = new URLSearchParams();

    // Remove page when filters change (don't include it)

    // Update search parameter
    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim());
    }

    // Update category parameter
    if (selectedCategoryId) {
      params.set('categoryId', selectedCategoryId);
    }
    const searchParamsStr = params.toString();
    // Check if we're already on the products page
    const isOnProductsPage = pathname.includes('/products');

    let targetUrl = `?${searchParamsStr}`;

    if (searchParamsStr.length > 0 && !isOnProductsPage) {
      // Navigate to products page with search params
      targetUrl = `/${locale}/products?${searchParamsStr}`;

    }
    router.push(targetUrl);

    // Announce filter changes to screen readers
    announceFilterChange();
  };

  const announceFilterChange = () => {
    if (!announcementRef.current) return;

    const hasSearch = searchQuery.trim() !== '';
    const hasCategory = selectedCategoryId !== '';

    let message = '';
    if (hasSearch && hasCategory) {
      const categoryName = categories.find(c => c.id === selectedCategoryId);
      const displayName = categoryName ? (locale === 'vi' ? categoryName.nameVi : categoryName.nameEn) : '';
      message = t('filteringBySearchAndCategory', { search: searchQuery, category: displayName });
    } else if (hasSearch) {
      message = t('searchingProducts', { search: searchQuery });
    } else if (hasCategory) {
      const categoryName = categories.find(c => c.id === selectedCategoryId);
      const displayName = categoryName ? (locale === 'vi' ? categoryName.nameVi : categoryName.nameEn) : '';
      message = t('filteringByCategory', { category: displayName });
    } else {
      message = t('showingAllProducts');
    }

    announcementRef.current.textContent = message;
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      if (searchQuery) {
        setSearchQuery('');
      }
    } else if (e.key === 'Enter') {
      updateURL();
    }
  };

  const handleSearchClick = () => {
    updateURL();
  };

  return (
    <div className={className} role="search">
      {/* Screen reader announcements for filter changes */}
      <div
        ref={announcementRef}
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />

      <div className="flex flex-col sm:flex-row items-stretch">
        {/* Category Dropdown */}
        {categoryOptions.length > 0 && (
        <div className="w-46 min-h-[44px] mb-3 sm:mb-0">
          <label htmlFor="category-filter-select" className="sr-only">
            {t('category')}
          </label>
          <Dropdown
            id="category-filter-select"
            options={categoryOptions}
            value={selectedCategoryId}
            onChange={setSelectedCategoryId}
            disabled={isLoading || categoryError !== null}
            buttonClassName="rounded-lg sm:rounded-r-none sm:border-r-0"
            aria-label={t('category')}
            aria-describedby={categoryError ? "category-error category-hint" : "category-hint"}
            aria-invalid={categoryError !== null}
            error={categoryError}
          />
          <span id="category-hint" className="sr-only">
            {t('categoryFilterHint')}
          </span>
        </div>
        )}

        {/* Search Input */}
        <div className="flex-1 relative min-h-[44px]">
          <label htmlFor="search-filter-input" className="sr-only">
            {t('searchProducts')}
          </label>
          <input
            ref={searchInputRef}
            id="search-filter-input"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder={t('searchProductsPlaceholder')}
            className="w-full h-full min-h-[44px] px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 border border-gray-300 rounded-lg sm:rounded-l-none focus:outline-none focus-visible:outline-none text-base"
            style={{ outline: 'none', boxShadow: 'none' } as React.CSSProperties}
            aria-label={t('searchProducts')}
            aria-describedby="search-hint"
          />
          <span id="search-hint" className="sr-only">
            {t('searchProductsHint')}
          </span>
          <button
            type="button"
            onClick={handleSearchClick}
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={t('search')}
          >
            <SvgSearch className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}