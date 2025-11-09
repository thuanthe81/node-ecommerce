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
    <aside className="bg-white p-6 rounded-lg shadow-sm space-y-6" aria-label={locale === 'vi' ? 'Bộ lọc sản phẩm' : 'Product filters'}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {locale === 'vi' ? 'Bộ lọc' : 'Filters'}
        </h2>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-700"
            aria-label={locale === 'vi' ? 'Xóa tất cả bộ lọc' : 'Clear all filters'}
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={locale === 'vi' ? 'Chọn danh mục' : 'Select category'}
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={locale === 'vi' ? 'Giá tối thiểu' : 'Minimum price'}
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={locale === 'vi' ? 'Giá tối đa' : 'Maximum price'}
          />
        </div>
      </fieldset>

      {/* Availability Filter */}
      <div>
        <label htmlFor="in-stock-filter" className="flex items-center gap-2 cursor-pointer">
          <input
            id="in-stock-filter"
            type="checkbox"
            checked={inStock}
            onChange={(e) => setInStock(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={locale === 'vi' ? 'Sắp xếp sản phẩm' : 'Sort products'}
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
        onClick={applyFilters}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
        aria-label={locale === 'vi' ? 'Áp dụng bộ lọc' : 'Apply filters'}
      >
        {locale === 'vi' ? 'Áp dụng bộ lọc' : 'Apply Filters'}
      </button>
    </aside>
  );
}
