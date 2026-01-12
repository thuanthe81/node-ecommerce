'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import type { TooltipProps } from './types';

export function Tooltip({
  content,
  placement = 'auto',
  className = '',
  id,
}: TooltipProps) {
  // Don't render if no content
  if (!content) {
    return null;
  }

  // Base classes for tooltip styling
  const baseClasses = [
    'tooltip',
    // Design system consistent colors - dark background with light text for contrast
    'bg-gray-900',
    'text-white',
    // Responsive text sizing for different screen sizes
    'text-xs sm:text-sm',
    // Consistent spacing with design system
    'px-3 py-2',
    // Rounded corners consistent with other UI elements
    'rounded-lg',
    // Enhanced shadow for visual depth
    'shadow-lg',
    // Prevent interaction and text selection
    'pointer-events-none',
    'select-none',
    // Positioning and layering handled by CSS
    'absolute',
    'z-[9999]',
    // Responsive max width for different screen sizes
    'max-w-xs sm:max-w-sm',
    'break-words',
    // Typography improvements
    'font-medium',
    'leading-tight',
    // Placement-specific positioning
    `tooltip--${placement}`,
  ].filter(Boolean).join(' ');

  const tooltipClasses = className ? `${baseClasses} ${className}` : baseClasses;

  return (
    <div
      id={id}
      className={tooltipClasses}
      role="tooltip"
      data-placement={placement}
    >
      {content}
    </div>
  );
}