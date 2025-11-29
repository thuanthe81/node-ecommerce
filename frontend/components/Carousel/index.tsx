'use client';

/**
 * Carousel Component - Main Entry Point
 *
 * This module provides a 3D carousel component with automatic fallback to 2D mode
 * for browsers that don't support 3D transforms or when there are fewer than 3 items.
 *
 * Features:
 * - 3D ring-based carousel with smooth animations
 * - Drag and touch interactions
 * - Keyboard navigation (Arrow keys, Escape)
 * - Auto-rotation with play/pause controls
 * - Responsive design (mobile, tablet, desktop)
 * - Accessibility support (ARIA labels, screen reader announcements)
 * - Graceful degradation to 2D slider
 * - Error boundary protection
 *
 * @module Carousel
 */

import { Carousel3DProps } from './types';
import { Carousel3DInternal } from './components/Carousel3D';
import { Carousel2D } from './components/Carousel2D';
import { use3DTransformSupport } from './hooks/use3DTransformSupport';
import CarouselErrorBoundary from '../Carousel3D/CarouselErrorBoundary';
import SimpleFallbackSlider from '../Carousel3D/SimpleFallbackSlider';

/**
 * Carousel3D Component
 *
 * A 3D carousel that displays items in a ring formation with rotation capabilities.
 * Automatically falls back to 2D mode if 3D transforms are not supported or if
 * there are fewer than 3 items.
 *
 * @param props - Configuration props for the carousel
 * @param props.items - Array of items to display in the carousel
 * @param props.autoRotate - Enable automatic rotation (default: false)
 * @param props.autoRotateInterval - Interval between rotations in milliseconds (default: 5000)
 * @param props.rotationSpeed - Rotation speed in degrees per interaction
 * @param props.ringRadius - Radius of the carousel ring in pixels
 * @param props.itemWidth - Width of each carousel item in pixels
 * @param props.itemHeight - Height of each carousel item in pixels
 * @param props.showControls - Show navigation controls (default: true)
 * @param props.showIndicators - Show position indicators (default: true)
 * @param props.className - Additional CSS class names
 *
 * @example
 * ```typescript
 * import Carousel3D from '@/components/Carousel';
 *
 * function MyPage() {
 *   const items = [
 *     { id: '1', imageUrl: '/image1.jpg', alt: 'Image 1', linkUrl: '/product/1' },
 *     { id: '2', imageUrl: '/image2.jpg', alt: 'Image 2', linkUrl: '/product/2' },
 *     { id: '3', imageUrl: '/image3.jpg', alt: 'Image 3', linkUrl: '/product/3' },
 *   ];
 *
 *   return (
 *     <Carousel3D
 *       items={items}
 *       autoRotate={true}
 *       autoRotateInterval={5000}
 *       showControls={true}
 *       showIndicators={true}
 *     />
 *   );
 * }
 * ```
 */
export function Carousel3D(props: Carousel3DProps) {
  const supports3D = use3DTransformSupport();

  // Use 2D fallback if 3D is not supported
  if (!supports3D) {
    return <Carousel2D {...props} />;
  }

  // Use simple fallback slider if fewer than 3 items
  if (props.items.length < 3) {
    return (
      <SimpleFallbackSlider
        items={props.items}
        itemWidth={props.itemWidth}
        itemHeight={props.itemHeight}
        autoSlide={props.autoRotate}
        autoSlideInterval={props.autoRotateInterval}
      />
    );
  }

  // Render 3D carousel with error boundary
  return (
    <CarouselErrorBoundary>
      <Carousel3DInternal {...props} />
    </CarouselErrorBoundary>
  );
}

// Export types
export type { CarouselItem, Carousel3DProps, CarouselState, ResponsiveConfig } from './types';

// Export components
export { Carousel2D } from './components/Carousel2D';

// Export hooks (for advanced usage)
export { useCarouselState } from './hooks/useCarouselState';
export { useAutoRotation } from './hooks/useAutoRotation';
export { useResponsiveConfig } from './hooks/useResponsiveConfig';
export { use3DTransformSupport } from './hooks/use3DTransformSupport';

// Export utilities (for advanced usage)
export {
  normalizeAngle,
  calculateItemTransform,
  calculateItemStyle,
  calculateZPosition,
  calculateFocusedIndex,
} from './utils/calculations';
export { easeInOutCubic, easeOutCubic } from './utils/easing';
export { throttle, debounce } from './utils/performance';
export { validateCarouselItems, isValidCarouselItem } from './utils/validation';

// Export constants
export { RESPONSIVE_CONFIG, DEFAULT_CONFIG } from './constants';

// Default export
export default Carousel3D;
