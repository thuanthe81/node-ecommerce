import { useEffect, RefObject } from 'react';

/**
 * Options for the useVisibilityDetection hook
 */
export interface UseVisibilityDetectionOptions {
  /**
   * Reference to the element to observe for viewport visibility
   */
  elementRef: RefObject<HTMLElement | null>;

  /**
   * Callback function called when visibility changes
   * @param isVisible - true if element is in viewport AND tab is active, false otherwise
   */
  onVisibilityChange: (isVisible: boolean) => void;

  /**
   * Intersection Observer threshold (0-1)
   * @default 0.5
   */
  threshold?: number;
}

/**
 * Custom hook that detects if an element is visible in the viewport and if the browser tab is active.
 * Combines Intersection Observer API for viewport detection and Page Visibility API for tab detection.
 *
 * This hook is used to pause auto-advance when the carousel is not visible to conserve resources.
 *
 * @param options - Configuration options for visibility detection
 *
 * @example
 * ```tsx
 * const carouselRef = useRef<HTMLDivElement>(null);
 *
 * useVisibilityDetection({
 *   elementRef: carouselRef,
 *   onVisibilityChange: (isVisible) => {
 *     console.log('Carousel is visible:', isVisible);
 *   },
 *   threshold: 0.5
 * });
 * ```
 */
export function useVisibilityDetection({
  elementRef,
  onVisibilityChange,
  threshold = 0.5,
}: UseVisibilityDetectionOptions): void {
  useEffect(() => {
    // Track both viewport visibility and tab visibility
    let isInViewport = true; // Default to true for graceful degradation
    let isTabActive = true; // Default to true for graceful degradation

    // Function to update combined visibility state
    const updateVisibility = () => {
      const isVisible = isInViewport && isTabActive;
      onVisibilityChange(isVisible);
    };

    // Set up Intersection Observer for viewport detection
    let observer: IntersectionObserver | null = null;

    if (typeof IntersectionObserver !== 'undefined' && elementRef.current) {
      observer = new IntersectionObserver(
        ([entry]) => {
          isInViewport = entry.isIntersecting;
          updateVisibility();
        },
        { threshold }
      );

      observer.observe(elementRef.current);
    } else {
      // Graceful degradation: if IntersectionObserver is not available,
      // assume element is always in viewport
      if (process.env.NODE_ENV === 'development') {
        console.warn('IntersectionObserver not available, assuming element is always visible');
      }
    }

    // Set up Page Visibility API for tab detection
    const handleVisibilityChange = () => {
      isTabActive = !document.hidden;
      updateVisibility();
    };

    if (typeof document !== 'undefined' && 'hidden' in document) {
      // Initialize tab active state
      isTabActive = !document.hidden;

      document.addEventListener('visibilitychange', handleVisibilityChange);
    } else {
      // Graceful degradation: if Page Visibility API is not available,
      // assume tab is always active
      if (process.env.NODE_ENV === 'development') {
        console.warn('Page Visibility API not available, assuming tab is always active');
      }
    }

    // Initial visibility check
    updateVisibility();

    // Cleanup function
    return () => {
      if (observer) {
        observer.disconnect();
      }

      if (typeof document !== 'undefined' && 'hidden' in document) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [elementRef, onVisibilityChange, threshold]);
}
