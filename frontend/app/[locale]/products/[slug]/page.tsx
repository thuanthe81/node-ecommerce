import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import ProductDetailContent from './ProductDetailContent';
import {
  fetchProductSSR,
  generateProductMetadata,
  generateProductStructuredData,
  shouldFallbackToCSR,
  getSSRErrorMessage
} from '@/lib/ssr-utils';
import {
  detectDeviceType,
  generateMobileViewportMeta,
  generateMobileStructuredData,
  generateMobileCSSClasses
} from '@/lib/mobile-ssr-utils';
import StructuredData from '@/components/StructuredData';

interface ProductPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

/**
 * Generates static params for popular products to enable ISR
 * Other products will be generated on-demand
 */
export async function generateStaticParams() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${baseUrl}/products/popular-slugs?limit=50`, {
      next: { revalidate: 3600 } // Revalidate popular products list every hour
    });

    if (!response.ok) {
      console.warn('Failed to fetch popular products for static generation');
      return [];
    }

    const popularSlugs: string[] = await response.json();
    return popularSlugs.map(slug => ({ slug }));
  } catch (error) {
    console.warn('Error generating static params for products:', error);
    return [];
  }
}

/**
 * Generates comprehensive metadata for product pages with server-side data fetching
 * Includes mobile-specific optimizations
 */
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { locale, slug } = await params;

  try {
    // Detect device type for mobile-specific optimizations
    const deviceConfig = await detectDeviceType();

    // Generate base metadata
    const baseMetadata = await generateProductMetadata(slug, locale);

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
    console.error('Error generating product metadata:', error);

    // Fallback metadata
    return {
      title: `${slug.replace(/-/g, ' ')} | Products`,
      description: 'Product details and information',
      robots: { index: false, follow: false },
    };
  }
}

/**
 * Server-side rendered product detail page with comprehensive error handling
 * Includes mobile-specific optimizations
 */
export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug, locale } = await params;

  // Detect device type for mobile optimizations
  const deviceConfig = await detectDeviceType();
  const mobileCSSClasses = generateMobileCSSClasses(deviceConfig);

  // Fetch product data server-side with error handling and fallbacks
  const productResult = await fetchProductSSR(slug, {
    apiTimeout: 5000,
    totalTimeout: 10000,
    retryAttempts: 2,
  });

  // Handle server-side rendering errors
  if (!productResult.data) {
    if (productResult.error?.code === 'NOT_FOUND') {
      notFound();
    }

    // Check if we should fallback to client-side rendering
    if (shouldFallbackToCSR(productResult)) {
      return (
        <div className={`container mx-auto px-4 py-8 ${mobileCSSClasses.join(' ')}`}>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">
              {getSSRErrorMessage(productResult, locale)}
            </p>
          </div>
          <Suspense
            fallback={
              <div className="animate-pulse">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="aspect-square bg-gray-200 rounded-lg" />
                  <div className="space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-3/4" />
                    <div className="h-6 bg-gray-200 rounded w-1/2" />
                    <div className="h-24 bg-gray-200 rounded" />
                  </div>
                </div>
              </div>
            }
          >
            <ProductDetailContent slug={slug} locale={locale} />
          </Suspense>
        </div>
      );
    }

    // If not fallback to CSR, show error page
    throw new Error(productResult.error?.message || 'Failed to load product');
  }

  const product = productResult.data;

  // Generate structured data for the product with mobile optimizations
  const baseStructuredData = generateProductStructuredData(product, locale, product.reviews);
  const mobileOptimizedStructuredData = generateMobileStructuredData(baseStructuredData, deviceConfig);

  return (
    <>
      {/* Add mobile-optimized structured data to page head */}
      <StructuredData data={mobileOptimizedStructuredData} />

      <div className={`container mx-auto px-4 py-8 ${mobileCSSClasses.join(' ')}`}>
        {/* Show cache performance info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-2 bg-gray-100 text-xs text-gray-600 rounded">
            SSR: {productResult.cacheHit ? 'Cache Hit' : 'Fresh Fetch'} |
            Render Time: {productResult.renderTime}ms
          </div>
        )}

        {/* Server-rendered product content */}
        <ProductDetailContent
          slug={slug}
          locale={locale}
          initialProduct={product}
          ssrMode={true}
        />
      </div>
    </>
  );
}