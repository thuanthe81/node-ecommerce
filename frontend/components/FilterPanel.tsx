'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { categoryApi } from '@/lib/category-api';
import { SvgChevronDown } from './Svgs';

interface Category {
  id: string;
  slug: string;
  nameEn: string;
  nameVi: string;
}

export default function FilterPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations();

  const [categories, setCategories] = useState<Category[]>([]);
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('categoryId') || ''
  );
  const [inStock, setInStock] = useState(searchParams.get('inStock') === 'true');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const didMountRef = useRef(false);
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryApi.getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    if (didMountRef.current) return;
    didMountRef.current = true;
    fetchCategories().then();
  }, []);

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());

    // Remove page when filters change
    params.delete('page');

    if (minPrice) {
      params.set('minPrice', minPrice);
    } else {
      params.delete('minPrice');
    }

    if (maxPrice) {
      params.set('maxPrice', maxPrice);
    } else {
      params.delete('maxPrice');
    }

    if (selectedCategory) {
      params.set('categoryId', selectedCategory);
    } else {
      params.delete('categoryId');
    }

    if (inStock) {
      params.set('inStock', 'true');
    } else {
      params.delete('inStock');
    }

    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);

    router.push(`?${params.toString()}`);
  };

  const clearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setSelectedCategory('');
    setInStock(false);
    setSortBy('createdAt');
    setSortOrder('desc');
    router.push(window.location.pathname);
  };

  const hasActiveFilters =
    minPrice || maxPrice || selectedCategory || inStock || sortBy !== 'createdAt';

  return (
    <aside className="bg-white rounded-lg shadow-sm" aria-label={t('common.productFilters')}>
      {/* Mobile Filter Toggle Button */}
      <button
        onClick={() => setIsFilterOpen(!isFilterOpen)}
        className="lg:hidden w-full flex items-center justify-between p-4 text-left border-b touch-manipulation"
        aria-expanded={isFilterOpen}
        aria-label={t('common.filterAndSorting')}
        style={{ minHeight: '44px' }}
      >
        <span className="font-semibold text-gray-900">
          {t('common.filterAndSorting')}
          {hasActiveFilters && (
            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-blue-600 rounded-full">
              !
            </span>
          )}
        </span>
        <SvgChevronDown
          className={`w-5 h-5 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {/* Filter Content */}
      <div className={`p-6 space-y-6 ${isFilterOpen ? 'block' : 'hidden lg:block'}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {t('common.filters')}
          </h2>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 touch-manipulation"
              aria-label={t('common.clearAllFilters')}
              style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}
            >
              {t('common.clearAll')}
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div>
          <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-2">
            {t('common.category')}
          </label>
          <select
            id="category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
            aria-label={t('common.selectCategory')}
            style={{ minHeight: '44px' }}
          >
            <option value="">{t('common.allCategories')}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {locale === 'vi' ? category.nameVi : category.nameEn}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range Filter */}
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-2">
            {t('common.priceRange')}
          </legend>
          <div className="space-y-2">
            <label htmlFor="min-price" className="sr-only">
              {t('common.minPrice')}
            </label>
            <input
              id="min-price"
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder={locale === 'vi' ? 'Giá tối thiểu' : 'Min price'}
              className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
              aria-label={t('common.minPrice')}
              style={{ minHeight: '44px' }}
            />
            <label htmlFor="max-price" className="sr-only">
              {t('common.maxPrice')}
            </label>
            <input
              id="max-price"
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder={t('common.maxPrice')}
              className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
              aria-label={t('common.maxPrice')}
              style={{ minHeight: '44px' }}
            />
          </div>
        </fieldset>

        {/* Availability Filter */}
        <div>
          <label htmlFor="in-stock-filter" className="flex items-center gap-3 cursor-pointer touch-manipulation" style={{ minHeight: '44px' }}>
            <input
              id="in-stock-filter"
              type="checkbox"
              checked={inStock}
              onChange={(e) => setInStock(e.target.checked)}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 touch-manipulation"
              aria-label={t('common.showInStockOnly')}
            />
            <span className="text-sm text-gray-700">
              {t('common.showInStockOnly')}
            </span>
          </label>
        </div>

        {/* Sort Options */}
        <div>
          <label htmlFor="sort-filter" className="block text-sm font-medium text-gray-700 mb-2">
            {t('common.sortBy')}
          </label>
          <select
            id="sort-filter"
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split('-');
              setSortBy(newSortBy);
              setSortOrder(newSortOrder);
            }}
            className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
            aria-label={t('common.sortProducts')}
            style={{ minHeight: '44px' }}
          >
            <option value="createdAt-desc">
              {t('common.newest')}
            </option>
            <option value="createdAt-asc">
              {t('common.oldest')}
            </option>
            <option value="price-asc">
              {t('common.priceLowToHigh')}
            </option>
            <option value="price-desc">
              {t('common.priceHighToLow')}
            </option>
            <option value="name-asc">
              {t('common.namAZ')}
            </option>
            <option value="name-desc">
              {t('common.namZA')}
            </option>
          </select>
        </div>

        {/* Apply Button */}
        <button
          onClick={() => {
            applyFilters();
            setIsFilterOpen(false);
          }}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium touch-manipulation"
          aria-label={t('common.applyFilters')}
          style={{ minHeight: '44px' }}
        >
          {t('common.applyFilters')}
        </button>
      </div>
    </aside>
  );
}