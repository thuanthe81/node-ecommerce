/**
 * Hook for managing carousel auto-rotation
 */

import { useEffect, useState, useCallback } from 'react';

/**
 * Options for auto-rotation behavior
 */
export interface AutoRotationOptions {
  /** Whether auto-rotation is enabled */
  enabled: boolean;
  /** Interval between rotations in milliseconds */
  interval: number;
  /** Whether user is currently dragging */
  isDragging: boolean;
  /** Whether user is hovering over carousel */
  isHovered: boolean;
  /** Whether carousel is currently animating */
  isAnimating: boolean;
  /** Whether user prefers reduced motion */
  prefersReducedMotion: boolean;
}

/**
 * Return value from useAutoRotation hook
 */
export interface AutoRotationState {
  /** Whether auto-rotation is currently active */
  isAutoRotating: boolean;
  /** Whether auto-rotation is paused by user */
  isPaused: boolean;
  /** Function to toggle pause state */
  togglePause: () => void;
  /** Function to pause auto-rotation */
  pause: () => void;
  /** Function to resume auto-rotation */
  resume: () => void;
}

/**
 * Custom hook for managing auto-rotation timer and pause/resume logic
 * Handles automatic rotation with pause on user interaction
 *
 * @param options - Configuration options for auto-rotation
 * @param onRotate - Callback function to execute on each rotation
 * @returns Auto-rotation state and control functions
 *
 * @example
 * ```typescript
 * function Carousel() {
 *   const { isAutoRotating, isPaused, togglePause } = useAutoRotation(
 *     {
 *       enabled: true,
 *       interval: 5000,
 *       isDragging: false,
 *       isHovered: false,
 *       isAnimating: false,
 *       prefersReducedMotion: false,
 *     },
 *     () => rotateToNext()
 *   );
 *
 *   return (
 *     <div>
 *       <button onClick={togglePause}>
 *         {isPaused ? 'Play' : 'Pause'}
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAutoRotation(
  options: AutoRotationOptions,
  onRotate: () => void
): AutoRotationState {
  const {
    enabled,
    interval,
    isDragging,
    isHovered,
    isAnimating,
    prefersReducedMotion,
  } = options;

  const [isAutoRotating, setIsAutoRotating] = useState(enabled);
  const [isPaused, setIsPaused] = useState(false);

  /**
   * Toggle pause state
   */
  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
    setIsAutoRotating((prev) => !prev);
  }, []);

  /**
   * Pause auto-rotation
   */
  const pause = useCallback(() => {
    setIsPaused(true);
    setIsAutoRotating(false);
  }, []);

  /**
   * Resume auto-rotation
   */
  const resume = useCallback(() => {
    setIsPaused(false);
    setIsAutoRotating(true);
  }, []);

  /**
   * Auto-rotation effect
   * Rotates carousel automatically at specified intervals
   * Pauses during user interaction (drag, hover, focus)
   */
  useEffect(() => {
    // Don't auto-rotate if:
    // - Auto-rotate is disabled
    // - User has manually paused
    // - User is dragging
    // - User is hovering
    // - Animation is in progress
    // - User prefers reduced motion
    if (
      !isAutoRotating ||
      isPaused ||
      isDragging ||
      isHovered ||
      isAnimating ||
      prefersReducedMotion
    ) {
      return;
    }

    // Set up interval for auto-rotation
    const intervalId = setInterval(() => {
      onRotate();
    }, interval);

    // Cleanup interval on unmount or when dependencies change
    return () => {
      clearInterval(intervalId);
    };
  }, [
    isAutoRotating,
    isPaused,
    isDragging,
    isHovered,
    isAnimating,
    prefersReducedMotion,
    interval,
    onRotate,
  ]);

  /**
   * Resume auto-rotation after interaction timeout
   * When user stops interacting, wait a bit before resuming auto-rotation
   */
  useEffect(() => {
    // If auto-rotate is enabled and user is not interacting
    // Set timeout to resume after a delay
    if (enabled && !isPaused && !isDragging && !isHovered && !isAnimating) {
      const timeoutId = setTimeout(() => {
        setIsAutoRotating(true);
      }, 2000); // Resume after 2 seconds of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [enabled, isPaused, isDragging, isHovered, isAnimating]);

  return {
    isAutoRotating,
    isPaused,
    togglePause,
    pause,
    resume,
  };
}
