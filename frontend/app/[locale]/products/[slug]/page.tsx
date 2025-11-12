import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import ProductDetailContent from './ProductDetailContent';
import { generateSEOMetadata } from '@/lib/seo';
import { Metadata } from 'next';

// This would ideally fetch product data for metadata
// For now, we'll use a simplified version
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata>  {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale });

  // In a real implementation, you would fetch the product here
  // const product = await productApi.getProductBySlug(slug);

  return generateSEOMetadata({
    title: `${slug.replace(/-/g, ' ')} | ${t('common.products')}`,
    description: t('seo.product.description'),
    locale,
    path: `/products/${slug}`,
    type: 'product',
  });
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  return (
    <div className="container mx-auto px-4 py-8">
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