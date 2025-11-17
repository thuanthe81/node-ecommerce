# Auto-Rotation Feature Implementation

## Overview

This document describes the implementation of the auto-rotation feature for the Carousel3D component, which automatically rotates the carousel at specified intervals while intelligently pausing during user interactions.

## Features Implemented

### 1. Auto-Rotation Timer
- Implemented using `useEffect` and `setInterval`
- Rotates carousel to the next item at configurable intervals
- Default interval: 5000ms (5 seconds)
- Uses the existing `animateToRotation` function for smooth transitions

### 2. Configuration Props
- `autoRotate`: Boolean to enable/disable auto-rotation (default: false)
- `autoRotateInterval`: Time in milliseconds between rotations (default: 5000)

### 3. Pause During User Interaction
Auto-rotation automatically pauses when:
- **Dragging**: User is dragging the carousel with mouse or touch
- **Hovering**: User's mouse is over the carousel
- **Manual Navigation**: User clicks navigation buttons, indicators, or items
- **Keyboard Navigation**: User navigates with arrow keys
- **Animation in Progress**: Prevents overlapping animations
- **Reduced Motion**: Respects user's accessibility preferences

### 4. Resume After Interaction
- Auto-rotation resumes 2 seconds after user interaction ends
- Timeout is cleared and reset on new interactions
- Only resumes if auto-rotation is enabled and not manually paused

### 5. Play/Pause Control Button
- Positioned in top-right corner of carousel
- Shows play icon when paused, pause icon when playing
- Accessible with keyboard focus and ARIA labels
- Styled with backdrop blur and hover effects
- Only visible when `autoRotate` prop is true

### 6. Keyboard Support
- **Escape key**: Stops auto-rotation completely
- Existing arrow key navigation also pauses auto-rotation

## State Management

### New State Variables
```typescript
const [isAutoRotating, setIsAutoRotating] = useState(autoRotate);
const [isPaused, setIsPaused] = useState(false);
const [isHovered, setIsHovered] = useState(false);
const [autoRotateTimeoutId, setAutoRotateTimeoutId] = useState<NodeJS.Timeout | null>(null);
```

### State Logic
- `isAutoRotating`: Tracks if auto-rotation is currently active
- `isPaused`: User's manual pause preference
- `isHovered`: Tracks hover state for pause behavior
- `autoRotateTimeoutId`: Manages resume timeout cleanup

## Implementation Details

### Auto-Rotation Effect
```typescript
useEffect(() => {
  if (
    !isAutoRotating ||
    isPaused ||
    state.isDragging ||
    isHovered ||
    state.isAnimating ||
    prefersReducedMotion
  ) {
    return;
  }

  const intervalId = setInterval(() => {
    const itemAngle = 360 / items.length;
    const targetRotation = state.rotation + itemAngle;
    animateToRotation(targetRotation);
  }, config.autoRotateInterval);

  return () => clearInterval(intervalId);
}, [dependencies]);
```

### Resume Timeout Effect
```typescript
useEffect(() => {
  if (autoRotateTimeoutId) {
    clearTimeout(autoRotateTimeoutId);
    setAutoRotateTimeoutId(null);
  }

  if (
    config.autoRotate &&
    !isPaused &&
    !state.isDragging &&
    !isHovered &&
    !state.isAnimating
  ) {
    const timeoutId = setTimeout(() => {
      setIsAutoRotating(true);
    }, 2000);

    setAutoRotateTimeoutId(timeoutId);
  }

  return () => {
    if (autoRotateTimeoutId) {
      clearTimeout(autoRotateTimeoutId);
    }
  };
}, [dependencies]);
```

### Event Handlers
All interaction handlers now pause auto-rotation:
- `handleDragStart`: Pauses on drag start
- `handleNext/handlePrevious`: Pauses on manual navigation
- `handleItemClick`: Pauses on item click
- `handleIndicatorClick`: Pauses on indicator click
- `handleMouseEnter`: Pauses on hover
- `handleMouseLeaveContainer`: Resumes after hover (with timeout)

## Usage Example

```tsx
<Carousel3D
  items={carouselItems}
  autoRotate={true}
  autoRotateInterval={5000}
  showControls={true}
  showIndicators={true}
/>
```

## Accessibility

- Play/pause button has proper ARIA labels
- Respects `prefers-reduced-motion` preference
- Keyboard accessible (Escape to stop)
- Screen reader friendly with status announcements

## Performance Considerations

- Uses `setInterval` for consistent timing
- Properly cleans up intervals and timeouts on unmount
- No performance impact when auto-rotation is disabled
- Leverages existing animation system for smooth transitions

## Testing Recommendations

1. **Auto-rotation timing**: Verify rotation occurs at specified intervals
2. **Pause on interaction**: Test all interaction types pause rotation
3. **Resume behavior**: Verify 2-second delay before resuming
4. **Play/pause button**: Test manual control functionality
5. **Keyboard navigation**: Test Escape key stops rotation
6. **Reduced motion**: Verify respects accessibility preferences
7. **Multiple carousels**: Test multiple instances don't interfere

## Future Enhancements

- Configurable resume delay
- Direction control (forward/backward)
- Pause on focus (for keyboard users)
- Analytics tracking for auto-rotation engagement
- Custom easing for auto-rotation transitions
