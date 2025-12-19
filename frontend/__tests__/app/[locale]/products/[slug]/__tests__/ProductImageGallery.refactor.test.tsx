/**
 * ProductImageGallery Refactor Verification Tests
 * Tests to verify the refactored component maintains backward compatibility
 */

import { render, screen, fireEvent } from '@testing-library/react';
import ProductImageGallery from '../../../../../../app/[locale]/products/[slug]/ProductImageGallery';
import { ProductImage } from '@/lib/product-api';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock next-intl
jest.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string, params?: any) => {
    const translations: Record<string, string> = {
      'defaultAriaLabel': 'Image carousel',
      'imageAnnouncement': `Image ${params?.current} of ${params?.total}`,
      'previousButton': 'Previous image',
      'nextButton': 'Next image',
      'thumbnailLabel': 'Go to image',
      'imageLoadError': 'Unable to load image',
      'loading': 'Loading',
    };
    return translations[key] || key;
  },
}));

const mockImages: ProductImage[] = [
  {
    id: '1',
    url: '/test-image-1.jpg',
    altTextEn: 'Test Image 1',
    altTextVi: 'Hình ảnh thử nghiệm 1',
    displayOrder: 0,
    isPrimary: true,
  },
  {
    id: '2',
    url: '/test-image-2.jpg',
    altTextEn: 'Test Image 2',
    altTextVi: 'Hình ảnh thử nghiệm 2',
    displayOrder: 1,
    isPrimary: false,
  },
  {
    id: '3',
    url: '/test-image-3.jpg',
    altTextEn: 'Test Image 3',
    altTextVi: 'Hình ảnh thử nghiệm 3',
    displayOrder: 2,
    isPrimary: false,
  },
];

describe('ProductImageGallery - Refactor Verification', () => {
  it('should render with the new Carousel component', () => {
    render(
      <ProductImageGallery images={mockImages} productName="Test Product" />
    );

    // Should render the carousel
    const carousel = screen.getByLabelText('Test Product image gallery');
    expect(carousel).toBeInTheDocument();
  });

  it('should show thumbnails when multiple images are provided', () => {
    render(
      <ProductImageGallery images={mockImages} productName="Test Product" />
    );

    // Should have thumbnail buttons (multiple)
    const thumbnails = screen.getAllByRole('button', { name: /Go to image/i });
    expect(thumbnails.length).toBe(3); // One for each image
  });

  it('should show navigation controls', () => {
    render(
      <ProductImageGallery images={mockImages} productName="Test Product" />
    );

    // Should have previous and next buttons
    const prevButton = screen.getByLabelText('Previous image');
    const nextButton = screen.getByLabelText('Next image');

    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();
  });

  it('should support zoom functionality (product-specific feature)', () => {
    render(
      <ProductImageGallery images={mockImages} productName="Test Product" />
    );

    // Find the wrapper div that has the zoom classes
    const zoomWrapper = screen.getByLabelText('Test Product image gallery').parentElement;

    // Should have zoom cursor classes
    expect(zoomWrapper?.className).toContain('cursor-zoom-in');

    // Click on the carousel main area to zoom
    const carouselMain = screen.getByLabelText('Test Product image gallery').querySelector('.carousel-main');
    if (carouselMain) {
      fireEvent.click(carouselMain);
    }

    // Should change to zoom-out cursor after click
    expect(zoomWrapper?.className).toContain('cursor-zoom-out');
    expect(zoomWrapper?.className).toContain('scale-150');
  });

  it('should accept auto-advance configuration props', () => {
    const { rerender } = render(
      <ProductImageGallery
        images={mockImages}
        productName="Test Product"
        autoAdvance={true}
        autoAdvanceInterval={5000}
        transitionDuration={300}
      />
    );

    // Component should render without errors
    expect(screen.getByLabelText('Test Product image gallery')).toBeInTheDocument();

    // Should also work with auto-advance disabled
    rerender(
      <ProductImageGallery
        images={mockImages}
        productName="Test Product"
        autoAdvance={false}
      />
    );

    expect(screen.getByLabelText('Test Product image gallery')).toBeInTheDocument();
  });

  it('should handle empty images array', () => {
    render(
      <ProductImageGallery images={[]} productName="Test Product" />
    );

    // Should show placeholder
    expect(screen.getByText('No image available')).toBeInTheDocument();
  });

  it('should transform ProductImage to CarouselImage format', () => {
    render(
      <ProductImageGallery images={mockImages} productName="Test Product" />
    );

    // Should render images with correct alt text (may appear multiple times in main + thumbnails)
    const images = screen.getAllByAltText('Test Image 1');
    expect(images.length).toBeGreaterThan(0);
  });

  it('should use product name as fallback for alt text', () => {
    const imagesWithoutAlt: ProductImage[] = [
      {
        id: '1',
        url: '/test-image-1.jpg',
        altTextEn: '',
        altTextVi: '',
        displayOrder: 0,
        isPrimary: true,
      },
    ];

    render(
      <ProductImageGallery images={imagesWithoutAlt} productName="Test Product" />
    );

    // Should use product name as fallback (single image, no thumbnails)
    const image = screen.getByAltText('Test Product');
    expect(image).toBeInTheDocument();
  });

  it('should maintain backward compatibility with locale prop', () => {
    render(
      <ProductImageGallery
        images={mockImages}
        productName="Test Product"
        locale="vi"
      />
    );

    // Component should render without errors
    expect(screen.getByLabelText('Test Product image gallery')).toBeInTheDocument();
  });
});
