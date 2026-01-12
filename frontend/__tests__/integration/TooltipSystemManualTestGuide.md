# SVG Tooltip System - Manual Testing Guide

This guide provides comprehensive manual testing procedures for the SVG tooltip system to verify end-to-end integration and compliance with all requirements.

## Prerequisites

1. Start the development server: `npm run dev`
2. Open the application in a web browser
3. Ensure you have access to browser developer tools
4. Test in both English and Vietnamese locales

## Test Categories

### 1. Complete System Integration

#### Test 1.1: Basic Tooltip Functionality
**Objective**: Verify all components wire together correctly

**Steps**:
1. Navigate to any page with SVG icons (header, footer, admin panel)
2. Hover over various SVG icons (menu, cart, close, user, etc.)
3. Verify tooltips appear with correct content
4. Move mouse away and verify tooltips disappear
5. Test multiple icons in sequence

**Expected Results**:
- Tooltips appear within 200ms of hover
- Tooltips disappear within 100ms of mouse leave
- Content matches the icon's purpose
- No visual glitches or overlapping tooltips

#### Test 1.2: Component Integration
**Objective**: Test tooltip system across different components

**Steps**:
1. Test tooltips in header navigation icons
2. Test tooltips in footer social media icons
3. Test tooltips in admin panel action buttons
4. Test tooltips in product cards and forms
5. Test tooltips in different page layouts

**Expected Results**:
- Consistent behavior across all components
- Proper styling and positioning
- No conflicts with other UI elements

### 2. Translation System Integration

#### Test 2.1: English Tooltips
**Objective**: Verify English tooltip content

**Steps**:
1. Set browser/app locale to English
2. Hover over various SVG icons
3. Verify tooltip content is in English
4. Check common icons: menu, cart, close, user, search, settings

**Expected Results**:
- All tooltips display in English
- Content is clear and descriptive
- No translation keys visible (e.g., "tooltips.menu")

#### Test 2.2: Vietnamese Tooltips
**Objective**: Verify Vietnamese tooltip content

**Steps**:
1. Set browser/app locale to Vietnamese
2. Hover over the same SVG icons as Test 2.1
3. Verify tooltip content is in Vietnamese
4. Compare with English versions for accuracy

**Expected Results**:
- All tooltips display in Vietnamese
- Translations are accurate and natural
- Text length doesn't cause layout issues

#### Test 2.3: Content Type Flexibility
**Objective**: Test different tooltip content types

**Steps**:
1. Find icons with direct string tooltips
2. Find icons with translation key tooltips
3. Find icons with translation object tooltips
4. Verify all types work correctly

**Expected Results**:
- Direct strings display as-is
- Translation keys resolve to localized text
- Translation objects use current locale

### 3. Accessibility Compliance

#### Test 3.1: ARIA Attributes
**Objective**: Verify proper ARIA implementation

**Steps**:
1. Open browser developer tools
2. Inspect SVG elements with tooltips
3. Check for `aria-describedby` attributes
4. Hover to show tooltip and inspect tooltip element
5. Verify tooltip has `role="tooltip"` and matching `id`

**Expected Results**:
- All tooltip-enabled SVGs have `aria-describedby`
- Tooltip elements have `role="tooltip"`
- IDs match between `aria-describedby` and tooltip `id`

#### Test 3.2: Keyboard Navigation
**Objective**: Test keyboard accessibility

**Steps**:
1. Use Tab key to navigate through focusable elements
2. When focus reaches elements containing SVG icons with tooltips
3. Verify tooltips appear on focus
4. Tab away and verify tooltips disappear on blur
5. Test with screen reader if available

**Expected Results**:
- Tooltips appear on keyboard focus
- Tooltips disappear on blur
- Screen readers announce tooltip content
- Navigation order is logical

#### Test 3.3: Screen Reader Compatibility
**Objective**: Test with assistive technology

**Steps**:
1. Enable screen reader (VoiceOver on Mac, NVDA on Windows)
2. Navigate to elements with tooltip-enabled SVGs
3. Verify screen reader announces tooltip content
4. Test both mouse hover and keyboard focus

**Expected Results**:
- Screen reader announces tooltip content
- Content is clear and helpful
- No duplicate announcements

### 4. Responsive Behavior

#### Test 4.1: Different Screen Sizes
**Objective**: Test responsive tooltip behavior

**Steps**:
1. Test on desktop (1920x1080)
2. Test on tablet (768x1024)
3. Test on mobile (375x667)
4. Use browser dev tools to simulate different sizes
5. Verify tooltips remain readable and properly positioned

**Expected Results**:
- Tooltips scale appropriately
- Text remains readable at all sizes
- Positioning adapts to screen constraints
- No overflow or clipping issues

#### Test 4.2: Edge Positioning
**Objective**: Test intelligent positioning

**Steps**:
1. Hover over icons near screen edges (top, bottom, left, right)
2. Verify tooltips reposition to stay visible
3. Test with different screen sizes
4. Check 8px minimum margin from edges

**Expected Results**:
- Tooltips never extend beyond screen edges
- Automatic repositioning works correctly
- Minimum 8px margin maintained
- Positioning is visually pleasing

### 5. Motion Preferences

#### Test 5.1: Reduced Motion
**Objective**: Test reduced motion compliance

**Steps**:
1. Enable "Reduce motion" in OS accessibility settings
2. Hover over SVG icons with tooltips
3. Verify animations are reduced or disabled
4. Check that functionality still works

**Expected Results**:
- Tooltips still appear and disappear
- Animations are reduced or eliminated
- Timing may be faster
- Functionality remains intact

### 6. Timing and Performance

#### Test 6.1: Default Timing
**Objective**: Verify timing requirements

**Steps**:
1. Use browser dev tools performance tab
2. Hover over icons and measure timing
3. Verify show delay (~200ms)
4. Verify hide delay (~100ms)

**Expected Results**:
- Tooltips appear within 200ms
- Tooltips disappear within 100ms
- No performance issues or lag
- Smooth user experience

#### Test 6.2: Custom Delays
**Objective**: Test custom timing configurations

**Steps**:
1. Find icons with custom `tooltipDelay` props
2. Hover and verify custom timing
3. Compare with default timing

**Expected Results**:
- Custom delays work as configured
- No conflicts with default behavior

### 7. Special Cases and Edge Cases

#### Test 7.1: Backward Compatibility
**Objective**: Verify existing SVG usage still works

**Steps**:
1. Find SVG components without tooltip props
2. Verify they render normally
3. Check for any regression issues
4. Verify no unexpected ARIA attributes

**Expected Results**:
- SVGs without tooltips work unchanged
- No performance impact
- No accessibility issues
- Clean HTML output

#### Test 7.2: Empty Content Handling
**Objective**: Test edge cases

**Steps**:
1. Test with empty string tooltips
2. Test with undefined tooltip props
3. Test with invalid content types

**Expected Results**:
- Empty content doesn't show tooltips
- No JavaScript errors
- Graceful degradation

#### Test 7.3: Rapid Interactions
**Objective**: Test system stability

**Steps**:
1. Rapidly hover over multiple icons
2. Move mouse quickly between icons
3. Test rapid focus/blur with keyboard
4. Check for memory leaks or performance issues

**Expected Results**:
- No visual glitches
- Tooltips don't stack or persist
- Smooth performance
- No memory leaks

### 8. Cross-Browser Compatibility

#### Test 8.1: Modern Browsers
**Objective**: Test across browser engines

**Steps**:
1. Test in Chrome/Chromium
2. Test in Firefox
3. Test in Safari
4. Test in Edge
5. Verify consistent behavior

**Expected Results**:
- Consistent appearance across browsers
- Same timing and behavior
- No browser-specific issues

#### Test 8.2: Mobile Browsers
**Objective**: Test mobile-specific behavior

**Steps**:
1. Test on iOS Safari
2. Test on Android Chrome
3. Test touch interactions
4. Verify mobile-specific adaptations

**Expected Results**:
- Touch interactions work appropriately
- Mobile-specific behaviors are correct
- Performance is acceptable

## Test Results Documentation

### Test Execution Checklist

- [ ] Complete System Integration (Tests 1.1-1.2)
- [ ] Translation System Integration (Tests 2.1-2.3)
- [ ] Accessibility Compliance (Tests 3.1-3.3)
- [ ] Responsive Behavior (Tests 4.1-4.2)
- [ ] Motion Preferences (Test 5.1)
- [ ] Timing and Performance (Tests 6.1-6.2)
- [ ] Special Cases and Edge Cases (Tests 7.1-7.3)
- [ ] Cross-Browser Compatibility (Tests 8.1-8.2)

### Issues Found

Document any issues found during testing:

1. **Issue Description**:
   - **Severity**: High/Medium/Low
   - **Browser**:
   - **Steps to Reproduce**:
   - **Expected vs Actual**:

### Sign-off

- [ ] All critical tests passed
- [ ] All accessibility requirements met
- [ ] All browser compatibility verified
- [ ] Performance requirements satisfied
- [ ] Ready for production deployment

**Tester**: ________________
**Date**: ________________
**Version**: ________________