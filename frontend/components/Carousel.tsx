/**
 * Carousel Component - Backward Compatibility Wrapper
 *
 * This file maintains backward compatibility by re-exporting the refactored
 * Carousel components. All new code should import from './Carousel/index' instead.
 */

// Re-export main components
export { default, Carousel3D, Carousel2D } from './Carousel/index';

// Re-export types
export type { CarouselItem, Carousel3DProps, CarouselState, ResponsiveConfig } from './Carousel/index';

// Re-export utility functions for backward compatibility
export {
  easeInOutCubic,
  easeOutCubic,
  normalizeAngle,
  calculateItemTransform,
  calculateItemStyle,
  calculateZPosition,
  calculateFocusedIndex,
} from './Carousel/index';
