/**
 * Performance tests for Carousel3D component
 * Tests rendering and interaction performance with maximum item count
 */

import { render, screen } from '@testing-library/react';
import Carousel3D, { CarouselItem } from '../Carousel';

// Generate test items
function generateTestItems(count: number): CarouselItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `item-${i}`,
    imageUrl: `/test-image-${i}.jpg`,
    alt: `Test item ${i}`,
    title: `Item ${i}`,
    linkUrl: `/item/${i}`,
  }));
}

describe('Carousel3D Performance', () => {
  it('should render with maximum item count (12 items)', () => {
    const items = generateTestItems(12);
    const { container } = render(<Carousel3D items={items} />);

    // Verify all items are rendered
    const carouselItems = container.querySelectorAll('.carousel-item');
    expect(carouselItems).toHaveLength(12);
  });

  it('should render with minimum item count (3 items)', () => {
    const items = generateTestItems(3);
    const { container } = render(<Carousel3D items={items} />);

    // Verify all items are rendered
    const carouselItems = container.querySelectorAll('.carousel-item');
    expect(carouselItems).toHaveLength(3);
  });

  it('should apply will-change CSS property for hardware acceleration', () => {
    const items = generateTestItems(6);
    const { container } = render(<Carousel3D items={items} />);

    // Check carousel ring has will-change
    const carouselRing = container.querySelector('.carousel-ring');
    expect(carouselRing).toHaveStyle({ willChange: 'transform' });

    // Check carousel items have will-change
    const carouselItems = container.querySelectorAll('.carousel-item');
    carouselItems.forEach(item => {
      expect(item).toHaveStyle({ willChange: 'transform, opacity' });
    });
  });

  it('should use lazy loading for non-focused images', () => {
    const items = generateTestItems(6);
    const { container } = render(<Carousel3D items={items} />);

    // Get all images
    const images = container.querySelectorAll('img');

    // At least one image should have lazy loading
    const lazyImages = Array.from(images).filter(img =>
      img.getAttribute('loading') === 'lazy'
    );

    expect(lazyImages.length).toBeGreaterThan(0);
  });

  it('should render efficiently with large item count', () => {
    const items = generateTestItems(12);

    // Measure render time
    const startTime = performance.now();
    const { container } = render(<Carousel3D items={items} />);
    const endTime = performance.now();

    const renderTime = endTime - startTime;

    // Verify render completes in reasonable time (< 100ms)
    expect(renderTime).toBeLessThan(100);

    // Verify all items rendered
    const carouselItems = container.querySelectorAll('.carousel-item');
    expect(carouselItems).toHaveLength(12);
  });

  it('should handle empty items array gracefully', () => {
    const { container } = render(<Carousel3D items={[]} />);

    // Should show empty state message
    expect(container.querySelector('.carousel-3d-empty')).toBeInTheDocument();
  });

  it('should use fallback slider for insufficient items', () => {
    const items = generateTestItems(2);
    const { container } = render(<Carousel3D items={items} />);

    // Should render fallback slider instead of 3D carousel
    expect(container.querySelector('.fallback-slider')).toBeInTheDocument();
  });
});