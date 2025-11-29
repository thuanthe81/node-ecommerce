'use client';

import { useCallback, memo } from 'react';
import { SvgChevronLeft, SvgChevronRight } from '../Svgs';

export interface CarouselControlsProps {
  onPrevious: () => void;
  onNext: () => void;
  disabled: boolean;
  className?: string;
}

/**
 * Navigation controls component for the 3D carousel
 * Provides previous/next buttons to rotate the carousel by one item position
 */
function CarouselControls({
  onPrevious,
  onNext,
  disabled,
  className = '',
}: CarouselControlsProps) {
  // Prevent button actions when disabled
  const handlePrevious = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (!disabled) {
        onPrevious();
      }
    },
    [disabled, onPrevious]
  );

  const handleNext = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (!disabled) {
        onNext();
      }
    },
    [disabled, onNext]
  );

  return (
    <div className={`carousel-controls absolute inset-0 pointer-events-none ${className}`}>
      {/* Previous button - left side */}
      <button
        type="button"
        onClick={handlePrevious}
        disabled={disabled}
        aria-label="Previous item"
        className={`
          carousel-control-btn carousel-control-prev
          absolute left-2 sm:left-4 top-1/2 -translate-y-1/2
          pointer-events-auto
          w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full
          bg-white/95 dark:bg-gray-800/95
          hover:bg-white dark:hover:bg-gray-800
          hover:scale-110 active:scale-95
          shadow-lg hover:shadow-2xl
          flex items-center justify-center
          transition-all duration-300 ease-out
          focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900
          disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/95 dark:disabled:hover:bg-gray-800/95 disabled:hover:scale-100
          backdrop-blur-sm
          border border-gray-200 dark:border-gray-700
          group
          z-10
        `}
      >
        <SvgChevronLeft
          strokeWidth={2.5}
          className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300"
        />
      </button>

      {/* Next button - right side */}
      <button
        type="button"
        onClick={handleNext}
        disabled={disabled}
        aria-label="Next item"
        className={`
          carousel-control-btn carousel-control-next
          absolute right-2 sm:right-4 top-1/2 -translate-y-1/2
          pointer-events-auto
          w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full
          bg-white/95 dark:bg-gray-800/95
          hover:bg-white dark:hover:bg-gray-800
          hover:scale-110 active:scale-95
          shadow-lg hover:shadow-2xl
          flex items-center justify-center
          transition-all duration-300 ease-out
          focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900
          disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/95 dark:disabled:hover:bg-gray-800/95 disabled:hover:scale-100
          backdrop-blur-sm
          border border-gray-200 dark:border-gray-700
          group
          z-10
        `}
      >
        <SvgChevronRight
          strokeWidth={2.5}
          className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300"
        />
      </button>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
// Only re-render when disabled state changes
export default memo(CarouselControls, (prevProps, nextProps) => {
  return prevProps.disabled === nextProps.disabled;
});
