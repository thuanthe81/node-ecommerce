# Implementation Plan

- [x] 1. Set up Carousel component structure
  - Create directory structure: `frontend/components/Carousel/` with subdirectories for components, hooks, and utils
  - Create `types.ts` with all TypeScript interfaces (CarouselProps, CarouselImage, AnimationState, etc.)
  - Create `index.tsx` as the main export entry point
  - _Requirements: 1.1, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 2. Extract and adapt hooks from ProductImageGallery
  - [x] 2.1 Move useAutoAdvance hook to Carousel/hooks/
    - Copy `useAutoAdvance.ts` from ProductImageGallery hooks
    - Update imports and ensure it works independently
    - _Requirements: 1.1, 4.1_

  - [x] 2.2 Move useVisibilityDetection hook to Carousel/hooks/
    - Copy `useVisibilityDetection.ts` from ProductImageGallery hooks
    - Update imports and ensure it works independently
    - _Requirements: 1.5, 4.4_

  - [x] 2.3 Create useCarouselAnimation hook
    - Implement animation state management (isAnimating, animationDirection, currentIndex)
    - Include navigation functions (goToNext, goToPrevious, goToImage)
    - Handle animation timing and state transitions
    - _Requirements: 1.3, 2.1, 2.2_

  - [x] 2.4 Create useImagePreloader hook
    - Implement image preloading logic with Promise-based loading
    - Track loaded and failed images in Sets
    - Return preloadImage function and loading state
    - _Requirements: 1.2_

- [x] 3. Implement main Carousel component
  - [x] 3.1 Create Carousel.tsx with core structure
    - Set up component with props interface
    - Implement configuration validation with safe defaults
    - Set up refs for gallery element and timers
    - Initialize all state variables
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 3.2 Integrate hooks into Carousel component
    - Use useAutoAdvance hook with proper configuration
    - Use useVisibilityDetection hook
    - Use useCarouselAnimation hook
    - Use useImagePreloader hook
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

  - [x] 3.3 Implement reduced motion detection
    - Add media query detection for prefers-reduced-motion
    - Update animation logic to skip animations when reduced motion is preferred
    - _Requirements: 1.4, 5.4_

  - [x] 3.4 Implement keyboard navigation
    - Add keyboard event listener for arrow keys
    - Call navigation functions on key press
    - Prevent default browser behavior
    - _Requirements: 2.3, 2.4, 5.5_

  - [x] 3.5 Implement touch/swipe gestures
    - Add touch event handlers (onTouchStart, onTouchMove, onTouchEnd)
    - Calculate swipe distance and direction
    - Trigger navigation based on swipe
    - _Requirements: 2.5, 2.6_

  - [x] 3.6 Implement hover pause functionality
    - Add mouse enter/leave handlers
    - Pause auto-advance on hover
    - Resume after hover ends
    - _Requirements: 4.2_

  - [x] 3.7 Implement ARIA live region for screen readers
    - Add ARIA live region to announce image changes
    - Update message when current index changes
    - _Requirements: 5.1_

  - [x] 3.8 Render main carousel structure
    - Create animation track container with translateX transforms
    - Render current, previous, and next images based on animation state
    - Apply proper styling and transitions
    - _Requirements: 1.3_

- [ ] 4. Implement CarouselImage sub-component
  - Create `components/CarouselImage.tsx`
  - Handle image loading and error states
  - Display loading spinner and error placeholder
  - Use Next.js Image component with proper sizing
  - Support locale-based alt text
  - _Requirements: 1.2_

- [x] 5. Implement CarouselControls sub-component
  - Create `components/CarouselControls.tsx`
  - Render previous and next buttons
  - Show/hide based on hover state and showControls prop
  - Include proper ARIA labels
  - Handle click events to trigger navigation
  - _Requirements: 2.1, 2.2, 5.2_

- [x] 6. Implement CarouselThumbnails sub-component
  - Create `components/CarouselThumbnails.tsx`
  - Render grid of thumbnail images
  - Highlight active thumbnail with visual indicator
  - Include aria-current attribute on active thumbnail
  - Handle thumbnail clicks to navigate
  - Conditionally render based on showThumbnails prop
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 5.3, 6.1_

- [x] 7. Add translations for Carousel
  - Add translation keys to `frontend/locales/translations.json`
  - Include English and Vietnamese translations for:
    - Image announcement template (e.g., "Image {current} of {total}")
    - Previous/next button labels
    - Error messages
  - _Requirements: 5.1, 5.2_

- [x] 8. Write unit tests for Carousel component
  - [x] 8.1 Test component rendering with different props
    - Test with showThumbnails true/false
    - Test with showControls true/false
    - Test with autoAdvance true/false
    - Test with different image arrays
    - _Requirements: 6.1, 6.2, 6.5_

  - [x] 8.2 Test navigation functionality
    - Test next/previous button clicks
    - Test thumbnail clicks
    - Test keyboard navigation
    - Test touch gestures
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.2_

  - [x] 8.3 Test auto-advance behavior
    - Test auto-advance timing
    - Test pause on hover
    - Test pause on manual navigation
    - Test pause when not visible
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 8.4 Test configuration validation
    - Test with invalid interval values (negative, zero, NaN, Infinity)
    - Test with invalid transition duration values
    - Verify fallback to defaults
    - _Requirements: 6.3, 6.4_

  - [x] 8.5 Test accessibility features
    - Test ARIA live region updates
    - Test ARIA labels on buttons
    - Test aria-current on thumbnails
    - Test keyboard navigation
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [x] 8.6 Test reduced motion support
    - Test that animations are skipped when prefers-reduced-motion is enabled
    - Test instant transitions
    - _Requirements: 1.4, 5.4_

- [ ]* 9. Write property-based tests for Carousel
  - [ ]* 9.1 Property test: Navigation wraps around correctly
    - **Property 1: Navigation wraps around correctly**
    - **Validates: Requirements 2.1, 2.2**
    - Generate random carousel states with different image counts
    - Test that next from last index goes to 0
    - Test that previous from 0 goes to last index

  - [ ]* 9.2 Property test: Auto-advance pauses on interaction
    - **Property 2: Auto-advance pauses on interaction**
    - **Validates: Requirements 4.2, 4.3**
    - Generate random carousel configurations
    - Test that hover pauses auto-advance
    - Test that manual navigation pauses auto-advance

  - [ ]* 9.3 Property test: Thumbnail selection updates current index
    - **Property 3: Thumbnail selection updates current index**
    - **Validates: Requirements 3.2**
    - Generate random image arrays and indices
    - Test that clicking thumbnail I sets index to I

  - [ ]* 9.4 Property test: Visibility controls auto-advance
    - **Property 4: Visibility controls auto-advance**
    - **Validates: Requirements 4.4**
    - Generate random visibility states
    - Test that auto-advance pauses when not visible

  - [ ]* 9.5 Property test: Reduced motion disables animations
    - **Property 5: Reduced motion disables animations**
    - **Validates: Requirements 1.4, 5.4**
    - Generate random carousel states
    - Test that animations are skipped with prefers-reduced-motion

  - [ ]* 9.6 Property test: Image preloading prevents failed transitions
    - **Property 6: Image preloading prevents failed transitions**
    - **Validates: Requirements 1.2**
    - Generate random navigation sequences
    - Test that target images are preloaded before animation

  - [ ]* 9.7 Property test: Keyboard navigation works correctly
    - **Property 7: Keyboard navigation works correctly**
    - **Validates: Requirements 2.3, 2.4**
    - Generate random carousel states
    - Test that arrow keys navigate correctly

  - [ ]* 9.8 Property test: Touch gestures navigate correctly
    - **Property 8: Touch gestures navigate correctly**
    - **Validates: Requirements 2.5, 2.6**
    - Generate random swipe distances and directions
    - Test that swipes navigate correctly

  - [ ]* 9.9 Property test: Configuration validation provides safe defaults
    - **Property 9: Configuration validation provides safe defaults**
    - **Validates: Requirements 6.3, 6.4**
    - Generate random invalid configuration values
    - Test that defaults are used for invalid values

  - [ ]* 9.10 Property test: Thumbnail visibility is configurable
    - **Property 10: Thumbnail visibility is configurable**
    - **Validates: Requirements 3.4, 6.1**
    - Generate random showThumbnails values
    - Test that thumbnails render only when enabled

- [x] 10. Update ProductImageGallery to use new Carousel
  - Refactor ProductImageGallery to use the new Carousel component internally
  - Keep product-specific features (zoom functionality)
  - Pass appropriate props to Carousel
  - Maintain backward compatibility with existing ProductImageGallery API
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 11. Remove old Carousel3D and Carousel2D components
  - [x] 11.1 Search for all usages of old carousel components
    - Use grepSearch to find imports of Carousel3D and Carousel2D
    - Document all files that need to be updated
    - _Requirements: 7.3_

  - [x] 11.2 Delete old carousel directories and files
    - Delete `frontend/components/Carousel3D/` directory
    - Delete old `frontend/components/Carousel/` directory (if different from new one)
    - Delete `frontend/components/Carousel.tsx` backward compatibility wrapper
    - _Requirements: 7.1, 7.2_

  - [x] 11.3 Delete old carousel test files
    - Delete `frontend/components/__tests__/Carousel3D.*.test.tsx` files
    - Delete any other Carousel3D-related test files
    - _Requirements: 7.4_

  - [x] 11.4 Verify no references remain
    - Use grepSearch to verify no imports of old carousel components
    - Check for any remaining references in code
    - _Requirements: 7.5_

- [x] 12. Update homepage to use new Carousel
  - [x] 12.1 Find and read homepage component
    - Locate the homepage file (likely `frontend/app/[locale]/page.tsx`)
    - Understand current carousel usage (if any)
    - _Requirements: 8.1_

  - [x] 12.2 Integrate new Carousel into homepage
    - Import new Carousel component
    - Configure with appropriate props (autoAdvance, showThumbnails, etc.)
    - Provide featured images data
    - Style to match homepage design
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]* 12.3 Test homepage carousel integration
    - Verify carousel renders correctly on homepage
    - Test auto-advance functionality
    - Test responsive behavior across viewports
    - Test navigation controls
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
