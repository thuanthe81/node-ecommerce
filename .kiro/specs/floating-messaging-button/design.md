# Design Document: Floating Messaging Button

## Overview

The Floating Messaging Button is a client-side React component that provides persistent, easy access to social media messaging platforms throughout the website. The component consists of a fixed-position trigger button and an animated popup menu displaying social media icons in a curved arc layout. The component integrates with the existing Footer Settings API to retrieve configured social media URLs and only displays platforms that have been configured by administrators.

## Architecture

### Component Structure

The feature will be implemented as a modular component following the established pattern in the codebase:

```
FloatingMessagingButton/
├── FloatingMessagingButton.tsx    # Main component
├── index.tsx                      # Export entry point
├── types.ts                       # TypeScript interfaces
├── components/
│   ├── TriggerButton.tsx         # The fixed floating button
│   └── SocialMediaMenu.tsx       # The curved popup menu
├── hooks/
│   ├── useFooterSettings.ts      # Hook to fetch social media URLs
│   ├── useMenuState.ts           # Hook to manage menu open/close state
│   └── useClickOutside.ts        # Hook to detect clicks outside component
└── utils/
    └── animations.ts             # Animation configuration and helpers
```

### Integration Points

1. **Layout Integration**: The component will be added to the root layout (`frontend/app/[locale]/layout.tsx`) to ensure it appears on all pages
2. **Footer Settings API**: Uses the existing `footerSettingsApi.getFooterSettings()` method from `frontend/lib/footer-settings-api.ts`
3. **SVG Icons**: Reuses existing social media icons from `frontend/components/Svgs.tsx` (SvgFacebook, SvgTikTok, SvgZalo, SvgWhatsApp)
4. **Translations**: Integrates with next-intl for accessible labels and tooltips

## Components and Interfaces

### Main Component: FloatingMessagingButton

**Responsibilities:**
- Orchestrate the trigger button and popup menu
- Fetch and manage footer settings data
- Handle component visibility based on available social media URLs
- Manage global state (menu open/close)

**Props:** None (self-contained component)

**State:**
- `isOpen: boolean` - Whether the popup menu is visible
- `footerSettings: FooterSettings | null` - Cached footer settings data
- `isLoading: boolean` - Loading state for API request
- `error: Error | null` - Error state for API failures

### Sub-Component: TriggerButton

**Responsibilities:**
- Render the fixed-position button
- Handle click events to toggle menu
- Display appropriate icon based on menu state
- Provide keyboard accessibility

**Props:**
```typescript
interface TriggerButtonProps {
  isOpen: boolean;
  onClick: () => void;
  ariaLabel: string;
}
```

### Sub-Component: SocialMediaMenu

**Responsibilities:**
- Render social media icons in curved arc layout
- Animate icon appearance with staggered timing
- Handle individual icon clicks
- Filter out platforms without configured URLs

**Props:**
```typescript
interface SocialMediaMenuProps {
  isOpen: boolean;
  socialMediaUrls: SocialMediaUrls;
  onClose: () => void;
}

interface SocialMediaUrls {
  facebook?: string | null;
  tiktok?: string | null;
  zalo?: string | null;
  whatsapp?: string | null;
}
```

### Custom Hooks

#### useFooterSettings

```typescript
interface UseFooterSettingsReturn {
  footerSettings: FooterSettings | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

function useFooterSettings(): UseFooterSettingsReturn
```

Fetches footer settings on component mount and provides refetch capability.

#### useMenuState

```typescript
interface UseMenuStateReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

function useMenuState(initialState?: boolean): UseMenuStateReturn
```

Manages the open/close state of the popup menu with helper functions.

#### useClickOutside

```typescript
function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T>,
  handler: () => void,
  enabled?: boolean
): void
```

Detects clicks outside the referenced element and calls the handler function.

## Data Models

### FooterSettings (Existing)

```typescript
interface FooterSettings {
  id: string;
  copyrightText: string;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  googleMapsUrl: string | null;
  facebookUrl: string | null;
  twitterUrl: string | null;
  tiktokUrl: string | null;
  zaloUrl: string | null;
  whatsappUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### SocialMediaPlatform

```typescript
interface SocialMediaPlatform {
  id: 'facebook' | 'tiktok' | 'zalo' | 'whatsapp';
  name: string;
  icon: React.ComponentType<SvgProps>;
  url: string | null;
  color: string; // Brand color for hover effects
}
```

### MenuPosition

```typescript
interface MenuPosition {
  angle: number;      // Angle in degrees for arc positioning
  radius: number;     // Distance from center button
  delay: number;      // Animation delay in milliseconds
}
```

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Menu toggle on button click

*For any* menu state (open or closed), clicking the floating button should toggle the menu to the opposite state.

**Validates: Requirements 2.1, 2.2**

### Property 2: Menu closes on outside click

*For any* open menu state, clicking outside the messaging system component should close the menu.

**Validates: Requirements 2.3**

### Property 3: Icon reflects menu state

*For any* menu state, the floating button icon should visually indicate whether the menu is open or closed (e.g., different icon or rotation).

**Validates: Requirements 2.5**

### Property 4: Only configured platforms displayed

*For any* footer settings configuration, the popup menu should only display social media icons for platforms that have non-null and non-empty URL values.

**Validates: Requirements 3.3**

### Property 5: Correct icon for each platform

*For any* displayed social media platform, the rendered icon component should match the expected SVG icon for that platform (Facebook → SvgFacebook, TikTok → SvgTikTok, etc.).

**Validates: Requirements 3.5**

### Property 6: Links use configured URLs

*For any* social media link rendered in the menu, the href attribute should exactly match the URL configured in footer settings for that platform.

**Validates: Requirements 4.2**

### Property 7: Links have security attributes

*For any* social media link, the anchor element should have both rel="noopener" and rel="noreferrer" attributes for security.

**Validates: Requirements 4.3**

### Property 8: Links have accessible labels

*For any* social media link, the element should have an aria-label attribute that identifies the platform name.

**Validates: Requirements 4.5, 7.4**

### Property 9: Component hidden when no URLs configured

*For any* footer settings where all social media URLs (facebook, tiktok, zalo, whatsapp) are null or empty strings, the floating button component should not render.

**Validates: Requirements 5.3**

### Property 10: Keyboard toggle functionality

*For any* menu state, pressing Enter or Space key on the focused floating button should toggle the menu visibility.

**Validates: Requirements 7.3**

### Property 11: ARIA attributes reflect state

*For any* menu state, the floating button should have aria-expanded attribute set to "true" when menu is open and "false" when menu is closed.

**Validates: Requirements 7.5**

## Error Handling

### API Errors

**Scenario**: Footer Settings API request fails

**Handling**:
1. Log error to console for debugging
2. Set error state in component
3. Do not render the floating button
4. Optionally retry after a delay (configurable)

**User Impact**: No floating button appears, but page functionality is not affected

### Missing Data

**Scenario**: Footer settings exist but all social media URLs are null/empty

**Handling**:
1. Component detects no valid URLs
2. Does not render the floating button
3. No error is logged (this is a valid state)

**User Impact**: No floating button appears (expected behavior)

### Invalid URLs

**Scenario**: Footer settings contain malformed URLs

**Handling**:
1. Component renders links with the URLs as provided
2. Browser handles invalid URLs naturally
3. No client-side URL validation (trust backend validation)

**User Impact**: Clicking invalid links may result in browser error pages

## Testing Strategy

### Unit Testing

**Framework**: Jest with React Testing Library

**Test Coverage**:

1. **Component Rendering**
   - Renders floating button when valid URLs exist
   - Does not render when all URLs are null/empty
   - Does not render when API request fails

2. **Menu Toggle Behavior**
   - Button click opens closed menu
   - Button click closes open menu
   - Outside click closes open menu
   - Escape key closes open menu

3. **Social Media Links**
   - Correct number of links rendered based on configured URLs
   - Each link has correct href from footer settings
   - Each link has target="_blank"
   - Each link has rel="noopener noreferrer"
   - Each link has aria-label

4. **Keyboard Accessibility**
   - Button is focusable
   - Enter key toggles menu
   - Space key toggles menu
   - Tab navigation works through social links

5. **Responsive Behavior**
   - Button has minimum touch target size on mobile
   - Menu layout adjusts for small viewports

### Property-Based Testing

**Framework**: fast-check (JavaScript property-based testing library)

**Property Tests**:

1. **Menu Toggle Property** (Property 1)
   - Generate random initial menu states
   - Verify clicking always toggles to opposite state
   - **Validates: Requirements 2.1, 2.2**

2. **URL Filtering Property** (Property 4)
   - Generate random footer settings with various URL combinations
   - Verify only platforms with non-null URLs are displayed
   - **Validates: Requirements 3.3**

3. **Link URL Correctness Property** (Property 6)
   - Generate random footer settings
   - Verify each rendered link href matches the configured URL
   - **Validates: Requirements 4.2**

4. **Security Attributes Property** (Property 7)
   - Generate random footer settings
   - Verify all rendered links have rel="noopener noreferrer"
   - **Validates: Requirements 4.3**

5. **Accessibility Labels Property** (Property 8)
   - Generate random footer settings
   - Verify all rendered links have aria-label attributes
   - **Validates: Requirements 4.5, 7.4**

6. **Component Visibility Property** (Property 9)
   - Generate footer settings with all URLs null/empty
   - Verify component does not render
   - **Validates: Requirements 5.3**

7. **ARIA State Property** (Property 11)
   - Generate random menu states
   - Verify aria-expanded matches menu open/closed state
   - **Validates: Requirements 7.5**

### Integration Testing

1. **Footer Settings API Integration**
   - Mock API responses
   - Verify component fetches data on mount
   - Verify component handles API errors gracefully

2. **Layout Integration**
   - Verify component renders in layout without breaking page
   - Verify z-index keeps button above other content
   - Verify button doesn't interfere with other interactive elements

### Visual Regression Testing

1. **Desktop Views**
   - Button appearance in closed state
   - Menu appearance in open state
   - Hover states on button and links

2. **Mobile Views**
   - Button sizing and positioning
   - Menu layout on small screens
   - Touch target sizes

3. **Animation States**
   - Menu opening animation
   - Menu closing animation
   - Icon transformation

## Implementation Notes

### Positioning Strategy

The floating button will use CSS fixed positioning:

```css
.floating-button {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
}

@media (max-width: 768px) {
  .floating-button {
    bottom: 16px;
    right: 16px;
  }
}
```

### Arc Layout Calculation

Social media icons will be positioned in a curved arc extending upward and leftward from the floating button using trigonometry. The menu container is positioned above and to the left of the button, with icons arranged in an arc pattern:

```typescript
function calculateArcPosition(
  index: number,
  total: number,
  radius: number
): { x: number; y: number } {
  // Arc spans 90 degrees (π/2 radians) from left to top
  // Icons positioned in an arc extending upward and leftward
  const startAngle = Math.PI; // 180 degrees (left)
  const endAngle = Math.PI / 2; // 90 degrees (top)
  const angleStep = (endAngle - startAngle) / (total - 1);
  const angle = startAngle + angleStep * index;

  return {
    x: Math.cos(angle) * radius, // Negative values move left
    y: Math.sin(angle) * radius, // Positive values move up (in CSS, negative moves up)
  };
}
```

### Animation Timing

- **Menu open/close**: 250ms ease-in-out
- **Icon stagger delay**: 50ms between each icon
- **Icon entrance**: 200ms ease-out
- **Hover effects**: 150ms ease-in-out

### Accessibility Considerations

1. **Focus Management**: When menu opens, focus remains on button (don't auto-focus first link)
2. **Keyboard Navigation**: Tab key moves through social links in logical order
3. **Screen Reader Announcements**: Use aria-live region to announce menu state changes
4. **Focus Trap**: Consider implementing focus trap when menu is open for better keyboard UX

### Performance Optimizations

1. **Lazy Loading**: Component only fetches footer settings once on mount
2. **Memoization**: Use React.memo for sub-components to prevent unnecessary re-renders
3. **Event Listener Cleanup**: Properly remove click-outside and keyboard listeners on unmount
4. **CSS Animations**: Use CSS transforms and opacity for better performance than position changes

### Browser Compatibility

- **Target**: Modern browsers (Chrome, Firefox, Safari, Edge - last 2 versions)
- **Fallback**: Component gracefully degrades if CSS features not supported
- **Testing**: Verify on iOS Safari and Chrome Android for mobile compatibility

## Future Enhancements

1. **Customizable Position**: Allow admin to configure button position (bottom-left, top-right, etc.)
2. **Additional Platforms**: Support for Instagram, Telegram, WeChat, etc.
3. **Custom Icons**: Allow admin to upload custom icons for platforms
4. **Animation Presets**: Multiple animation styles to choose from
5. **Tooltip on Hover**: Show platform name on hover before clicking
6. **Analytics Integration**: Track which platforms are clicked most frequently
7. **Conditional Display**: Show/hide on specific pages or routes
8. **Theme Customization**: Allow admin to customize colors and styling
