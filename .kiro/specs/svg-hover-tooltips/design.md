# Design Document

## Overview

This design implements a simple, accessible tooltip system for SVG components. The solution enhances existing SVG components with optional tooltip functionality while maintaining backward compatibility and following React best practices.

## Architecture

The tooltip system consists of two main components:

1. **CSS-based Tooltip System** - Pure CSS hover-based tooltips with intelligent positioning
2. **Enhanced SVG Components** - Modified SVG components that render tooltip elements alongside SVG content

The architecture follows a CSS-first approach where tooltips are shown/hidden using CSS `:hover` pseudo-classes, eliminating JavaScript event handling for better performance and simplicity. Tooltips are opt-in via props, ensuring existing implementations continue to work unchanged.

## Components and Interfaces

### CSS Tooltip System

The tooltip system uses pure CSS for show/hide behavior:

```css
.svg-tooltip-container {
  position: relative;
  display: inline-block;
}

.svg-tooltip-container .tooltip {
  visibility: hidden;
  opacity: 0;
  position: absolute;
  z-index: 9999;
  transition: opacity 0.2s, visibility 0.2s;
}

.svg-tooltip-container:hover .tooltip {
  visibility: visible;
  opacity: 1;
}
```

### Enhanced SVG Props

```typescript
interface SvgTooltipProps {
  tooltip?: string | { en: string; vi: string };
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
}

export type SvgProps = React.SVGProps<SVGSVGElement> & SvgTooltipProps;
```

### Tooltip Component (Simplified)

```typescript
interface TooltipProps {
  content: string | React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ content, placement = 'auto', className }) => {
  // Simplified implementation - no state management needed
};
```

## Data Models

### Tooltip State

```typescript
interface TooltipState {
  isVisible: boolean;
  content: string;
  position: {
    x: number;
    y: number;
  };
  placement: 'top' | 'bottom' | 'left' | 'right';
  targetElement: HTMLElement | null;
}
```

### Translation Support

The tooltip system integrates with the existing translation system:

```typescript
// Translation keys will be added to frontend/locales/translations.json
{
  "tooltips": {
    "svgMenu": {
      "en": "Menu",
      "vi": "Menu"
    },
    "svgClose": {
      "en": "Close",
      "vi": "Đóng"
    },
    "svgCart": {
      "en": "Shopping Cart",
      "vi": "Giỏ hàng"
    }
    // ... additional SVG tooltips
  }
}
```

## Implementation Strategy

### Phase 1: CSS Tooltip System

1. Create CSS classes for tooltip container and tooltip positioning
2. Implement intelligent positioning using CSS custom properties
3. Add responsive design and accessibility features
4. Include proper ARIA attributes for screen readers

### Phase 2: SVG Integration

1. Simplify SVG components to use CSS-based tooltips
2. Remove JavaScript event handlers and state management
3. Integrate with translation system
4. Maintain backward compatibility

### Phase 3: Translation and Documentation

1. Add tooltip translations for all SVG components
2. Update component documentation
3. Add usage examples
4. Test accessibility compliance

## Positioning Logic

The tooltip positioning uses CSS custom properties and intelligent placement:

```css
.tooltip {
  /* Default positioning - can be overridden with CSS custom properties */
  --tooltip-offset: 8px;
  --tooltip-arrow-size: 6px;
}

.tooltip--top {
  bottom: calc(100% + var(--tooltip-offset));
  left: 50%;
  transform: translateX(-50%);
}

.tooltip--bottom {
  top: calc(100% + var(--tooltip-offset));
  left: 50%;
  transform: translateX(-50%);
}

.tooltip--left {
  right: calc(100% + var(--tooltip-offset));
  top: 50%;
  transform: translateY(-50%);
}

.tooltip--right {
  left: calc(100% + var(--tooltip-offset));
  top: 50%;
  transform: translateY(-50%);
}
```

For auto placement, JavaScript is used only for initial positioning calculation, then CSS custom properties are set for the final position.

## Styling

Tooltips use CSS classes with Tailwind utilities and custom CSS:

```css
.svg-tooltip-container {
  position: relative;
  display: inline-block;
}

.tooltip {
  /* Base styling consistent with design system */
  @apply bg-gray-900 text-white text-xs sm:text-sm px-3 py-2 rounded-lg shadow-lg;
  @apply pointer-events-none select-none absolute z-[9999] max-w-xs sm:max-w-sm break-words;
  @apply font-medium leading-tight;

  /* CSS-based show/hide */
  visibility: hidden;
  opacity: 0;
  transition: opacity 0.2s ease-out, visibility 0.2s ease-out;
}

.svg-tooltip-container:hover .tooltip {
  visibility: visible;
  opacity: 1;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .tooltip {
    transition: none;
  }
}
```

## Accessibility Features

1. **ARIA Support**: `aria-describedby` links tooltip to trigger element
2. **Keyboard Navigation**: Tooltips show on focus using `:focus-visible` CSS pseudo-class
3. **Screen Reader**: `role="tooltip"` for proper announcement
4. **Reduced Motion**: Respects `prefers-reduced-motion` setting via CSS media queries
5. **Focus Management**: CSS-based focus handling doesn't interfere with keyboard navigation

```css
.svg-tooltip-container:focus-visible .tooltip,
.svg-tooltip-container:hover .tooltip {
  visibility: visible;
  opacity: 1;
}
```

## Error Handling

1. **Missing Translations**: Fall back to English or provided string
2. **Positioning Errors**: CSS fallback positioning with safe margins
3. **Invalid Props**: Gracefully ignore invalid tooltip configurations
4. **Performance**: CSS-based approach eliminates JavaScript event handling overhead

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: CSS hover interaction consistency
*For any* SVG component with tooltip content, hovering over the element should show the tooltip via CSS `:hover` pseudo-class, and moving the mouse away should hide the tooltip, returning to the original state
**Validates: Requirements 1.1, 1.2**

### Property 2: CSS transition timing
*For any* tooltip interaction, CSS transitions should provide smooth show/hide animations within the specified duration (200ms for show, 100ms for hide)
**Validates: Requirements 1.4, 1.5**

### Property 3: CSS positioning prevents overflow
*For any* tooltip and screen position, the tooltip should be positioned using CSS to remain fully visible within the viewport with appropriate margins from all edges
**Validates: Requirements 1.3, 5.1, 5.2, 5.3, 5.4, 5.5**

### Property 4: Simplified tooltip integration
*For any* SVG component, providing a tooltip prop should enable CSS-based tooltip functionality while maintaining all existing SVG behavior and styling
**Validates: Requirements 2.1, 2.3**

### Property 5: Backward compatibility preservation
*For any* existing SVG component usage without tooltip props, the component should function identically to the original implementation
**Validates: Requirements 2.2, 2.5**

### Property 6: Content type flexibility
*For any* tooltip content (string or translation object), the tooltip should display the appropriate text based on the content type and current locale
**Validates: Requirements 2.4, 3.1, 3.2**

### Property 7: CSS-based accessibility compliance
*For any* tooltip interaction, proper ARIA attributes should be present and CSS-based keyboard navigation (`:focus-visible`) should work equivalently to mouse hover
**Validates: Requirements 3.3, 3.4**

### Property 8: CSS motion preference respect
*For any* tooltip with reduced motion preferences enabled, CSS transitions should be disabled via media queries
**Validates: Requirements 3.5**

### Property 9: Design system consistency
*For any* rendered tooltip, the styling should use design system colors, fonts, spacing, and visual elements (shadows, rounded corners)
**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 10: Responsive scaling behavior
*For any* screen size, tooltips should scale appropriately and remain readable and properly positioned
**Validates: Requirements 4.5**

## Testing Strategy

### Unit Tests
- Tooltip component rendering and positioning
- Hook state management and event handling
- Translation integration and fallbacks
- Accessibility attribute presence
- Specific examples that demonstrate correct behavior
- Edge cases and error conditions

### Property-Based Tests
- Universal properties that hold for all inputs
- Comprehensive input coverage through randomization
- Each property test runs minimum 100 iterations
- Tests tagged with: **Feature: svg-hover-tooltips, Property {number}: {property_text}**

Both unit and property tests are complementary and necessary for comprehensive coverage. Unit tests catch concrete bugs while property tests verify general correctness across all possible inputs.