/**
 * Carousel Component Types
 * Type definitions for the reusable Carousel component
 */

/**
 * Carousel image data structure
 */
export interface CarouselImage {
  id: string;
  url: string;
  altTextEn: string;
  altTextVi: string;
}

/**
 * Main Carousel component props
 */
export interface CarouselProps {
  /** Array of images to display in the carousel */
  images: CarouselImage[];

  // Display options
  /** Whether to show thumbnail strip below main image */
  showThumbnails?: boolean;
  /** Whether to show navigation controls (prev/next buttons) */
  showControls?: boolean;

  // Auto-advance configuration
  /** Enable automatic progression through images */
  autoAdvance?: boolean;
  /** Interval between auto-advances in milliseconds */
  autoAdvanceInterval?: number;
  /** Duration of slide transition animation in milliseconds */
  transitionDuration?: number;

  // Styling
  /** Additional CSS classes for the carousel container */
  className?: string;
  /** Aspect ratio for images */
  aspectRatio?: 'square' | 'video' | 'wide';

  // Accessibility
  /** ARIA label for the carousel */
  ariaLabel?: string;

  // Callbacks
  /** Callback fired when the current image changes */
  onImageChange?: (index: number) => void;
}

/**
 * Animation state for carousel transitions
 */
export interface AnimationState {
  /** Whether an animation is currently in progress */
  isAnimating: boolean;
  /** Direction of the current animation */
  animationDirection: 'next' | 'prev' | null;
  /** Current active image index */
  currentIndex: number;
}

/**
 * Image loading state tracking
 */
export interface ImageLoadingState {
  /** Set of image URLs that have successfully loaded */
  loadedImages: Set<string>;
  /** Set of image URLs that failed to load */
  failedImages: Set<string>;
}

/**
 * Auto-advance state tracking
 */
export interface AutoAdvanceState {
  /** Whether auto-advance is paused by user interaction */
  isPausedByUser: boolean;
  /** Whether the carousel is visible in the viewport */
  isVisible: boolean;
  /** Whether the user is hovering over the carousel */
  isHovered: boolean;
}

/**
 * Props for CarouselImage sub-component
 */
export interface CarouselImageProps {
  /** Image data to display */
  image: CarouselImage;
  /** Current locale for alt text selection */
  locale: string;
  /** Whether this image is currently active */
  isActive: boolean;
  /** Whether an animation is in progress */
  isAnimating: boolean;
  /** Direction of current animation */
  animationDirection: 'next' | 'prev' | null;
  /** Position of this image in the animation track */
  position: 'current' | 'next' | 'prev';
  /** Callback when image loads successfully */
  onLoad: () => void;
  /** Callback when image fails to load */
  onError: () => void;
}

/**
 * Props for CarouselControls sub-component
 */
export interface CarouselControlsProps {
  /** Callback for previous button click */
  onPrevious: () => void;
  /** Callback for next button click */
  onNext: () => void;
  /** Whether controls should be visible */
  isVisible: boolean;
  /** Whether controls are disabled (e.g., during animation) */
  disabled: boolean;
}

/**
 * Props for CarouselThumbnails sub-component
 */
export interface CarouselThumbnailsProps {
  /** Array of images to display as thumbnails */
  images: CarouselImage[];
  /** Index of the currently active image */
  currentIndex: number;
  /** Current locale for alt text selection */
  locale: string;
  /** Callback when a thumbnail is clicked */
  onThumbnailClick: (index: number) => void;
}

/**
 * Options for useAutoAdvance hook
 */
export interface UseAutoAdvanceOptions {
  /** Whether auto-advance is enabled */
  enabled: boolean;
  /** Interval between advances in milliseconds */
  interval: number;
  /** Whether auto-advance is paused by user interaction */
  isPaused: boolean;
  /** Whether the carousel is visible in viewport */
  isVisible: boolean;
  /** Whether user is hovering over carousel */
  isHovered: boolean;
  /** Whether an animation is currently in progress */
  isAnimating: boolean;
  /** Callback to execute on each advance */
  onAdvance: () => void;
}

/**
 * Options for useVisibilityDetection hook
 */
export interface UseVisibilityDetectionOptions {
  /** Ref to the element to observe */
  elementRef: React.RefObject<HTMLElement>;
  /** Callback when visibility changes */
  onVisibilityChange: (isVisible: boolean) => void;
}

/**
 * Return type for useCarouselAnimation hook
 */
export interface UseCarouselAnimationReturn {
  /** Current animation state */
  animationState: AnimationState;
  /** Navigate to next image */
  goToNext: () => Promise<void>;
  /** Navigate to previous image */
  goToPrevious: () => Promise<void>;
  /** Navigate to specific image by index */
  goToImage: (index: number) => void;
  /** Whether reduced motion is preferred */
  prefersReducedMotion: boolean;
}

/**
 * Return type for useImagePreloader hook
 */
export interface UseImagePreloaderReturn {
  /** Function to preload an image */
  preloadImage: (url: string) => Promise<void>;
  /** Set of successfully loaded image URLs */
  loadedImages: Set<string>;
  /** Set of failed image URLs */
  failedImages: Set<string>;
}
