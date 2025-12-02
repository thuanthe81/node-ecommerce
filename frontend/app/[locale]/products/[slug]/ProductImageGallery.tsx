'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { ProductImage } from '@/lib/product-api';
import { useLocale, useTranslations } from 'next-intl';
import { SvgAlertTriangle, SvgChevronLeft, SvgChevronRight } from '@/components/Svgs';
import { useAutoAdvance } from './hooks/useAutoAdvance';
import { useVisibilityDetection } from './hooks/useVisibilityDetection';

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
  locale?: string;
  // Auto-advance configuration
  autoAdvance?: boolean;
  autoAdvanceInterval?: number;
  transitionDuration?: number;
}

export default function ProductImageGallery({
  images,
  productName,
  locale: localeProp,
  autoAdvance: autoAdvanceProp,
  autoAdvanceInterval: autoAdvanceIntervalProp,
  transitionDuration: transitionDurationProp,
}: ProductImageGalleryProps) {
  // Configuration validation with fallback to defaults
  const validatePositiveNumber = (value: number | undefined, defaultValue: number): number => {
    if (typeof value !== 'number' || value <= 0 || !isFinite(value)) {
      // if (process.env.NODE_ENV === 'development') {
      //   console.warn(
      //     `Invalid configuration value: ${value}. Falling back to default: ${defaultValue}`
      //   );
      // }
      return defaultValue;
    }
    return value;
  };

  // Validated configuration values
  const autoAdvance = autoAdvanceProp !== undefined ? autoAdvanceProp : true;
  const autoAdvanceInterval = validatePositiveNumber(autoAdvanceIntervalProp, 3000);
  const transitionDuration = validatePositiveNumber(transitionDurationProp, 500);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'next' | 'prev' | null>(null);
  // Track loading state for each image by URL
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  // State for auto-advance pause control
  const [isPausedByUser, setIsPausedByUser] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const galleryRef = useRef<HTMLDivElement>(null);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const localeFromHook = useLocale();
  const locale = localeProp || localeFromHook;
  const t = useTranslations('products.gallery');

  // Detect prefers-reduced-motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // ARIA live region state
  const [ariaLiveMessage, setAriaLiveMessage] = useState('');

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Detect prefers-reduced-motion on mount and when it changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Visibility detection hook - pauses auto-advance when not visible
  useVisibilityDetection({
    elementRef: galleryRef,
    onVisibilityChange: setIsVisible,
    threshold: 0.5,
  });

  // These will be safely accessed after the empty check
  const currentImage = images?.[currentIndex];
  const altText = currentImage
    ? locale === 'vi'
      ? currentImage.altTextVi || productName
      : currentImage.altTextEn || productName
    : productName;

  /**
   * Preload an image and return a promise that resolves when loaded or rejects on error
   */
  const preloadImage = (url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // If already loaded, resolve immediately
      if (loadedImages.has(url)) {
        resolve();
        return;
      }

      // If already failed, reject immediately
      if (failedImages.has(url)) {
        reject(new Error('Image previously failed to load'));
        return;
      }

      const img = new window.Image();

      img.onload = () => {
        setLoadedImages((prev) => new Set(prev).add(url));
        setFailedImages((prev) => {
          prev.delete(url);
          return prev;
        });
        resolve();
      };

      img.onerror = () => {
        setFailedImages((prev) => new Set(prev).add(url));
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  };

  /**
   * Pause auto-advance temporarily when user interacts
   * Auto-advance will resume after the pause duration
   */
  const pauseAutoAdvance = useCallback(() => {
    // Clear any existing pause timer
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
    }

    // Pause auto-advance
    setIsPausedByUser(true);

    // Resume after interval + transition duration
    // This gives the user time to view the image they selected
    pauseTimerRef.current = setTimeout(() => {
      setIsPausedByUser(false);
    }, autoAdvanceInterval + transitionDuration);
  }, [autoAdvanceInterval, transitionDuration]);

  const handleHovered = (hovered:boolean) => {
    if (hovered) pauseAutoAdvance();
    setIsHovered(hovered);
  }

  // Navigation functions with animation support
  const goToPrevious = useCallback(async () => {
    // Prevent navigation during animation
    if (isAnimating) return;

    // Pause auto-advance when user manually navigates
    // pauseAutoAdvance();

    const prevIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    const prevImageUrl = images[prevIndex].url;

    // If reduced motion is preferred, skip animation
    if (prefersReducedMotion) {
      setCurrentIndex(prevIndex);
      setIsZoomed(false);
      setImageLoading(true);
      setImageError(false);
      return;
    }

    // Wait for the previous image to load before starting animation
    try {
      await preloadImage(prevImageUrl);
    } catch (error) {
      // If image fails to load, we still proceed but mark it as failed
      console.warn('Failed to preload previous image:', error);
    }

    setIsZoomed(false);

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
  }, [isAnimating, pauseAutoAdvance, currentIndex, images.length, prefersReducedMotion, transitionDuration]);

  const goToNext = useCallback(async () => {
    // Prevent navigation during animation
    if (isAnimating) return;

    // Pause auto-advance when user manually navigates
    // pauseAutoAdvance();

    const nextIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
    const nextImageUrl = images[nextIndex].url;

    // If reduced motion is preferred, skip animation
    if (prefersReducedMotion) {
      setCurrentIndex(nextIndex);
      setIsZoomed(false);
      setImageLoading(true);
      setImageError(false);
      return;
    }

    // Wait for the next image to load before starting animation
    try {
      await preloadImage(nextImageUrl);
    } catch (error) {
      // If image fails to load, we still proceed but mark it as failed
      console.warn('Failed to preload next image:', error);
    }

    setAnimationDirection('next');
    setIsAnimating(true);
    setIsZoomed(false);

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
  }, [isAnimating, pauseAutoAdvance, currentIndex, images.length, prefersReducedMotion, transitionDuration]);

  const goToImage = useCallback((index: number) => {
    // Prevent navigation during animation
    if (isAnimating) return;

    // Pause auto-advance when user selects a thumbnail
    pauseAutoAdvance();

    // For thumbnail clicks, we'll use instant transition (no animation)
    setCurrentIndex(index);
    setIsZoomed(false);
    setImageLoading(true);
    setImageError(false);
  }, [isAnimating, pauseAutoAdvance]);

  // Mark current image as loaded when it loads successfully
  useEffect(() => {
    if (!imageLoading && !imageError && currentImage) {
      setLoadedImages((prev) => new Set(prev).add(currentImage.url));
    }
  }, [imageLoading, imageError, currentImage]);

  // Mark current image as failed when it fails to load
  useEffect(() => {
    if (imageError && currentImage) {
      setFailedImages((prev) => new Set(prev).add(currentImage.url));
    }
  }, [imageError, currentImage]);

  // Update ARIA live region when image changes
  useEffect(() => {
    if (images.length > 1) {
      const message = t('imageAnnouncement', {
        current: currentIndex + 1,
        total: images.length,
      });
      setAriaLiveMessage(message);
    }
  }, [currentIndex, images.length, t]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
      }
    };
  }, []);

  // Callback for advancing to next image (used by auto-advance)
  const handleAutoAdvance = useCallback(() => {
    // Don't pause auto-advance for automatic transitions
    // We temporarily set isPausedByUser to false during auto-advance
    const nextIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
    const nextImageUrl = images[nextIndex].url;

    // If reduced motion is preferred, skip animation
    if (prefersReducedMotion) {
      setCurrentIndex(nextIndex);
      setIsZoomed(false);
      setImageLoading(true);
      setImageError(false);
      return;
    }

    // Wait for the next image to load before starting animation
    preloadImage(nextImageUrl)
      .catch((error) => {
        console.warn('Failed to preload next image:', error);
      })
      .finally(() => {
        setAnimationDirection('next');
        setIsAnimating(true);
        setIsZoomed(false);

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
      });
  }, [currentIndex, images.length, prefersReducedMotion, transitionDuration]);

  // Auto-advance hook - manages automatic image progression
  useAutoAdvance({
    enabled: autoAdvance,
    interval: autoAdvanceInterval,
    transitionDuration,
    imagesCount: images.length,
    isPaused: isPausedByUser,
    isVisible,
    isZoomed,
    isAnimating,
    onAdvance: handleAutoAdvance,
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        void goToPrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        void goToNext();
      }
    };

    // Only add listener if gallery is in viewport or focused
    if (galleryRef.current) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [goToPrevious, goToNext]);

  // Touch/swipe handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      void goToNext();
    } else if (isRightSwipe) {
      void goToPrevious();
    }
  }, [touchStart, touchEnd, goToNext, goToPrevious]);

  // Handle empty images case with placeholder - must be after all hooks
  if (!images || images.length === 0) {
    return (
      <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
        <span className="text-gray-400">No image available</span>
      </div>
    );
  }

  return (
    <div className="space-y-4" ref={galleryRef}>
      {/* ARIA live region for screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {ariaLiveMessage}
      </div>

      {/* Main Image */}
      <div
        className="relative"
        onMouseEnter={() => handleHovered(true)}
        onMouseLeave={() => handleHovered(false)}
      >
        <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
          {/* Gallery track container for scrolling animation */}
          <div
            className="flex h-full"
            style={{
              transform: isAnimating && animationDirection === 'next'
                ? `translateX(-100%)`
                : isAnimating && animationDirection === 'prev'
                ? `translateX(0%)`
                : animationDirection === 'prev'
                ? `translateX(-100%)`
                : 'translateX(0)',
              transition: isAnimating && !prefersReducedMotion
                ? `transform ${transitionDuration}ms ease-in-out`
                : 'none',
              willChange: isAnimating && !prefersReducedMotion ? 'transform' : 'auto',
            }}
          >
            {/* Previous image (for prev animation) - positioned before current */}
            {isAnimating && animationDirection === 'prev' && (
              <div className="relative flex-shrink-0 w-full h-full">
                <Image
                  src={images[currentIndex === 0 ? images.length - 1 : currentIndex - 1].url}
                  alt={
                    locale === 'vi'
                      ? images[currentIndex === 0 ? images.length - 1 : currentIndex - 1].altTextVi || productName
                      : images[currentIndex === 0 ? images.length - 1 : currentIndex - 1].altTextEn || productName
                  }
                  fill
                  className="object-cover object-center"
                  style={{opacity: 1}}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            )}

            {/* Current image container */}
            <div
              className="relative flex-shrink-0 w-full h-full cursor-zoom-in"
              onClick={() => !isAnimating && setIsZoomed(!isZoomed)}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <Image
                src={currentImage!.url}
                alt={altText}
                fill
                className={`object-cover object-center transition-transform duration-200 ${
                  isZoomed ? 'scale-150' : 'scale-100'
                }`}
                style={{opacity: 1}}
                priority={currentIndex === 0}
                sizes="(max-width: 1024px) 100vw, 50vw"
                onLoad={() => {
                  setLoadedImages((prev) => new Set(prev).add(currentImage!.url));
                  setImageLoading(false);
                }}
                onError={() => {
                  setFailedImages((prev) => new Set(prev).add(currentImage!.url));
                  setImageLoading(false);
                  setImageError(true);
                }}
              />
            </div>

            {/* Next image (for next animation) */}
            {isAnimating && animationDirection === 'next' && (
              <div className="relative flex-shrink-0 w-full h-full">
                <Image
                  src={images[currentIndex === images.length - 1 ? 0 : currentIndex + 1].url}
                  alt={
                    locale === 'vi'
                      ? images[currentIndex === images.length - 1 ? 0 : currentIndex + 1].altTextVi || productName
                      : images[currentIndex === images.length - 1 ? 0 : currentIndex + 1].altTextEn || productName
                  }
                  fill
                  className="object-cover object-center"
                  style={{opacity: 1}}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            )}
          </div>
        </div>

        {/* Previous/Next Buttons - Only show if multiple images */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className={`absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200 ${
                isHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
              } [@media(hover:none)]:opacity-100 [@media(hover:none)]:pointer-events-auto`}
              aria-label="Previous image"
            >
              <SvgChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={goToNext}
              className={`absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200 ${
                isHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
              } [@media(hover:none)]:opacity-100 [@media(hover:none)]:pointer-events-auto`}
              aria-label="Next image"
            >
              <SvgChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails - Only show if multiple images */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => goToImage(index)}
              className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-colors ${
                currentIndex === index
                  ? 'border-blue-600'
                  : 'border-transparent hover:border-gray-300'
              }`}
              aria-label={`View image ${index + 1}`}
              aria-current={currentIndex === index}
            >
              <Image
                src={image.url}
                alt={
                  locale === 'vi'
                    ? image.altTextVi || productName
                    : image.altTextEn || productName
                }
                fill
                className="object-cover object-center"
                style={{opacity: 1}}
                sizes="(max-width: 1024px) 25vw, 12.5vw"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}