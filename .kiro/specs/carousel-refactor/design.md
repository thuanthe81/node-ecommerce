# Design Document

## Overview

This design extracts the animation and auto-advance logic from the ProductImageGallery component into a reusable Carousel component. The new component will provide a modern, accessible image carousel with configurable thumbnail display, replacing the existing Carousel3D and Carousel2D implementations. The design focuses on creating a flexible, performant component that can be used across the application, including on the homepage.

## Architecture

The Carousel component will follow a modular architecture similar to other refactored components in the codebase:

```
frontend/components/Carousel/
├── Carousel.tsx              # Main component
├── index.tsx                 # Export entry point
├── types.ts                  # TypeScript interfaces
├── components/               # Sub-components
│   ├── CarouselImage.tsx    # Individual image display
│   ├── CarouselControls.tsx # Navigation buttons
│   └── CarouselThumbnails.tsx # Thumbnail strip
├── hooks/                    # Custom hooks
│   ├── useAutoAdvance.ts    # Auto-advance logic (moved from ProductImageGallery)
│   ├── useVisibilityDetection.ts # Visibility detection (moved from ProductImageGallery)
│   ├── useCarouselAnimation.ts # Animation state management
│   └── useImagePreloader.ts # Image preloading logic
└── utils/                    # Helper functions
    └── imageHelpers.ts      # Image loading utilities
```

The component will be self-contained with all necessary logic for:
- Image navigation and animation
- Auto-advance with pause conditions
- Visibility detection
- Image preloading
- Accessibility features
- Touch/swipe gestures
- Keyboard navigation

## Components and Interfaces

### Main Carousel Component

```typescript
interface CarouselImage {
  id: string;
  url: string;
  altTextEn: string;
  altTextVi: string;
}

interface CarouselProps {
  images: CarouselImage[];
  // Display options
  showThumbnails?: boolean;
  showControls?: boolean;
  // Auto-advance configuration
  autoAdvance?: boolean;
  autoAdvanceInterval?: number;
  transitionDuration?: number;
  // Styling
  className?: string;
  aspectRatio?: 'square' | 'video' | 'wide';
  // Accessibility
  ariaLabel?: string;
  // Callbacks
  onImageChange?: (index: number) => void;
}
```

### Sub-Components

**CarouselImage**: Renders individual images with loading states and error handling
```typescript
interface CarouselImageProps {
  image: CarouselImage;
  locale: string;
  isActive: boolean;
  isAnimating: boolean;
  animationDirection: 'next' | 'prev' | null;
  position: 'current' | 'next' | 'prev';
  onLoad: () => void;
  onError: () => void;
}
```

**CarouselControls**: Navigation buttons (previous/next)
```typescript
interface CarouselControlsProps {
  onPrevious: () => void;
  onNext: () => void;
  isVisible: boolean;
  disabled: boolean;
}
```

**CarouselThumbnails**: Thumbnail strip below main image
```typescript
interface CarouselThumbnailsProps {
  images: CarouselImage[];
  currentIndex: number;
  locale: string;
  onThumbnailClick: (index: number) => void;
}
```

## Data Models

### Animation State

```typescript
interface AnimationState {
  isAnimating: boolean;
  animationDirection: 'next' | 'prev' | null;
  currentIndex: number;
}
```

### Image Loading State

```typescript
interface ImageLoadingState {
  loadedImages: Set<string>;
  failedImages: Set<string>;
}
```

### Auto-Advance State

```typescript
interface AutoAdvanceState {
  isPausedByUser: boolean;
  isVisible: boolean;
  isHovered: boolean;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Navigation wraps around correctly

*For any* carousel with N images, navigating next from index N-1 should result in index 0, and navigating previous from index 0 should result in index N-1
**Validates: Requirements 2.1, 2.2**

### Property 2: Auto-advance pauses on interaction

*For any* carousel with auto-advance enabled, when a user hovers over the carousel or manually navigates, auto-advance should be paused
**Validates: Requirements 4.2, 4.3**

### Property 3: Thumbnail selection updates current index

*For any* carousel with thumbnails enabled, clicking thumbnail at index I should set the current index to I
**Validates: Requirements 3.2**

### Property 4: Visibility controls auto-advance

*For any* carousel with auto-advance enabled, when the carousel is not visible in the viewport, auto-advance should be paused
**Validates: Requirements 4.4**

### Property 5: Reduced motion disables animations

*For any* carousel, when the user has prefers-reduced-motion enabled, all transitions should be instant (no animation)
**Validates: Requirements 1.4, 5.4**

### Property 6: Image preloading prevents failed transitions

*For any* carousel navigation action, the target image should be preloaded before the animation starts
**Validates: Requirements 1.2**

### Property 7: Keyboard navigation works correctly

*For any* carousel, pressing the left arrow key should navigate to the previous image, and pressing the right arrow key should navigate to the next image
**Validates: Requirements 2.3, 2.4**

### Property 8: Touch gestures navigate correctly

*For any* carousel on a touch device, swiping left should navigate to the next image, and swiping right should navigate to the previous image
**Validates: Requirements 2.5, 2.6**

### Property 9: Configuration validation provides safe defaults

*For any* carousel configuration with invalid values (negative, zero, or non-finite numbers), the system should fall back to safe default values
**Validates: Requirements 6.3, 6.4**

### Property 10: Thumbnail visibility is configurable

*For any* carousel, when showThumbnails is false, the thumbnail strip should not be rendered
**Validates: Requirements 3.4, 6.1**

## Error Handling

### Image Loading Errors

- Failed images are tracked in `failedImages` set
- Preloading failures are caught and logged but don't block navigation
- Error state is displayed for images that fail to load
- Retry logic is not implemented (images are marked as failed permanently)

### Configuration Validation

- Invalid configuration values (negative, zero, NaN, Infinity) fall back to defaults
- Default values: autoAdvanceInterval=3000ms, transitionDuration=500ms
- Validation warnings logged in development mode only

### Browser Compatibility

- Graceful degradation for browsers without IntersectionObserver
- Graceful degradation for browsers without Page Visibility API
- Feature detection for 3D transforms (not needed for this 2D carousel)
- Touch event support detection

### Animation State Management

- Prevent navigation during active animations
- Clear timers on unmount to prevent memory leaks
- Handle rapid navigation attempts gracefully

## Testing Strategy

### Unit Tests

The testing strategy will include both unit tests and property-based tests to ensure comprehensive coverage.

**Unit tests will cover:**
- Component rendering with different prop combinations
- Thumbnail visibility based on showThumbnails prop
- Control button visibility and interaction
- Image loading and error states
- Configuration validation with invalid values
- Edge cases: single image, empty image array
- ARIA attributes and accessibility features

**Test files:**
- `frontend/components/Carousel/__tests__/Carousel.test.tsx`
- `frontend/components/Carousel/__tests__/CarouselThumbnails.test.tsx`
- `frontend/components/Carousel/__tests__/useAutoAdvance.test.tsx`
- `frontend/components/Carousel/__tests__/useVisibilityDetection.test.tsx`

### Property-Based Tests

Property-based testing will be implemented using **fast-check** (the standard PBT library for TypeScript/JavaScript). Each property-based test will run a minimum of 100 iterations to ensure thorough coverage.

**Property tests will verify:**
- Navigation wrapping (Property 1)
- Auto-advance pause behavior (Property 2)
- Thumbnail selection (Property 3)
- Visibility-based auto-advance control (Property 4)
- Reduced motion handling (Property 5)
- Image preloading (Property 6)
- Keyboard navigation (Property 7)
- Touch gesture navigation (Property 8)
- Configuration validation (Property 9)
- Thumbnail visibility (Property 10)

Each property-based test will be tagged with a comment in the format:
`// Feature: carousel-refactor, Property {number}: {property_text}`

**Test file:**
- `frontend/components/Carousel/__tests__/Carousel.property.test.tsx`

### Integration Tests

- Test carousel integration with ProductImageGallery
- Test carousel integration with homepage
- Test auto-advance with visibility detection
- Test animation sequences (prev → current → next)
- Test user interaction flows (hover, click, swipe)

### Accessibility Tests

- Screen reader announcements
- Keyboard navigation
- ARIA attributes
- Focus management
- Reduced motion support

## Implementation Notes

### Extracting from ProductImageGallery

The following logic will be extracted and generalized:

1. **Animation Logic**: The track-based sliding animation with translateX transforms
2. **Auto-Advance Hook**: The `useAutoAdvance` hook will be moved to the Carousel component
3. **Visibility Detection Hook**: The `useVisibilityDetection` hook will be moved to the Carousel component
4. **Image Preloading**: The `preloadImage` function and loading state management
5. **Navigation Functions**: `goToNext`, `goToPrevious`, `goToImage` with animation support
6. **Touch Gestures**: Swipe detection logic
7. **Keyboard Navigation**: Arrow key handling
8. **Reduced Motion Detection**: Media query detection and handling

### Differences from ProductImageGallery

The Carousel component will differ from ProductImageGallery in these ways:

1. **No Zoom Feature**: Carousel won't include the zoom-on-click functionality
2. **Configurable Thumbnails**: Thumbnails can be shown or hidden via prop
3. **Simplified Props**: More focused prop interface for general carousel use
4. **No Product-Specific Logic**: Removes product name and locale-specific fallbacks
5. **Reusable Design**: Designed for use across the application, not just product pages

### Replacing Old Carousel Components

The old Carousel3D and Carousel2D components will be completely removed:

1. Delete `frontend/components/Carousel3D/` directory
2. Delete old `frontend/components/Carousel/` directory (will be replaced)
3. Delete `frontend/components/Carousel.tsx` (backward compatibility wrapper)
4. Delete associated test files
5. Update all imports across the codebase
6. Verify no references remain using grep search

### Homepage Integration

The homepage will be updated to use the new Carousel component:

1. Import the new Carousel component
2. Configure with appropriate props (autoAdvance, showThumbnails, etc.)
3. Provide featured images data
4. Style to match homepage design
5. Ensure responsive behavior across viewports

## Performance Considerations

### Image Preloading

- Preload next/previous images before animation starts
- Track loaded images to avoid redundant loading
- Use browser cache effectively

### Animation Performance

- Use CSS transforms (translateX) for GPU acceleration
- Set `willChange: 'transform'` during animations
- Clear `willChange` when not animating
- Use `requestAnimationFrame` for smooth transitions

### Memory Management

- Clear timers on unmount
- Remove event listeners on cleanup
- Limit number of simultaneously rendered images (current + next + prev)

### Render Optimization

- Memoize sub-components to prevent unnecessary re-renders
- Use stable callbacks with useCallback
- Minimize state updates during animations
