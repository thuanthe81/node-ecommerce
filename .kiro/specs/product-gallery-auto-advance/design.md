# Design Document: Product Gallery Auto-Advance with Scrolling Effect

## Overview

This design enhances the existing ProductImageGallery component to include automatic image advancement with a smooth scrolling transition effect. The feature will create an engaging, carousel-like experience while maintaining full user control and accessibility. The implementation will use React hooks for state management, CSS transitions for animations, and browser APIs for performance optimization.

## Architecture

The enhancement will be implemented entirely within the existing ProductImageGallery component with the following architectural considerations:

### Component Structure
- **ProductImageGallery** (existing component, to be enhanced)
  - Add auto-advance timer management
  - Add scrolling animation state
  - Add visibility detection
  - Add hover state for navigation buttons
  - Maintain existing functionality (manual navigation, keyboard, touch, zoom)

### Key Dependencies
- React hooks: `useState`, `useEffect`, `useRef`, `useCallback`
- Browser APIs: Intersection Observer, Page Visibility API
- CSS transitions for scrolling animation
- Existing Next.js Image component

### State Management
All state will be managed locally within the ProductImageGallery component using React hooks:
- Auto-advance timer state
- Animation in-progress state
- Hover state for navigation buttons
- Visibility state (viewport and tab)
- User interaction pause state

## Components and Interfaces

### Enhanced ProductImageGallery Props

```typescript
interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
  locale?: string;
  // New optional props for auto-advance configuration
  autoAdvance?: boolean;           // Enable/disable auto-advance (default: true)
  autoAdvanceInterval?: number;    // Interval in milliseconds (default: 5000)
  transitionDuration?: number;     // Animation duration in milliseconds (default: 1000)
}
```

### Internal State

```typescript
// Existing state
const [currentIndex, setCurrentIndex] = useState(0);
const [isZoomed, setIsZoomed] = useState(false);
const [imageLoading, setImageLoading] = useState(true);
const [imageError, setImageError] = useState(false);

// New state for auto-advance
const [isAnimating, setIsAnimating] = useState(false);
const [isPaused, setIsPaused] = useState(false);
const [isVisible, setIsVisible] = useState(true);
const [isHovered, setIsHovered] = useState(false);

// Refs for timer management
const autoAdvanceTimer = useRef<NodeJS.Timeout | null>(null);
const animationTimer = useRef<NodeJS.Timeout | null>(null);
```

### Custom Hook: useAutoAdvance

```typescript
interface UseAutoAdvanceOptions {
  enabled: boolean;
  interval: number;
  transitionDuration: number;
  imagesCount: number;
  isPaused: boolean;
  isVisible: boolean;
  isZoomed: boolean;
  isAnimating: boolean;
  onAdvance: () => void;
}

function useAutoAdvance(options: UseAutoAdvanceOptions): void {
  // Manages auto-advance timer
  // Handles cleanup
  // Respects pause conditions
}
```

### Custom Hook: useVisibilityDetection

```typescript
interface UseVisibilityDetectionOptions {
  elementRef: RefObject<HTMLElement>;
  onVisibilityChange: (isVisible: boolean) => void;
}

function useVisibilityDetection(options: UseVisibilityDetectionOptions): void {
  // Uses Intersection Observer for viewport detection
  // Uses Page Visibility API for tab detection
  // Combines both signals
}
```

## Data Models

No new data models are required. The component will continue to use the existing `ProductImage` interface:

```typescript
interface ProductImage {
  id: string;
  url: string;
  altTextEn: string | null;
  altTextVi: string | null;
  displayOrder: number;
  isPrimary: boolean;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Auto-advance timer starts on mount
*For any* ProductImageGallery with multiple images and auto-advance enabled, mounting the component should start a timer that advances to the next image after the configured interval.
**Validates: Requirements 1.1, 1.2**

### Property 2: Timer cleanup on unmount
*For any* ProductImageGallery with active timers, unmounting the component should clear all timers and intervals, leaving no memory leaks.
**Validates: Requirements 1.5**

### Property 3: Navigation button visibility on hover
*For any* ProductImageGallery, hovering over the image area should make navigation buttons visible, and leaving the area should hide them.
**Validates: Requirements 2.1, 2.2**

### Property 4: User interaction pauses auto-advance
*For any* user interaction (button click, thumbnail selection, keyboard navigation, swipe gesture), the auto-advance timer should pause and reset.
**Validates: Requirements 2.3, 2.4, 2.5, 2.6**

### Property 5: Zoom pauses auto-advance
*For any* ProductImageGallery, activating zoom should pause auto-advance, and deactivating zoom should resume it.
**Validates: Requirements 2.7**

### Property 6: Scrolling animation duration
*For any* image transition, the scrolling effect should have the configured duration (default 1 second).
**Validates: Requirements 3.1, 5.2**

### Property 7: Navigation blocked during animation
*For any* ProductImageGallery while scrolling animation is in progress, attempting navigation should be prevented until animation completes.
**Validates: Requirements 3.2, 3.3**

### Property 8: Wait for image load before transition
*For any* image transition, if the next image is not yet loaded, the system should wait for loading to complete before starting the scrolling animation.
**Validates: Requirements 3.4, 4.5**

### Property 9: ARIA announcements for auto-advance
*For any* ProductImageGallery with auto-advance active, image changes should trigger ARIA live region updates for screen reader users.
**Validates: Requirements 4.1**

### Property 10: Reduced motion preference
*For any* user with prefers-reduced-motion enabled, the scrolling effect should be disabled and transitions should be instant.
**Validates: Requirements 4.2**

### Property 11: Pause when not visible
*For any* ProductImageGallery, when the gallery is not in the viewport or the browser tab is not active, auto-advance should pause.
**Validates: Requirements 4.3, 4.4**

### Property 12: Configuration validation
*For any* configuration values provided (interval, duration), if they are not positive numbers, the system should fall back to default values.
**Validates: Requirements 5.3, 5.4**

## Error Handling

### Invalid Configuration
- Validate `autoAdvanceInterval` and `transitionDuration` are positive numbers
- Fall back to defaults if invalid: 5000ms interval, 1000ms duration
- Log warnings in development mode for invalid configurations

### Image Loading Failures
- Maintain existing error handling for failed image loads
- Skip auto-advance to failed images
- Show error state without breaking auto-advance for other images

### Animation Interruption
- If component unmounts during animation, clean up timers immediately
- If user interacts during animation, cancel animation and respond to interaction
- Ensure no orphaned timers or animation states

### Browser API Unavailability
- Gracefully degrade if Intersection Observer is not available (assume always visible)
- Gracefully degrade if Page Visibility API is not available (assume always active)
- Feature should work in all modern browsers with progressive enhancement

## Testing Strategy

### Unit Testing Framework
- **Framework**: Jest with React Testing Library
- **Location**: `frontend/app/[locale]/products/[slug]/__tests__/ProductImageGallery.test.tsx`

### Property-Based Testing Framework
- **Framework**: fast-check (JavaScript/TypeScript property-based testing library)
- **Configuration**: Minimum 100 iterations per property test
- **Tagging**: Each property test must include a comment with format: `**Feature: product-gallery-auto-advance, Property {number}: {property_text}**`

### Unit Test Coverage
Unit tests will cover specific examples and integration points:
- Component renders correctly with auto-advance enabled/disabled
- Navigation buttons appear/disappear on hover
- Manual navigation works correctly
- Zoom interaction works correctly
- Configuration prop validation
- Edge cases: single image, empty images array
- Reduced motion media query handling

### Property-Based Test Coverage
Property tests will verify universal behaviors:
- **Property 1**: Timer starts and advances images for any valid image array
- **Property 2**: All timers cleaned up on unmount for any component state
- **Property 3**: Hover shows/hides buttons for any hover sequence
- **Property 4**: Any user interaction pauses and resets timer
- **Property 5**: Zoom toggle pauses/resumes auto-advance correctly
- **Property 6**: Animation duration matches configuration for any valid duration
- **Property 7**: Navigation blocked during animation for any navigation attempt
- **Property 8**: Waits for image load for any loading state
- **Property 9**: ARIA updates occur for any image transition
- **Property 10**: Reduced motion disables animation for any transition
- **Property 11**: Visibility changes pause/resume for any visibility state
- **Property 12**: Invalid configs fall back to defaults for any invalid input

### Test Utilities
- Mock timers using Jest fake timers
- Mock Intersection Observer API
- Mock Page Visibility API
- Mock prefers-reduced-motion media query
- Helper functions for simulating user interactions
- Helper functions for advancing time and checking state

## Implementation Details

### Scrolling Animation Implementation

The scrolling effect will be implemented using CSS transforms and transitions:

```css
.gallery-container {
  position: relative;
  overflow: hidden;
}

.gallery-track {
  display: flex;
  transition: transform 1s ease-in-out;
  will-change: transform;
}

.gallery-track.no-transition {
  transition: none;
}

.gallery-image {
  flex-shrink: 0;
  width: 100%;
}
```

The animation sequence for **next** (forward):
1. Current image at `translateX(0%)`
2. On advance: animate track to `translateX(-100%)` over 1 second
3. Current image slides left and disappears
4. Next image slides in from right
5. After animation: reset track position and update current index

The animation sequence for **previous** (backward):
1. Previous image positioned at `translateX(-100%)` (off-screen left)
2. Current image at `translateX(0%)`
3. On previous: animate track to `translateX(0%)` over 1 second
4. Current image slides right and disappears
5. Previous image slides in from left
6. After animation: reset track position and update current index

### Auto-Advance Timer Logic

```typescript
// Pseudo-code for timer logic
function startAutoAdvance() {
  if (!shouldAutoAdvance()) return;

  clearExistingTimer();

  autoAdvanceTimer.current = setTimeout(() => {
    if (canAdvance()) {
      advanceToNextImage();
    }
  }, autoAdvanceInterval);
}

function shouldAutoAdvance() {
  return (
    autoAdvance &&
    images.length > 1 &&
    !isPaused &&
    !isZoomed &&
    !isAnimating &&
    isVisible &&
    isTabActive
  );
}
```

### Visibility Detection

```typescript
// Intersection Observer for viewport visibility
useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => setIsInViewport(entry.isIntersecting),
    { threshold: 0.5 }
  );

  if (galleryRef.current) {
    observer.observe(galleryRef.current);
  }

  return () => observer.disconnect();
}, []);

// Page Visibility API for tab visibility
useEffect(() => {
  const handleVisibilityChange = () => {
    setIsTabActive(!document.hidden);
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, []);
```

### Navigation Button Hover State

```css
.nav-buttons {
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
  pointer-events: none;
}

.gallery-container:hover .nav-buttons {
  opacity: 1;
  pointer-events: auto;
}

/* On mobile/touch devices, always show buttons */
@media (hover: none) {
  .nav-buttons {
    opacity: 1;
    pointer-events: auto;
  }
}
```

### Accessibility Considerations

```typescript
// ARIA live region for screen readers
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {`Image ${currentIndex + 1} of ${images.length}: ${altText}`}
</div>

// Respect prefers-reduced-motion
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const transitionClass = prefersReducedMotion ? 'no-transition' : '';
```

## Performance Optimizations

1. **Use CSS transforms** instead of position changes for better performance
2. **will-change: transform** hint for browser optimization
3. **Pause when not visible** to conserve CPU/battery
4. **Debounce hover events** to prevent excessive state updates
5. **Use useCallback** for event handlers to prevent unnecessary re-renders
6. **Lazy load images** that aren't immediately visible
7. **Cancel pending animations** when component unmounts

## Migration Strategy

This is an enhancement to an existing component, not a breaking change:

1. **Backward Compatible**: All existing props and behavior remain unchanged
2. **Opt-in**: Auto-advance is enabled by default but can be disabled via props
3. **No Database Changes**: Purely frontend enhancement
4. **No API Changes**: No backend modifications required
5. **Gradual Rollout**: Can be tested on staging before production
6. **Feature Flag**: Could add a feature flag if needed for gradual rollout

## Security Considerations

- No security implications as this is a client-side UI enhancement
- No user data is collected or transmitted
- No new external dependencies that could introduce vulnerabilities
- Timers are properly cleaned up to prevent memory leaks

## Future Enhancements

Potential future improvements (out of scope for this spec):
- Configurable animation types (slide, fade, zoom)
- Touch gesture for pause/resume
- Progress indicator showing auto-advance countdown
- Admin configuration for default auto-advance settings
- Analytics tracking for user engagement with auto-advance
