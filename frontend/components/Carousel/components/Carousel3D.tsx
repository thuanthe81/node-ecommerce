'use client';

/**
 * Carousel3D Component
 *
 * A 3D carousel component that displays items in a ring formation with rotation capabilities.
 * Supports drag interactions, keyboard navigation, auto-rotation, and responsive design.
 *
 * @example
 * ```typescript
 * <Carousel3D
 *   items={carouselItems}
 *   autoRotate={true}
 *   autoRotateInterval={5000}
 *   showControls={true}
 *   showIndicators={true}
 * />
 * ```
 */

import { useMemo, useCallback, useState, useEffect } from 'react';
import { Carousel3DProps } from '../types';
import { DEFAULT_CONFIG } from '../constants';
import { useResponsiveConfig } from '../hooks/useResponsiveConfig';
import { useCarouselState } from '../hooks/useCarouselState';
import { useAutoRotation } from '../hooks/useAutoRotation';
import { validateCarouselItems } from '../utils/validation';
import { calculateItemTransform, calculateZPosition, calculateItemStyle } from '../utils/calculations';
import CarouselItem from '../../Carousel3D/CarouselItem';
import CarouselControls from '../../Carousel3D/CarouselControls';
import CarouselIndicators from '../../Carousel3D/CarouselIndicators';
import { SvgPlay, SvgPause, SvgImage } from '../../Svgs';

/**
 * Internal Carousel3D component implementation
 */
export function Carousel3DInternal({
  items: rawItems,
  autoRotate = DEFAULT_CONFIG.autoRotate,
  autoRotateInterval = DEFAULT_CONFIG.autoRotateInterval,
  rotationSpeed,
  ringRadius: propRingRadius,
  itemWidth: propItemWidth,
  itemHeight: propItemHeight,
  showControls = DEFAULT_CONFIG.showControls,
  showIndicators = DEFAULT_CONFIG.showIndicators,
  className = '',
}: Carousel3DProps) {
  // Validate and filter items
  const items = useMemo(() => validateCarouselItems(rawItems), [rawItems]);

  // Get responsive configuration based on screen size
  const responsiveConfig = useResponsiveConfig();

  // Use prop values if provided, otherwise use responsive config
  const ringRadius = propRingRadius ?? responsiveConfig.ringRadius;
  const itemWidth = propItemWidth ?? responsiveConfig.itemWidth;
  const itemHeight = propItemHeight ?? responsiveConfig.itemHeight;
  const dragSensitivity = responsiveConfig.dragSensitivity;
  const perspective = responsiveConfig.perspective;

  // Check for reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Use carousel state hook
  const {
    state,
    animateToRotation,
    startDrag,
    handleDrag,
    endDrag,
    goToNext,
    goToPrevious,
    goToIndex,
    handleItemClick,
    srAnnouncement,
  } = useCarouselState(
    {
      items,
      animationDuration: DEFAULT_CONFIG.animationDuration,
      dragSensitivity,
      prefersReducedMotion,
      itemCount: items.length,
    },
    undefined // Will be set by auto-rotation hook
  );

  // Use auto-rotation hook
  const { isAutoRotating, isPaused, togglePause } = useAutoRotation(
    {
      enabled: autoRotate,
      interval: autoRotateInterval,
      isDragging: state.isDragging,
      isHovered,
      isAnimating: state.isAnimating,
      prefersReducedMotion,
    },
    () => {
      const itemAngle = 360 / items.length;
      const targetRotation = state.rotation + itemAngle;
      animateToRotation(targetRotation);
    }
  );

  // Mouse event handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      startDrag(e.clientX);
    },
    [startDrag]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      handleDrag(e.clientX);
    },
    [handleDrag]
  );

  const handleMouseUp = useCallback(() => {
    endDrag();
  }, [endDrag]);

  const handleMouseLeave = useCallback(() => {
    if (state.isDragging) {
      endDrag();
    }
  }, [state.isDragging, endDrag]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeaveContainer = useCallback(() => {
    setIsHovered(false);
    if (state.isDragging) {
      endDrag();
    }
  }, [state.isDragging, endDrag]);

  // Touch event handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        startDrag(touch.clientX);
      }
    },
    [startDrag]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1 && state.isDragging) {
        e.preventDefault();
        handleDrag(e.touches[0].clientX);
      }
    },
    [handleDrag, state.isDragging]
  );

  const handleTouchEnd = useCallback(() => {
    endDrag();
  }, [endDrag]);

  // Global mouse event listeners for drag
  useEffect(() => {
    if (!state.isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      handleDrag(e.clientX);
    };

    const handleGlobalMouseUp = () => {
      endDrag();
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [state.isDragging, handleDrag, endDrag]);

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (state.isDragging || state.isAnimating) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case 'Escape':
          e.preventDefault();
          // Handled by auto-rotation hook
          break;
        default:
          break;
      }
    },
    [state.isDragging, state.isAnimating, goToPrevious, goToNext]
  );

  // Handle empty items array
  if (items.length === 0) {
    return (
      <div className="carousel-3d-empty w-full py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8">
            <SvgImage
              className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4"
              aria-hidden="true"
            />
            <p className="text-gray-600 dark:text-gray-400">
              No items to display in carousel
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`carousel-3d-container relative w-full overflow-hidden touch-manipulation bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-8 md:py-12 lg:py-16 ${className}`}
      role="region"
      aria-label="Featured products carousel"
      aria-roledescription="carousel"
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeaveContainer}
      tabIndex={0}
    >
      {/* Screen reader announcements */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {srAnnouncement}
      </div>

      {/* Auto-rotation play/pause control */}
      {autoRotate && (
        <button
          onClick={togglePause}
          className="absolute top-4 right-4 z-20 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:shadow-xl hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 group"
          aria-label={isPaused ? 'Play auto-rotation' : 'Pause auto-rotation'}
          title={isPaused ? 'Play auto-rotation' : 'Pause auto-rotation'}
        >
          {isPaused ? (
            <SvgPlay
              className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300"
              aria-hidden="true"
            />
          ) : (
            <SvgPause
              className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300"
              aria-hidden="true"
            />
          )}
        </button>
      )}

      <div
        className="carousel-3d-wrapper relative w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        style={{
          perspective: `${perspective}px`,
          perspectiveOrigin: '50% 50%',
          height: `${itemHeight * 1.5}px`,
        }}
      >
        {/* Carousel ring with 3D transforms */}
        <div
          className="carousel-ring relative w-full h-full transition-opacity duration-300 hover:opacity-100"
          style={{
            transformStyle: 'preserve-3d',
            transform: `translateZ(-${ringRadius}px)`,
            cursor: state.isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            willChange: 'transform',
            opacity: state.isDragging ? 0.95 : 1,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          aria-live="polite"
          aria-atomic="false"
        >
          {items.map((item, index) => {
            const transform = calculateItemTransform(
              index,
              items.length,
              state.rotation,
              ringRadius
            );
            const z = calculateZPosition(index, items.length, state.rotation, ringRadius);
            const { scale, opacity, zIndex } = calculateItemStyle(z, ringRadius);
            const isFocused = index === state.focusedIndex;

            return (
              <CarouselItem
                key={item.id}
                item={item}
                index={index}
                totalItems={items.length}
                rotation={state.rotation}
                ringRadius={ringRadius}
                itemWidth={itemWidth}
                itemHeight={itemHeight}
                isFocused={isFocused}
                onClick={() => handleItemClick(index)}
                transform={transform}
                scale={scale}
                opacity={opacity}
                zIndex={zIndex}
              />
            );
          })}
        </div>

        {/* Navigation Controls */}
        {showControls && (
          <CarouselControls
            onPrevious={goToPrevious}
            onNext={goToNext}
            disabled={state.isAnimating}
          />
        )}

        {/* Carousel Indicators */}
        {showIndicators && (
          <CarouselIndicators
            totalItems={items.length}
            activeIndex={state.focusedIndex}
            onIndicatorClick={goToIndex}
            disabled={state.isAnimating}
          />
        )}
      </div>
    </div>
  );
}
