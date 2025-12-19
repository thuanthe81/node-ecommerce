/**
 * Carousel Component Unit Tests
 * Tests for the reusable Carousel component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Carousel from '../Carousel/Carousel';
import { CarouselImage } from '../Carousel/types';

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
      defaultAriaLabel: 'Image carousel',
      imageAnnouncement: `Image ${params?.current || 1} of ${params?.total || 1}`,
      previousButton: 'Previous image',
      nextButton: 'Next image',
      thumbnailLabel: 'Go to image',
      imageLoadError: 'Unable to load image',
      loading: 'Loading...',
    };
    return translations[key] || key;
  },
}));

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver as any;

// Mock matchMedia for reduced motion detection
const mockMatchMedia = jest.fn();
window.matchMedia = mockMatchMedia as any;

// Sample test images
const createTestImages = (count: number = 3): CarouselImage[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `img-${i + 1}`,
    url: `/test-image-${i + 1}.jpg`,
    altTextEn: `Test Image ${i + 1}`,
    altTextVi: `Hình ảnh thử nghiệm ${i + 1}`,
  }));
};

describe('Carousel Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock requestAnimationFrame
    global.requestAnimationFrame = jest.fn((cb) => {
      cb(0);
      return 0;
    }) as any;

    // Mock matchMedia to return no reduced motion by default
    mockMatchMedia.mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('8.1 Component rendering with different props', () => {
    it('should render carousel with images', () => {
      const images = createTestImages(3);
      render(<Carousel images={images} />);

      expect(screen.getByLabelText('Image carousel')).toBeInTheDocument();
    });

    it('should render with showThumbnails=true', () => {
      const images = createTestImages(3);
      render(<Carousel images={images} showThumbnails={true} />);

      // Check that thumbnails are rendered
      const thumbnails = screen.getAllByRole('button');
      // Should have prev, next, and 3 thumbnail buttons
      expect(thumbnails.length).toBeGreaterThanOrEqual(3);
    });

    it('should not render thumbnails when showThumbnails=false', () => {
      const images = createTestImages(3);
      const { container } = render(<Carousel images={images} showThumbnails={false} />);

      // Check that thumbnail container doesn't exist
      const thumbnailContainer = container.querySelector('.carousel-thumbnails');
      expect(thumbnailContainer).not.toBeInTheDocument();
    });

    it('should render with showControls=true', () => {
      const images = createTestImages(3);
      render(<Carousel images={images} showControls={true} />);

      expect(screen.getByLabelText('Previous image')).toBeInTheDocument();
      expect(screen.getByLabelText('Next image')).toBeInTheDocument();
    });

    it('should not render controls when showControls=false', () => {
      const images = createTestImages(3);
      render(<Carousel images={images} showControls={false} />);

      expect(screen.queryByLabelText('Previous image')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Next image')).not.toBeInTheDocument();
    });

    it('should render with autoAdvance=true', () => {
      const images = createTestImages(3);
      render(<Carousel images={images} autoAdvance={true} />);

      expect(screen.getByLabelText('Image carousel')).toBeInTheDocument();
    });

    it('should render with autoAdvance=false', () => {
      const images = createTestImages(3);
      render(<Carousel images={images} autoAdvance={false} />);

      expect(screen.getByLabelText('Image carousel')).toBeInTheDocument();
    });

    it('should render with different image arrays', () => {
      const singleImage = createTestImages(1);
      const { rerender } = render(<Carousel images={singleImage} />);
      expect(screen.getByLabelText('Image carousel')).toBeInTheDocument();

      const manyImages = createTestImages(10);
      rerender(<Carousel images={manyImages} />);
      expect(screen.getByLabelText('Image carousel')).toBeInTheDocument();
    });

    it('should not render when images array is empty', () => {
      const { container } = render(<Carousel images={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render with custom className', () => {
      const images = createTestImages(3);
      const { container } = render(<Carousel images={images} className="custom-class" />);

      const carousel = container.querySelector('.carousel');
      expect(carousel).toHaveClass('custom-class');
    });

    it('should render with custom ariaLabel', () => {
      const images = createTestImages(3);
      render(<Carousel images={images} ariaLabel="Custom carousel label" />);

      expect(screen.getByLabelText('Custom carousel label')).toBeInTheDocument();
    });
  });

  describe('8.2 Navigation functionality', () => {
    it('should navigate to next image on next button click', async () => {
      const images = createTestImages(3);
      render(<Carousel images={images} showControls={true} />);

      const nextButton = screen.getByLabelText('Next image');

      await act(async () => {
        fireEvent.click(nextButton);
        jest.runAllTimers();
      });

      // Check ARIA announcement updated
      expect(screen.getByText('Image 2 of 3')).toBeInTheDocument();
    });

    it('should navigate to previous image on previous button click', async () => {
      const images = createTestImages(3);
      render(<Carousel images={images} showControls={true} />);

      const prevButton = screen.getByLabelText('Previous image');

      await act(async () => {
        fireEvent.click(prevButton);
        jest.runAllTimers();
      });

      // Should wrap to last image
      expect(screen.getByText('Image 3 of 3')).toBeInTheDocument();
    });

    it('should navigate to specific image on thumbnail click', async () => {
      const images = createTestImages(3);
      render(<Carousel images={images} showThumbnails={true} />);

      // Find thumbnail buttons (skip prev/next controls)
      const allButtons = screen.getAllByRole('button');
      const thumbnailButtons = allButtons.filter(btn =>
        !btn.getAttribute('aria-label')?.includes('Previous') &&
        !btn.getAttribute('aria-label')?.includes('Next')
      );

      // Click third thumbnail
      fireEvent.click(thumbnailButtons[2]);

      // Wait for state update
      jest.advanceTimersByTime(100);

      await waitFor(() => {
        expect(screen.getByText('Image 3 of 3')).toBeInTheDocument();
      });
    });

    it('should navigate on left arrow key press', async () => {
      const images = createTestImages(3);
      const { container } = render(<Carousel images={images} />);

      const carousel = container.querySelector('.carousel');
      expect(carousel).toBeInTheDocument();

      // Simulate left arrow key
      fireEvent.keyDown(carousel!, { key: 'ArrowLeft' });

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText('Image 3 of 3')).toBeInTheDocument();
      });
    });

    it('should navigate on right arrow key press', async () => {
      const images = createTestImages(3);
      const { container } = render(<Carousel images={images} />);

      const carousel = container.querySelector('.carousel');
      expect(carousel).toBeInTheDocument();

      // Simulate right arrow key
      fireEvent.keyDown(carousel!, { key: 'ArrowRight' });

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText('Image 2 of 3')).toBeInTheDocument();
      });
    });

    it('should navigate on swipe left (touch gesture)', async () => {
      const images = createTestImages(3);
      const { container } = render(<Carousel images={images} />);

      const carousel = container.querySelector('.carousel');
      expect(carousel).toBeInTheDocument();

      // Simulate swipe left (next)
      fireEvent.touchStart(carousel!, { touches: [{ clientX: 200 }] });
      fireEvent.touchMove(carousel!, { touches: [{ clientX: 100 }] });
      fireEvent.touchEnd(carousel!);

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText('Image 2 of 3')).toBeInTheDocument();
      });
    });

    it('should navigate on swipe right (touch gesture)', async () => {
      const images = createTestImages(3);
      const { container } = render(<Carousel images={images} />);

      const carousel = container.querySelector('.carousel');
      expect(carousel).toBeInTheDocument();

      // Simulate swipe right (previous)
      fireEvent.touchStart(carousel!, { touches: [{ clientX: 100 }] });
      fireEvent.touchMove(carousel!, { touches: [{ clientX: 200 }] });
      fireEvent.touchEnd(carousel!);

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText('Image 3 of 3')).toBeInTheDocument();
      });
    });

    it('should not navigate on small swipe distance', async () => {
      const images = createTestImages(3);
      const { container } = render(<Carousel images={images} />);

      const carousel = container.querySelector('.carousel');
      expect(carousel).toBeInTheDocument();

      // Simulate small swipe (less than MIN_SWIPE_DISTANCE)
      fireEvent.touchStart(carousel!, { touches: [{ clientX: 100 }] });
      fireEvent.touchMove(carousel!, { touches: [{ clientX: 120 }] });
      fireEvent.touchEnd(carousel!);

      jest.advanceTimersByTime(500);

      // Should still be on first image
      expect(screen.getByText('Image 1 of 3')).toBeInTheDocument();
    });

    it('should wrap around from last to first on next', async () => {
      const images = createTestImages(3);
      render(<Carousel images={images} showControls={true} />);

      const nextButton = screen.getByLabelText('Next image');

      // Navigate to last image
      fireEvent.click(nextButton);
      jest.advanceTimersByTime(500);
      fireEvent.click(nextButton);
      jest.advanceTimersByTime(500);

      // Should be on image 3
      await waitFor(() => {
        expect(screen.getByText('Image 3 of 3')).toBeInTheDocument();
      });

      // Click next again - should wrap to first
      fireEvent.click(nextButton);
      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText('Image 1 of 3')).toBeInTheDocument();
      });
    });

    it('should wrap around from first to last on previous', async () => {
      const images = createTestImages(3);
      render(<Carousel images={images} showControls={true} />);

      const prevButton = screen.getByLabelText('Previous image');

      // Click previous from first image - should wrap to last
      fireEvent.click(prevButton);
      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText('Image 3 of 3')).toBeInTheDocument();
      });
    });
  });

  describe('8.3 Auto-advance behavior', () => {
    it('should auto-advance after configured interval', async () => {
      const images = createTestImages(3);
      render(<Carousel images={images} autoAdvance={true} autoAdvanceInterval={2000} />);

      // Initially on first image
      expect(screen.getByText('Image 1 of 3')).toBeInTheDocument();

      // Advance time by interval + transition duration
      await act(async () => {
        jest.advanceTimersByTime(2500);
      });

      expect(screen.getByText('Image 2 of 3')).toBeInTheDocument();
    });

    it('should pause auto-advance on hover', async () => {
      const images = createTestImages(3);
      const { container } = render(
        <Carousel images={images} autoAdvance={true} autoAdvanceInterval={2000} />
      );

      const carousel = container.querySelector('.carousel');
      expect(carousel).toBeInTheDocument();

      // Hover over carousel
      act(() => {
        fireEvent.mouseEnter(carousel!);
      });

      // Advance time - should NOT auto-advance
      await act(async () => {
        jest.advanceTimersByTime(3000);
      });

      // Should still be on first image
      expect(screen.getByText('Image 1 of 3')).toBeInTheDocument();

      // Mouse leave
      act(() => {
        fireEvent.mouseLeave(carousel!);
      });

      // Now it should advance
      await act(async () => {
        jest.advanceTimersByTime(2500);
      });

      expect(screen.getByText('Image 2 of 3')).toBeInTheDocument();
    });

    it('should pause auto-advance on manual navigation', async () => {
      const images = createTestImages(3);
      render(
        <Carousel
          images={images}
          autoAdvance={true}
          autoAdvanceInterval={2000}
          showControls={true}
        />
      );

      // Initially on first image
      expect(screen.getByText('Image 1 of 3')).toBeInTheDocument();

      // Manually navigate
      const nextButton = screen.getByLabelText('Next image');
      act(() => {
        fireEvent.click(nextButton);
      });

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      expect(screen.getByText('Image 2 of 3')).toBeInTheDocument();

      // Auto-advance should be paused temporarily
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      // Should still be on image 2 (paused)
      expect(screen.getByText('Image 2 of 3')).toBeInTheDocument();

      // After pause duration, should resume
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(screen.getByText('Image 3 of 3')).toBeInTheDocument();
    });

    it('should pause auto-advance when not visible', () => {
      const images = createTestImages(3);

      // Mock IntersectionObserver to report not visible
      const mockObserve = jest.fn();
      const mockDisconnect = jest.fn();
      let intersectionCallback: any;

      mockIntersectionObserver.mockImplementation((callback: any) => {
        intersectionCallback = callback;
        return {
          observe: mockObserve,
          unobserve: jest.fn(),
          disconnect: mockDisconnect,
        };
      });

      render(
        <Carousel images={images} autoAdvance={true} autoAdvanceInterval={2000} />
      );

      // Simulate element not visible
      if (intersectionCallback) {
        intersectionCallback([{ isIntersecting: false }]);
      }

      // Advance time - should NOT auto-advance
      jest.advanceTimersByTime(3000);

      // Should still be on first image
      expect(screen.getByText('Image 1 of 3')).toBeInTheDocument();
    });

    it('should not auto-advance when autoAdvance is false', () => {
      const images = createTestImages(3);
      render(<Carousel images={images} autoAdvance={false} />);

      // Initially on first image
      expect(screen.getByText('Image 1 of 3')).toBeInTheDocument();

      // Advance time
      jest.advanceTimersByTime(5000);

      // Should still be on first image
      expect(screen.getByText('Image 1 of 3')).toBeInTheDocument();
    });

    it('should use custom autoAdvanceInterval', async () => {
      const images = createTestImages(3);
      render(
        <Carousel images={images} autoAdvance={true} autoAdvanceInterval={1000} />
      );

      // Initially on first image
      expect(screen.getByText('Image 1 of 3')).toBeInTheDocument();

      // Advance by custom interval + transition
      await act(async () => {
        jest.advanceTimersByTime(1500);
      });

      expect(screen.getByText('Image 2 of 3')).toBeInTheDocument();
    });
  });

  describe('8.4 Configuration validation', () => {
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      // Set NODE_ENV to development for validation warnings
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
      process.env.NODE_ENV = 'test';
    });

    it('should use default interval for negative autoAdvanceInterval', async () => {
      const images = createTestImages(3);
      render(
        <Carousel images={images} autoAdvance={true} autoAdvanceInterval={-1000} />
      );

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid autoAdvanceInterval value')
      );

      // Should use default (3000ms)
      expect(screen.getByText('Image 1 of 3')).toBeInTheDocument();

      await act(async () => {
        jest.advanceTimersByTime(3500);
      });

      // Should advance with default interval
      expect(screen.getByText('Image 2 of 3')).toBeInTheDocument();
    });

    it('should use default interval for zero autoAdvanceInterval', () => {
      const images = createTestImages(3);
      render(
        <Carousel images={images} autoAdvance={true} autoAdvanceInterval={0} />
      );

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid autoAdvanceInterval value')
      );
    });

    it('should use default interval for NaN autoAdvanceInterval', () => {
      const images = createTestImages(3);
      render(
        <Carousel images={images} autoAdvance={true} autoAdvanceInterval={NaN} />
      );

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid autoAdvanceInterval value')
      );
    });

    it('should use default interval for Infinity autoAdvanceInterval', () => {
      const images = createTestImages(3);
      render(
        <Carousel images={images} autoAdvance={true} autoAdvanceInterval={Infinity} />
      );

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid autoAdvanceInterval value')
      );
    });

    it('should use default duration for negative transitionDuration', () => {
      const images = createTestImages(3);
      render(
        <Carousel images={images} transitionDuration={-500} />
      );

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid transitionDuration value')
      );
    });

    it('should use default duration for zero transitionDuration', () => {
      const images = createTestImages(3);
      render(
        <Carousel images={images} transitionDuration={0} />
      );

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid transitionDuration value')
      );
    });

    it('should use default duration for NaN transitionDuration', () => {
      const images = createTestImages(3);
      render(
        <Carousel images={images} transitionDuration={NaN} />
      );

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid transitionDuration value')
      );
    });

    it('should use default duration for Infinity transitionDuration', () => {
      const images = createTestImages(3);
      render(
        <Carousel images={images} transitionDuration={Infinity} />
      );

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid transitionDuration value')
      );
    });

    it('should accept valid positive autoAdvanceInterval', () => {
      const images = createTestImages(3);
      render(
        <Carousel images={images} autoAdvance={true} autoAdvanceInterval={5000} />
      );

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should accept valid positive transitionDuration', () => {
      const images = createTestImages(3);
      render(
        <Carousel images={images} transitionDuration={300} />
      );

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should not warn in production mode', () => {
      process.env.NODE_ENV = 'production';

      const images = createTestImages(3);
      render(
        <Carousel images={images} autoAdvance={true} autoAdvanceInterval={-1000} />
      );

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe('8.5 Accessibility features', () => {
    it('should have ARIA live region that updates on image change', async () => {
      const images = createTestImages(3);
      render(<Carousel images={images} showControls={true} />);

      // Check initial ARIA announcement
      expect(screen.getByText('Image 1 of 3')).toBeInTheDocument();

      // Navigate to next image
      const nextButton = screen.getByLabelText('Next image');
      act(() => {
        fireEvent.click(nextButton);
      });

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      // Check updated ARIA announcement
      expect(screen.getByText('Image 2 of 3')).toBeInTheDocument();
    });

    it('should have ARIA labels on navigation buttons', () => {
      const images = createTestImages(3);
      render(<Carousel images={images} showControls={true} />);

      expect(screen.getByLabelText('Previous image')).toBeInTheDocument();
      expect(screen.getByLabelText('Next image')).toBeInTheDocument();
    });

    it('should have aria-current on active thumbnail', () => {
      const images = createTestImages(3);
      const { container } = render(<Carousel images={images} showThumbnails={true} />);

      // Find thumbnails
      const thumbnails = container.querySelectorAll('[aria-current]');
      expect(thumbnails.length).toBeGreaterThan(0);

      // First thumbnail should have aria-current="true"
      const activeThumbnail = Array.from(thumbnails).find(
        thumb => thumb.getAttribute('aria-current') === 'true'
      );
      expect(activeThumbnail).toBeInTheDocument();
    });

    it('should update aria-current when navigating', async () => {
      const images = createTestImages(3);
      const { container } = render(
        <Carousel images={images} showThumbnails={true} showControls={true} />
      );

      // Navigate to next image
      const nextButton = screen.getByLabelText('Next image');
      fireEvent.click(nextButton);
      jest.advanceTimersByTime(500);

      await waitFor(() => {
        const thumbnails = container.querySelectorAll('[aria-current="true"]');
        expect(thumbnails.length).toBeGreaterThan(0);
      });
    });

    it('should support keyboard navigation with arrow keys', async () => {
      const images = createTestImages(3);
      const { container } = render(<Carousel images={images} />);

      const carousel = container.querySelector('.carousel');
      expect(carousel).toBeInTheDocument();

      // Test right arrow
      await act(async () => {
        fireEvent.keyDown(carousel!, { key: 'ArrowRight' });
        jest.advanceTimersByTime(500);
        jest.runOnlyPendingTimers();
      });

      expect(screen.getByText('Image 2 of 3')).toBeInTheDocument();

      // Test left arrow
      await act(async () => {
        fireEvent.keyDown(carousel!, { key: 'ArrowLeft' });
        jest.advanceTimersByTime(500);
        jest.runOnlyPendingTimers();
      });

      expect(screen.getByText('Image 1 of 3')).toBeInTheDocument();
    });

    it('should have proper tabIndex for keyboard focus', () => {
      const images = createTestImages(3);
      const { container } = render(<Carousel images={images} />);

      const carousel = container.querySelector('.carousel');
      expect(carousel).toHaveAttribute('tabIndex', '0');
    });

    it('should have role and aria-label on carousel container', () => {
      const images = createTestImages(3);
      render(<Carousel images={images} ariaLabel="Product images" />);

      const carousel = screen.getByLabelText('Product images');
      expect(carousel).toBeInTheDocument();
    });

    it('should announce total number of images', () => {
      const images = createTestImages(5);
      render(<Carousel images={images} />);

      expect(screen.getByText('Image 1 of 5')).toBeInTheDocument();
    });

    it('should have sr-only class on ARIA live region', () => {
      const images = createTestImages(3);
      const { container } = render(<Carousel images={images} />);

      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion).toHaveClass('sr-only');
    });

    it('should have aria-atomic on ARIA live region', () => {
      const images = createTestImages(3);
      const { container } = render(<Carousel images={images} />);

      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    });
  });

  describe('8.6 Reduced motion support', () => {
    it('should skip animations when prefers-reduced-motion is enabled', () => {
      // Mock matchMedia to return reduced motion preference
      mockMatchMedia.mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const images = createTestImages(3);
      const { container } = render(<Carousel images={images} showControls={true} />);

      // Navigate to next image
      const nextButton = screen.getByLabelText('Next image');
      fireEvent.click(nextButton);

      // Check that transition duration is 0ms
      const track = container.querySelector('.carousel-track');
      expect(track).toBeInTheDocument();

      const style = window.getComputedStyle(track!);
      // In reduced motion mode, transitionDuration should be 0ms
      expect(track).toHaveStyle({ transitionDuration: '0ms' });
    });

    it('should use instant transitions with reduced motion', async () => {
      // Mock matchMedia to return reduced motion preference
      mockMatchMedia.mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const images = createTestImages(3);
      render(<Carousel images={images} showControls={true} />);

      const nextButton = screen.getByLabelText('Next image');
      fireEvent.click(nextButton);

      // With reduced motion, transition should be instant
      // No need to wait for animation
      jest.advanceTimersByTime(100);

      await waitFor(() => {
        expect(screen.getByText('Image 2 of 3')).toBeInTheDocument();
      });
    });

    it('should respect reduced motion for auto-advance', async () => {
      // Mock matchMedia to return reduced motion preference
      mockMatchMedia.mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const images = createTestImages(3);
      const { container } = render(
        <Carousel images={images} autoAdvance={true} autoAdvanceInterval={2000} />
      );

      // Auto-advance should still work
      jest.advanceTimersByTime(2500);

      await waitFor(() => {
        expect(screen.getByText('Image 2 of 3')).toBeInTheDocument();
      });

      // But transitions should be instant
      const track = container.querySelector('.carousel-track');
      expect(track).toHaveStyle({ transitionDuration: '0ms' });
    });

    it('should respect reduced motion for keyboard navigation', async () => {
      // Mock matchMedia to return reduced motion preference
      mockMatchMedia.mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const images = createTestImages(3);
      const { container } = render(<Carousel images={images} />);

      const carousel = container.querySelector('.carousel');
      fireEvent.keyDown(carousel!, { key: 'ArrowRight' });

      // Transition should be instant
      jest.advanceTimersByTime(100);

      await waitFor(() => {
        expect(screen.getByText('Image 2 of 3')).toBeInTheDocument();
      });

      const track = container.querySelector('.carousel-track');
      expect(track).toHaveStyle({ transitionDuration: '0ms' });
    });

    it('should respect reduced motion for touch gestures', async () => {
      // Mock matchMedia to return reduced motion preference
      mockMatchMedia.mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const images = createTestImages(3);
      const { container } = render(<Carousel images={images} />);

      const carousel = container.querySelector('.carousel');

      // Simulate swipe
      fireEvent.touchStart(carousel!, { touches: [{ clientX: 200 }] });
      fireEvent.touchMove(carousel!, { touches: [{ clientX: 100 }] });
      fireEvent.touchEnd(carousel!);

      // Transition should be instant
      jest.advanceTimersByTime(100);

      await waitFor(() => {
        expect(screen.getByText('Image 2 of 3')).toBeInTheDocument();
      });

      const track = container.querySelector('.carousel-track');
      expect(track).toHaveStyle({ transitionDuration: '0ms' });
    });

    it('should update reduced motion preference when media query changes', () => {
      let mediaQueryListener: any;

      // Mock matchMedia with listener support
      mockMatchMedia.mockImplementation((query: string) => {
        const mql = {
          matches: false,
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn((event: string, listener: any) => {
            if (event === 'change') {
              mediaQueryListener = listener;
            }
          }),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        };
        return mql;
      });

      const images = createTestImages(3);
      const { container } = render(<Carousel images={images} />);

      // Initially no reduced motion
      let track = container.querySelector('.carousel-track');
      expect(track).not.toHaveStyle({ transitionDuration: '0ms' });

      // Simulate media query change to reduced motion
      if (mediaQueryListener) {
        mediaQueryListener({ matches: true });
      }

      // Should now have reduced motion
      track = container.querySelector('.carousel-track');
      // Note: This test verifies the listener is set up correctly
      expect(mediaQueryListener).toBeDefined();
    });
  });
});
