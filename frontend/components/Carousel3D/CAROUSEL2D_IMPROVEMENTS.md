# Carousel2D and SimpleFallbackSlider Improvements

## Overview
Enhanced the Carousel2D component and SimpleFallbackSlider with full-width layout support and automatic slide functionality.

## Key Improvements

### 1. Full-Width Layout Support
- Added `fullWidth` prop (default: `true`) to SimpleFallbackSlider
- When enabled, the carousel spans the entire container width
- Navigation buttons positioned inside the carousel (left: 4, right: 4) for full-width mode
- Responsive height with max-height constraint (70vh) for better viewport adaptation
- Removes rounded corners in full-width mode for edge-to-edge display

### 2. Auto-Slide Functionality
- Added `autoSlide` prop (default: `true`) to enable automatic slide transitions
- Added `autoSlideInterval` prop (default: `5000ms`) to control slide duration
- Auto-slide pauses on:
  - Mouse hover over the carousel
  - Manual navigation (previous/next buttons)
  - Indicator clicks
- Auto-slide resumes after 3 seconds of inactivity following manual interaction
- Play/Pause button in top-right corner for user control

### 3. Enhanced User Experience
- Smooth transitions between slides with CSS animations
- Visual feedback on all interactive elements (buttons, indicators)
- Accessibility improvements:
  - ARIA labels for all controls
  - Keyboard navigation support
  - Screen reader announcements
- Hover effects pause auto-slide for better user control
- Manual navigation temporarily pauses auto-slide

### 4. Responsive Design
- Full-width mode adapts to container size
- Navigation buttons positioned appropriately for both modes:
  - Full-width: Inside carousel edges (left-4, right-4)
  - Centered: Outside carousel (translate-x-12/16)
- Height constraints prevent overflow on smaller viewports
- Maintains aspect ratio and image quality

## Component Props

### SimpleFallbackSlider
```typescript
interface SimpleFallbackSliderProps {
  items: CarouselItem[];
  itemWidth?: number;           // Default: 300
  itemHeight?: number;          // Default: 400
  autoSlide?: boolean;          // Default: true
  autoSlideInterval?: number;   // Default: 5000 (ms)
  fullWidth?: boolean;          // Default: true
}
```

### Carousel2D
The Carousel2D component now passes through `autoRotate` and `autoRotateInterval` props to SimpleFallbackSlider as `autoSlide` and `autoSlideInterval` respectively, maintaining API consistency with Carousel3D.

## Usage Example

```tsx
import { Carousel2D } from '@/components/Carousel';

// Full-width with auto-slide (default)
<Carousel2D
  items={carouselItems}
  autoRotate={true}
  autoRotateInterval={5000}
/>

// Centered layout without auto-slide
<Carousel2D
  items={carouselItems}
  autoRotate={false}
  itemWidth={400}
  itemHeight={500}
/>
```

## Technical Implementation

### Auto-Slide Logic
1. **Main Effect**: Advances to next slide at specified interval
2. **Pause Conditions**: Checks for `isPaused`, `isHovered`, or single item
3. **Resume Effect**: Automatically resumes after 3s of inactivity
4. **Manual Control**: Play/Pause button toggles `isPaused` state

### Layout Modes
- **Full-Width Mode**:
  - Container: `w-full`
  - Height: `min(itemHeight, 600px)` with `max-height: 70vh`
  - Buttons: Positioned inside with `left-4` / `right-4`
  - Corners: No border radius (`rounded-none`)

- **Centered Mode**:
  - Container: `max-w-2xl mx-auto px-4`
  - Height: `min(itemWidth, 400px)` × `min(itemHeight, 500px)`
  - Buttons: Positioned outside with translate
  - Corners: Rounded (`rounded-xl`)

## Browser Compatibility
- Modern browsers with CSS3 support
- Graceful degradation for older browsers
- Touch-friendly for mobile devices
- Keyboard accessible

## Performance Considerations
- Uses React hooks (useCallback, useEffect) for optimization
- Cleanup of intervals and timeouts on unmount
- Efficient state management with minimal re-renders
- Image lazy loading with Next.js Image component

## Future Enhancements
- Swipe gesture support for mobile
- Transition effects (fade, slide, etc.)
- Thumbnail preview navigation
- Video content support
- Progress bar for auto-slide timing
