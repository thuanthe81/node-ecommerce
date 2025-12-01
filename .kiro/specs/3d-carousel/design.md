# Design Document: 3D Ring Carousel Component

## Overview

The 3D Ring Carousel is an interactive React component that displays images in a circular 3D formation with smooth rotation animations. The component will be integrated into the homepage to showcase featured products or promotional content. It uses CSS 3D transforms and React hooks for state management, providing both mouse/touch drag interactions and button-based navigation.

## Architecture

### Component Structure

```
Carousel3D (Main Component)
├── CarouselRing (3D Container)
│   └── CarouselItem[] (Individual Images)
├── CarouselControls (Navigation Buttons)
└── CarouselIndicators (Optional Dots)
```

### Technology Stack

- **React 18+**: Component framework with hooks
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling and responsive design
- **CSS 3D Transforms**: Ring layout and rotation effects
- **Next.js**: Integration with existing app structure

## Components and Interfaces

### 1. Carousel3D Component

Main component that orchestrates the carousel functionality.

```typescript
interface CarouselItem {
  id: string;
  imageUrl: string;
  alt: string;
  linkUrl?: string;
  title?: string;
}

interface Carousel3DProps {
  items: CarouselItem[];
  autoRotate?: boolean;
  autoRotateInterval?: number; // milliseconds
  rotationSpeed?: number; // degrees per interaction
  ringRadius?: number; // pixels
  itemWidth?: number; // pixels
  itemHeight?: number; // pixels
  showControls?: boolean;
  showIndicators?: boolean;
  className?: string;
}

interface CarouselState {
  rotation: number; // current rotation angle in degrees
  isDragging: boolean;
  dragStartX: number;
  dragStartRotation: number;
  isAnimating: boolean;
  focusedIndex: number;
}
```

### 2. CarouselItem Component

Individual image item with 3D positioning.

```typescript
interface CarouselItemProps {
  item: CarouselItem;
  index: number;
  totalItems: number;
  rotation: number;
  ringRadius: number;
  itemWidth: number;
  itemHeight: number;
  isFocused: boolean;
  onClick: () => void;
}
```

### 3. CarouselControls Component

Navigation buttons for manual rotation.

```typescript
interface CarouselControlsProps {
  onPrevious: () => void;
  onNext: () => void;
  disabled: boolean;
}
```

## Data Models

### Carousel Configuration

```typescript
const DEFAULT_CONFIG = {
  autoRotate: false,
  autoRotateInterval: 5000,
  rotationSpeed: 360 / items.length, // one item rotation
  ringRadius: 300,
  itemWidth: 200,
  itemHeight: 300,
  showControls: true,
  showIndicators: true,
  animationDuration: 600, // milliseconds
  dragSensitivity: 0.5,
};
```

### 3D Transform Calculations

```typescript
// Calculate position for each item in the ring
function calculateItemTransform(
  index: number,
  totalItems: number,
  rotation: number,
  ringRadius: number
): string {
  const angle = (360 / totalItems) * index + rotation;
  const angleRad = (angle * Math.PI) / 180;

  const x = Math.sin(angleRad) * ringRadius;
  const z = Math.cos(angleRad) * ringRadius;

  return `translate3d(${x}px, 0, ${z}px) rotateY(${-angle}deg)`;
}

// Calculate scale and opacity based on z-position
function calculateItemStyle(z: number, ringRadius: number) {
  const normalizedZ = (z + ringRadius) / (ringRadius * 2);
  const scale = 0.6 + normalizedZ * 0.4; // scale from 0.6 to 1.0
  const opacity = 0.4 + normalizedZ * 0.6; // opacity from 0.4 to 1.0

  return { scale, opacity };
}
```

## Implementation Details

### 3D CSS Setup

```css
.carousel-container {
  perspective: 1200px;
  perspective-origin: 50% 50%;
}

.carousel-ring {
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.carousel-item {
  transform-style: preserve-3d;
  backface-visibility: hidden;
  will-change: transform;
}
```

### Interaction Handling

**Mouse/Touch Drag:**
```typescript
const handleDragStart = (clientX: number) => {
  setState(prev => ({
    ...prev,
    isDragging: true,
    dragStartX: clientX,
    dragStartRotation: prev.rotation,
  }));
};

const handleDragMove = (clientX: number) => {
  if (!state.isDragging) return;

  const deltaX = clientX - state.dragStartX;
  const rotationDelta = deltaX * config.dragSensitivity;

  setState(prev => ({
    ...prev,
    rotation: prev.dragStartRotation + rotationDelta,
  }));
};

const handleDragEnd = () => {
  // Snap to nearest item
  const itemAngle = 360 / items.length;
  const nearestIndex = Math.round(state.rotation / itemAngle);
  const targetRotation = nearestIndex * itemAngle;

  animateToRotation(targetRotation);
};
```

**Button Navigation:**
```typescript
const rotateToNext = () => {
  const itemAngle = 360 / items.length;
  const targetRotation = state.rotation + itemAngle;
  animateToRotation(targetRotation);
};

const rotateToPrevious = () => {
  const itemAngle = 360 / items.length;
  const targetRotation = state.rotation - itemAngle;
  animateToRotation(targetRotation);
};
```

**Keyboard Navigation:**
```typescript
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowLeft') {
    rotateToPrevious();
  } else if (e.key === 'ArrowRight') {
    rotateToNext();
  }
};
```

### Responsive Design

```typescript
const RESPONSIVE_CONFIG = {
  mobile: {
    ringRadius: 200,
    itemWidth: 150,
    itemHeight: 200,
  },
  tablet: {
    ringRadius: 250,
    itemWidth: 180,
    itemHeight: 250,
  },
  desktop: {
    ringRadius: 300,
    itemWidth: 200,
    itemHeight: 300,
  },
};

// Use window resize listener or Tailwind breakpoints
const useResponsiveConfig = () => {
  const [config, setConfig] = useState(RESPONSIVE_CONFIG.desktop);

  useEffect(() => {
    const updateConfig = () => {
      const width = window.innerWidth;
      if (width < 768) setConfig(RESPONSIVE_CONFIG.mobile);
      else if (width < 1024) setConfig(RESPONSIVE_CONFIG.tablet);
      else setConfig(RESPONSIVE_CONFIG.desktop);
    };

    updateConfig();
    window.addEventListener('resize', updateConfig);
    return () => window.removeEventListener('resize', updateConfig);
  }, []);

  return config;
};
```

## Integration with Homepage

### Placement Strategy

The carousel will be integrated into the `HomeContent.tsx` component, positioned prominently above the main content section.

```typescript
// Updated HomeContent.tsx structure
<div className="homepage-container">
  <PromotionalBanner /> {/* Existing banner */}
  <Carousel3D items={featuredItems} /> {/* New 3D carousel */}
  <main className="main-content">
    {/* Existing content */}
  </main>
</div>
```

### Data Source

The carousel will fetch featured products or promotional content from the existing API:

```typescript
// Option 1: Featured products
const items = await productApi.getProducts({
  featured: true,
  limit: 6
});

// Option 2: Banner content
const items = await contentApi.getBanners();

// Transform to carousel format
const carouselItems = items.map(item => ({
  id: item.id,
  imageUrl: item.imageUrl || item.images?.[0]?.url,
  alt: item.name || item.title,
  linkUrl: `/products/${item.slug}` || item.linkUrl,
  title: item.name || item.title,
}));
```

## Error Handling

### Image Loading Failures

```typescript
const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

const handleImageError = (itemId: string) => {
  setImageErrors(prev => new Set(prev).add(itemId));
};

// Render placeholder for failed images
{imageErrors.has(item.id) ? (
  <div className="placeholder-image">
    <ImageIcon />
    <span>Image unavailable</span>
  </div>
) : (
  <img src={item.imageUrl} alt={item.alt} />
)}
```

### Insufficient Items

```typescript
// Minimum 3 items required for ring effect
if (items.length < 3) {
  return (
    <div className="carousel-fallback">
      <SimpleSlider items={items} />
    </div>
  );
}
```

### Performance Issues

```typescript
// Throttle drag events for performance
const throttledDragMove = useCallback(
  throttle(handleDragMove, 16), // ~60fps
  [state.isDragging]
);

// Use CSS transforms instead of position changes
// Enable hardware acceleration with will-change
```

## Accessibility

### ARIA Attributes

```typescript
<div
  role="region"
  aria-label="Featured products carousel"
  aria-roledescription="carousel"
>
  <div className="carousel-ring" aria-live="polite">
    {items.map((item, index) => (
      <div
        key={item.id}
        role="group"
        aria-roledescription="slide"
        aria-label={`${index + 1} of ${items.length}: ${item.title}`}
        aria-hidden={index !== focusedIndex}
      >
        {/* Item content */}
      </div>
    ))}
  </div>
</div>
```

### Keyboard Navigation

- Arrow Left/Right: Navigate between items
- Tab: Focus on controls and focused item
- Enter/Space: Activate focused item link
- Escape: Stop auto-rotation

### Reduced Motion Support

```typescript
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

const animationDuration = prefersReducedMotion ? 0 : config.animationDuration;
```

## Testing Strategy

### Unit Tests

1. **Transform Calculations**
   - Test `calculateItemTransform` with various inputs
   - Verify correct positioning for different item counts
   - Test rotation angle normalization

2. **State Management**
   - Test drag interaction state updates
   - Verify rotation snapping logic
   - Test focus index calculation

3. **Event Handlers**
   - Test mouse/touch event handling
   - Verify keyboard navigation
   - Test button click handlers

### Integration Tests

1. **Component Rendering**
   - Verify all items render correctly
   - Test with minimum (3) and maximum (12) items
   - Test responsive behavior at different breakpoints

2. **User Interactions**
   - Test drag-to-rotate functionality
   - Verify button navigation
   - Test click-to-focus behavior
   - Test keyboard navigation

3. **Error Scenarios**
   - Test with missing images
   - Test with insufficient items
   - Test with invalid data

### Visual Regression Tests

1. Capture screenshots at different rotation angles
2. Test responsive layouts on mobile/tablet/desktop
3. Verify 3D perspective rendering
4. Test focus states and hover effects

### Performance Tests

1. Measure frame rate during rotation
2. Test with maximum number of items
3. Verify smooth animations on mobile devices
4. Test memory usage during extended use

## Performance Optimization

### Rendering Optimization

```typescript
// Memoize item components
const CarouselItem = memo(({ item, ...props }: CarouselItemProps) => {
  // Component implementation
});

// Virtualize off-screen items (optional for large item counts)
const visibleItems = useMemo(() => {
  return items.filter((_, index) => {
    const angle = (360 / items.length) * index + rotation;
    const normalizedAngle = ((angle % 360) + 360) % 360;
    return normalizedAngle < 180 || normalizedAngle > 180;
  });
}, [items, rotation]);
```

### Animation Performance

```typescript
// Use CSS transforms for hardware acceleration
// Avoid layout thrashing
// Use requestAnimationFrame for smooth updates

const animateToRotation = (targetRotation: number) => {
  const startRotation = state.rotation;
  const startTime = performance.now();

  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / config.animationDuration, 1);
    const eased = easeInOutCubic(progress);

    const currentRotation = startRotation + (targetRotation - startRotation) * eased;

    setState(prev => ({ ...prev, rotation: currentRotation }));

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      setState(prev => ({ ...prev, isAnimating: false }));
    }
  };

  setState(prev => ({ ...prev, isAnimating: true }));
  requestAnimationFrame(animate);
};
```

### Image Loading and Caching

```typescript
// Use Next.js Image component for automatic optimization
// Ensure images are cached and not re-downloaded on focus changes
// Load all images on initial render with consistent priority

import Image from 'next/image';

<Image
  src={item.imageUrl}
  alt={item.alt}
  fill
  sizes="(max-width: 768px) 150px, (max-width: 1024px) 180px, 200px"
  // Use static priority - don't change based on focus state
  // This prevents re-downloading when focus changes
  priority={false}
  unoptimized={false}
  className="object-cover object-center"
/>
```

**Key Optimization Principles:**

1. **Consistent Priority**: The `priority` prop should remain constant for each image, not change based on focus state. Changing `priority` can trigger re-downloads.

2. **Browser Caching**: Next.js Image component automatically handles browser caching. Images are cached by URL and won't be re-downloaded unless the cache is invalidated.

3. **Preloading Strategy**: For carousel images, consider preloading all images on component mount rather than lazy loading, since users will likely view all items.

4. **Avoid Dynamic Props**: Props like `priority`, `loading`, and `unoptimized` should not change dynamically based on state (like `isFocused`). This ensures stable image loading behavior.

## Configuration and Customization

### Admin Integration

The carousel items can be managed through the existing content management system:

1. Use existing Banner content type with a new "carousel" category
2. Add a "displayOrder" field to control item sequence
3. Reuse existing image upload and link management

### Props-based Customization

```typescript
// Example usage with custom configuration
<Carousel3D
  items={featuredProducts}
  autoRotate={true}
  autoRotateInterval={4000}
  ringRadius={350}
  itemWidth={220}
  itemHeight={320}
  showControls={true}
  showIndicators={false}
  className="my-custom-carousel"
/>
```

## Browser Compatibility

- Modern browsers with CSS 3D transform support
- Fallback to 2D carousel for older browsers
- Tested on: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Mobile: iOS Safari 14+, Chrome Android 90+

## Future Enhancements

1. **Video Support**: Allow video items in the carousel
2. **Parallax Effects**: Add depth-based parallax scrolling
3. **Gesture Recognition**: Support pinch-to-zoom and multi-touch
4. **Analytics Integration**: Track item views and interactions
5. **A/B Testing**: Support for testing different configurations