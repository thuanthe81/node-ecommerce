'use client';

import { Product } from '@/lib/product-api';
import ProductCard from '@/components/ProductCard';

interface RelatedProductsProps {
  products: Product[];
  locale: string;
}

export default function RelatedProducts({ products, locale }: RelatedProductsProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <div className="border-t pt-12">
      <h2 className="text-2xl font-bold mb-6">
        {locale === 'vi' ? 'Sản phẩm liên quan' : 'Related Products'}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
