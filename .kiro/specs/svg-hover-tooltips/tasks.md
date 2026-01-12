# Implementation Plan: SVG Hover Tooltips

## Overview

This implementation plan creates a CSS-based tooltip system for SVG components using pure CSS hover states and minimal JavaScript. The approach follows a CSS-first methodology starting with core CSS tooltip classes, then integrating with existing SVG components, and finally adding translations and documentation.

## Tasks

- [x] 1. Create CSS-based tooltip infrastructure
  - Create CSS classes for tooltip containers and positioning
  - Implement CSS hover-based show/hide behavior
  - Add intelligent positioning using CSS custom properties
  - Include proper ARIA attributes for accessibility
  - _Requirements: 1.3, 3.3, 3.4, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 1.1 Write property test for CSS positioning
  - **Property 3: CSS positioning prevents overflow**
  - **Validates: Requirements 1.3, 5.1, 5.2, 5.3, 5.4, 5.5**

- [ ]* 1.2 Write property test for CSS accessibility compliance
  - **Property 7: CSS-based accessibility compliance**
  - **Validates: Requirements 3.3, 3.4**

- [x] 2. Implement CSS hover interaction logic
  - Add CSS `:hover` pseudo-class for tooltip display
  - Add CSS `:focus-visible` for keyboard accessibility
  - Implement CSS transitions for smooth show/hide (200ms show, 100ms hide)
  - Add CSS media query for motion preference detection
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 3.4, 3.5_

- [ ]* 2.1 Write property test for CSS hover interaction consistency
  - **Property 1: CSS hover interaction consistency**
  - **Validates: Requirements 1.1, 1.2**

- [ ]* 2.2 Write property test for CSS transition timing
  - **Property 2: CSS transition timing**
  - **Validates: Requirements 1.4, 1.5**

- [ ]* 2.3 Write property test for CSS motion preference respect
  - **Property 8: CSS motion preference respect**
  - **Validates: Requirements 3.5**

- [x] 3. Checkpoint - Ensure CSS tooltip functionality works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Simplify SVG components with CSS-based tooltips
  - Remove JavaScript event handlers and state management
  - Modify existing SVG components to use CSS tooltip containers
  - Integrate simplified tooltip rendering with SVG components
  - Ensure backward compatibility with existing implementations
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [ ]* 4.1 Write property test for simplified tooltip integration
  - **Property 4: Simplified tooltip integration**
  - **Validates: Requirements 2.1, 2.3**

- [ ]* 4.2 Write property test for backward compatibility
  - **Property 5: Backward compatibility preservation**
  - **Validates: Requirements 2.2, 2.5**

- [x] 5. Implement translation system integration
  - Add tooltip translation keys to translations.json
  - Implement content type handling (string vs translation object)
  - Add locale-aware tooltip content resolution
  - Support both English and Vietnamese translations
  - _Requirements: 2.4, 3.1, 3.2_

- [ ]* 5.1 Write property test for content type flexibility
  - **Property 6: Content type flexibility**
  - **Validates: Requirements 2.4, 3.1, 3.2**

- [x] 6. Implement CSS tooltip styling and design system integration
  - Create CSS classes for tooltip styling with Tailwind utilities
  - Ensure consistent colors, fonts, and spacing
  - Add dark background with light text for contrast
  - Include subtle drop shadow and rounded corners
  - Implement responsive scaling for different screen sizes
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 6.1 Write property test for design system consistency
  - **Property 9: Design system consistency**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

- [ ]* 6.2 Write property test for responsive scaling
  - **Property 10: Responsive scaling behavior**
  - **Validates: Requirements 4.5**

- [x] 7. Add tooltip content for existing SVG components
  - Add meaningful tooltip translations for all SVG components
  - Update SVG component usage examples with tooltip props
  - Ensure tooltip content is concise and helpful
  - _Requirements: 3.1, 3.2_

- [ ]* 7.1 Write unit tests for SVG tooltip integration
  - Test specific SVG components with tooltip functionality
  - Test translation key resolution
  - _Requirements: 3.1, 3.2_

- [x] 8. Final integration and testing
  - Wire all CSS components together
  - Test complete CSS-based tooltip system end-to-end
  - Verify accessibility compliance with screen readers
  - Test responsive behavior across different devices
  - _Requirements: All requirements_

- [ ]* 8.1 Write integration tests for complete CSS tooltip system
  - Test end-to-end CSS tooltip functionality
  - Test cross-browser compatibility
  - _Requirements: All requirements_

- [x] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Refactor to CSS hover-based tooltips
  - Remove JavaScript event handlers from useTooltip hook
  - Simplify SVG components to use CSS-only tooltip containers
  - Update CSS classes to handle hover states purely with CSS
  - Remove complex positioning JavaScript and use CSS positioning
  - Maintain translation support and accessibility features
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 2.1, 2.3_

- [ ]* 10.1 Write property test for CSS hover behavior
  - **Property 1: CSS hover interaction consistency**
  - **Validates: Requirements 1.1, 1.2**

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- CSS-first approach eliminates JavaScript event handling complexity
- Integration with existing translation system (next-intl)
- Pure CSS for performance and simplicity