'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { categoryApi } from '@/lib/category-api';

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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryApi.getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
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
    <aside className="bg-white rounded-lg shadow-sm" aria-label={locale === 'vi' ? 'Bộ lọc sản phẩm' : 'Product filters'}>
      {/* Mobile Filter Toggle Button */}
      <button
        onClick={() => setIsFilterOpen(!isFilterOpen)}
        className="lg:hidden w-full flex items-center justify-between p-4 text-left border-b touch-manipulation"
        aria-expanded={isFilterOpen}
        aria-label={locale === 'vi' ? 'Bộ lọc và sắp xếp' : 'Filters and sorting'}
        style={{ minHeight: '44px' }}
      >
        <span className="font-semibold text-gray-900">
          {locale === 'vi' ? 'Bộ lọc & Sắp xếp' : 'Filters & Sort'}
          {hasActiveFilters && (
            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-blue-600 rounded-full">
              !
            </span>
          )}
        </span>
        <svg
          className={`w-5 h-5 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Filter Content */}
      <div className={`p-6 space-y-6 ${isFilterOpen ? 'block' : 'hidden lg:block'}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {locale === 'vi' ? 'Bộ lọc' : 'Filters'}
          </h2>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 touch-manipulation"
              aria-label={locale === 'vi' ? 'Xóa tất cả bộ lọc' : 'Clear all filters'}
              style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}
            >
              {locale === 'vi' ? 'Xóa bộ lọc' : 'Clear all'}
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div>
          <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-2">
            {locale === 'vi' ? 'Danh mục' : 'Category'}
          </label>
          <select
            id="category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
            aria-label={locale === 'vi' ? 'Chọn danh mục' : 'Select category'}
            style={{ minHeight: '44px' }}
          >
            <option value="">{locale === 'vi' ? 'Tất cả' : 'All categories'}</option>
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
            {locale === 'vi' ? 'Khoảng giá' : 'Price Range'}
          </legend>
          <div className="space-y-2">
            <label htmlFor="min-price" className="sr-only">
              {locale === 'vi' ? 'Giá tối thiểu' : 'Minimum price'}
            </label>
            <input
              id="min-price"
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder={locale === 'vi' ? 'Giá tối thiểu' : 'Min price'}
              className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
              aria-label={locale === 'vi' ? 'Giá tối thiểu' : 'Minimum price'}
              style={{ minHeight: '44px' }}
            />
            <label htmlFor="max-price" className="sr-only">
              {locale === 'vi' ? 'Giá tối đa' : 'Maximum price'}
            </label>
            <input
              id="max-price"
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder={locale === 'vi' ? 'Giá tối đa' : 'Max price'}
              className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
              aria-label={locale === 'vi' ? 'Giá tối đa' : 'Maximum price'}
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
              aria-label={locale === 'vi' ? 'Chỉ hiển thị sản phẩm còn hàng' : 'Show only in-stock products'}
            />
            <span className="text-sm text-gray-700">
              {locale === 'vi' ? 'Chỉ hiển thị sản phẩm còn hàng' : 'In stock only'}
            </span>
          </label>
        </div>

        {/* Sort Options */}
        <div>
          <label htmlFor="sort-filter" className="block text-sm font-medium text-gray-700 mb-2">
            {locale === 'vi' ? 'Sắp xếp theo' : 'Sort by'}
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
            aria-label={locale === 'vi' ? 'Sắp xếp sản phẩm' : 'Sort products'}
            style={{ minHeight: '44px' }}
          >
            <option value="createdAt-desc">
              {locale === 'vi' ? 'Mới nhất' : 'Newest'}
            </option>
            <option value="createdAt-asc">
              {locale === 'vi' ? 'Cũ nhất' : 'Oldest'}
            </option>
            <option value="price-asc">
              {locale === 'vi' ? 'Giá: Thấp đến cao' : 'Price: Low to High'}
            </option>
            <option value="price-desc">
              {locale === 'vi' ? 'Giá: Cao đến thấp' : 'Price: High to Low'}
            </option>
            <option value="name-asc">
              {locale === 'vi' ? 'Tên: A-Z' : 'Name: A-Z'}
            </option>
            <option value="name-desc">
              {locale === 'vi' ? 'Tên: Z-A' : 'Name: Z-A'}
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
          aria-label={locale === 'vi' ? 'Áp dụng bộ lọc' : 'Apply filters'}
          style={{ minHeight: '44px' }}
        >
          {locale === 'vi' ? 'Áp dụng bộ lọc' : 'Apply Filters'}
        </button>
      </div>
    </aside>
  );
}
