# Carousel3D Accessibility Testing Guide

This document provides guidance for testing the accessibility features of the Carousel3D component.

## Implemented Accessibility Features

### 1. Keyboard Navigation
- **Arrow Left**: Navigate to previous item (counter-clockwise rotation)
- **Arrow Right**: Navigate to next item (clockwise rotation)
- **Enter/Space**: Activate the focused item (navigate to its link)
- **Tab**: Focus on the carousel container and interactive elements

### 2. ARIA Attributes
- `role="region"`: Identifies the carousel as a landmark region
- `aria-label="Featured products carousel"`: Provides a descriptive label
- `aria-roledescription="carousel"`: Specifies the type of region
- `aria-live="polite"`: Announces changes to screen readers
- `aria-atomic="true"`: Ensures complete announcements
- `aria-hidden`: Set on non-focused items to hide them from screen readers

### 3. Screen Reader Announcements
- Announces focused item changes: "Showing item X of Y: [Item Title]"
- Updates are announced politely without interrupting user
- Each carousel item has descriptive labels

### 4. Focus Management
- Carousel container is keyboard focusable (tabIndex={0})
- Only the focused item is keyboard accessible (tabIndex={0})
- Non-focused items have tabIndex={-1}
- Visual focus indicators (ring-2 ring-blue-500)

## Manual Testing Checklist

### Keyboard Navigation Testing

1. **Basic Navigation**
   - [ ] Tab to focus on the carousel
   - [ ] Press Arrow Right to move to next item
   - [ ] Press Arrow Left to move to previous item
   - [ ] Verify smooth rotation animations
   - [ ] Verify focused item has visible focus indicator

2. **Item Activation**
   - [ ] Navigate to an item using arrow keys
   - [ ] Press Enter or Space to activate the item
   - [ ] Verify navigation to the correct URL

3. **Focus Management**
   - [ ] Tab through the page and verify carousel receives focus
   - [ ] Verify only one item is in tab order at a time
   - [ ] Verify focus indicator is clearly visible

### Screen Reader Testing

#### NVDA (Windows)
1. Start NVDA (Insert + N)
2. Navigate to the carousel using Tab or arrow keys
3. Verify announcements:
   - [ ] "Featured products carousel, region, carousel"
   - [ ] "Showing item X of Y: [Item Title]"
   - [ ] Item details when focused

#### JAWS (Windows)
1. Start JAWS
2. Navigate to the carousel
3. Verify similar announcements as NVDA
4. Test with virtual cursor (arrow keys)
5. Test with forms mode (Enter on carousel)

#### VoiceOver (macOS)
1. Enable VoiceOver (Cmd + F5)
2. Navigate to carousel (VO + Right Arrow)
3. Verify announcements:
   - [ ] "Featured products carousel, region"
   - [ ] "Showing item X of Y: [Item Title]"
4. Test VO + Space to activate items

#### VoiceOver (iOS)
1. Enable VoiceOver in Settings
2. Swipe to navigate to carousel
3. Verify touch and swipe gestures work
4. Verify announcements are clear

#### TalkBack (Android)
1. Enable TalkBack in Settings
2. Swipe to navigate to carousel
3. Verify announcements
4. Test double-tap to activate

### Visual Focus Testing

1. **Focus Indicators**
   - [ ] Verify focus ring is visible on carousel container
   - [ ] Verify focused item has distinct visual indicator
   - [ ] Verify focus indicators meet WCAG contrast requirements
   - [ ] Test in both light and dark modes

2. **High Contrast Mode**
   - [ ] Enable high contrast mode (Windows)
   - [ ] Verify all interactive elements are visible
   - [ ] Verify focus indicators are visible

### Reduced Motion Testing

1. **Prefers Reduced Motion**
   - [ ] Enable reduced motion in OS settings
   - [ ] Verify animations are minimal or disabled
   - [ ] Verify carousel still functions correctly

### Touch/Mobile Testing

1. **Touch Interactions**
   - [ ] Verify swipe gestures work on mobile
   - [ ] Verify touch targets are at least 44x44px
   - [ ] Test on various mobile devices

2. **Mobile Screen Readers**
   - [ ] Test with VoiceOver on iOS
   - [ ] Test with TalkBack on Android
   - [ ] Verify announcements work with touch

## Automated Testing Recommendations

When a testing framework is configured, consider adding these automated tests:

### Unit Tests
```typescript
describe('Carousel3D Accessibility', () => {
  it('should have proper ARIA attributes', () => {
    // Test role, aria-label, aria-roledescription
  });

  it('should handle keyboard navigation', () => {
    // Test ArrowLeft and ArrowRight key events
  });

  it('should update focused index on navigation', () => {
    // Test state updates
  });

  it('should announce focused item changes', () => {
    // Test screen reader announcements
  });
});
```

### Integration Tests
```typescript
describe('Carousel3D Keyboard Navigation', () => {
  it('should navigate to next item on ArrowRight', () => {
    // Simulate key press and verify rotation
  });

  it('should navigate to previous item on ArrowLeft', () => {
    // Simulate key press and verify rotation
  });

  it('should activate focused item on Enter', () => {
    // Simulate Enter key and verify navigation
  });
});
```

### Accessibility Tests (with jest-axe or similar)
```typescript
import { axe } from 'jest-axe';

describe('Carousel3D Accessibility Compliance', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<Carousel3D items={mockItems} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## WCAG 2.1 Compliance

The Carousel3D component aims to meet the following WCAG 2.1 criteria:

- **1.3.1 Info and Relationships (Level A)**: ✅ Proper semantic structure with ARIA
- **2.1.1 Keyboard (Level A)**: ✅ All functionality available via keyboard
- **2.1.2 No Keyboard Trap (Level A)**: ✅ Users can navigate away from carousel
- **2.4.3 Focus Order (Level A)**: ✅ Logical focus order maintained
- **2.4.7 Focus Visible (Level AA)**: ✅ Clear focus indicators
- **4.1.2 Name, Role, Value (Level A)**: ✅ Proper ARIA attributes
- **4.1.3 Status Messages (Level AA)**: ✅ Screen reader announcements

## Known Limitations

1. **Auto-rotation**: Not yet implemented (planned for task 13)
2. **Indicators**: Not yet implemented (planned for task 12)
3. **Reduced Motion**: Needs testing with actual reduced motion preferences

## Resources

- [ARIA Authoring Practices - Carousel Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/)
- [WebAIM - Keyboard Accessibility](https://webaim.org/techniques/keyboard/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
