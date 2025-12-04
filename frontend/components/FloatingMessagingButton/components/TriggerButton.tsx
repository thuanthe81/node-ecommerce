/**
 * TriggerButton Component
 * The fixed-position floating button that triggers the social media menu
 */

'use client';

import React from 'react';
import { SvgMessage, SvgClose } from '@/components/Svgs';
import { TriggerButtonProps } from '../types';

/**
 * TriggerButton - Fixed floating button component
 * Displays a messaging icon that transforms when menu is open
 * Handles click and keyboard interactions
 *
 * @param {TriggerButtonProps} props - Component props
 * @returns Rendered trigger button
 */
export function TriggerButton({ isOpen, onClick, ariaLabel }: TriggerButtonProps) {
  /**
   * Handle keyboard events for accessibility
   * Triggers onClick when Enter or Space is pressed
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel}
      aria-expanded={isOpen}
      className="
        relative
        w-14 h-14
        bg-blue-600 hover:bg-blue-700
        text-white
        rounded-full
        shadow-lg hover:shadow-xl
        transition-all duration-200 ease-in-out
        flex items-center justify-center
        focus:outline-none focus:ring-4 focus:ring-blue-300
        active:scale-95
        md:bottom-6 md:right-6
        max-md:bottom-4 max-md:right-4
        max-md:w-12 max-md:h-12
        max-sm:bottom-3 max-sm:right-3
        max-sm:w-11 max-sm:h-11
        max-[374px]:w-10 max-[374px]:h-10
        min-w-[44px] min-h-[44px]
        touch-manipulation
      "
      style={{
        WebkitTapHighlightColor: 'rgba(37, 99, 235, 0.1)',
      }}
    >
      {/* Icon transformation based on menu state */}
      <div
        className={`
          transition-transform duration-200 ease-in-out
          ${isOpen ? 'rotate-90' : 'rotate-0'}
        `}
      >
        {isOpen ? (
          <SvgClose
            className="
              w-6 h-6
              max-sm:w-5 max-sm:h-5
              max-[374px]:w-4 max-[374px]:h-4
            "
            aria-hidden="true"
          />
        ) : (
          <SvgMessage
            className="
              w-6 h-6
              max-sm:w-5 max-sm:h-5
              max-[374px]:w-4 max-[374px]:h-4
            "
            aria-hidden="true"
          />
        )}
      </div>
    </button>
  );
}
