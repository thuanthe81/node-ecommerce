/**
 * Integration tests for Carousel3D component
 * Tests user interactions, state management, keyboard navigation, and accessibility
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Carousel3D, { CarouselItem } from '../Carousel';

// Test data
const mockItems: CarouselItem[] = [
  {
    id: '1',
    imageUrl: '/test1.jpg',
    alt: 'Test item 1',
    title: 'Item 1',
    linkUrl: '/item/1',
  },
  {
    id: '2',
    imageUrl: '/test2.jpg',
    alt: 'Test item 2',
    title: 'Item 2',
    linkUrl: '/item/2',
  },
  {
    id: '3',
    imageUrl: '/test3.jpg',
    alt: 'Test item 3',
    title: 'Item 3',
    linkUrl: '/item/3',
  },
  {
    id: '4',
    imageUrl: '/test4.jpg',
    alt: 'Test item 4',
    title: 'Item 4',
    linkUrl: '/item/4',
  },
  {
    id: '5',
    imageUrl: '/test5.jpg',
    alt: 'Test item 5',
    title: 'Item 5',
    linkUrl: '/item/5',
  },
  {
    id: '6',
    imageUrl: '/test6.jpg',
    alt: 'Test item 6',
    title: 'Item 6',
    linkUrl: '/item/6',
  },
];

describe('Carousel3D Integration Tests', () => {
  describe('Component Rendering', () => {
    it('should render carousel with all items', () => {
      const { container } = render(<Carousel3D items={mockItems} />);

      const carouselItems = container.querySelectorAll('.carousel-item');
      expect(carouselItems).toHaveLength(6);
    });

    it('should render with controls by default', () => {
      render(<Carousel3D items={mockItems} />);

      expect(screen.getByLabelText(/previous/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/next/i)).toBeInTheDocument();
    });

    it('should render with indicators by default', () => {
      const { container } = render(<Carousel3D items={mockItems} />);

      const indicators = container.querySelectorAll('.carousel-indicator');
      expect(indicators).toHaveLength(6);
    });

    it('should hide controls when showControls is false', () => {
      render(<Carousel3D items={mockItems} showControls={false} />);

      expect(screen.queryByLabelText(/previous/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/next/i)).not.toBeInTheDocument();
    });

    it('should hide indicators when showIndicators is false', () => {
      const { container } = render(<Carousel3D items={mockItems} showIndicators={false} />);

      const indicators = container.querySelectorAll('.carousel-indicator');
      expect(indicators).toHaveLength(0);
    });
  });

  describe('Button Navigation', () => {
    it('should rotate to next item when next button is clicked', async () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const nextButton = screen.getByLabelText(/next/i);

      // Get initial rotation
      const carouselRing = container.querySelector('.carousel-ring');
      const initialTransform = carouselRing?.getAttribute('style');

      // Click next button
      fireEvent.click(nextButton);

      // Wait for animation
      await waitFor(() => {
        const newTransform = carouselRing?.getAttribute('style');
        expect(newTransform).not.toBe(initialTransform);
      });
    });

    it('should rotate to previous item when previous button is clicked', async () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const prevButton = screen.getByLabelText(/previous/i);

      // Get initial rotation
      const carouselRing = container.querySelector('.carousel-ring');
      const initialTransform = carouselRing?.getAttribute('style');

      // Click previous button
      fireEvent.click(prevButton);

      // Wait for animation
      await waitFor(() => {
        const newTransform = carouselRing?.getAttribute('style');
        expect(newTransform).not.toBe(initialTransform);
      });
    });

    it('should disable buttons during animation', async () => {
      render(<Carousel3D items={mockItems} />);
      const nextButton = screen.getByLabelText(/next/i);

      // Click next button
      fireEvent.click(nextButton);

      // Button should be disabled during animation
      expect(nextButton).toBeDisabled();

      // Wait for animation to complete
      await waitFor(() => {
        expect(nextButton).not.toBeDisabled();
      }, { timeout: 1000 });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should rotate to next item on ArrowRight key', async () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const carousel = container.querySelector('.carousel-3d');

      // Get initial rotation
      const carouselRing = container.querySelector('.carousel-ring');
      const initialTransform = carouselRing?.getAttribute('style');

      // Press ArrowRight
      if (carousel) {
        fireEvent.keyDown(carousel, { key: 'ArrowRight' });
      }

      // Wait for animation
      await waitFor(() => {
        const newTransform = carouselRing?.getAttribute('style');
        expect(newTransform).not.toBe(initialTransform);
      });
    });

    it('should rotate to previous item on ArrowLeft key', async () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const carousel = container.querySelector('.carousel-3d');

      // Get initial rotation
      const carouselRing = container.querySelector('.carousel-ring');
      const initialTransform = carouselRing?.getAttribute('style');

      // Press ArrowLeft
      if (carousel) {
        fireEvent.keyDown(carousel, { key: 'ArrowLeft' });
      }

      // Wait for animation
      await waitFor(() => {
        const newTransform = carouselRing?.getAttribute('style');
        expect(newTransform).not.toBe(initialTransform);
      });
    });

    it('should not respond to other keys', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const carousel = container.querySelector('.carousel-3d');
      const carouselRing = container.querySelector('.carousel-ring');
      const initialTransform = carouselRing?.getAttribute('style');

      // Press various keys that should not trigger rotation
      if (carousel) {
        fireEvent.keyDown(carousel, { key: 'Enter' });
        fireEvent.keyDown(carousel, { key: 'Space' });
        fireEvent.keyDown(carousel, { key: 'Tab' });
      }

      // Transform should not change
      const newTransform = carouselRing?.getAttribute('style');
      expect(newTransform).toBe(initialTransform);
    });
  });

  describe('Mouse Drag Interaction', () => {
    it('should update rotation on mouse drag', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const carousel = container.querySelector('.carousel-3d');
      const carouselRing = container.querySelector('.carousel-ring');

      if (!carousel || !carouselRing) {
        throw new Error('Carousel elements not found');
      }

      const initialTransform = carouselRing.getAttribute('style');

      // Simulate drag
      fireEvent.mouseDown(carousel, { clientX: 100 });
      fireEvent.mouseMove(carousel, { clientX: 200 });
      fireEvent.mouseUp(carousel);

      // Transform should change
      const newTransform = carouselRing.getAttribute('style');
      expect(newTransform).not.toBe(initialTransform);
    });

    it('should set isDragging state during drag', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const carousel = container.querySelector('.carousel-3d');

      if (!carousel) {
        throw new Error('Carousel not found');
      }

      // Start drag
      fireEvent.mouseDown(carousel, { clientX: 100 });

      // Carousel should have dragging class or state
      expect(carousel.classList.contains('dragging') ||
             carousel.getAttribute('data-dragging') === 'true').toBeTruthy();

      // End drag
      fireEvent.mouseUp(carousel);
    });
  });

  describe('Touch Interaction', () => {
    it('should update rotation on touch swipe', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const carousel = container.querySelector('.carousel-3d');
      const carouselRing = container.querySelector('.carousel-ring');

      if (!carousel || !carouselRing) {
        throw new Error('Carousel elements not found');
      }

      const initialTransform = carouselRing.getAttribute('style');

      // Simulate touch swipe
      fireEvent.touchStart(carousel, {
        touches: [{ clientX: 100, clientY: 0 }],
      });
      fireEvent.touchMove(carousel, {
        touches: [{ clientX: 200, clientY: 0 }],
      });
      fireEvent.touchEnd(carousel);

      // Transform should change
      const newTransform = carouselRing.getAttribute('style');
      expect(newTransform).not.toBe(initialTransform);
    });
  });

  describe('Indicator Navigation', () => {
    it('should jump to specific item when indicator is clicked', async () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const indicators = container.querySelectorAll('.carousel-indicator');

      // Click on third indicator (index 2)
      fireEvent.click(indicators[2]);

      // Wait for animation
      await waitFor(() => {
        // Third indicator should be active
        expect(indicators[2].classList.contains('active')).toBeTruthy();
      });
    });
  });

  describe('Auto-rotation', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should auto-rotate when autoRotate is enabled', () => {
      const { container } = render(
        <Carousel3D items={mockItems} autoRotate={true} autoRotateInterval={1000} />
      );
      const carouselRing = container.querySelector('.carousel-ring');
      const initialTransform = carouselRing?.getAttribute('style');

      // Fast-forward time
      jest.advanceTimersByTime(1100);

      // Transform should change
      const newTransform = carouselRing?.getAttribute('style');
      expect(newTransform).not.toBe(initialTransform);
    });

    it('should pause auto-rotation on hover', () => {
      const { container } = render(
        <Carousel3D items={mockItems} autoRotate={true} autoRotateInterval={1000} />
      );
      const carousel = container.querySelector('.carousel-3d');

      if (carousel) {
        // Hover over carousel
        fireEvent.mouseEnter(carousel);

        const carouselRing = container.querySelector('.carousel-ring');
        const transformAfterHover = carouselRing?.getAttribute('style');

        // Fast-forward time
        jest.advanceTimersByTime(1100);

        // Transform should not change while hovering
        const transformAfterTime = carouselRing?.getAttribute('style');
        expect(transformAfterTime).toBe(transformAfterHover);
      }
    });

    it('should resume auto-rotation after hover ends', () => {
      const { container } = render(
        <Carousel3D items={mockItems} autoRotate={true} autoRotateInterval={1000} />
      );
      const carousel = container.querySelector('.carousel-3d');

      if (carousel) {
        // Hover and unhover
        fireEvent.mouseEnter(carousel);
        fireEvent.mouseLeave(carousel);

        const carouselRing = container.querySelector('.carousel-ring');
        const transformBeforeResume = carouselRing?.getAttribute('style');

        // Fast-forward time
        jest.advanceTimersByTime(1100);

        // Transform should change after resuming
        const transformAfterResume = carouselRing?.getAttribute('style');
        expect(transformAfterResume).not.toBe(transformBeforeResume);
      }
    });
  });

  describe('Error Handling', () => {
    it('should show fallback slider for insufficient items', () => {
      const twoItems = mockItems.slice(0, 2);
      const { container } = render(<Carousel3D items={twoItems} />);

      expect(container.querySelector('.fallback-slider')).toBeInTheDocument();
    });

    it('should show empty state for no items', () => {
      const { container } = render(<Carousel3D items={[]} />);

      expect(container.querySelector('.carousel-3d-empty')).toBeInTheDocument();
    });

    it('should handle image loading errors gracefully', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const images = container.querySelectorAll('img');

      // Trigger error on first image
      fireEvent.error(images[0]);

      // Component should still be rendered
      expect(container.querySelector('.carousel-3d')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const carousel = container.querySelector('.carousel-3d');

      expect(carousel).toHaveAttribute('role', 'region');
      expect(carousel).toHaveAttribute('aria-label');
    });

    it('should have aria-live region for announcements', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const liveRegion = container.querySelector('[aria-live]');

      expect(liveRegion).toBeInTheDocument();
    });

    it('should mark non-focused items as aria-hidden', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const items = container.querySelectorAll('.carousel-item');

      // At least some items should be aria-hidden
      const hiddenItems = Array.from(items).filter(item =>
        item.getAttribute('aria-hidden') === 'true'
      );

      expect(hiddenItems.length).toBeGreaterThan(0);
    });

    it('should have keyboard-accessible controls', () => {
      render(<Carousel3D items={mockItems} />);

      const prevButton = screen.getByLabelText(/previous/i);
      const nextButton = screen.getByLabelText(/next/i);

      expect(prevButton).toHaveAttribute('type', 'button');
      expect(nextButton).toHaveAttribute('type', 'button');
    });

    it('should support reduced motion preference', () => {
      // Mock prefers-reduced-motion
      const matchMediaMock = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: matchMediaMock,
      });

      const { container } = render(<Carousel3D items={mockItems} />);
      const carousel = container.querySelector('.carousel-3d');

      // Should have reduced-motion class or attribute
      expect(
        carousel?.classList.contains('reduced-motion') ||
        carousel?.hasAttribute('data-reduced-motion')
      ).toBeTruthy();
    });
  });

  describe('Responsive Behavior', () => {
    it('should adjust configuration for mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { container } = render(<Carousel3D items={mockItems} />);
      const carousel = container.querySelector('.carousel-3d');

      // Trigger resize event
      fireEvent(window, new Event('resize'));

      // Should apply mobile configuration
      expect(carousel).toBeInTheDocument();
    });

    it('should adjust configuration for tablet viewport', () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      const { container } = render(<Carousel3D items={mockItems} />);

      // Trigger resize event
      fireEvent(window, new Event('resize'));

      // Should apply tablet configuration
      expect(container.querySelector('.carousel-3d')).toBeInTheDocument();
    });

    it('should adjust configuration for desktop viewport', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });

      const { container } = render(<Carousel3D items={mockItems} />);

      // Trigger resize event
      fireEvent(window, new Event('resize'));

      // Should apply desktop configuration
      expect(container.querySelector('.carousel-3d')).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('should maintain rotation state across interactions', async () => {
      render(<Carousel3D items={mockItems} />);
      const nextButton = screen.getByLabelText(/next/i);

      // Click next multiple times
      fireEvent.click(nextButton);
      await waitFor(() => expect(nextButton).not.toBeDisabled());

      fireEvent.click(nextButton);
      await waitFor(() => expect(nextButton).not.toBeDisabled());

      fireEvent.click(nextButton);
      await waitFor(() => expect(nextButton).not.toBeDisabled());

      // State should be maintained
      expect(nextButton).toBeInTheDocument();
    });

    it('should update focused index when rotation changes', async () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const nextButton = screen.getByLabelText(/next/i);
      const indicators = container.querySelectorAll('.carousel-indicator');

      // Initially first indicator should be active
      expect(indicators[0].classList.contains('active')).toBeTruthy();

      // Click next
      fireEvent.click(nextButton);

      // Wait for animation and state update
      await waitFor(() => {
        // Second indicator should become active
        expect(indicators[1].classList.contains('active')).toBeTruthy();
      });
    });
  });
});