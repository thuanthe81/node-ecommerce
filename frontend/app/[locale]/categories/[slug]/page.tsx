import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Breadcrumb from '@/components/Breadcrumb';
import ProductGrid from '@/components/ProductGrid';
import Link from 'next/link';
import StructuredData from '@/components/StructuredData';
import {
  fetchCategorySSR,
  generateCategoryMetadata,
  generateCategoryStructuredData,
  shouldFallbackToCSR,
  getSSRErrorMessage,
} from '@/lib/ssr-utils';
import {
  detectDeviceType,
  getDefaultDeviceConfig,
  generateMobileViewportMeta,
  generateMobileStructuredData,
  generateMobileCSSClasses
} from '@/lib/mobile-ssr-utils';
import { CategoryPageData, EnhancedCategory } from '@/lib/ssr-types';
import { categoryApi } from '@/lib/category-api';
import { EnhancedProduct } from '@/lib/product-api';

interface PageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
  searchParams: Promise<{
    page?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
  }>;
}

// Server-side data fetching function
async function getCategoryData(
  slug: string,
  searchParams: {
    page?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
  }
): Promise<CategoryPageData | null> {
  const page = parseInt(searchParams.page || '1', 10);
  const sortBy = searchParams.sort?.split('-')[0] as 'price' | 'name' | 'createdAt' | undefined;
  const sortOrder = searchParams.sort?.split('-')[1] as 'asc' | 'desc' | undefined;
  const minPrice = searchParams.minPrice ? parseInt(searchParams.minPrice, 10) : undefined;
  const maxPrice = searchParams.maxPrice ? parseInt(searchParams.maxPrice, 10) : undefined;
  const inStock = searchParams.inStock === 'true' ? true : undefined;

  const result = await fetchCategorySSR(slug, {
    page,
    sortBy,
    sortOrder,
    minPrice,
    maxPrice,
    inStock,
    limit: 20,
  });

  return result.data;
}

// Generate metadata for SEO with static device configuration
export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const resolvedSearchParams = await searchParams;

  try {
    // Use default device config for static generation (no headers() call)
    const deviceConfig = getDefaultDeviceConfig();

    // Generate base metadata
    const baseMetadata = await generateCategoryMetadata(slug, locale, resolvedSearchParams);

    // Add mobile-specific viewport and meta tags
    const mobileViewportMeta = generateMobileViewportMeta(deviceConfig);

    // Enhance metadata with mobile optimizations
    const enhancedMetadata: Metadata = {
      ...baseMetadata,
      other: {
        ...baseMetadata.other,
        ...mobileViewportMeta
      }
    };

    return enhancedMetadata;
  } catch (error) {
    console.error('Error generating category metadata:', error);
    return {
      title: `${slug.replace(/-/g, ' ')} | Categories`,
      description: 'Browse products in this category',
      robots: { index: false, follow: false },
    };
  }
}

// Generate static params for popular categories
export async function generateStaticParams() {
  try {
    const categories = await categoryApi.getCategories();

    // Generate static params for all active categories
    return categories
      .filter(category => category.isActive)
      .map(category => ({
        slug: category.slug,
      }));
  } catch (error) {
    console.error('Error generating static params for categories:', error);
    return [];
  }
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { locale, slug } = await params;
  const resolvedSearchParams = await searchParams;
  const t = await getTranslations();

  // Use default device config for static generation (no headers() call)
  const deviceConfig = getDefaultDeviceConfig();
  const mobileCSSClasses = generateMobileCSSClasses(deviceConfig);

  // Fetch category data server-side
  const categoryData = await getCategoryData(slug, resolvedSearchParams);

  if (!categoryData) {
    notFound();
  }

  const { category, products, breadcrumbs, pagination, filters } = categoryData;

  // Helper functions for localized content
  const getCategoryName = (cat: EnhancedCategory) => {
    return locale === 'vi' ? cat.nameVi : cat.nameEn;
  };

  const getCategoryDescription = (cat: EnhancedCategory) => {
    return locale === 'vi' ? cat.descriptionVi : cat.descriptionEn;
  };

  const getProductName = (product: EnhancedProduct) => {
    return locale === 'vi' ? product.nameVi : product.nameEn;
  };

  // Generate breadcrumb items for the component
  const breadcrumbItems = breadcrumbs.map(crumb => ({
    label: crumb.name,
    href: crumb.path,
  }));

  // Generate structured data with mobile optimizations
  const baseStructuredData = generateCategoryStructuredData(
    category,
    products,
    locale,
    pagination
  );
  const mobileOptimizedStructuredData = generateMobileStructuredData(baseStructuredData, deviceConfig);

  // Generate pagination URLs
  const generatePageUrl = (page: number) => {
    const params = new URLSearchParams(resolvedSearchParams as Record<string, string>);
    params.set('page', page.toString());
    return `/${locale}/categories/${slug}?${params.toString()}`;
  };

  return (
    <>
      <StructuredData data={mobileOptimizedStructuredData} />

      <div className={`container mx-auto px-4 py-8 ${mobileCSSClasses.join(' ')}`}>
        <Breadcrumb items={breadcrumbItems} />

        {/* Category Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {getCategoryName(category)}
          </h1>
          {getCategoryDescription(category) && (
            <p className="text-gray-600">{getCategoryDescription(category)}</p>
          )}
          {category.productCount > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              {category.productCount} {t('common.products').toLowerCase()}
            </p>
          )}
        </div>

        {/* Subcategories */}
        {category.children && category.children.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('nav.categories')}
            </h2>
            <div className={`grid gap-4 ${deviceConfig.isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6'}`}>
              {category.children.map((child) => (
                <Link
                  key={child.id}
                  href={`/${locale}/categories/${child.slug}`}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow text-center"
                >
                  {child.imageUrl && (
                    <div className="w-16 h-16 mx-auto mb-2 bg-gray-200 rounded-full overflow-hidden">
                      <img
                        src={child.imageUrl}
                        alt={getCategoryName(child)}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <h3 className="text-sm font-medium text-gray-900">
                    {getCategoryName(child)}
                  </h3>
                  {child.productCount > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {child.productCount} {t('common.products').toLowerCase()}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Products Section */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {t('common.products')}
            </h2>
            <div className="flex items-center space-x-4">
              <select
                className="border rounded-md px-3 py-2 text-sm"
                defaultValue={resolvedSearchParams.sort || ''}
                onChange={(e) => {
                  const params = new URLSearchParams(resolvedSearchParams as Record<string, string>);
                  if (e.target.value) {
                    params.set('sort', e.target.value);
                  } else {
                    params.delete('sort');
                  }
                  params.delete('page'); // Reset to first page when sorting
                  window.location.href = `/${locale}/categories/${slug}?${params.toString()}`;
                }}
              >
                <option value="">{t('search.sortBy')}</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="createdAt-desc">Newest</option>
                <option value="name-asc">Name: A-Z</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          {products.length > 0 ? (
            <>
              <ProductGrid products={products} />

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-8 flex justify-center items-center space-x-2">
                  {pagination.hasPrev && (
                    <Link
                      href={generatePageUrl(pagination.currentPage - 1)}
                      className="px-3 py-2 border rounded-md hover:bg-gray-50"
                      rel="prev"
                    >
                      {t('common.previous')}
                    </Link>
                  )}

                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter(page =>
                      page === 1 ||
                      page === pagination.totalPages ||
                      Math.abs(page - pagination.currentPage) <= 2
                    )
                    .map((page, index, array) => (
                      <div key={page} className="flex items-center">
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="px-2 text-gray-500">...</span>
                        )}
                        <Link
                          href={generatePageUrl(page)}
                          className={`px-3 py-2 border rounded-md ${
                            page === pagination.currentPage
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </Link>
                      </div>
                    ))}

                  {pagination.hasNext && (
                    <Link
                      href={generatePageUrl(pagination.currentPage + 1)}
                      className="px-3 py-2 border rounded-md hover:bg-gray-50"
                      rel="next"
                    >
                      {t('common.next')}
                    </Link>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">
                {t('common.noProductsFound')}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}