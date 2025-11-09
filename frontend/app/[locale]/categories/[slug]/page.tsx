'use client';

import { useState, useEffect, use } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { categoryApi, Category } from '@/lib/category-api';
import Breadcrumb from '@/components/Breadcrumb';
import Link from 'next/link';

interface PageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

export default function CategoryPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const locale = useLocale();
  const t = useTranslations();
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setLoading(true);
        const data = await categoryApi.getCategoryBySlug(resolvedParams.slug);
        setCategory(data);
      } catch (err) {
        console.error('Failed to fetch category:', err);
        setError('Failed to load category');
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [resolvedParams.slug]);

  const getCategoryName = (cat: Category) => {
    return locale === 'vi' ? cat.nameVi : cat.nameEn;
  };

  const getCategoryDescription = (cat: Category) => {
    return locale === 'vi' ? cat.descriptionVi : cat.descriptionEn;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-64 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t('common.error')}
          </h1>
          <p className="text-gray-600 mb-4">
            {error || 'Category not found'}
          </p>
          <Link
            href={`/${locale}`}
            className="text-blue-600 hover:text-blue-700"
          >
            {t('common.back')}
          </Link>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [];
  if (category.parent) {
    breadcrumbItems.push({
      label: getCategoryName(category.parent),
      href: `/${locale}/categories/${category.parent.slug}`,
    });
  }
  breadcrumbItems.push({
    label: getCategoryName(category),
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb items={breadcrumbItems} />

      {/* Category Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {getCategoryName(category)}
        </h1>
        {getCategoryDescription(category) && (
          <p className="text-gray-600">{getCategoryDescription(category)}</p>
        )}
        {category._count && (
          <p className="text-sm text-gray-500 mt-2">
            {category._count.products} {t('common.products').toLowerCase()}
          </p>
        )}
      </div>

      {/* Subcategories */}
      {category.children && category.children.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t('nav.categories')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {category.children.map((child) => (
              <Link
                key={child.id}
                href={`/${locale}/categories/${child.slug}`}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow text-center"
              >
                {child.imageUrl && (
                  <div className="w-16 h-16 mx-auto mb-2 bg-gray-200 rounded-full"></div>
                )}
                <h3 className="text-sm font-medium text-gray-900">
                  {getCategoryName(child)}
                </h3>
                {child._count && child._count.products > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {child._count.products} {t('common.products').toLowerCase()}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Products Grid - Placeholder */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {t('common.products')}
          </h2>
          <div className="flex items-center space-x-4">
            <select className="border rounded-md px-3 py-2 text-sm">
              <option>{t('search.sortBy')}</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Newest</option>
              <option>Name: A-Z</option>
            </select>
          </div>
        </div>

        {/* Products will be implemented in task 7 */}
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">
            Products will be displayed here (Task 7)
          </p>
        </div>
      </div>
    </div>
  );
}
