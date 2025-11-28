import { render, screen } from '@testing-library/react';
import ProductCard from '../ProductCard';
import { Product } from '@/lib/product-api';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// Mock next-intl
jest.mock('next-intl', () => ({
  useLocale: () => 'en',
}));

const mockProduct: Product = {
  id: '1',
  slug: 'test-product',
  sku: 'TEST-001',
  nameEn: 'Test Product',
  nameVi: 'Sản phẩm thử nghiệm',
  descriptionEn: 'Test description',
  descriptionVi: 'Mô tả thử nghiệm',
  price: 100000,
  stockQuantity: 10,
  isActive: true,
  isFeatured: false,
  category: {
    id: 'cat-1',
    slug: 'test-category',
    nameEn: 'Test Category',
    nameVi: 'Danh mục thử nghiệm',
  },
  images: [],
};

describe('ProductCard', () => {
  it('should display placeholder when product has no images', () => {
    render(<ProductCard product={mockProduct} />);

    const image = screen.getByAltText('Test Product');
    expect(image).toHaveAttribute('src', '/placeholder-product.png');
  });

  it('should display primary image (lowest displayOrder)', () => {
    const productWithImages: Product = {
      ...mockProduct,
      images: [
        {
          id: 'img-2',
          url: '/image-2.jpg',
          altTextEn: 'Second Image',
          altTextVi: 'Hình ảnh thứ hai',
          displayOrder: 1,
        },
        {
          id: 'img-1',
          url: '/image-1.jpg',
          altTextEn: 'Primary Image',
          altTextVi: 'Hình ảnh chính',
          displayOrder: 0,
        },
      ],
    };

    render(<ProductCard product={productWithImages} />);

    const image = screen.getByAltText('Primary Image');
    expect(image).toHaveAttribute('src', '/image-1.jpg');
  });

  it('should use product name as alt text when image has no alt text', () => {
    const productWithImageNoAlt: Product = {
      ...mockProduct,
      images: [
        {
          id: 'img-1',
          url: '/image-1.jpg',
          displayOrder: 0,
        },
      ],
    };

    render(<ProductCard product={productWithImageNoAlt} />);

    const image = screen.getByAltText('Test Product');
    expect(image).toHaveAttribute('src', '/image-1.jpg');
  });

  it('should select image with lowest displayOrder even when images are unsorted', () => {
    const productWithUnsortedImages: Product = {
      ...mockProduct,
      images: [
        {
          id: 'img-3',
          url: '/image-3.jpg',
          altTextEn: 'Third Image',
          displayOrder: 2,
        },
        {
          id: 'img-1',
          url: '/image-1.jpg',
          altTextEn: 'Primary Image',
          displayOrder: 0,
        },
        {
          id: 'img-2',
          url: '/image-2.jpg',
          altTextEn: 'Second Image',
          displayOrder: 1,
        },
      ],
    };

    render(<ProductCard product={productWithUnsortedImages} />);

    const image = screen.getByAltText('Primary Image');
    expect(image).toHaveAttribute('src', '/image-1.jpg');
  });

  it('should display "Contact for Price" for zero-price products', () => {
    const zeroPriceProduct: Product = {
      ...mockProduct,
      price: 0,
    };

    render(<ProductCard product={zeroPriceProduct} />);

    expect(screen.getByText('Contact for Price')).toBeInTheDocument();
  });

  it('should not display currency formatting for zero-price products', () => {
    const zeroPriceProduct: Product = {
      ...mockProduct,
      price: 0,
    };

    render(<ProductCard product={zeroPriceProduct} />);

    // Should not contain currency symbols or numeric price
    expect(screen.queryByText(/₫/)).not.toBeInTheDocument();
    expect(screen.queryByText(/0/)).not.toBeInTheDocument();
  });

  it('should display regular price for non-zero price products', () => {
    render(<ProductCard product={mockProduct} />);

    // Should display formatted price
    expect(screen.getByText(/100.000/)).toBeInTheDocument();
  });

  it('should use blue styling for contact-for-price text', () => {
    const zeroPriceProduct: Product = {
      ...mockProduct,
      price: 0,
    };

    render(<ProductCard product={zeroPriceProduct} />);

    const contactText = screen.getByText('Contact for Price');
    expect(contactText).toHaveClass('text-blue-600');
  });
});
