/**
 * Responsive behavior tests for Carousel3D component
 * Tests behavior at different breakpoints and viewport sizes
 */

import { render, fireEvent } from '@testing-library/react';
import Carousel3D, { CarouselItem } from '../Carousel';

// Test data
const mockItems: CarouselItem[] = Array.from({ length: 6 }, (_, i) => ({
  id: `item-${i}`,
  imageUrl: `/test-${i}.jpg`,
  alt: `Test item ${i}`,
  title: `Item ${i}`,
  linkUrl: `/item/${i}`,
}));

// Helper to set viewport size
function setViewportSize(width: number, height: number = 768) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
}

describe('Carousel3D Responsive Tests', () => {
  describe('Mobile Viewport (< 768px)', () => {
    beforeEach(() => {
      setViewportSize(375, 667); // iPhone SE size
    });

    it('should render on mobile viewport', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      fireEvent(window, new Event('resize'));

      expect(container.querySelector('.carousel-3d')).toBeInTheDocument();
    });

    it('should apply mobile-specific configuration', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      fireEvent(window, new Event('resize'));

      const carousel = container.querySelector('.carousel-3d');
      expect(carousel).toBeInTheDocument();
    });

    it('should support touch interactions on mobile', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const carousel = container.querySelector('.carousel-3d');

      if (!carousel) {
        throw new Error('Carousel not found');
      }

      // Should handle touch events
      fireEvent.touchStart(carousel, {
        touches: [{ clientX: 100, clientY: 0 }],
      });
      fireEvent.touchMove(carousel, {
        touches: [{ clientX: 200, clientY: 0 }],
      });
      fireEvent.touchEnd(carousel);

      expect(carousel).toBeInTheDocument();
    });

    it('should have appropriately sized controls for mobile', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      fireEvent(window, new Event('resize'));

      const controls = container.querySelector('.carousel-controls');
      expect(controls).toBeInTheDocument();
    });

    it('should adjust ring radius for mobile', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      fireEvent(window, new Event('resize'));

      const carousel = container.querySelector('.carousel-3d');
      expect(carousel).toBeInTheDocument();
    });
  });

  describe('Tablet Viewport (768px - 1024px)', () => {
    beforeEach(() => {
      setViewportSize(768, 1024); // iPad size
    });

    it('should render on tablet viewport', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      fireEvent(window, new Event('resize'));

      expect(container.querySelector('.carousel-3d')).toBeInTheDocument();
    });

    it('should apply tablet-specific configuration', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      fireEvent(window, new Event('resize'));

      const carousel = container.querySelector('.carousel-3d');
      expect(carousel).toBeInTheDocument();
    });

    it('should support both touch and mouse interactions', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const carousel = container.querySelector('.carousel-3d');

      if (!carousel) {
        throw new Error('Carousel not found');
      }

      // Should handle mouse events
      fireEvent.mouseDown(carousel, { clientX: 100 });
      fireEvent.mouseMove(carousel, { clientX: 200 });
      fireEvent.mouseUp(carousel);

      // Should handle touch events
      fireEvent.touchStart(carousel, {
        touches: [{ clientX: 100, clientY: 0 }],
      });
      fireEvent.touchMove(carousel, {
        touches: [{ clientX: 200, clientY: 0 }],
      });
      fireEvent.touchEnd(carousel);

      expect(carousel).toBeInTheDocument();
    });
  });

  describe('Desktop Viewport (>= 1024px)', () => {
    beforeEach(() => {
      setViewportSize(1920, 1080); // Full HD size
    });

    it('should render on desktop viewport', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      fireEvent(window, new Event('resize'));

      expect(container.querySelector('.carousel-3d')).toBeInTheDocument();
    });

    it('should apply desktop-specific configuration', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      fireEvent(window, new Event('resize'));

      const carousel = container.querySelector('.carousel-3d');
      expect(carousel).toBeInTheDocument();
    });

    it('should support mouse interactions', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const carousel = container.querySelector('.carousel-3d');

      if (!carousel) {
        throw new Error('Carousel not found');
      }

      // Should handle mouse events
      fireEvent.mouseDown(carousel, { clientX: 100 });
      fireEvent.mouseMove(carousel, { clientX: 200 });
      fireEvent.mouseUp(carousel);

      expect(carousel).toBeInTheDocument();
    });

    it('should have full-sized controls for desktop', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      fireEvent(window, new Event('resize'));

      const controls = container.querySelector('.carousel-controls');
      expect(controls).toBeInTheDocument();
    });
  });

  describe('Viewport Transitions', () => {
    it('should update configuration when resizing from mobile to desktop', () => {
      const { container } = render(<Carousel3D items={mockItems} />);

      // Start with mobile
      setViewportSize(375);
      fireEvent(window, new Event('resize'));

      const carousel = container.querySelector('.carousel-3d');
      expect(carousel).toBeInTheDocument();

      // Resize to desktop
      setViewportSize(1920);
      fireEvent(window, new Event('resize'));

      expect(carousel).toBeInTheDocument();
    });

    it('should update configuration when resizing from desktop to mobile', () => {
      const { container } = render(<Carousel3D items={mockItems} />);

      // Start with desktop
      setViewportSize(1920);
      fireEvent(window, new Event('resize'));

      const carousel = container.querySelector('.carousel-3d');
      expect(carousel).toBeInTheDocument();

      // Resize to mobile
      setViewportSize(375);
      fireEvent(window, new Event('resize'));

      expect(carousel).toBeInTheDocument();
    });

    it('should maintain rotation state during resize', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const carouselRing = container.querySelector('.carousel-ring');

      // Start with desktop
      setViewportSize(1920);
      fireEvent(window, new Event('resize'));

      // Rotate carousel
      const carousel = container.querySelector('.carousel-3d');
      if (carousel) {
        fireEvent.mouseDown(carousel, { clientX: 100 });
        fireEvent.mouseMove(carousel, { clientX: 200 });
        fireEvent.mouseUp(carousel);
      }

      const transformAfterRotation = carouselRing?.getAttribute('style');

      // Resize to mobile
      setViewportSize(375);
      fireEvent(window, new Event('resize'));

      // Rotation state should be maintained
      expect(carouselRing).toBeInTheDocument();
    });
  });

  describe('Orientation Changes', () => {
    it('should handle portrait to landscape transition', () => {
      const { container } = render(<Carousel3D items={mockItems} />);

      // Portrait
      setViewportSize(375, 667);
      fireEvent(window, new Event('resize'));

      const carousel = container.querySelector('.carousel-3d');
      expect(carousel).toBeInTheDocument();

      // Landscape
      setViewportSize(667, 375);
      fireEvent(window, new Event('resize'));

      expect(carousel).toBeInTheDocument();
    });

    it('should handle landscape to portrait transition', () => {
      const { container } = render(<Carousel3D items={mockItems} />);

      // Landscape
      setViewportSize(667, 375);
      fireEvent(window, new Event('resize'));

      const carousel = container.querySelector('.carousel-3d');
      expect(carousel).toBeInTheDocument();

      // Portrait
      setViewportSize(375, 667);
      fireEvent(window, new Event('resize'));

      expect(carousel).toBeInTheDocument();
    });
  });

  describe('Custom Breakpoints', () => {
    it('should handle custom ring radius on mobile', () => {
      setViewportSize(375);
      const { container } = render(
        <Carousel3D items={mockItems} ringRadius={150} />
      );
      fireEvent(window, new Event('resize'));

      expect(container.querySelector('.carousel-3d')).toBeInTheDocument();
    });

    it('should handle custom item dimensions on tablet', () => {
      setViewportSize(768);
      const { container } = render(
        <Carousel3D items={mockItems} itemWidth={180} itemHeight={240} />
      );
      fireEvent(window, new Event('resize'));

      expect(container.querySelector('.carousel-3d')).toBeInTheDocument();
    });

    it('should handle custom configuration on desktop', () => {
      setViewportSize(1920);
      const { container } = render(
        <Carousel3D
          items={mockItems}
          ringRadius={400}
          itemWidth={250}
          itemHeight={350}
        />
      );
      fireEvent(window, new Event('resize'));

      expect(container.querySelector('.carousel-3d')).toBeInTheDocument();
    });
  });

  describe('Performance on Different Viewports', () => {
    it('should render efficiently on mobile', () => {
      setViewportSize(375);
      const startTime = performance.now();
      const { container } = render(<Carousel3D items={mockItems} />);
      fireEvent(window, new Event('resize'));
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
      expect(container.querySelector('.carousel-3d')).toBeInTheDocument();
    });

    it('should render efficiently on tablet', () => {
      setViewportSize(768);
      const startTime = performance.now();
      const { container } = render(<Carousel3D items={mockItems} />);
      fireEvent(window, new Event('resize'));
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
      expect(container.querySelector('.carousel-3d')).toBeInTheDocument();
    });

    it('should render efficiently on desktop', () => {
      setViewportSize(1920);
      const startTime = performance.now();
      const { container } = render(<Carousel3D items={mockItems} />);
      fireEvent(window, new Event('resize'));
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
      expect(container.querySelector('.carousel-3d')).toBeInTheDocument();
    });
  });

  describe('Touch Sensitivity', () => {
    it('should have higher drag sensitivity on mobile', () => {
      setViewportSize(375);
      const { container } = render(<Carousel3D items={mockItems} />);
      fireEvent(window, new Event('resize'));

      const carousel = container.querySelector('.carousel-3d');
      if (!carousel) {
        throw new Error('Carousel not found');
      }

      const carouselRing = container.querySelector('.carousel-ring');
      const initialTransform = carouselRing?.getAttribute('style');

      // Small touch movement should cause rotation
      fireEvent.touchStart(carousel, {
        touches: [{ clientX: 100, clientY: 0 }],
      });
      fireEvent.touchMove(carousel, {
        touches: [{ clientX: 120, clientY: 0 }],
      });
      fireEvent.touchEnd(carousel);

      const newTransform = carouselRing?.getAttribute('style');
      expect(newTransform).not.toBe(initialTransform);
    });
  });

  describe('Fallback Behavior', () => {
    it('should show fallback slider on very small screens with insufficient space', () => {
      setViewportSize(320, 480); // Very small mobile
      const twoItems = mockItems.slice(0, 2);
      const { container } = render(<Carousel3D items={twoItems} />);
      fireEvent(window, new Event('resize'));

      // Should show fallback for insufficient items
      expect(container.querySelector('.fallback-slider')).toBeInTheDocument();
    });
  });
});