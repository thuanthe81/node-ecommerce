/**
 * Example usage of SSR utilities for enhanced server-side rendering
 * This file demonstrates how to use the SSR infrastructure in Next.js pages
 */

import { Metadata } from 'next';
import Script from 'next/script';
import {
  fetchProductSSR,
  fetchCategorySSR,
  fetchHomepageSSR,
  generateProductMetadata,
  generateCategoryMetadata,
  generateProductStructuredData,
  generateCategoryStructuredData,
  generateHomepageStructuredData,
  shouldFallbackToCSR,
  getSSRErrorMessage,
} from './ssr-utils';
import { generateStructuredDataScript } from './structured-data';

/**
 * Example: Enhanced Product Page with SSR
 */
interface ProductPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

// Generate metadata for product page
export async function generateProductPageMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  return generateProductMetadata(slug, locale);
}

// Product page component with SSR data fetching
export async function ProductPageExample({ params }: ProductPageProps) {
  const { locale, slug } = await params;

  // Fetch product data with SSR error handling
  const result = await fetchProductSSR(slug);

  // Check if we should fallback to client-side rendering
  if (shouldFallbackToCSR(result)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading Product...</h1>
          <p className="text-gray-600">
            {getSSRErrorMessage(result, locale)}
          </p>
          {/* Client-side component would be rendered here */}
        </div>
      </div>
    );
  }

  if (!result.data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <p className="text-gray-600">The requested product could not be found.</p>
        </div>
      </div>
    );
  }

  const product = result.data;
  const productName = locale === 'vi' ? product.nameVi : product.nameEn;
  const productDescription = locale === 'vi' ? product.descriptionVi : product.descriptionEn;

  // Generate structured data
  const structuredDataJson = generateProductStructuredData(product, locale);

  return (
    <>
      {/* Structured Data */}
      <Script
        id="product-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredDataJson }}
      />

      {/* Product Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            {product.images.map((image, index) => (
              <img
                key={image.id}
                src={image.url}
                alt={locale === 'vi' ? image.altTextVi : image.altTextEn}
                className="w-full h-auto rounded-lg"
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            ))}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">{productName}</h1>

            <div className="flex items-center space-x-4">
              <span className="text-2xl font-bold text-primary">
                {product.price.toLocaleString('vi-VN')}₫
              </span>
              {product.compareAtPrice && (
                <span className="text-lg text-gray-500 line-through">
                  {product.compareAtPrice.toLocaleString('vi-VN')}₫
                </span>
              )}
            </div>

            <div className="prose max-w-none">
              <p>{productDescription}</p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">SKU:</span>
              <span className="text-sm font-mono">{product.sku}</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {locale === 'vi' ? 'Tình trạng:' : 'Availability:'}
              </span>
              <span className={`text-sm font-medium ${
                product.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {product.stockQuantity > 0
                  ? (locale === 'vi' ? 'Còn hàng' : 'In Stock')
                  : (locale === 'vi' ? 'Hết hàng' : 'Out of Stock')
                }
              </span>
            </div>

            {/* Add to Cart Button */}
            <button
              className="w-full bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-dark transition-colors"
              disabled={product.stockQuantity === 0}
            >
              {locale === 'vi' ? 'Thêm vào giỏ hàng' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Example: Enhanced Category Page with SSR
 */
interface CategoryPageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ page?: string; sort?: string }>;
}

// Generate metadata for category page
export async function generateCategoryPageMetadata({
  params,
  searchParams
}: CategoryPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const { page } = await searchParams;
  return generateCategoryMetadata(slug, locale, { page });
}

// Category page component with SSR data fetching
export async function CategoryPageExample({ params, searchParams }: CategoryPageProps) {
  const { locale, slug } = await params;
  const { page = '1', sort } = await searchParams;

  // Fetch category data with SSR error handling
  const result = await fetchCategorySSR(slug, {
    page: parseInt(page, 10),
    sortBy: sort as any
  });

  // Check if we should fallback to client-side rendering
  if (shouldFallbackToCSR(result)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading Category...</h1>
          <p className="text-gray-600">
            {getSSRErrorMessage(result, locale)}
          </p>
        </div>
      </div>
    );
  }

  if (!result.data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
          <p className="text-gray-600">The requested category could not be found.</p>
        </div>
      </div>
    );
  }

  const { category, products, pagination } = result.data;
  const categoryName = locale === 'vi' ? category.nameVi : category.nameEn;
  const categoryDescription = locale === 'vi' ? category.descriptionVi : category.descriptionEn;

  // Generate structured data
  const structuredDataJson = generateCategoryStructuredData(category, products, locale, pagination);

  return (
    <>
      {/* Structured Data */}
      <Script
        id="category-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredDataJson }}
      />

      {/* Category Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Category Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">{categoryName}</h1>
          {categoryDescription && (
            <p className="text-gray-600 text-lg">{categoryDescription}</p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            {pagination.totalItems} {locale === 'vi' ? 'sản phẩm' : 'products'}
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => {
            const productName = locale === 'vi' ? product.nameVi : product.nameEn;
            return (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {product.images[0] && (
                  <img
                    src={product.images[0].url}
                    alt={locale === 'vi' ? product.images[0].altTextVi : product.images[0].altTextEn}
                    className="w-full h-48 object-cover"
                    loading="lazy"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                    {productName}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">
                      {product.price.toLocaleString('vi-VN')}₫
                    </span>
                    {product.stockQuantity === 0 && (
                      <span className="text-xs text-red-600 font-medium">
                        {locale === 'vi' ? 'Hết hàng' : 'Out of Stock'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center space-x-2">
            {pagination.hasPrev && (
              <a
                href={`?page=${pagination.currentPage - 1}${sort ? `&sort=${sort}` : ''}`}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                {locale === 'vi' ? 'Trước' : 'Previous'}
              </a>
            )}

            <span className="px-4 py-2 bg-primary text-white rounded">
              {pagination.currentPage} / {pagination.totalPages}
            </span>

            {pagination.hasNext && (
              <a
                href={`?page=${pagination.currentPage + 1}${sort ? `&sort=${sort}` : ''}`}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                {locale === 'vi' ? 'Sau' : 'Next'}
              </a>
            )}
          </div>
        )}
      </div>
    </>
  );
}

/**
 * Example: Enhanced Homepage with SSR
 */
interface HomepageProps {
  params: Promise<{ locale: string }>;
}

// Homepage component with SSR data fetching
export async function HomepageExample({ params }: HomepageProps) {
  const { locale } = await params;

  // Fetch homepage data with SSR error handling
  const result = await fetchHomepageSSR();

  // Check if we should fallback to client-side rendering
  if (shouldFallbackToCSR(result)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p className="text-gray-600">
            {getSSRErrorMessage(result, locale)}
          </p>
        </div>
      </div>
    );
  }

  const data = result.data || {
    featuredProducts: [],
    categories: [],
    promotionalBanners: [],
    homepageSections: [],
    seoData: {} as any,
  };

  // Generate structured data
  const structuredDataJson = generateHomepageStructuredData(locale);

  return (
    <>
      {/* Structured Data */}
      <Script
        id="homepage-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredDataJson }}
      />

      {/* Homepage Content */}
      <div>
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary to-primary-dark text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {locale === 'vi'
                ? 'Sản phẩm Handmade chất lượng cao'
                : 'High Quality Handmade Products'
              }
            </h1>
            <p className="text-xl mb-8">
              {locale === 'vi'
                ? 'Khám phá bộ sưu tập độc đáo của chúng tôi'
                : 'Discover our unique collection'
              }
            </p>
          </div>
        </section>

        {/* Featured Products */}
        {data.featuredProducts.length > 0 && (
          <section className="py-16">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-8">
                {locale === 'vi' ? 'Sản phẩm nổi bật' : 'Featured Products'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {data.featuredProducts.slice(0, 8).map((product) => {
                  const productName = locale === 'vi' ? product.nameVi : product.nameEn;
                  return (
                    <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                      {product.images[0] && (
                        <img
                          src={product.images[0].url}
                          alt={locale === 'vi' ? product.images[0].altTextVi : product.images[0].altTextEn}
                          className="w-full h-48 object-cover"
                          loading="lazy"
                        />
                      )}
                      <div className="p-4">
                        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                          {productName}
                        </h3>
                        <span className="text-lg font-bold text-primary">
                          {product.price.toLocaleString('vi-VN')}₫
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Categories */}
        {data.categories.length > 0 && (
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-8">
                {locale === 'vi' ? 'Danh mục sản phẩm' : 'Product Categories'}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {data.categories.map((category) => {
                  const categoryName = locale === 'vi' ? category.nameVi : category.nameEn;
                  return (
                    <div key={category.id} className="text-center">
                      {category.imageUrl && (
                        <img
                          src={category.imageUrl}
                          alt={categoryName}
                          className="w-full h-32 object-cover rounded-lg mb-4"
                          loading="lazy"
                        />
                      )}
                      <h3 className="font-medium text-gray-900">{categoryName}</h3>
                      <p className="text-sm text-gray-600">
                        {category.productCount} {locale === 'vi' ? 'sản phẩm' : 'products'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}