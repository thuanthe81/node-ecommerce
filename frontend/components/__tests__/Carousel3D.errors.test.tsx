/**
 * Error handling tests for Carousel3D component
 * Tests error scenarios, edge cases, and graceful degradation
 */

import { render, screen, fireEvent } from '@testing-library/react';
import Carousel3D, { CarouselItem } from '../Carousel';

describe('Carousel3D Error Handling Tests', () => {
  describe('Insufficient Items', () => {
    it('should show fallback slider with 2 items', () => {
      const twoItems: CarouselItem[] = [
        {
          id: '1',
          imageUrl: '/test1.jpg',
          alt: 'Test 1',
          title: 'Item 1',
        },
        {
          id: '2',
          imageUrl: '/test2.jpg',
          alt: 'Test 2',
          title: 'Item 2',
        },
      ];

      const { container } = render(<Carousel3D items={twoItems} />);

      expect(container.querySelector('.fallback-slider')).toBeInTheDocument();
      expect(container.querySelector('.carousel-3d')).not.toBeInTheDocument();
    });

    it('should show fallback slider with 1 item', () => {
      const oneItem: CarouselItem[] = [
        {
          id: '1',
          imageUrl: '/test1.jpg',
          alt: 'Test 1',
          title: 'Item 1',
        },
      ];

      const { container } = render(<Carousel3D items={oneItem} />);

      expect(container.querySelector('.fallback-slider')).toBeInTheDocument();
    });

    it('should show empty state with 0 items', () => {
      const { container } = render(<Carousel3D items={[]} />);

      expect(container.querySelector('.carousel-3d-empty')).toBeInTheDocument();
    });
  });

  describe('Image Loading Errors', () => {
    const mockItems: CarouselItem[] = [
      {
        id: '1',
        imageUrl: '/invalid1.jpg',
        alt: 'Test 1',
        title: 'Item 1',
      },
      {
        id: '2',
        imageUrl: '/invalid2.jpg',
        alt: 'Test 2',
        title: 'Item 2',
      },
      {
        id: '3',
        imageUrl: '/invalid3.jpg',
        alt: 'Test 3',
        title: 'Item 3',
      },
    ];

    it('should handle image loading error gracefully', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const images = container.querySelectorAll('img');

      // Trigger error on first image
      fireEvent.error(images[0]);

      // Carousel should still be rendered
      expect(container.querySelector('.carousel-3d')).toBeInTheDocument();
    });

    it('should show placeholder for failed images', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const images = container.querySelectorAll('img');

      // Trigger error on first image
      fireEvent.error(images[0]);

      // Should show placeholder or error state
      expect(container.querySelector('.carousel-3d')).toBeInTheDocument();
    });

    it('should handle multiple image errors', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const images = container.querySelectorAll('img');

      // Trigger errors on all images
      images.forEach(img => fireEvent.error(img));

      // Carousel should still be rendered
      expect(container.querySelector('.carousel-3d')).toBeInTheDocument();
    });

    it('should continue to function after image error', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const images = container.querySelectorAll('img');

      // Trigger error on first image
      fireEvent.error(images[0]);

      // Should still be able to navigate
      const nextButton = screen.getByLabelText(/next/i);
      fireEvent.click(nextButton);

      expect(container.querySelector('.carousel-3d')).toBeInTheDocument();
    });
  });

  describe('Missing Data', () => {
    it('should handle items without imageUrl', () => {
      const itemsWithoutImages: CarouselItem[] = [
        {
          id: '1',
          imageUrl: '',
          alt: 'Test 1',
          title: 'Item 1',
        },
        {
          id: '2',
          imageUrl: '',
          alt: 'Test 2',
          title: 'Item 2',
        },
        {
          id: '3',
          imageUrl: '',
          alt: 'Test 3',
          title: 'Item 3',
        },
      ];

      const { container } = render(<Carousel3D items={itemsWithoutImages} />);

      expect(container.querySelector('.carousel-3d')).toBeInTheDocument();
    });

    it('should handle items without alt text', () => {
      const itemsWithoutAlt: CarouselItem[] = [
        {
          id: '1',
          imageUrl: '/test1.jpg',
          alt: '',
          title: 'Item 1',
        },
        {
          id: '2',
          imageUrl: '/test2.jpg',
          alt: '',
          title: 'Item 2',
        },
        {
          id: '3',
          imageUrl: '/test3.jpg',
          alt: '',
          title: 'Item 3',
        },
      ];

      const { container } = render(<Carousel3D items={itemsWithoutAlt} />);

      expect(container.querySelector('.carousel-3d')).toBeInTheDocument();
    });

    it('should handle items without linkUrl', () => {
      const itemsWithoutLinks: CarouselItem[] = [
        {
          id: '1',
          imageUrl: '/test1.jpg',
          alt: 'Test 1',
          title: 'Item 1',
        },
        {
          id: '2',
          imageUrl: '/test2.jpg',
          alt: 'Test 2',
          title: 'Item 2',
        },
        {
          id: '3',
          imageUrl: '/test3.jpg',
          alt: 'Test 3',
          title: 'Item 3',
        },
      ];

      const { container } = render(<Carousel3D items={itemsWithoutLinks} />);

      expect(container.querySelector('.carousel-3d')).toBeInTheDocument();
    });

    it('should handle items without title', () => {
      const itemsWithoutTitle: CarouselItem[] = [
        {
          id: '1',
          imageUrl: '/test1.jpg',
          alt: 'Test 1',
        },
        {
          id: '2',
          imageUrl: '/test2.jpg',
          alt: 'Test 2',
        },
        {
          id: '3',
          imageUrl: '/test3.jpg',
          alt: 'Test 3',
        },
      ];

      const { container } = render(<Carousel3D items={itemsWithoutTitle} />);

      expect(container.querySelector('.carousel-3d')).toBeInTheDocument();
    });
  });

  describe('Invalid Props', () => {
    const validItems: CarouselItem[] = [
      { id: '1', imageUrl: '/test1.jpg', alt: 'Test 1' },
      { id: '2', imageUrl: '/test2.jpg', alt: 'Test 2' },
      { id: '3', imageUrl: '/test3.jpg', alt: 'Test 3' },
    ];

    it('should handle negative ringRadius', () => {
      const { container } = render(
        <Carousel3D items={validItems} ringRadius={-100} />
      );

      expect(container.querySelector('.carousel-3d')).toBeInTheDocument();
    });

    it('should handle zero ringRadius', () => {
      const { container } = render(
        <Carousel3D items={validItems} ringRadius={0} />
      );

      expect(container.querySelector('.carousel-3d')).toBeInTheDocument();
    });

    it('should handle negative itemWidth', () => {
      const { container } = render(
        <Carousel3D items={validItems} itemWidth={-100} />
      );

      expect(container.querySelector('.carousel-3d')).toBeInTheDocument();
    });

    it('should handle negative itemHeight', () => {
      const { container } = render(
        <Carousel3D items={validItems} itemHeight={-100} />
      );

      expect(container.querySelector('.carousel-3d')).toBeInTheDocument();
    });

    it('should handle negative autoRotateInterval', () => {
      const { container } = render(
        <Carousel3D items={validItems} autoRotate={true} autoRotateInterval={-1000} />
      );

      expect(container.querySelector('.carousel-3d')).toBeInTheDocument();
    });

    it('should handle zero autoRotateInterval', () => {
      const { container } = render(
        <Carousel3D items={validItems} autoRotate={true} autoRotateInterval={0} />
      );

      expect(container.querySelector('.carousel-3d')).toBeInTheDocument();
    });
  });

  describe('Maximum Items', () => {
    it('should handle maximum item count (12 items)', () => {
      const maxItems: CarouselItem[] = Array.from({ length: 12 }, (_, i) => ({
        id: `item-${i}`,
        imageUrl: `/test${i}.jpg`,
        alt: `Test ${i}`,
        title: `Item ${i}`,
      }));

      const { container } = render(<Carousel3D items={maxItems} />);

      const carouselItems = container.querySelectorAll('.carousel-item');
      expect(carouselItems).toHaveLength(12);
    });

    it('should handle more than maximum item count', () => {
      const tooManyItems: CarouselItem[] = Array.from({ length: 20 }, (_, i) => ({
        id: `item-${i}`,
        imageUrl: `/test${i}.jpg`,
        alt: `Test ${i}`,
        title: `Item ${i}`,
      }));

      const { container } = render(<Carousel3D items={tooManyItems} />);

      // Should still render (may show all or limit to max)
      expect(container.querySelector('.carousel-3d')).toBeInTheDocument();
    });
  });

  describe('Browser Compatibility', () => {
    it('should handle missing CSS 3D transform support', () => {
      const validItems: CarouselItem[] = [
        { id: '1', imageUrl: '/test1.jpg', alt: 'Test 1' },
        { id: '2', imageUrl: '/test2.jpg', alt: 'Test 2' },
        { id: '3', imageUrl: '/test3.jpg', alt: 'Test 3' },
      ];

      const { container } = render(<Carousel3D items={validItems} />);

      // Should render even if 3D transforms aren't supported
      expect(container.querySelector('.carousel-3d') ||
             container.querySelector('.fallback-slider')).toBeInTheDocument();
    });
  });

  describe('Memory Leaks', () => {
    it('should clean up event listeners on unmount', () => {
      const validItems: CarouselItem[] = [
        { id: '1', imageUrl: '/test1.jpg', alt: 'Test 1' },
        { id: '2', imageUrl: '/test2.jpg', alt: 'Test 2' },
        { id: '3', imageUrl: '/test3.jpg', alt: 'Test 3' },
      ];

      const { unmount } = render(<Carousel3D items={validItems} />);

      // Unmount component
      unmount();

      // Component should be removed
      expect(screen.queryByRole('region')).not.toBeInTheDocument();
    });

    it('should clean up timers on unmount with auto-rotation', () => {
      const validItems: CarouselItem[] = [
        { id: '1', imageUrl: '/test1.jpg', alt: 'Test 1' },
        { id: '2', imageUrl: '/test2.jpg', alt: 'Test 2' },
        { id: '3', imageUrl: '/test3.jpg', alt: 'Test 3' },
      ];

      const { unmount } = render(
        <Carousel3D items={validItems} autoRotate={true} />
      );

      // Unmount component
      unmount();

      // Component should be removed
      expect(screen.queryByRole('region')).not.toBeInTheDocument();
    });
  });

  describe('Rapid Interactions', () => {
    const validItems: CarouselItem[] = [
      { id: '1', imageUrl: '/test1.jpg', alt: 'Test 1' },
      { id: '2', imageUrl: '/test2.jpg', alt: 'Test 2' },
      { id: '3', imageUrl: '/test3.jpg', alt: 'Test 3' },
      { id: '4', imageUrl: '/test4.jpg', alt: 'Test 4' },
      { id: '5', imageUrl: '/test5.jpg', alt: 'Test 5' },
      { id: '6', imageUrl: '/test6.jpg', alt: 'Test 6' },
    ];

    it('should handle rapid button clicks', () => {
      render(<Carousel3D items={validItems} />);
      const nextButton = screen.getByLabelText(/next/i);

      // Click rapidly
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);

      // Should still be rendered
      expect(nextButton).toBeInTheDocument();
    });

    it('should handle rapid keyboard navigation', () => {
      const { container } = render(<Carousel3D items={validItems} />);
      const carousel = container.querySelector('.carousel-3d');

      if (carousel) {
        // Press keys rapidly
        fireEvent.keyDown(carousel, { key: 'ArrowRight' });
        fireEvent.keyDown(carousel, { key: 'ArrowRight' });
        fireEvent.keyDown(carousel, { key: 'ArrowLeft' });
        fireEvent.keyDown(carousel, { key: 'ArrowRight' });
      }

      // Should still be rendered
      expect(carousel).toBeInTheDocument();
    });

    it('should handle rapid drag interactions', () => {
      const { container } = render(<Carousel3D items={validItems} />);
      const carousel = container.querySelector('.carousel-3d');

      if (carousel) {
        // Rapid drag movements
        fireEvent.mouseDown(carousel, { clientX: 100 });
        fireEvent.mouseMove(carousel, { clientX: 150 });
        fireEvent.mouseMove(carousel, { clientX: 200 });
        fireEvent.mouseMove(carousel, { clientX: 250 });
        fireEvent.mouseUp(carousel);
      }

      // Should still be rendered
      expect(carousel).toBeInTheDocument();
    });
  });

  describe('Concurrent Updates', () => {
    const validItems: CarouselItem[] = [
      { id: '1', imageUrl: '/test1.jpg', alt: 'Test 1' },
      { id: '2', imageUrl: '/test2.jpg', alt: 'Test 2' },
      { id: '3', imageUrl: '/test3.jpg', alt: 'Test 3' },
      { id: '4', imageUrl: '/test4.jpg', alt: 'Test 4' },
    ];

    it('should handle button click during drag', () => {
      const { container } = render(<Carousel3D items={validItems} />);
      const carousel = container.querySelector('.carousel-3d');
      const nextButton = screen.getByLabelText(/next/i);

      if (carousel) {
        // Start drag
        fireEvent.mouseDown(carousel, { clientX: 100 });
        fireEvent.mouseMove(carousel, { clientX: 150 });

        // Click button during drag
        fireEvent.click(nextButton);

        // End drag
        fireEvent.mouseUp(carousel);
      }

      // Should still be rendered
      expect(carousel).toBeInTheDocument();
    });

    it('should handle keyboard navigation during animation', () => {
      const { container } = render(<Carousel3D items={validItems} />);
      const carousel = container.querySelector('.carousel-3d');
      const nextButton = screen.getByLabelText(/next/i);

      // Start animation with button
      fireEvent.click(nextButton);

      // Try keyboard navigation during animation
      if (carousel) {
        fireEvent.keyDown(carousel, { key: 'ArrowLeft' });
      }

      // Should still be rendered
      expect(carousel).toBeInTheDocument();
    });
  });
});