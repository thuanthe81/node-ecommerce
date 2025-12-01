# Design Document

## Overview

This feature enhances the admin panel navigation by transforming the Content menu item into an expandable/collapsible menu with sub-items for each content type. This provides administrators with quick access to filtered content views without requiring manual filtering on the main content page.

The implementation will modify the AdminLayout component to support nested navigation items, add routing for content type-specific pages, and persist the navigation state across page navigations.

## Architecture

### Component Structure

```
AdminLayout (Modified)
├── Navigation State Management
│   ├── Expanded menu tracking
│   └── Session storage persistence
├── Navigation Items
│   ├── Standard menu items (Dashboard, Products, etc.)
│   └── Expandable Content menu
│       ├── Parent item with chevron icon
│       └── Sub-items for each content type
└── Active route detection
```

### Routing Structure

The feature will use query parameters to filter content by type:
- `/admin/content` - All content (existing)
- `/admin/content?type=PAGE` - Pages only
- `/admin/content?type=FAQ` - FAQs only
- `/admin/content?type=BANNER` - Banners only
- `/admin/content?type=HOMEPAGE_SECTION` - Homepage Sections only

This approach maintains backward compatibility and doesn't require new page files.

## Components and Interfaces

### Modified AdminLayout Component

**Location:** `frontend/components/AdminLayout.tsx`

**New State:**
```typescript
interface NavigationState {
  expandedMenus: Set<string>; // Track which menus are expanded
}
```

**New Navigation Item Structure:**
```typescript
interface NavigationItem {
  name: string;
  href: string;
  icon: ReactNode;
  subItems?: NavigationSubItem[];
}

interface NavigationSubItem {
  name: string;
  href: string;
  type: string; // Content type identifier
}
```

### Content Type Configuration

**Content Types:**
```typescript
const CONTENT_TYPES = [
  { key: 'PAGE', labelEn: 'Pages', labelVi: 'Trang' },
  { key: 'FAQ', labelEn: 'FAQs', labelVi: 'Câu hỏi thường gặp' },
  { key: 'BANNER', labelEn: 'Banners', labelVi: 'Banner' },
  { key: 'HOMEPAGE_SECTION', labelEn: 'Homepage Sections', labelVi: 'Phần trang chủ' }
];
```

## Data Models

### Session Storage Schema

```typescript
interface AdminNavigationState {
  expandedMenus: string[]; // Array of expanded menu identifiers
  timestamp: number; // For cache invalidation
}
```

**Storage Key:** `admin_navigation_state`

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Navigation state persistence
*For any* navigation state (expanded/collapsed), when a user navigates to a different admin page and returns, the navigation state should remain unchanged from before navigation.
**Validates: Requirements 2.1, 2.2**

### Property 2: Auto-expansion on matching route
*For any* content type sub-item, when the current route matches that sub-item's href, the Content menu should be automatically expanded.
**Validates: Requirements 2.4**

### Property 3: Sub-item filtering consistency
*For any* content type sub-item, when clicked, the resulting page should display only content items matching that specific type.
**Validates: Requirements 1.4**

### Property 4: Translation completeness
*For any* content type sub-item, both English and Vietnamese translations should be defined and displayed correctly based on the current locale.
**Validates: Requirements 3.1, 3.2, 3.3**

### Property 5: Visual hierarchy preservation
*For any* sub-item, it should be visually indented relative to its parent menu item to indicate hierarchical relationship.
**Validates: Requirements 4.1**

### Property 6: Keyboard navigation completeness
*For any* navigation state, all menu items and sub-items should be reachable via keyboard tab navigation in logical order.
**Validates: Requirements 4.4**

## Error Handling

### Session Storage Errors
- **Scenario:** Session storage is unavailable or full
- **Handling:** Gracefully degrade to in-memory state only, log warning to console
- **User Impact:** Navigation state won't persist across page refreshes

### Invalid Content Type
- **Scenario:** URL contains invalid content type parameter
- **Handling:** Redirect to main content page with all types
- **User Impact:** User sees all content instead of filtered view

### Missing Translations
- **Scenario:** Translation key not found for content type
- **Handling:** Fall back to English label, log warning
- **User Impact:** English label displayed regardless of locale

## Testing Strategy

### Unit Tests

1. **Navigation State Management**
   - Test expanding/collapsing menu items
   - Test session storage read/write operations
   - Test state restoration from session storage
   - Test handling of corrupted session storage data

2. **Route Matching**
   - Test active state detection for parent items
   - Test active state detection for sub-items
   - Test auto-expansion when route matches sub-item

3. **Translation Rendering**
   - Test correct label display for each locale
   - Test fallback behavior for missing translations

### Property-Based Tests

Property-based tests will be implemented using `fast-check` library (JavaScript/TypeScript PBT framework) with a minimum of 100 iterations per test.

1. **Property 1: Navigation state persistence**
   - Generate random navigation states (various combinations of expanded menus)
   - Simulate page navigation
   - Verify state remains consistent after navigation

2. **Property 2: Auto-expansion on matching route**
   - Generate random content type routes
   - Verify Content menu auto-expands when route matches any sub-item

3. **Property 3: Sub-item filtering consistency**
   - Generate random content type selections
   - Verify filtered results contain only items of selected type

4. **Property 4: Translation completeness**
   - Generate all possible locale/content-type combinations
   - Verify translations exist and are non-empty for all combinations

5. **Property 5: Visual hierarchy preservation**
   - Generate random navigation structures
   - Verify sub-items have greater indentation than parent items

6. **Property 6: Keyboard navigation completeness**
   - Generate random navigation states
   - Simulate tab key presses
   - Verify all items are reachable in logical order

### Integration Tests

1. **End-to-End Navigation Flow**
   - Navigate through all content type sub-items
   - Verify correct content filtering on each page
   - Verify navigation state persists across page changes

2. **Accessibility Testing**
   - Test with screen readers (NVDA, JAWS, VoiceOver)
   - Verify ARIA attributes are correct
   - Test keyboard-only navigation

## Implementation Notes

### Parent Item Click Behavior
The Content menu item should toggle expansion/collapse instead of navigating:
```typescript
const handleParentClick = (e: React.MouseEvent, itemName: string) => {
  if (hasSubItems) {
    e.preventDefault(); // Prevent navigation
    toggleExpansion(itemName); // Toggle expanded state
  }
};
```

### Chevron Icon Animation
Use CSS transitions for smooth rotation when expanding/collapsing:
```css
.chevron {
  transition: transform 0.2s ease-in-out;
}
.chevron.expanded {
  transform: rotate(90deg);
}
```

### Active State Detection
Check both exact match and prefix match for parent items:
```typescript
const isActive = pathname === item.href ||
                 pathname.startsWith(item.href + '/') ||
                 (item.subItems && item.subItems.some(sub => pathname.includes(sub.href)));
```

### Session Storage Key
Use a versioned key to allow for future schema changes:
```typescript
const STORAGE_KEY = 'admin_navigation_state_v1';
```

### Performance Considerations
- Debounce session storage writes to avoid excessive I/O
- Use React.memo for navigation items to prevent unnecessary re-renders
- Lazy load sub-items only when parent is expanded

### Accessibility Requirements
- Add `aria-expanded` attribute to expandable menu items
- Add `aria-current="page"` to active navigation items
- Ensure proper heading hierarchy in navigation
- Provide skip navigation link for keyboard users
- Use semantic HTML (`<nav>`, `<ul>`, `<li>`)
