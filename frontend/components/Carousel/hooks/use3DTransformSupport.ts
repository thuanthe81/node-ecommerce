/**
 * Hook for detecting browser 3D transform support
 */

import { useState, useEffect } from 'react';

/**
 * Detects if the browser supports CSS 3D transforms
 *
 * @returns true if 3D transforms are supported, false otherwise
 */
function detect3DTransformSupport(): boolean {
  if (typeof window === 'undefined') return false;

  const el = document.createElement('div');
  const transforms = [
    'transform',
    'WebkitTransform',
    'MozTransform',
    'msTransform',
    'OTransform',
  ];

  for (const transform of transforms) {
    if (el.style[transform as any] !== undefined) {
      el.style[transform as any] = 'translate3d(1px, 1px, 1px)';
      const has3D = window.getComputedStyle(el).getPropertyValue(transform);
      return has3D !== undefined && has3D.length > 0 && has3D !== 'none';
    }
  }

  return false;
}

/**
 * Custom hook to detect 3D transform support
 * Checks browser capabilities on mount and returns support status
 *
 * @returns true if 3D transforms are supported
 *
 * @example
 * ```typescript
 * function MyCarousel() {
 *   const supports3D = use3DTransformSupport();
 *
 *   if (!supports3D) {
 *     return <FallbackCarousel />;
 *   }
 *
 *   return <Carousel3D />;
 * }
 * ```
 */
export function use3DTransformSupport(): boolean {
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    setIsSupported(detect3DTransformSupport());
  }, []);

  return isSupported;
}
