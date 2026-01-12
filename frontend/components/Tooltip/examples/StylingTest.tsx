/**
 * Test component to verify enhanced tooltip styling
 */

import React from 'react';
import { SvgMenu, SvgCart, SvgHome, SvgSearch } from '@/components/Svgs';

export function TooltipStylingTest() {
  return (
    <div className="p-8 space-y-8 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Tooltip Styling Test</h2>

      {/* Test responsive sizing */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Responsive Text Sizing</h3>
        <div className="flex space-x-8 items-center">
          <SvgMenu
            tooltip="This is a short tooltip"
            className="w-8 h-8 cursor-pointer hover:text-blue-600"
          />
          <SvgCart
            tooltip="This is a much longer tooltip that should demonstrate responsive text sizing and wrapping behavior across different screen sizes"
            className="w-8 h-8 cursor-pointer hover:text-blue-600"
          />
        </div>
        <p className="text-sm text-gray-600">
          Hover over icons to see responsive text sizing (text-xs on mobile, text-sm on larger screens)
        </p>
      </section>

      {/* Test different placements */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Enhanced Visual Design</h3>
        <div className="flex justify-center space-x-12 py-8">
          <SvgHome
            tooltip="Top placement with enhanced shadow"
            tooltipPlacement="top"
            className="w-8 h-8 cursor-pointer hover:text-blue-600"
          />
          <SvgSearch
            tooltip="Bottom placement with rounded corners"
            tooltipPlacement="bottom"
            className="w-8 h-8 cursor-pointer hover:text-blue-600"
          />
          <SvgMenu
            tooltip="Left placement with improved typography"
            tooltipPlacement="left"
            className="w-8 h-8 cursor-pointer hover:text-blue-600"
          />
          <SvgCart
            tooltip="Right placement with consistent spacing"
            tooltipPlacement="right"
            className="w-8 h-8 cursor-pointer hover:text-blue-600"
          />
        </div>
        <p className="text-sm text-gray-600">
          Hover over icons to see enhanced visual design with improved shadows, typography, and spacing
        </p>
      </section>

      {/* Test edge positioning */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Edge Positioning Test</h3>
        <div className="relative border-2 border-dashed border-gray-300 h-32">
          {/* Top edge */}
          <SvgHome
            tooltip="Tooltip near top edge should position correctly"
            className="absolute top-2 left-1/2 transform -translate-x-1/2 w-6 h-6 cursor-pointer hover:text-blue-600"
          />

          {/* Right edge */}
          <SvgSearch
            tooltip="Tooltip near right edge should position correctly"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 cursor-pointer hover:text-blue-600"
          />

          {/* Bottom edge */}
          <SvgCart
            tooltip="Tooltip near bottom edge should position correctly"
            className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-6 h-6 cursor-pointer hover:text-blue-600"
          />

          {/* Left edge */}
          <SvgMenu
            tooltip="Tooltip near left edge should position correctly"
            className="absolute left-2 top-1/2 transform -translate-y-1/2 w-6 h-6 cursor-pointer hover:text-blue-600"
          />
        </div>
        <p className="text-sm text-gray-600">
          Hover over icons near edges to test intelligent positioning with 8px margins
        </p>
      </section>

      {/* Test accessibility */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Accessibility Test</h3>
        <div className="flex space-x-4">
          <button className="p-3 bg-blue-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            <SvgMenu
              tooltip="Keyboard accessible tooltip - try tabbing to this button"
              className="w-6 h-6"
            />
          </button>
          <button className="p-3 bg-green-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
            <SvgCart
              tooltip="Another keyboard accessible tooltip with proper ARIA attributes"
              className="w-6 h-6"
            />
          </button>
        </div>
        <p className="text-sm text-gray-600">
          Use Tab key to navigate and test keyboard accessibility
        </p>
      </section>

      {/* Design system consistency test */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Design System Consistency</h3>
        <div className="flex space-x-4 items-center">
          <button className="px-4 py-2 bg-gray-900 text-white rounded-lg shadow-lg">
            Regular Button
          </button>
          <SvgHome
            tooltip="This tooltip should match the button's styling"
            className="w-8 h-8 cursor-pointer hover:text-blue-600"
          />
        </div>
        <p className="text-sm text-gray-600">
          Compare tooltip styling with regular UI elements for consistency
        </p>
      </section>

      <div className="mt-8 p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">Styling Features Implemented</h3>
        <ul className="space-y-1 text-sm">
          <li>✅ Responsive text sizing (text-xs sm:text-sm)</li>
          <li>✅ Enhanced shadows and visual depth</li>
          <li>✅ Consistent colors with design system (bg-gray-900, text-white)</li>
          <li>✅ Improved typography (font-medium, leading-tight)</li>
          <li>✅ Rounded corners (rounded-lg)</li>
          <li>✅ Responsive max-width (max-w-xs sm:max-w-sm)</li>
          <li>✅ Smooth animations with reduced motion support</li>
          <li>✅ Proper spacing and margins</li>
          <li>✅ Dark mode and high contrast support</li>
          <li>✅ Print media hiding</li>
        </ul>
      </div>
    </div>
  );
}

export default TooltipStylingTest;