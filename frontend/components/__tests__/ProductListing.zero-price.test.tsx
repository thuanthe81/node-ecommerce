import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductGrid from '../ProductGrid';
import ProductCard from '../ProductCard';
import { Product } from '@/lib/product-api';

// Mock next-intl
jest.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

describe('Product Listing with Zero-Price Products', () => {
  const createMockProduct = (overrides: Partial<Product> = {}): Product => ({
    id: '1',
    nameEn: 'Test Product',
    nameVi: 'Sản phẩm thử nghiệm',
    slug: 'test-product',
    descriptionEn: 'Test description',
    descriptionVi: 'Mô tả thử nghiệm',
    price: 100,
    compareAtPrice: null,
    sku: 'TEST-001',
    stockQuantity: 10,
    categoryId: 'cat-1',
    isActive: true,
    isFeatured: false,
    images: [
      {
        id: 'img-1',
        url: '/test-image.jpg',
        thumbnailUrl: '/test-thumb.jpg',
        altTextEn: 'Test image',
        altTextVi: 'Hình ảnh thử nghiệm',
        displayOrder: 0,
        productId: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    category: {
      id: 'cat-1',
      nameEn: 'Test Category',
      nameVi: 'Danh mục thử nghiệm',
      slug: 'test-category',
      descriptionEn: null,
      descriptionVi: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  describe('ProductGrid with zero-price products', () => {
    it('should display zero-price products correctly in grid', () => {
      const products = [
        createMockProduct({ id: '1', price: 0, nameEn: 'Zero Price Product' }),
        createMockProduct({ id: '2', price: 100, nameEn: 'Regular Product' }),
      ];

      render(<ProductGrid products={products} />);

      expect(screen.getByText('Zero Price Product')).toBeInTheDocument();
      expect(screen.getByText('Regular Product')).toBeInTheDocument();
    });

    it('should display all products when all are zero-price', () => {
      const products = [
        createMockProduct({ id: '1', price: 0, nameEn: 'Zero Price 1' }),
        createMockProduct({ id: '2', price: 0, nameEn: 'Zero Price 2' }),
        createMockProduct({ id: '3', price: 0, nameEn: 'Zero Price 3' }),
      ];

      render(<ProductGrid products={products} />);

      expect(screen.getByText('Zero Price 1')).toBeInTheDocument();
      expect(screen.getByText('Zero Price 2')).toBeInTheDocument();
      expect(screen.getByText('Zero Price 3')).toBeInTheDocument();
    });

    it('should show empty state when no products', () => {
      render(<ProductGrid products={[]} />);

      expect(screen.getByText('No products found')).toBeInTheDocument();
    });

    it('should handle mixed zero and non-zero price products', () => {
      const products = [
        createMockProduct({ id: '1', price: 0, nameEn: 'Zero Price Item' }),
        createMockProduct({ id: '2', price: 50, nameEn: 'Low Price' }),
        createMockProduct({ id: '3', price: 100, nameEn: 'Mid Price' }),
        createMockProduct({ id: '4', price: 0, nameEn: 'Another Zero' }),
      ];

      render(<ProductGrid products={products} />);

      // Check that all product names are displayed
      expect(screen.getByText('Zero Price Item')).toBeInTheDocument();
      expect(screen.getByText('Low Price')).toBeInTheDocument();
      expect(screen.getByText('Mid Price')).toBeInTheDocument();
      expect(screen.getByText('Another Zero')).toBeInTheDocument();

      // Check that "Contact for Price" appears multiple times (for zero-price products)
      const contactForPriceElements = screen.getAllByText('Contact for Price');
      expect(contactForPriceElements.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('ProductCard display for zero-price products', () => {
    it('should display "Contact for Price" for zero-price product', () => {
      const product = createMockProduct({ price: 0 });

      render(<ProductCard product={product} />);

      expect(screen.getByText('Contact for Price')).toBeInTheDocument();
    });

    it('should not display currency formatting for zero-price product', () => {
      const product = createMockProduct({ price: 0 });

      const { container } = render(<ProductCard product={product} />);

      // Should not contain VND or currency symbols
      expect(container.textContent).not.toContain('₫');
      expect(container.textContent).not.toContain('VND');
      expect(container.textContent).toContain('Contact for Price');
    });

    it('should display regular price for non-zero product', () => {
      const product = createMockProduct({ price: 100000 });

      const { container } = render(<ProductCard product={product} />);

      // Should contain currency formatting
      expect(container.textContent).toMatch(/100[,.]000/);
    });

    it('should handle zero price with discount price', () => {
      const product = createMockProduct({ price: 0, compareAtPrice: 100 });

      render(<ProductCard product={product} />);

      // Should show contact for price, not the discount
      expect(screen.getByText('Contact for Price')).toBeInTheDocument();
    });

    it('should display pre-order indicator for zero-price product', () => {
      const product = createMockProduct({ price: 0, stockQuantity: 0 });

      render(<ProductCard product={product} />);

      expect(screen.getByText('Pre-Order')).toBeInTheDocument();
      expect(screen.getByText('Contact for Price')).toBeInTheDocument();
    });
  });

  describe('Sorting behavior with zero-price products', () => {
    it('should maintain display order for price-sorted products', () => {
      // Simulating products already sorted by price ascending
      const products = [
        createMockProduct({ id: '1', price: 0, nameEn: 'Zero Price' }),
        createMockProduct({ id: '2', price: 50, nameEn: 'Low Price' }),
        createMockProduct({ id: '3', price: 100, nameEn: 'High Price' }),
      ];

      const { container } = render(<ProductGrid products={products} />);

      const productNames = Array.from(container.querySelectorAll('h3')).map(
        (el) => el.textContent,
      );

      expect(productNames).toEqual(['Zero Price', 'Low Price', 'High Price']);
    });

    it('should maintain display order for reverse price-sorted products', () => {
      // Simulating products already sorted by price descending
      const products = [
        createMockProduct({ id: '3', price: 100, nameEn: 'High Price' }),
        createMockProduct({ id: '2', price: 50, nameEn: 'Low Price' }),
        createMockProduct({ id: '1', price: 0, nameEn: 'Zero Price' }),
      ];

      const { container } = render(<ProductGrid products={products} />);

      const productNames = Array.from(container.querySelectorAll('h3')).map(
        (el) => el.textContent,
      );

      expect(productNames).toEqual(['High Price', 'Low Price', 'Zero Price']);
    });

    it('should display multiple zero-price products in order', () => {
      const products = [
        createMockProduct({ id: '1', price: 0, nameEn: 'Alpha Zero' }),
        createMockProduct({ id: '2', price: 0, nameEn: 'Beta Zero' }),
        createMockProduct({ id: '3', price: 0, nameEn: 'Gamma Zero' }),
      ];

      const { container } = render(<ProductGrid products={products} />);

      const productNames = Array.from(container.querySelectorAll('h3')).map(
        (el) => el.textContent,
      );

      expect(productNames).toEqual(['Alpha Zero', 'Beta Zero', 'Gamma Zero']);
    });
  });

  describe('Edge cases', () => {
    it('should handle product with price as string "0"', () => {
      const product = createMockProduct({ price: '0' as any });

      render(<ProductCard product={product} />);

      expect(screen.getByText('Contact for Price')).toBeInTheDocument();
    });

    it('should handle product with very small non-zero price', () => {
      const product = createMockProduct({ price: 1 });

      const { container } = render(<ProductCard product={product} />);

      // Should display as regular price, not contact for price
      expect(container.textContent).not.toContain('Contact for Price');
    });

    it('should handle large number of zero-price products', () => {
      const products = Array.from({ length: 20 }, (_, i) =>
        createMockProduct({
          id: `${i}`,
          price: 0,
          nameEn: `Zero Price Product ${i}`,
        }),
      );

      render(<ProductGrid products={products} />);

      // Should render all products
      products.forEach((product) => {
        expect(screen.getByText(product.nameEn)).toBeInTheDocument();
      });
    });

    it('should handle product with null or undefined price gracefully', () => {
      const product = createMockProduct({ price: null as any });

      render(<ProductCard product={product} />);

      // Should treat null/undefined as zero and show contact for price
      expect(screen.getByText('Contact for Price')).toBeInTheDocument();
    });
  });
});
