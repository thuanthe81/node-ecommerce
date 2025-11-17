'use client';

import { useCallback, memo } from 'react';

export interface CarouselIndicatorsProps {
  totalItems: number;
  activeIndex: number;
  onIndicatorClick: (index: number) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Indicators component for the 3D carousel
 * Displays dots representing each carousel item with click navigation
 */
function CarouselIndicators({
  totalItems,
  activeIndex,
  onIndicatorClick,
  disabled = false,
  className = '',
}: CarouselIndicatorsProps) {
  // Create array of indices for rendering dots
  const indicators = Array.from({ length: totalItems }, (_, i) => i);

  // Handle indicator click
  const handleClick = useCallback(
    (index: number) => (e: React.MouseEvent) => {
      e.preventDefault();
      if (!disabled) {
        onIndicatorClick(index);
      }
    },
    [disabled, onIndicatorClick]
  );

  return (
    <div
      className={`carousel-indicators absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-10 ${className}`}
      role="tablist"
      aria-label="Carousel navigation"
    >
      <div className="flex items-center justify-center gap-2 sm:gap-2.5 bg-black/30 dark:bg-black/50 backdrop-blur-md rounded-full px-4 sm:px-5 py-2.5 sm:py-3 shadow-lg border border-white/10">
        {indicators.map((index) => {
          const isActive = index === activeIndex;

          return (
            <button
              key={index}
              type="button"
              role="tab"
              aria-label={`Go to item ${index + 1}`}
              aria-selected={isActive}
              aria-controls={`carousel-item-${index}`}
              onClick={handleClick(index)}
              disabled={disabled}
              className={`
                carousel-indicator
                transition-all duration-300 ease-out
                rounded-full
                focus:outline-none focus:ring-2 focus:ring-white dark:focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black/30
                disabled:cursor-not-allowed disabled:opacity-50
                hover:scale-110 active:scale-95
                ${
                  isActive
                    ? 'w-8 sm:w-10 h-2.5 sm:h-3 bg-white dark:bg-blue-400 shadow-md shadow-white/50'
                    : 'w-2.5 sm:w-3 h-2.5 sm:h-3 bg-white/60 dark:bg-white/50 hover:bg-white/90 dark:hover:bg-white/80'
                }
              `}
            >
              <span className="sr-only">
                {isActive ? `Current item: ${index + 1}` : `Item ${index + 1}`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
// Only re-render when activeIndex or disabled state changes
export default memo(CarouselIndicators, (prevProps, nextProps) => {
  return (
    prevProps.activeIndex === nextProps.activeIndex &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.totalItems === nextProps.totalItems
  );
});
