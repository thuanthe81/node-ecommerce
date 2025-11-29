/**
 * Type definitions for Carousel components
 */

/**
 * Represents a single item in the carousel
 */
export interface CarouselItem {
  /** Unique identifier for the item */
  id: string;
  /** URL of the image to display */
  imageUrl: string;
  /** Alternative text for the image (accessibility) */
  alt: string;
  /** Optional URL to navigate to when item is clicked */
  linkUrl?: string;
  /** Optional title for the item */
  title?: string;
}

/**
 * Props for the Carousel3D component
 */
export interface Carousel3DProps {
  /** Array of items to display in the carousel */
  items: CarouselItem[];
  /** Enable automatic rotation */
  autoRotate?: boolean;
  /** Interval between rotations in milliseconds */
  autoRotateInterval?: number;
  /** Rotation speed in degrees per interaction */
  rotationSpeed?: number;
  /** Radius of the carousel ring in pixels */
  ringRadius?: number;
  /** Width of each carousel item in pixels */
  itemWidth?: number;
  /** Height of each carousel item in pixels */
  itemHeight?: number;
  /** Show navigation controls (prev/next buttons) */
  showControls?: boolean;
  /** Show position indicators */
  showIndicators?: boolean;
  /** Additional CSS class names */
  className?: string;
}

/**
 * Internal state for carousel rotation and interaction
 */
export interface CarouselState {
  /** Current rotation angle in degrees */
  rotation: number;
  /** Whether user is currently dragging */
  isDragging: boolean;
  /** X-coordinate where drag started */
  dragStartX: number;
  /** Rotation angle when drag started */
  dragStartRotation: number;
  /** Whether carousel is currently animating */
  isAnimating: boolean;
  /** Index of the currently focused item */
  focusedIndex: number;
}

/**
 * Responsive configuration for different screen sizes
 */
export interface ResponsiveConfig {
  /** Radius of the carousel ring in pixels */
  ringRadius: number;
  /** Width of each carousel item in pixels */
  itemWidth: number;
  /** Height of each carousel item in pixels */
  itemHeight: number;
  /** Sensitivity of drag interactions (higher = more sensitive) */
  dragSensitivity: number;
  /** CSS perspective value for 3D effect */
  perspective: number;
}
