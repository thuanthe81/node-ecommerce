# SVG Components Tooltip Integration

This document describes the tooltip integration for SVG components in the application.

## Overview

All SVG components in `Svgs.tsx` now support tooltip functionality through the tooltip system. When users hover over or focus on an SVG icon, a tooltip will appear showing descriptive text in the current locale.

## Features

- **Automatic Translation**: Tooltips are automatically translated based on the current locale (English/Vietnamese)
- **Intelligent Positioning**: Tooltips automatically position themselves to avoid screen edges
- **Accessibility**: Full keyboard navigation and screen reader support
- **Customizable**: Placement, delay, and content can be customized
- **Backward Compatible**: Existing SVG usage continues to work without changes

## Usage

### Basic Usage

```tsx
import { SvgMenu, SvgCart, SvgUser } from './Svgs';

// Using translation keys (recommended)
<SvgMenu tooltip="tooltips.menu" />
<SvgCart tooltip="tooltips.cart" />
<SvgUser tooltip="tooltips.user" />
```

### Advanced Usage

```tsx
// Custom placement
<SvgMenu tooltip="tooltips.menu" tooltipPlacement="top" />

// Custom delay
<SvgMenu tooltip="tooltips.menu" tooltipDelay={500} />

// Auto placement (intelligent positioning)
<SvgMenu tooltip="tooltips.menu" tooltipPlacement="auto" />

// Direct text (not recommended - use translation keys instead)
<SvgMenu tooltip="Menu" />

// Translation object
<SvgMenu tooltip={{ en: "Menu", vi: "Menu" }} />
```

### Without Tooltips

```tsx
// Works exactly as before
<SvgMenu className="w-6 h-6" />
```

## Available Tooltip Translation Keys

All tooltip translations are stored in `frontend/locales/translations.json` under the `tooltips` section:

```json
{
  "tooltips": {
    "menu": { "en": "Menu", "vi": "Menu" },
    "close": { "en": "Close", "vi": "Đóng" },
    "cart": { "en": "Shopping Cart", "vi": "Giỏ hàng" },
    "home": { "en": "Home", "vi": "Trang chủ" },
    // ... and many more
  }
}
```

## Supported SVG Components

All SVG components in `Svgs.tsx` support tooltips:

### Navigation & UI
- `SvgMenu`, `SvgClose`, `SvgHome`, `SvgSearch`, `SvgSettings`
- `SvgChevronLeft`, `SvgChevronRight`, `SvgChevronDown`
- `SvgArrowLeft`, `SvgArrowRight`, `SvgX`

### Actions & Status
- `SvgPlus`, `SvgTrash`, `SvgEdit`, `SvgCheck`, `SvgRefresh`
- `SvgCheckCircle`, `SvgXCircle`, `SvgExclamationCircle`
- `SvgSpinner`, `SvgUpload`, `SvgDownload`

### E-commerce
- `SvgCart`, `SvgShoppingBag`, `SvgCreditCard`, `SvgBankCard`
- `SvgTruck`, `SvgQrCode`, `SvgCurrency`

### Communication
- `SvgEmail`, `SvgPhone`, `SvgLocation`, `SvgMessage`, `SvgMail`

### Social Media
- `SvgFacebook`, `SvgTwitter`, `SvgTikTok`, `SvgWhatsApp`, `SvgZalo`

### Content & Media
- `SvgImage`, `SvgFile`, `SvgFolder`, `SvgDocument`, `SvgImageUpload`
- `SvgPlay`, `SvgPause`, `SvgPrint`

### Admin & Analytics
- `SvgUsers`, `SvgChart`, `SvgClipboard`, `SvgGrid`, `SvgViewList`
- `SvgCalendar`, `SvgClock`, `SvgTag`

### Authentication
- `SvgUser`, `SvgLogin`, `SvgLogout`, `SvgLock`

### Technical
- `SvgGoogle`, `SvgNext`, `SvgVercel`, `SvgWindow`, `SvgGlobe`

## Implementation Details

### SvgWithTooltip Wrapper

All SVG components use the `SvgWithTooltip` wrapper component that:

1. Resolves tooltip content using translation keys
2. Manages tooltip state and positioning
3. Handles accessibility attributes
4. Provides hover and focus event handling

### Special Cases

#### SvgZalo Component

The `SvgZalo` component uses an `Image` component instead of SVG, so it has a custom tooltip implementation:

```tsx
export const SvgZalo = ({ tooltip, tooltipPlacement, tooltipDelay, ...props }) => {
  const tooltipContent = useTooltipContent(tooltip);
  const { isVisible, position, tooltipProps } = useTooltip(tooltipContent, tooltipDelay, tooltipPlacement);

  return (
    <>
      <Image {...props} {...(tooltip ? tooltipProps : {})} />
      {tooltip && <Tooltip ... />}
    </>
  );
};
```

## Accessibility

The tooltip system includes comprehensive accessibility features:

- **ARIA Attributes**: `aria-describedby` links tooltips to trigger elements
- **Keyboard Navigation**: Tooltips show on focus and hide on blur
- **Screen Reader Support**: `role="tooltip"` for proper announcement
- **Motion Preferences**: Respects `prefers-reduced-motion` setting

## Best Practices

1. **Use Translation Keys**: Always use translation keys instead of hardcoded text
2. **Auto Placement**: Use `tooltipPlacement="auto"` for intelligent positioning
3. **Consistent Delays**: Use default delays unless specific timing is needed
4. **Meaningful Content**: Ensure tooltip text is concise and helpful
5. **Test Accessibility**: Verify tooltips work with keyboard navigation and screen readers

## Examples

See `Svgs-usage-examples.tsx` for comprehensive usage examples including:

- Basic tooltip usage
- Advanced configurations
- Different placement options
- Social media icons
- Status indicators
- E-commerce components
- Contact information icons

## Migration

Existing SVG component usage requires no changes. To add tooltips:

```tsx
// Before
<SvgMenu className="w-6 h-6" />

// After (with tooltip)
<SvgMenu tooltip="tooltips.menu" className="w-6 h-6" />
```

## Testing

The tooltip integration includes comprehensive tests in:

- `__tests__/components/Tooltip.test.tsx`
- `__tests__/components/useTooltip.test.tsx`
- `__tests__/components/SvgTooltipIntegration.test.tsx`
- `__tests__/components/TooltipTranslationIntegration.test.tsx`

Run tests with:

```bash
npm test -- --testPathPattern="Tooltip|Svg"
```