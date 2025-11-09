'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { productApi, Product } from '@/lib/product-api';
import Link from 'next/link';
import Image from 'next/image';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const locale = useLocale();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    if (query.trim()) {
      router.push(`/${locale}/products?search=${encodeURIComponent(query)}`);
      setIsOpen(false);
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-xl">
      <form onSubmit={handleSearch}>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={locale === 'vi' ? 'Tìm kiếm sản phẩm...' : 'Search products...'}
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              {locale === 'vi' ? 'Đang tìm kiếm...' : 'Searching...'}
            </div>
          ) : results.length > 0 ? (
            <>
              {results.map((product) => {
                const name = locale === 'vi' ? product.nameVi : product.nameEn;
                const imageUrl = product.images[0]?.url || '/placeholder-product.png';

                return (
                  <Link
                    key={product.id}
                    href={`/${locale}/products/${product.slug}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 border-b last:border-b-0"
                  >
                    <div className="relative w-12 h-12 flex-shrink-0 bg-gray-100 rounded">
                      <Image
                        src={imageUrl}
                        alt={name}
                        fill
                        className="object-cover rounded"
                        sizes="48px"
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
              >
                {locale === 'vi' ? 'Xem tất cả kết quả' : 'View all results'}
              </Link>
            </>
          ) : (
            <div className="p-4 text-center text-gray-500">
              {locale === 'vi' ? 'Không tìm thấy sản phẩm' : 'No products found'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
