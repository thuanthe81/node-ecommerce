'use client';

/**
 * Carousel2D Component
 *
 * A 2D fallback carousel component for browsers that don't support 3D transforms
 * or when fewer than 3 items are present. Uses a simple slider implementation.
 *
 * @example
 * ```typescript
 * <Carousel2D
 *   items={carouselItems}
 *   autoRotate={true}
 *   autoRotateInterval={3000}
 * />
 * ```
 */

import { useMemo } from 'react';
import { Carousel3DProps } from '../types';
import { useResponsiveConfig } from '../hooks/useResponsiveConfig';
import { validateCarouselItems } from '../utils/validation';
import SimpleFallbackSlider from '../../Carousel3D/SimpleFallbackSlider';

/**
 * Carousel2D component - 2D fallback implementation
 *
 * @param props - Carousel3D props (subset used for 2D mode)
 */
export function Carousel2D({
  items: rawItems,
  itemWidth: propItemWidth,
  itemHeight: propItemHeight,
  autoRotate = true,
  autoRotateInterval = 3000,
}: Carousel3DProps) {
  const items = useMemo(() => validateCarouselItems(rawItems), [rawItems]);
  const responsiveConfig = useResponsiveConfig();
  const itemWidth = propItemWidth ?? responsiveConfig.itemWidth;
  const itemHeight = propItemHeight ?? responsiveConfig.itemHeight;

  return (
    <SimpleFallbackSlider
      items={items}
      itemWidth={itemWidth}
      itemHeight={itemHeight}
      autoSlide={autoRotate}
      autoSlideInterval={autoRotateInterval}
      fullWidth={true}
    />
  );
}
