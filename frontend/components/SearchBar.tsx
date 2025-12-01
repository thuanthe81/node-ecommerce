'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { productApi, Product } from '@/lib/product-api';
import Link from 'next/link';
import Image from 'next/image';
import { SvgSearch } from './Svgs';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const locale = useLocale();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  useEffect(() => {
    const searchProducts = async () => {
      if (query.length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      try {
        const products = await productApi.searchProducts(query, 5);
        setResults(products);
        setIsOpen(true);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && results[selectedIndex]) {
      // Navigate to selected product
      router.push(`/${locale}/products/${results[selectedIndex].slug}`);
      setIsOpen(false);
      setSelectedIndex(-1);
    } else if (query.trim()) {
      router.push(`/${locale}/products?search=${encodeURIComponent(query)}`);
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-xl">
      <form onSubmit={handleSearch} role="search">
        <div className="relative">
          <label htmlFor="product-search" className="sr-only">
            {locale === 'vi' ? 'Tìm kiếm sản phẩm' : 'Search products'}
          </label>
          <input
            ref={inputRef}
            id="product-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={locale === 'vi' ? 'Tìm kiếm sản phẩm...' : 'Search products...'}
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={locale === 'vi' ? 'Tìm kiếm sản phẩm' : 'Search products'}
            aria-autocomplete="list"
            aria-controls={isOpen ? 'search-results' : undefined}
            aria-expanded={isOpen}
            aria-activedescendant={selectedIndex >= 0 ? `search-result-${selectedIndex}` : undefined}
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label={locale === 'vi' ? 'Tìm kiếm' : 'Search'}
          >
            <SvgSearch className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div
          id="search-results"
          className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto"
          role="listbox"
          aria-label={locale === 'vi' ? 'Kết quả tìm kiếm' : 'Search results'}
        >
          {loading ? (
            <div className="p-4 text-center text-gray-500" role="status" aria-live="polite">
              {locale === 'vi' ? 'Đang tìm kiếm...' : 'Searching...'}
            </div>
          ) : results.length > 0 ? (
            <>
              {results.map((product, index) => {
                const name = locale === 'vi' ? product.nameVi : product.nameEn;
                const imageUrl = product.images[0]?.url || '/placeholder-product.png';
                const altText = locale === 'vi'
                  ? product.images[0]?.altTextVi || name
                  : product.images[0]?.altTextEn || name;
                const isSelected = index === selectedIndex;

                return (
                  <Link
                    key={product.id}
                    id={`search-result-${index}`}
                    href={`/${locale}/products/${product.slug}`}
                    onClick={() => {
                      setIsOpen(false);
                      setSelectedIndex(-1);
                    }}
                    className={`flex items-center gap-3 p-3 border-b last:border-b-0 ${
                      isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    role="option"
                    aria-selected={isSelected}
                    aria-label={`${name} - ${new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(Number(product.price))}`}
                  >
                    <div className="relative w-12 h-12 flex-shrink-0 bg-gray-100 rounded">
                      <Image
                        src={imageUrl}
                        alt={altText}
                        fill
                        style={{ opacity: 1 }}
                        className="object-cover object-center rounded"
                        sizes="48px"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{name}</p>
                      <p className="text-sm text-gray-600">
                        {new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(Number(product.price))}
                      </p>
                    </div>
                  </Link>
                );
              })}
              <Link
                href={`/${locale}/products?search=${encodeURIComponent(query)}`}
                onClick={() => setIsOpen(false)}
                className="block p-3 text-center text-blue-600 hover:bg-gray-50 font-medium"
                aria-label={locale === 'vi' ? 'Xem tất cả kết quả tìm kiếm' : 'View all search results'}
              >
                {locale === 'vi' ? 'Xem tất cả kết quả' : 'View all results'}
              </Link>
            </>
          ) : (
            <div className="p-4 text-center text-gray-500" role="status">
              {locale === 'vi' ? 'Không tìm thấy sản phẩm' : 'No products found'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}