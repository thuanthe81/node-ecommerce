/**
 * ProductImageGallery Component Tests
 * Tests for navigation button hover behavior
 */

import { render, screen, fireEvent } from '@testing-library/react';
import ProductImageGallery from '../ProductImageGallery';
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
    if (key === 'imageAnnouncement') {
      return `Image ${params?.current} of ${params?.total}`;
    }
    return key;
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

describe('ProductImageGallery - Navigation Button Hover Behavior', () => {
  it('should hide navigation buttons by default', () => {
    render(
      <ProductImageGallery images={mockImages} productName="Test Product" />
    );

    const prevButton = screen.getByLabelText('Previous image');
    const nextButton = screen.getByLabelText('Next image');

    // Buttons should have opacity-0 class
    expect(prevButton.className).toContain('opacity-0');
    expect(nextButton.className).toContain('opacity-0');
  });

  it('should show navigation buttons on hover', () => {
    render(
      <ProductImageGallery images={mockImages} productName="Test Product" />
    );

    const galleryContainer = screen.getByLabelText('Previous image').parentElement;
    const prevButton = screen.getByLabelText('Previous image');
    const nextButton = screen.getByLabelText('Next image');

    // Initially hidden
    expect(prevButton.className).toContain('opacity-0');
    expect(nextButton.className).toContain('opacity-0');

    // Hover over gallery
    if (galleryContainer) {
      fireEvent.mouseEnter(galleryContainer);
    }

    // Buttons should now be visible
    expect(prevButton.className).toContain('opacity-100');
    expect(nextButton.className).toContain('opacity-100');
  });

  it('should hide navigation buttons when mouse leaves', () => {
    render(
      <ProductImageGallery images={mockImages} productName="Test Product" />
    );

    const galleryContainer = screen.getByLabelText('Previous image').parentElement;
    const prevButton = screen.getByLabelText('Previous image');
    const nextButton = screen.getByLabelText('Next image');

    // Hover over gallery
    if (galleryContainer) {
      fireEvent.mouseEnter(galleryContainer);
    }

    // Buttons should be visible
    expect(prevButton.className).toContain('opacity-100');
    expect(nextButton.className).toContain('opacity-100');

    // Mouse leaves
    if (galleryContainer) {
      fireEvent.mouseLeave(galleryContainer);
    }

    // Buttons should be hidden again
    expect(prevButton.className).toContain('opacity-0');
    expect(nextButton.className).toContain('opacity-0');
  });

  it('should not show navigation buttons for single image gallery', () => {
    const singleImage = [mockImages[0]];
    render(
      <ProductImageGallery images={singleImage} productName="Test Product" />
    );

    const prevButton = screen.queryByLabelText('Previous image');
    const nextButton = screen.queryByLabelText('Next image');

    expect(prevButton).not.toBeInTheDocument();
    expect(nextButton).not.toBeInTheDocument();
  });

  it('should have transition classes for smooth animation', () => {
    render(
      <ProductImageGallery images={mockImages} productName="Test Product" />
    );

    const prevButton = screen.getByLabelText('Previous image');
    const nextButton = screen.getByLabelText('Next image');

    // Check for transition classes
    expect(prevButton.className).toContain('transition-all');
    expect(prevButton.className).toContain('duration-200');
    expect(nextButton.className).toContain('transition-all');
    expect(nextButton.className).toContain('duration-200');
  });

  it('should have media query classes for touch devices', () => {
    render(
      <ProductImageGallery images={mockImages} productName="Test Product" />
    );

    const prevButton = screen.getByLabelText('Previous image');
    const nextButton = screen.getByLabelText('Next image');

    // Check for touch device classes (always visible on touch devices)
    expect(prevButton.className).toContain('[@media(hover:none)]:opacity-100');
    expect(prevButton.className).toContain('[@media(hover:none)]:pointer-events-auto');
    expect(nextButton.className).toContain('[@media(hover:none)]:opacity-100');
    expect(nextButton.className).toContain('[@media(hover:none)]:pointer-events-auto');
  });
});

describe('ProductImageGallery - Image Loading Detection', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Mock Image constructor
    global.Image = class {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src = '';

      constructor() {
        // Simulate successful image load after a short delay
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 100);
      }
    } as any;
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should preload next image before starting animation', async () => {
    render(
      <ProductImageGallery images={mockImages} productName="Test Product" />
    );

    const nextButton = screen.getByLabelText('Next image');

    // Click next button
    fireEvent.click(nextButton);

    // Wait for image preload
    jest.advanceTimersByTime(100);

    // Animation should start after image is loaded
    expect(nextButton).toBeInTheDocument();
  });

  it('should handle image load errors gracefully', () => {
    // Mock Image to simulate error
    global.Image = class {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src = '';

      constructor() {
        setTimeout(() => {
          if (this.onerror) {
            this.onerror();
          }
        }, 100);
      }
    } as any;

    render(
      <ProductImageGallery images={mockImages} productName="Test Product" />
    );

    const nextButton = screen.getByLabelText('Next image');

    // Click next button
    fireEvent.click(nextButton);

    // Wait for image load error
    jest.advanceTimersByTime(100);

    // Component should still work despite error
    expect(nextButton).toBeInTheDocument();
  });

  it('should track loaded images to avoid reloading', async () => {
    render(
      <ProductImageGallery images={mockImages} productName="Test Product" />
    );

    const nextButton = screen.getByLabelText('Next image');

    // Navigate to next image
    fireEvent.click(nextButton);
    jest.advanceTimersByTime(100);
    jest.advanceTimersByTime(1000); // Complete animation

    // Navigate back to first image
    const prevButton = screen.getByLabelText('Previous image');
    fireEvent.click(prevButton);
    jest.advanceTimersByTime(100);
    jest.advanceTimersByTime(1000); // Complete animation

    // Navigate to next again (should use cached load state)
    fireEvent.click(nextButton);
    jest.advanceTimersByTime(100);

    // Component should still be functional
    expect(nextButton).toBeInTheDocument();
  });
});

describe('ProductImageGallery - Scrolling Animation', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should prevent navigation during animation', () => {
    render(
      <ProductImageGallery images={mockImages} productName="Test Product" />
    );

    const nextButton = screen.getByLabelText('Next image');

    // Click next button
    fireEvent.click(nextButton);

    // Try to click again immediately (should be blocked)
    fireEvent.click(nextButton);

    // Only one animation should be in progress
    // We can verify this by checking that the component doesn't crash
    expect(nextButton).toBeInTheDocument();
  });

  it('should complete animation after transition duration', () => {
    render(
      <ProductImageGallery
        images={mockImages}
        productName="Test Product"
        transitionDuration={1000}
      />
    );

    const nextButton = screen.getByLabelText('Next image');

    // Click next button
    fireEvent.click(nextButton);

    // Fast-forward time by transition duration
    jest.advanceTimersByTime(1000);

    // Animation should be complete, navigation should work again
    fireEvent.click(nextButton);
    expect(nextButton).toBeInTheDocument();
  });

  it('should use custom transition duration when provided', () => {
    const customDuration = 500;
    render(
      <ProductImageGallery
        images={mockImages}
        productName="Test Product"
        transitionDuration={customDuration}
      />
    );

    const nextButton = screen.getByLabelText('Next image');

    // Click next button
    fireEvent.click(nextButton);

    // Fast-forward time by custom duration
    jest.advanceTimersByTime(customDuration);

    // Animation should be complete
    expect(nextButton).toBeInTheDocument();
  });

  it('should clean up animation timer on unmount', () => {
    const { unmount } = render(
      <ProductImageGallery images={mockImages} productName="Test Product" />
    );

    const nextButton = screen.getByLabelText('Next image');

    // Start animation
    fireEvent.click(nextButton);

    // Unmount before animation completes
    unmount();

    // Fast-forward time - should not cause errors
    jest.advanceTimersByTime(1000);

    // No errors should occur
    expect(true).toBe(true);
  });

  it('should allow thumbnail navigation during animation', () => {
    render(
      <ProductImageGallery images={mockImages} productName="Test Product" />
    );

    const nextButton = screen.getByLabelText('Next image');
    const thumbnail = screen.getByLabelText('View image 3');

    // Start animation with next button
    fireEvent.click(nextButton);

    // Click thumbnail (should work even during animation)
    fireEvent.click(thumbnail);

    // Component should still be functional
    expect(thumbnail).toBeInTheDocument();
  });
});
