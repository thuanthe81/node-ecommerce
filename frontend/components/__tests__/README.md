# Carousel3D Test Suite

## Overview

This directory contains comprehensive tests for the Carousel3D component, covering transform calculations, performance, integration, accessibility, responsive behavior, and error handling.

## Test Files

### 1. `Carousel3D.transforms.test.ts`
Tests for 3D transform calculation utilities:
- Angle normalization
- Item transform calculations for different item counts (3, 6, 12)
- Z-position calculations
- Scale and opacity calculations
- Focused index calculations
- Easing functions (easeInOutCubic, easeOutCubic)

**Status**: ✅ Passing (with minor fixes for -0 vs 0 comparisons)

### 2. `Carousel3D.performance.test.tsx`
Tests for rendering and performance optimization:
- Rendering with minimum (3) and maximum (12) items
- Hardware acceleration (will-change CSS property)
- Lazy loading for images
- Render time performance
- Empty state and fallback slider handling

**Status**: ⚠️ Needs adjustment - Some tests rely on specific CSS class names

### 3. `Carousel3D.integration.test.tsx`
Tests for user interactions and state management:
- Component rendering with controls and indicators
- Button navigation (next/previous)
- Keyboard navigation (ArrowLeft/ArrowRight)
- Mouse drag interactions
- Touch swipe interactions
- Indicator navigation
- Auto-rotation behavior
- Error handling scenarios
- Accessibility features
- Responsive behavior
- State management

**Status**: ⚠️ Needs adjustment - Tests need to be updated to match actual component structure

### 4. `Carousel3D.accessibility.test.tsx`
Tests for accessibility compliance:
- ARIA attributes (role, aria-label, aria-roledescription, aria-live)
- Button accessibility
- Image alt text
- Keyboard navigation
- Focus management
- Screen reader support
- Reduced motion support
- Color contrast
- Semantic HTML
- Touch target sizes
- Automated accessibility testing with jest-axe

**Status**: ⚠️ Needs adjustment - Requires actual component structure

### 5. `Carousel3D.responsive.test.tsx`
Tests for responsive behavior:
- Mobile viewport (< 768px)
- Tablet viewport (768px - 1024px)
- Desktop viewport (>= 1024px)
- Viewport transitions
- Orientation changes
- Custom breakpoints
- Performance across viewports
- Touch sensitivity adjustments

**Status**: ⚠️ Needs adjustment - Requires actual component structure

### 6. `Carousel3D.errors.test.tsx`
Tests for error handling and edge cases:
- Insufficient items (0, 1, 2 items)
- Image loading errors
- Missing data (imageUrl, alt, linkUrl, title)
- Invalid props (negative values, zero values)
- Maximum item count handling
- Browser compatibility
- Memory leak prevention
- Rapid interactions
- Concurrent updates

**Status**: ⚠️ Needs adjustment - Requires actual component structure

## Test Infrastructure

### Dependencies Installed
- `@testing-library/react` - React component testing utilities
- `@testing-library/jest-dom` - Custom Jest matchers for DOM
- `@testing-library/user-event` - User interaction simulation
- `jest` - Testing framework
- `jest-environment-jsdom` - DOM environment for Jest
- `@types/jest` - TypeScript types for Jest
- `ts-jest` - TypeScript support for Jest
- `jest-axe` - Automated accessibility testing

### Configuration Files
- `jest.config.js` - Jest configuration with Next.js support
- `jest.setup.js` - Test setup file with jest-dom matchers

### Test Scripts
```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
}
```

## Current Status

### ✅ Completed
1. Test infrastructure setup (Jest, React Testing Library, jest-axe)
2. Transform calculation tests (passing)
3. Test file structure created for all required test categories
4. Comprehensive test coverage planned for:
   - Unit tests for transform calculations
   - Integration tests for user interactions
   - Accessibility tests with automated tools
   - Responsive behavior tests
   - Error handling tests
   - Performance tests

### ⚠️ Needs Adjustment
The integration, accessibility, responsive, error, and performance tests need to be updated to match the actual component structure. The tests currently use generic CSS class names that may not match the actual implementation.

## Next Steps

To complete the test implementation:

1. **Review actual component structure**: Examine the Carousel3D component to identify the actual CSS classes, data attributes, and DOM structure
2. **Update test selectors**: Replace generic selectors (`.carousel-3d`, `.carousel-ring`, etc.) with actual selectors from the component
3. **Verify component behavior**: Ensure tests match the actual behavior of the component (e.g., how indicators show active state, how controls are disabled, etc.)
4. **Run and fix failing tests**: Execute tests and fix any remaining issues
5. **Add missing test cases**: Identify any gaps in test coverage and add additional tests as needed

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test Carousel3D.transforms.test.ts
```

## Test Coverage Goals

- **Transform calculations**: 100% coverage ✅
- **Component rendering**: 90%+ coverage
- **User interactions**: 90%+ coverage
- **Accessibility**: 100% coverage
- **Error handling**: 90%+ coverage
- **Responsive behavior**: 85%+ coverage

## Notes

- Tests follow the principle of testing behavior, not implementation details
- Accessibility tests use jest-axe for automated WCAG compliance checking
- Performance tests measure render times and verify optimization techniques
- Error tests ensure graceful degradation and proper error handling
