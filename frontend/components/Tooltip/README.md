# Tooltip System with Translation Integration

This tooltip system provides comprehensive support for internationalization with both English and Vietnamese translations, along with flexible content handling and accessibility features.

## Features

- ✅ **Translation Support**: Automatic resolution of translation keys and locale-specific content
- ✅ **Content Flexibility**: Support for string content, translation keys, and translation objects
- ✅ **Intelligent Positioning**: Auto-placement with viewport edge detection
- ✅ **Accessibility**: Full keyboard navigation and ARIA support
- ✅ **Motion Preferences**: Respects user's reduced motion preferences
- ✅ **TypeScript**: Full type safety with comprehensive interfaces

## Quick Start

### Basic Usage with Translation Keys

```tsx
import { SvgMenu } from '@/components/Svgs';
import { COMMON_TOOLTIP_KEYS } from '@/components/Tooltip';

function MyComponent() {
  return (
    <SvgMenu
      tooltip={COMMON_TOOLTIP_KEYS.MENU}
      className="w-6 h-6 cursor-pointer"
    />
  );
}
```

### Custom Bilingual Content

```tsx
import { SvgCart } from '@/components/Svgs';
import { createTooltipContent } from '@/components/Tooltip';

function MyComponent() {
  return (
    <SvgCart
      tooltip={createTooltipContent('Shopping Cart', 'Giỏ hàng')}
      tooltipPlacement="top"
      className="w-6 h-6 cursor-pointer"
    />
  );
}
```

### Direct String Content

```tsx
import { SvgSearch } from '@/components/Svgs';

function MyComponent() {
  return (
    <SvgSearch
      tooltip="Search for products"
      className="w-6 h-6 cursor-pointer"
    />
  );
}
```

## Translation System

### Translation Keys

The system supports predefined translation keys that automatically resolve to the current locale:

```tsx
import { COMMON_TOOLTIP_KEYS } from '@/components/Tooltip';

// Available keys:
COMMON_TOOLTIP_KEYS.MENU        // 'menu'
COMMON_TOOLTIP_KEYS.CLOSE       // 'close'
COMMON_TOOLTIP_KEYS.CART        // 'cart'
COMMON_TOOLTIP_KEYS.HOME        // 'home'
COMMON_TOOLTIP_KEYS.SEARCH      // 'search'
// ... and more
```

### Adding New Translations

Add new tooltip translations to `frontend/locales/translations.json`:

```json
{
  "tooltips": {
    "myNewTooltip": {
      "en": "My New Tooltip",
      "vi": "Tooltip Mới Của Tôi"
    }
  }
}
```

### Content Resolution Priority

The system resolves tooltip content in this order:

1. **Translation Key**: If the string matches a key in translations, use the translated value
2. **Direct String**: If no translation key found, use the string as-is
3. **Translation Object**: For `{ en: string, vi: string }` objects, use the current locale
4. **Fallback**: Default to English if locale is not supported

## API Reference

### SvgTooltipProps

```tsx
interface SvgTooltipProps {
  tooltip?: string | { en: string; vi: string };
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  tooltipDelay?: number;
}
```

### Utility Functions

#### useTooltipContentResolver()

```tsx
function useTooltipContentResolver(): (
  tooltip?: string | { en: string; vi: string }
) => string | undefined;
```

Hook that returns a function to resolve tooltip content based on current locale.

#### createTooltipContent(en, vi)

```tsx
function createTooltipContent(
  en: string,
  vi: string
): { en: string; vi: string };
```

Helper function to create translation objects.

#### isValidTooltipContent(content)

```tsx
function isValidTooltipContent(
  content: unknown
): content is string | { en: string; vi: string };
```

Type guard to validate tooltip content structure.

## Positioning

### Auto Placement (Default)

The tooltip automatically chooses the best position based on available space:

```tsx
<SvgMenu tooltip="Menu" tooltipPlacement="auto" />
```

### Manual Placement

Force a specific position:

```tsx
<SvgMenu tooltip="Menu" tooltipPlacement="top" />
<SvgMenu tooltip="Menu" tooltipPlacement="bottom" />
<SvgMenu tooltip="Menu" tooltipPlacement="left" />
<SvgMenu tooltip="Menu" tooltipPlacement="right" />
```

### Viewport Constraints

- Tooltips maintain a minimum 8px margin from screen edges
- Automatic repositioning when the preferred placement doesn't fit
- Intelligent fallback positioning for edge cases

## Timing and Animation

### Default Timing

- **Show delay**: 200ms (as per requirements)
- **Hide delay**: 100ms (as per requirements)

### Custom Timing

```tsx
<SvgMenu
  tooltip="Menu"
  tooltipDelay={500} // Custom show delay
/>
```

### Reduced Motion Support

The system automatically respects the user's `prefers-reduced-motion` setting:

- Reduces show/hide delays significantly
- Maintains functionality while being less visually distracting

## Accessibility

### ARIA Support

- Automatic `aria-describedby` linking
- Proper `role="tooltip"` attributes
- Screen reader compatible

### Keyboard Navigation

- Tooltips appear on focus events
- Tooltips hide on blur events
- Full keyboard accessibility

### Example with Button

```tsx
<button className="p-2 focus:outline-none focus:ring-2">
  <SvgMenu tooltip={COMMON_TOOLTIP_KEYS.MENU} />
</button>
```

## Styling

### Default Styles

Tooltips use Tailwind CSS classes for consistent styling:

```css
.tooltip {
  @apply bg-gray-900 text-white text-sm px-2 py-1 rounded shadow-lg;
  @apply pointer-events-none select-none;
  @apply transition-opacity duration-200;
  @apply z-50 absolute;
  @apply max-w-xs break-words;
}
```

### Custom Styling

Pass custom classes through the `className` prop on the SVG component:

```tsx
<SvgMenu
  tooltip="Menu"
  className="w-8 h-8 text-blue-600 hover:text-blue-800"
/>
```

## Testing

### Unit Tests

The system includes comprehensive unit tests for:

- Translation resolution
- Content type handling
- Locale switching
- Utility functions

### Example Test

```tsx
import { useTooltipContentResolver } from '@/components/Tooltip';

test('resolves translation keys correctly', () => {
  const resolveContent = useTooltipContentResolver();
  const content = resolveContent('menu');
  expect(content).toBe('Menu');
});
```

## Best Practices

### 1. Use Translation Keys for Common Icons

```tsx
// ✅ Good - uses predefined translation key
<SvgMenu tooltip={COMMON_TOOLTIP_KEYS.MENU} />

// ❌ Avoid - hardcoded text
<SvgMenu tooltip="Menu" />
```

### 2. Create Translation Objects for Custom Content

```tsx
// ✅ Good - supports both languages
<SvgCustom tooltip={createTooltipContent('Custom Action', 'Hành động tùy chỉnh')} />

// ❌ Avoid - English only
<SvgCustom tooltip="Custom Action" />
```

### 3. Validate Content in Development

```tsx
import { isValidTooltipContent } from '@/components/Tooltip';

const tooltipContent = getTooltipFromAPI();
if (!isValidTooltipContent(tooltipContent)) {
  console.warn('Invalid tooltip content:', tooltipContent);
}
```

### 4. Use Auto Placement for Flexibility

```tsx
// ✅ Good - adapts to available space
<SvgMenu tooltip="Menu" tooltipPlacement="auto" />

// ⚠️ Use sparingly - may be cut off
<SvgMenu tooltip="Menu" tooltipPlacement="top" />
```

## Migration Guide

### From Basic Tooltips

If you have existing tooltip implementations:

```tsx
// Before
<div title="Menu">
  <SvgMenu />
</div>

// After
<SvgMenu tooltip={COMMON_TOOLTIP_KEYS.MENU} />
```

### Adding Translations

1. Add translation keys to `translations.json`
2. Update components to use translation keys
3. Test both English and Vietnamese locales

## Troubleshooting

### Common Issues

**Tooltip not showing:**
- Check that content is not empty or undefined
- Verify the element is focusable or hoverable
- Ensure proper event handlers are attached

**Wrong language displayed:**
- Verify current locale is set correctly
- Check translation keys exist in translations.json
- Confirm useLocale() returns expected value

**Positioning issues:**
- Use 'auto' placement for most cases
- Check viewport constraints (8px margins)
- Verify target element has proper positioning

### Debug Mode

Enable debug logging in development:

```tsx
// Add to your component for debugging
useEffect(() => {
  console.log('Current locale:', useLocale());
  console.log('Tooltip content:', resolveContent(tooltip));
}, [tooltip]);
```

## Contributing

When adding new tooltip functionality:

1. Add comprehensive tests
2. Update translations for both languages
3. Follow existing naming conventions
4. Document new features in this README
5. Ensure accessibility compliance

## Requirements Validation

This implementation satisfies all requirements:

- ✅ **2.4**: Support both string and translated tooltip content
- ✅ **3.1**: Support English and Vietnamese translations
- ✅ **3.2**: Locale-aware tooltip content resolution
- ✅ **Translation Integration**: Seamless integration with next-intl
- ✅ **Content Flexibility**: Multiple content type support
- ✅ **Type Safety**: Full TypeScript support