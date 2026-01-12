/**
 * Examples demonstrating how to use the tooltip system with translation integration
 */

import React from 'react';
import { SvgMenu, SvgCart, SvgHome, SvgSearch, SvgUser } from '@/components/Svgs';
import { createTooltipContent, COMMON_TOOLTIP_KEYS } from '../utils/tooltipUtils';

export function TooltipUsageExamples() {
  return (
    <div className="p-8 space-y-8">
      <h2 className="text-2xl font-bold mb-4">Tooltip Usage Examples</h2>

      {/* Example 1: Using translation keys */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">1. Using Translation Keys</h3>
        <div className="flex space-x-4">
          <SvgMenu
            tooltip={COMMON_TOOLTIP_KEYS.MENU}
            className="w-6 h-6 cursor-pointer hover:text-blue-600"
          />
          <SvgCart
            tooltip={COMMON_TOOLTIP_KEYS.CART}
            className="w-6 h-6 cursor-pointer hover:text-blue-600"
          />
          <SvgHome
            tooltip={COMMON_TOOLTIP_KEYS.HOME}
            className="w-6 h-6 cursor-pointer hover:text-blue-600"
          />
        </div>
        <p className="text-sm text-gray-600">
          These icons use predefined translation keys that automatically resolve to the current locale.
        </p>
      </section>

      {/* Example 2: Using direct string content */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">2. Using Direct String Content</h3>
        <div className="flex space-x-4">
          <SvgSearch
            tooltip="Search for products"
            className="w-6 h-6 cursor-pointer hover:text-blue-600"
          />
          <SvgUser
            tooltip="View your profile"
            className="w-6 h-6 cursor-pointer hover:text-blue-600"
          />
        </div>
        <p className="text-sm text-gray-600">
          These icons use direct string content that will be displayed as-is.
        </p>
      </section>

      {/* Example 3: Using translation objects */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">3. Using Translation Objects</h3>
        <div className="flex space-x-4">
          <SvgMenu
            tooltip={createTooltipContent('Open menu', 'Mở menu')}
            className="w-6 h-6 cursor-pointer hover:text-blue-600"
          />
          <SvgCart
            tooltip={createTooltipContent('View shopping cart', 'Xem giỏ hàng')}
            className="w-6 h-6 cursor-pointer hover:text-blue-600"
          />
        </div>
        <p className="text-sm text-gray-600">
          These icons use translation objects that provide content for both English and Vietnamese.
        </p>
      </section>

      {/* Example 4: Custom placement and timing */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">4. Custom Placement and Timing</h3>
        <div className="flex space-x-4">
          <SvgHome
            tooltip={COMMON_TOOLTIP_KEYS.HOME}
            tooltipPlacement="top"
            className="w-6 h-6 cursor-pointer hover:text-blue-600"
          />
          <SvgSearch
            tooltip={COMMON_TOOLTIP_KEYS.SEARCH}
            tooltipPlacement="bottom"
            className="w-6 h-6 cursor-pointer hover:text-blue-600"
          />
          <SvgUser
            tooltip={COMMON_TOOLTIP_KEYS.USER}
            tooltipPlacement="left"
            className="w-6 h-6 cursor-pointer hover:text-blue-600"
          />
        </div>
        <p className="text-sm text-gray-600">
          These icons demonstrate custom tooltip placement and timing options.
        </p>
      </section>

      {/* Example 5: Accessibility features */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">5. Accessibility Features</h3>
        <div className="flex space-x-4">
          <button className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
            <SvgMenu
              tooltip={COMMON_TOOLTIP_KEYS.MENU}
              className="w-6 h-6"
            />
          </button>
          <button className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
            <SvgCart
              tooltip={COMMON_TOOLTIP_KEYS.CART}
              className="w-6 h-6"
            />
          </button>
        </div>
        <p className="text-sm text-gray-600">
          These buttons demonstrate keyboard accessibility - tooltips appear on focus as well as hover.
        </p>
      </section>

      {/* Usage instructions */}
      <section className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Usage Instructions</h3>
        <ul className="space-y-2 text-sm">
          <li><strong>Translation Keys:</strong> Use predefined keys from COMMON_TOOLTIP_KEYS for consistent translations</li>
          <li><strong>Direct Strings:</strong> Use for custom content that doesn't need translation</li>
          <li><strong>Translation Objects:</strong> Use createTooltipContent() for custom bilingual content</li>
          <li><strong>Placement:</strong> Use tooltipPlacement prop to control tooltip position (auto, top, bottom, left, right)</li>
          <li><strong>Accessibility:</strong> Tooltips automatically include ARIA attributes and keyboard support</li>
        </ul>
      </section>
    </div>
  );
}

export default TooltipUsageExamples;