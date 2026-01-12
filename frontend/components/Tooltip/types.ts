import React from 'react';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right' | 'auto';

export interface TooltipProps {
  content: string | React.ReactNode;
  placement?: TooltipPlacement;
  className?: string;
  id?: string;
}

export interface SvgTooltipProps {
  tooltip?: string | { en: string; vi: string };
  tooltipPlacement?: TooltipPlacement;
}

// Legacy interfaces kept for backward compatibility
export interface TooltipState {
  isVisible: boolean;
  content: string;
  position: {
    x: number;
    y: number;
  };
  placement: TooltipPlacement;
  targetElement: HTMLElement | null;
}

export interface UseTooltipReturn {
  isVisible: boolean;
  position: { x: number; y: number };
  placement: TooltipPlacement;
  showTooltip: (event: React.MouseEvent) => void;
  hideTooltip: () => void;
  tooltipProps: {
    onMouseEnter: (event: React.MouseEvent) => void;
    onMouseLeave: () => void;
    onFocus: (event: React.FocusEvent) => void;
    onBlur: () => void;
    'aria-describedby'?: string;
  };
}