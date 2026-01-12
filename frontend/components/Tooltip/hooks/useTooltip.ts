'use client';

import { useState, useCallback, useRef, useId, useEffect } from 'react';
import { useLocale } from 'next-intl';
import type { UseTooltipReturn, TooltipPlacement } from '../types';

const SHOW_DELAY = 200; // 200ms show delay as per requirements
const HIDE_DELAY = 100; // 100ms hide delay as per requirements
const VIEWPORT_MARGIN = 8; // 8px margin from screen edges as per requirements

interface CalculatePositionParams {
  triggerRect: DOMRect;
  tooltipRect: DOMRect;
  placement: TooltipPlacement;
  viewport: { width: number; height: number };
}

function calculatePosition({
  triggerRect,
  tooltipRect,
  placement,
  viewport,
}: CalculatePositionParams): { x: number; y: number; finalPlacement: TooltipPlacement } {
  let x = 0;
  let y = 0;
  let finalPlacement = placement;

  // Calculate initial position based on placement
  switch (placement) {
    case 'top':
      x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
      y = triggerRect.top - tooltipRect.height - VIEWPORT_MARGIN;
      break;
    case 'bottom':
      x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
      y = triggerRect.bottom + VIEWPORT_MARGIN;
      break;
    case 'left':
      x = triggerRect.left - tooltipRect.width - VIEWPORT_MARGIN;
      y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
      break;
    case 'right':
      x = triggerRect.right + VIEWPORT_MARGIN;
      y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
      break;
    case 'auto':
    default:
      // Auto placement - choose the best position
      const spaceTop = triggerRect.top;
      const spaceBottom = viewport.height - triggerRect.bottom;
      const spaceLeft = triggerRect.left;
      const spaceRight = viewport.width - triggerRect.right;

      // Prefer top/bottom over left/right for better readability
      if (spaceTop >= tooltipRect.height + VIEWPORT_MARGIN) {
        finalPlacement = 'top';
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        y = triggerRect.top - tooltipRect.height - VIEWPORT_MARGIN;
      } else if (spaceBottom >= tooltipRect.height + VIEWPORT_MARGIN) {
        finalPlacement = 'bottom';
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        y = triggerRect.bottom + VIEWPORT_MARGIN;
      } else if (spaceRight >= tooltipRect.width + VIEWPORT_MARGIN) {
        finalPlacement = 'right';
        x = triggerRect.right + VIEWPORT_MARGIN;
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
      } else if (spaceLeft >= tooltipRect.width + VIEWPORT_MARGIN) {
        finalPlacement = 'left';
        x = triggerRect.left - tooltipRect.width - VIEWPORT_MARGIN;
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
      } else {
        // Fallback to top-right with safe margins
        finalPlacement = 'top';
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        y = triggerRect.top - tooltipRect.height - VIEWPORT_MARGIN;
      }
      break;
  }

  // Ensure tooltip stays within viewport bounds with margin
  if (x < VIEWPORT_MARGIN) {
    x = VIEWPORT_MARGIN;
  } else if (x + tooltipRect.width > viewport.width - VIEWPORT_MARGIN) {
    x = viewport.width - tooltipRect.width - VIEWPORT_MARGIN;
  }

  if (y < VIEWPORT_MARGIN) {
    y = VIEWPORT_MARGIN;
  } else if (y + tooltipRect.height > viewport.height - VIEWPORT_MARGIN) {
    y = viewport.height - tooltipRect.height - VIEWPORT_MARGIN;
  }

  return { x, y, finalPlacement };
}

export function useTooltip(
  content?: string,
  delay: number = SHOW_DELAY,
  placement: TooltipPlacement = 'auto'
): UseTooltipReturn {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [finalPlacement, setFinalPlacement] = useState<TooltipPlacement>(placement);
  const locale = useLocale(); // Get current locale for tooltip content resolution

  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipId = useId();

  // Check for reduced motion preference to adjust timing
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const clearTimeouts = useCallback(() => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const showTooltip = useCallback((event: React.MouseEvent) => {
    if (!content) return;

    clearTimeouts();

    // Respect reduced motion preference - reduce or eliminate delays
    const effectiveDelay = prefersReducedMotion ? Math.min(delay, 50) : delay;

    showTimeoutRef.current = setTimeout(() => {
      const target = event.currentTarget as HTMLElement;
      if (!target) return; // Guard against null target

      const triggerRect = target.getBoundingClientRect();

      // Create a temporary element to measure tooltip dimensions
      const tempTooltip = document.createElement('div');
      tempTooltip.className = 'tooltip bg-gray-900 text-white text-xs sm:text-sm px-3 py-2 rounded-lg shadow-lg pointer-events-none select-none absolute opacity-0 z-[9999] max-w-xs sm:max-w-sm break-words font-medium leading-tight mx-2';
      tempTooltip.textContent = typeof content === 'string' ? content : '';
      tempTooltip.style.visibility = 'hidden';
      document.body.appendChild(tempTooltip);

      const tooltipRect = tempTooltip.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      const { x, y, finalPlacement: calculatedPlacement } = calculatePosition({
        triggerRect,
        tooltipRect,
        placement,
        viewport,
      });

      document.body.removeChild(tempTooltip);

      setPosition({ x, y });
      setFinalPlacement(calculatedPlacement);
      setIsVisible(true);
    }, effectiveDelay);
  }, [content, delay, placement, clearTimeouts, prefersReducedMotion]);

  const hideTooltip = useCallback(() => {
    clearTimeouts();

    // Respect reduced motion preference - reduce or eliminate hide delay
    const effectiveHideDelay = prefersReducedMotion ? Math.min(HIDE_DELAY, 25) : HIDE_DELAY;

    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, effectiveHideDelay);
  }, [clearTimeouts, prefersReducedMotion]);

  const handleMouseEnter = useCallback((event: React.MouseEvent) => {
    console.log("Hover")
    showTooltip(event);
  }, [showTooltip]);

  const handleMouseLeave = useCallback(() => {
    console.log("Leave")
    hideTooltip();
  }, [hideTooltip]);

  const handleFocus = useCallback((event: React.FocusEvent) => {
    // Convert FocusEvent to MouseEvent-like object for positioning
    const mouseEvent = {
      currentTarget: event.currentTarget,
    } as React.MouseEvent;
    showTooltip(mouseEvent);
  }, [showTooltip]);

  const handleBlur = useCallback(() => {
    hideTooltip();
  }, [hideTooltip]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      clearTimeouts();
    };
  }, [clearTimeouts]);

  return {
    isVisible,
    position,
    placement: finalPlacement,
    showTooltip,
    hideTooltip,
    tooltipProps: {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onFocus: handleFocus,
      onBlur: handleBlur,
      'aria-describedby': content ? tooltipId : undefined,
    },
  };
}