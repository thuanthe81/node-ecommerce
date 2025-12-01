import { useEffect, useRef, useCallback } from 'react';

/**
 * Options for the useAutoAdvance hook
 */
export interface UseAutoAdvanceOptions {
  /**
   * Whether auto-advance is enabled
   */
  enabled: boolean;

  /**
   * Interval between automatic image changes in milliseconds
   */
  interval: number;

  /**
   * Duration of the transition animation in milliseconds
   */
  transitionDuration: number;

  /**
   * Total number of images in the gallery
   */
  imagesCount: number;

  /**
   * Whether auto-advance is paused due to user interaction
   */
  isPaused: boolean;

  /**
   * Whether the gallery is visible (in viewport and tab is active)
   */
  isVisible: boolean;

  /**
   * Whether the image is currently zoomed
   */
  isZoomed: boolean;

  /**
   * Whether an animation is currently in progress
   */
  isAnimating: boolean;

  /**
   * Callback function to advance to the next image
   */
  onAdvance: () => void;
}

/**
 * Custom hook that manages automatic image advancement for the gallery.
 * Handles timer management, pause conditions, and cleanup.
 *
 * Auto-advance will be paused when:
 * - User is interacting with the gallery (isPaused)
 * - Image is zoomed (isZoomed)
 * - Gallery is not visible in viewport or tab is not active (isVisible)
 * - Animation is in progress (isAnimating)
 * - There is only one image (imagesCount <= 1)
 * - Auto-advance is disabled (enabled = false)
 *
 * @param options - Configuration options for auto-advance
 *
 * @example
 * ```tsx
 * useAutoAdvance({
 *   enabled: true,
 *   interval: 5000,
 *   transitionDuration: 1000,
 *   imagesCount: images.length,
 *   isPaused: false,
 *   isVisible: true,
 *   isZoomed: false,
 *   isAnimating: false,
 *   onAdvance: () => goToNext()
 * });
 * ```
 */
export function useAutoAdvance({
  enabled,
  interval,
  transitionDuration,
  imagesCount,
  isPaused,
  isVisible,
  isZoomed,
  isAnimating,
  onAdvance,
}: UseAutoAdvanceOptions): void {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Clears any existing timer
   */
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /**
   * Determines if auto-advance should be active based on all conditions
   */
  const shouldAutoAdvance = useCallback(() => {
    return (
      enabled &&
      imagesCount > 1 &&
      !isPaused &&
      !isZoomed &&
      !isAnimating &&
      isVisible
    );
  }, [enabled, imagesCount, isPaused, isZoomed, isAnimating, isVisible]);

  /**
   * Starts the auto-advance timer
   */
  const startTimer = useCallback(() => {
    if (!shouldAutoAdvance()) {
      return;
    }

    clearTimer();

    timerRef.current = setTimeout(() => {
      onAdvance();
    }, interval);
  }, [shouldAutoAdvance, clearTimer, onAdvance, interval]);

  // Effect to manage the auto-advance timer
  useEffect(() => {
    if (shouldAutoAdvance()) {
      startTimer();
    } else {
      clearTimer();
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      clearTimer();
    };
  }, [shouldAutoAdvance, startTimer, clearTimer]);
}
