/**
 * Carousel Component
 * A reusable image carousel with auto-advance, thumbnails, and accessibility features
 */

'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CarouselProps } from './types';
import { useAutoAdvance } from './hooks/useAutoAdvance';
import { useVisibilityDetection } from '@/components/Carousel/hooks';
import { useCarouselAnimation } from '@/components/Carousel/hooks';
import { useImagePreloader } from './hooks/useImagePreloader';
import CarouselImage from './components/CarouselImage';
import CarouselControls from './components/CarouselControls';
import CarouselThumbnails from './components/CarouselThumbnails';

/**
 * Default configuration values
 */
const DEFAULT_AUTO_ADVANCE_INTERVAL = 2000;
const DEFAULT_TRANSITION_DURATION = 500;
const MIN_SWIPE_DISTANCE = 50;

/**
 * Validates and returns a safe configuration value
 */
function validateConfigValue(value: number | undefined, defaultValue: number, name: string): number {
  if (value === undefined) {
    return defaultValue;
  }

  if (isNaN(value) || !isFinite(value) || value <= 0) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `Invalid ${name} value: ${value}. Using default: ${defaultValue}ms`
      );
    }
    return defaultValue;
  }

  return value;
}

/**
 * Main Carousel component
 * Displays a series of images with navigation controls and optional thumbnails
 */
const Carousel: React.FC<CarouselProps> = ({
  images,
  showThumbnails = false,
  showControls = true,
  autoAdvance = false,
  autoAdvanceInterval,
  transitionDuration,
  className = '',
  aspectRatio = 'video',
  ariaLabel,
  onImageChange,
}) => {
  const locale = useLocale();
  const t = useTranslations('carousel');

  // Refs
  const carouselRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number>(0);
  const touchEndXRef = useRef<number>(0);

  // Validate configuration values
  const validatedInterval = validateConfigValue(
    autoAdvanceInterval,
    DEFAULT_AUTO_ADVANCE_INTERVAL,
    'autoAdvanceInterval'
  );
  const validatedDuration = validateConfigValue(
    transitionDuration,
    DEFAULT_TRANSITION_DURATION,
    'transitionDuration'
  );

  // State
  const [isHovered, setIsHovered] = useState(false);
  const [isPausedByUser, setIsPausedByUser] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Detect touch-capable device (mobile/tablet)
  useEffect(() => {
    const checkTouchDevice = () => {
      // Check if device supports touch events
      const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      setIsMobile(isTouchDevice);
    };

    checkTouchDevice();
  }, []);

  // Image preloader hook
  const { preloadImage, markAsLoaded, markAsFailed } = useImagePreloader();

  // Carousel animation hook
  const {
    currentIndex,
    isAnimating,
    animationDirection,
    goToNext,
    goToPrevious,
    goToImage,
  } = useCarouselAnimation({
    imagesCount: images.length,
    transitionDuration: validatedDuration,
    prefersReducedMotion,
    preloadImage,
    getImageUrl: (index) => images[index]?.url || '',
    onIndexChange: onImageChange,
  });

  // Visibility detection hook
  useVisibilityDetection({
    elementRef: carouselRef,
    onVisibilityChange: setIsVisible,
  });

  // Auto-advance hook
  useAutoAdvance({
    enabled: autoAdvance,
    interval: validatedInterval,
    transitionDuration: validatedDuration,
    imagesCount: images.length,
    isPaused: isPausedByUser || isHovered,
    isVisible,
    isAnimating,
    onAdvance: goToNext,
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevious();
        setIsPausedByUser(true);
        // Resume after a delay
        setTimeout(() => setIsPausedByUser(false), validatedInterval);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
        setIsPausedByUser(true);
        // Resume after a delay
        setTimeout(() => setIsPausedByUser(false), validatedInterval);
      }
    };

    const element = carouselRef.current;
    if (element) {
      element.addEventListener('keydown', handleKeyDown);
      return () => element.removeEventListener('keydown', handleKeyDown);
    }
  }, [goToNext, goToPrevious, validatedInterval]);

  // Touch/swipe gestures
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchEndXRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndXRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const distance = touchStartXRef.current - touchEndXRef.current;
    const absDistance = Math.abs(distance);

    if (absDistance > MIN_SWIPE_DISTANCE) {
      if (distance > 0) {
        // Swiped left - go to next
        goToNext();
      } else {
        // Swiped right - go to previous
        goToPrevious();
      }
      setIsPausedByUser(true);
      // Resume after a delay
      setTimeout(() => setIsPausedByUser(false), validatedInterval);
    }
  }, [goToNext, goToPrevious, validatedInterval]);

  // Hover pause functionality
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  // Handle thumbnail click
  const handleThumbnailClick = useCallback(
    (index: number) => {
      goToImage(index);
      setIsPausedByUser(true);
      // Resume after a delay
      setTimeout(() => setIsPausedByUser(false), validatedInterval);
    },
    [goToImage, validatedInterval]
  );

  // Handle control button clicks
  const handlePreviousClick = useCallback(() => {
    goToPrevious();
    setIsPausedByUser(true);
    // Resume after a delay
    setTimeout(() => setIsPausedByUser(false), validatedInterval);
  }, [goToPrevious, validatedInterval]);

  const handleNextClick = useCallback(() => {
    goToNext();
    setIsPausedByUser(true);
    // Resume after a delay
    setTimeout(() => setIsPausedByUser(false), validatedInterval);
  }, [goToNext, validatedInterval]);

  // Get current image
  const currentImage = images[currentIndex];
  const prevIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
  const nextIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
  const prevImage = images[prevIndex];
  const nextImage = images[nextIndex];

  // Get alt text based on locale
  const getAltText = (image: typeof currentImage) => {
    return locale === 'vi' ? image.altTextVi : image.altTextEn;
  };

  // ARIA live region message
  const ariaMessage = t('imageAnnouncement', {
    current: currentIndex + 1,
    total: images.length,
  });

  // Calculate transform for animation track
  // The track is 300% wide with 3 images side by side
  // We start at -33.333% to show the middle (current) image
  // When animating to next, we move to -66.666% (showing the next image)
  // When animating to prev, we move to 0% (showing the prev image)
  const getTrackTransform = () => {
    if (prefersReducedMotion) {
      return 'translateX(-33.333%)';
    }

    if (!isAnimating) {
      return 'translateX(-33.333%)';
    }

    if (animationDirection === 'next') {
      return 'translateX(-66.666%)';
    } else if (animationDirection === 'prev') {
      return 'translateX(0%)';
    }

    return 'translateX(-33.333%)';
  };

  // Get aspect ratio class
  const aspectRatioClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'aspect-[21/9]',
  }[aspectRatio];

  if (images.length === 0) {
    return null;
  }

  return (
    <div
      ref={carouselRef}
      className={`carousel relative ${className}`}
      aria-label={ariaLabel || t('defaultAriaLabel')}
      tabIndex={0}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ARIA live region for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {ariaMessage}
      </div>

      {/* Main carousel container */}
      <div className={`carousel-main relative overflow-hidden ${aspectRatioClass}`}>
        {/* Animation track - always contains 3 images: prev, current, next */}
        <div
          className="carousel-track flex h-full"
          style={{
            transform: getTrackTransform(),
            transition: isAnimating && !prefersReducedMotion
              ? `transform ${validatedDuration}ms ease-in-out`
              : 'none',
            width: '300%',
          }}
        >
          {/* Previous image (left position) */}
          <div className="flex-shrink-0 relative h-full" style={{ width: '33.333%' }}>
            <CarouselImage
              image={prevImage}
              locale={locale}
              isActive={false}
              isAnimating={isAnimating}
              animationDirection={animationDirection}
              position="prev"
              onLoad={() => markAsLoaded(prevImage.url)}
              onError={() => markAsFailed(prevImage.url)}
            />
          </div>

          {/* Current image (center position) */}
          <div className="flex-shrink-0 relative h-full" style={{ width: '33.333%' }}>
            <CarouselImage
              image={currentImage}
              locale={locale}
              isActive={true}
              isAnimating={isAnimating}
              animationDirection={animationDirection}
              position="current"
              onLoad={() => markAsLoaded(currentImage.url)}
              onError={() => markAsFailed(currentImage.url)}
            />
          </div>

          {/* Next image (right position) */}
          <div className="flex-shrink-0 relative h-full" style={{ width: '33.333%' }}>
            <CarouselImage
              image={nextImage}
              locale={locale}
              isActive={false}
              isAnimating={isAnimating}
              animationDirection={animationDirection}
              position="next"
              onLoad={() => markAsLoaded(nextImage.url)}
              onError={() => markAsFailed(nextImage.url)}
            />
          </div>
        </div>

        {/* Navigation controls */}
        {images.length > 1 && (
          <CarouselControls
            onPrevious={handlePreviousClick}
            onNext={handleNextClick}
            isVisible={showControls && (isMobile || isHovered)}
            disabled={isAnimating}
          />
        )}
      </div>

      {/* Thumbnails */}
      {showThumbnails && (
        <CarouselThumbnails
          images={images}
          currentIndex={currentIndex}
          locale={locale}
          onThumbnailClick={handleThumbnailClick}
        />
      )}
    </div>
  );
};

export default Carousel;