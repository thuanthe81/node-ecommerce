import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Animation direction for carousel transitions
 */
export type AnimationDirection = 'next' | 'prev' | null;

/**
 * Options for the useCarouselAnimation hook
 */
export interface UseCarouselAnimationOptions {
  /**
   * Total number of images in the carousel
   */
  imagesCount: number;

  /**
   * Duration of the transition animation in milliseconds
   */
  transitionDuration: number;

  /**
   * Whether the user prefers reduced motion
   */
  prefersReducedMotion: boolean;

  /**
   * Callback to preload an image before animation
   */
  preloadImage: (url: string) => Promise<void>;

  /**
   * Function to get image URL by index
   */
  getImageUrl: (index: number) => string;

  /**
   * Callback when animation state changes (optional)
   */
  onAnimationChange?: (isAnimating: boolean) => void;

  /**
   * Callback when index changes (optional)
   */
  onIndexChange?: (index: number) => void;
}

/**
 * Return type for useCarouselAnimation hook
 */
export interface UseCarouselAnimationReturn {
  /**
   * Current image index
   */
  currentIndex: number;

  /**
   * Whether an animation is currently in progress
   */
  isAnimating: boolean;

  /**
   * Current animation direction
   */
  animationDirection: AnimationDirection;

  /**
   * Navigate to the next image
   */
  goToNext: () => Promise<void>;

  /**
   * Navigate to the previous image
   */
  goToPrevious: () => Promise<void>;

  /**
   * Navigate to a specific image by index
   */
  goToImage: (index: number) => void;
}

/**
 * Custom hook that manages carousel animation state and navigation.
 * Handles animation timing, state transitions, and image preloading.
 *
 * @param options - Configuration options for carousel animation
 *
 * @example
 * ```tsx
 * const {
 *   currentIndex,
 *   isAnimating,
 *   animationDirection,
 *   goToNext,
 *   goToPrevious,
 *   goToImage
 * } = useCarouselAnimation({
 *   imagesCount: images.length,
 *   transitionDuration: 500,
 *   prefersReducedMotion: false,
 *   preloadImage: (url) => preloadImage(url),
 *   getImageUrl: (index) => images[index].url
 * });
 * ```
 */
export function useCarouselAnimation({
  imagesCount,
  transitionDuration,
  prefersReducedMotion,
  preloadImage,
  getImageUrl,
  onAnimationChange,
  onIndexChange,
}: UseCarouselAnimationOptions): UseCarouselAnimationReturn {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<AnimationDirection>(null);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Notify when animation state changes
  useEffect(() => {
    onAnimationChange?.(isAnimating);
  }, [isAnimating, onAnimationChange]);

  // Notify when index changes
  useEffect(() => {
    onIndexChange?.(currentIndex);
  }, [currentIndex, onIndexChange]);

  /**
   * Navigate to the previous image with animation
   */
  const goToPrevious = useCallback(async () => {
    // Prevent navigation during animation
    if (isAnimating) return;

    const prevIndex = currentIndex === 0 ? imagesCount - 1 : currentIndex - 1;
    const prevImageUrl = getImageUrl(prevIndex);

    // If reduced motion is preferred, skip animation
    if (prefersReducedMotion) {
      setCurrentIndex(prevIndex);
      return;
    }

    // Wait for the previous image to load before starting animation
    try {
      await preloadImage(prevImageUrl);
    } catch (error) {
      // If image fails to load, we still proceed but log the error
      console.warn('Failed to preload previous image:', error);
    }

    // Step 1: Set direction without animating (positions track at -100%)
    setAnimationDirection('prev');

    // Step 2: Wait for next frame, then start animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    });

    // Clear any existing animation timer
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
    }

    // After animation completes, update the index
    animationTimerRef.current = setTimeout(() => {
      setCurrentIndex(prevIndex);
      setIsAnimating(false);
      setAnimationDirection(null);
    }, transitionDuration);
  }, [
    isAnimating,
    currentIndex,
    imagesCount,
    prefersReducedMotion,
    preloadImage,
    getImageUrl,
    transitionDuration,
  ]);

  /**
   * Navigate to the next image with animation
   */
  const goToNext = useCallback(async () => {
    // Prevent navigation during animation
    if (isAnimating) return;

    const nextIndex = currentIndex === imagesCount - 1 ? 0 : currentIndex + 1;
    const nextImageUrl = getImageUrl(nextIndex);

    // If reduced motion is preferred, skip animation
    if (prefersReducedMotion) {
      setCurrentIndex(nextIndex);
      return;
    }

    // Wait for the next image to load before starting animation
    try {
      await preloadImage(nextImageUrl);
    } catch (error) {
      // If image fails to load, we still proceed but log the error
      console.warn('Failed to preload next image:', error);
    }

    setAnimationDirection('next');
    setIsAnimating(true);

    // Clear any existing animation timer
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
    }

    // After animation completes, update the index
    animationTimerRef.current = setTimeout(() => {
      setCurrentIndex(nextIndex);
      setIsAnimating(false);
      setAnimationDirection(null);
    }, transitionDuration);
  }, [
    isAnimating,
    currentIndex,
    imagesCount,
    prefersReducedMotion,
    preloadImage,
    getImageUrl,
    transitionDuration,
  ]);

  /**
   * Navigate to a specific image by index (instant, no animation)
   */
  const goToImage = useCallback(
    (index: number) => {
      // Prevent navigation during animation
      if (isAnimating) return;

      // Validate index
      if (index < 0 || index >= imagesCount) {
        console.warn(`Invalid index: ${index}. Must be between 0 and ${imagesCount - 1}`);
        return;
      }

      // For direct navigation (e.g., thumbnail clicks), use instant transition
      setCurrentIndex(index);
    },
    [isAnimating, imagesCount]
  );

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
    };
  }, []);

  return {
    currentIndex,
    isAnimating,
    animationDirection,
    goToNext,
    goToPrevious,
    goToImage,
  };
}
