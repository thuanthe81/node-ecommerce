'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { useLocale } from 'next-intl';
import { productApi, Product, EnhancedProduct } from '@/lib/product-api';
import ProductImageGallery from './ProductImageGallery';
import ProductInfo from './ProductInfo';
import RelatedProducts from './RelatedProducts';
import StructuredData from '@/components/StructuredData';
import { generateProductSchema, generateBreadcrumbList } from '@/lib/seo';

interface ProductDetailContentProps {
  slug: string;
  locale: string;
  initialProduct: EnhancedProduct | null; // SSR-provided initial data
  initialRelatedProducts: Product[] | null; // SSR-provided related products
  ssrMode?: boolean; // Flag to indicate SSR mode
}

export default function ProductDetailContent({
  slug,
  locale,
  initialProduct,
  initialRelatedProducts,
  ssrMode = false,
}: ProductDetailContentProps) {
  const [product, setProduct] = useState<Product | EnhancedProduct | null>(initialProduct || null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>(initialRelatedProducts || []);
  const [loading, setLoading] = useState(!initialProduct);
  const currentLocale = useLocale();

  useEffect(() => {
    // Fallback to client-side fetching if no initial data
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

    if (!initialProduct || relatedProducts.length == 0) {
      fetchProduct();
    }
  }, [slug, initialProduct, ssrMode]);

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

  // Handle both Product and EnhancedProduct types
  const productName = currentLocale === 'vi'
    ? (product as any).nameVi
    : (product as any).nameEn;

  const productDescription = currentLocale === 'vi'
    ? (product as any).descriptionVi
    : (product as any).descriptionEn;

  const categoryName = currentLocale === 'vi' ? product.category.nameVi : product.category.nameEn;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const localePrefix = currentLocale === 'vi' ? '' : `/${currentLocale}`;
  const productUrl = `${siteUrl}${localePrefix}/products/${product.slug}`;

  // Only generate structured data if not in SSR mode (to avoid duplication)
  let productSchema = null;
  let breadcrumbSchema = null;

  if (!ssrMode) {
    productSchema = generateProductSchema({
      name: productName,
      description: productDescription,
      image: product.images[0]?.url || '',
      price: product.price,
      currency: 'VND',
      availability: product.stockQuantity > 0 ? 'in stock' : 'pre-order',
      sku: product.sku,
      rating: product.averageRating,
      reviewCount: product._count?.reviews,
      url: productUrl,
    });

    breadcrumbSchema = generateBreadcrumbList([
      { name: 'Home', url: `${siteUrl}${localePrefix}` },
      { name: 'Products', url: `${siteUrl}${localePrefix}/products` },
      { name: categoryName, url: `${siteUrl}${localePrefix}/categories/${product.category.slug}` },
      { name: productName, url: productUrl },
    ]);
  }

  return (
    <>
      {!ssrMode && productSchema && breadcrumbSchema && (
        <StructuredData data={[productSchema, breadcrumbSchema]} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <ProductImageGallery images={product.images} productName={productName} />
        <ProductInfo product={product} />
      </div>

      {relatedProducts.length > 0 && (
        <RelatedProducts products={relatedProducts} locale={currentLocale} />
      )}
    </>
  );
}