'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { useLocale } from 'next-intl';
import { productApi, Product } from '@/lib/product-api';
import ProductImageGallery from './ProductImageGallery';
import ProductInfo from './ProductInfo';
import RelatedProducts from './RelatedProducts';
import StructuredData from '@/components/StructuredData';
import { generateProductSchema, generateBreadcrumbList } from '@/lib/seo';

interface ProductDetailContentProps {
  slug: string;
  locale: string;
}

export default function ProductDetailContent({
  slug,
  locale,
}: ProductDetailContentProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const currentLocale = useLocale();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await productApi.getProductBySlug(slug);
        setProduct(data);
        // @ts-ignore - relatedProducts is added by backend
        setRelatedProducts(data.relatedProducts || []);
      } catch (error) {
        console.error('Error fetching product:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  if (loading) {
    return (
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
    );
  }

  if (!product) {
    notFound();
  }

  const productName = currentLocale === 'vi' ? product.nameVi : product.nameEn;
  const productDescription = currentLocale === 'vi' ? product.descriptionVi : product.descriptionEn;
  const categoryName = currentLocale === 'vi' ? product.category.nameVi : product.category.nameEn;
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const localePrefix = currentLocale === 'vi' ? '' : `/${currentLocale}`;
  const productUrl = `${siteUrl}${localePrefix}/products/${product.slug}`;
  
  const productSchema = generateProductSchema({
    name: productName,
    description: productDescription,
    image: product.images[0]?.url || '',
    price: product.price,
    currency: 'VND',
    availability: product.stockQuantity > 0 ? 'in stock' : 'out of stock',
    sku: product.sku,
    rating: product.averageRating,
    reviewCount: product._count?.reviews,
    url: productUrl,
  });

  const breadcrumbSchema = generateBreadcrumbList([
    { name: 'Home', url: `${siteUrl}${localePrefix}` },
    { name: 'Products', url: `${siteUrl}${localePrefix}/products` },
    { name: categoryName, url: `${siteUrl}${localePrefix}/categories/${product.category.slug}` },
    { name: productName, url: productUrl },
  ]);

  return (
    <>
      <StructuredData data={[productSchema, breadcrumbSchema]} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <ProductImageGallery images={product.images} productName={product.nameEn} />
        <ProductInfo product={product} />
      </div>

      {relatedProducts.length > 0 && (
        <RelatedProducts products={relatedProducts} locale={currentLocale} />
      )}
    </>
  );
}
