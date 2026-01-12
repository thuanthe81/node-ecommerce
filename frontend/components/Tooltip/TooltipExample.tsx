'use client';

import React from 'react';
import { SvgMenu, SvgClose, SvgCart } from '../Svgs';

/**
 * Example component demonstrating tooltip functionality with SVG components
 * This is for testing and demonstration purposes
 */
export function TooltipExample() {
  return (
    <div className="p-8 space-y-4">
      <h2 className="text-xl font-bold mb-4">SVG Tooltip Examples</h2>

      <div className="flex space-x-4 items-center">
        <SvgMenu
          className="w-6 h-6 text-gray-600 hover:text-gray-800 cursor-pointer"
          tooltip="menu"
        />
        <span>Menu icon with tooltip</span>
      </div>

      <div className="flex space-x-4 items-center">
        <SvgClose
          className="w-6 h-6 text-gray-600 hover:text-gray-800 cursor-pointer"
          tooltip="close"
        />
        <span>Close icon with tooltip</span>
      </div>

      <div className="flex space-x-4 items-center">
        <SvgCart
          className="w-6 h-6 text-gray-600 hover:text-gray-800 cursor-pointer"
          tooltip="cart"
        />
        <span>Cart icon with tooltip</span>
      </div>

      <div className="flex space-x-4 items-center">
        <SvgMenu
          className="w-6 h-6 text-gray-600 hover:text-gray-800 cursor-pointer"
          tooltip="Custom tooltip text"
          tooltipPlacement="bottom"
        />
        <span>Menu with custom tooltip text and bottom placement</span>
      </div>

      <div className="flex space-x-4 items-center">
        <SvgCart
          className="w-6 h-6 text-gray-600 hover:text-gray-800 cursor-pointer"
          tooltip={{ en: "Shopping Cart", vi: "Giỏ hàng" }}
          tooltipDelay={100}
        />
        <span>Cart with translation object and faster delay</span>
      </div>
    </div>
  );
}