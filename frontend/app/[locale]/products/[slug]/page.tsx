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
  getDefaultDeviceConfig,
  generateMobileViewportMeta,
  generateMobileStructuredData,
  generateMobileCSSClasses
} from '@/lib/mobile-ssr-utils';
import StructuredData from '@/components/StructuredData';
import { productApi } from '@/lib/product-api';

interface ProductPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

/**
 * Generates static params for popular products to enable ISR
 * Other products will be generated on-demand
 */
export async function generateStaticParams() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  try {
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
    console.log('fetch url: ', `${baseUrl}/products/popular-slugs?limit=50`);
    console.warn('Error generating static params for products:', error);
    return [];
  }
}

/**
 * Generates comprehensive metadata for product pages with server-side data fetching
 * Uses static device configuration to allow static generation
 */
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { locale, slug } = await params;

  try {
    // Use default device config for static generation (no headers() call)
    const deviceConfig = getDefaultDeviceConfig();

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

  // Use default device config for static generation (no headers() call)
  const deviceConfig = getDefaultDeviceConfig();
  const mobileCSSClasses = generateMobileCSSClasses(deviceConfig);

  // Fetch product data server-side with error handling and fallbacks
  const productResult = await fetchProductSSR(slug);

  const product = productResult.data;
  const relatedProducts = product? product.relatedProducts : null;

  // Generate structured data for the product with mobile optimizations
  const baseStructuredData = product? generateProductStructuredData(product, locale, product.reviews) : null;
  const mobileOptimizedStructuredData = generateMobileStructuredData(baseStructuredData, deviceConfig);

  return (
    <>
      {/* Add mobile-optimized structured data to page head */}
      <StructuredData data={mobileOptimizedStructuredData} />

      <div className={`container mx-auto px-4 py-8 ${mobileCSSClasses.join(' ')}`}>

        {/* Server-rendered product content */}
        <ProductDetailContent
          slug={slug}
          locale={locale}
          initialProduct={product}
          initialRelatedProducts={relatedProducts}
          ssrMode={true}
        />
      </div>
    </>
  );
}