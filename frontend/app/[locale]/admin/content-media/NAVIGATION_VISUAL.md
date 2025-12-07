# Navigation Visual Structure

## Admin Navigation Menu

```
┌─────────────────────────────────────┐
│ Admin Navigation                    │
├─────────────────────────────────────┤
│ 🏠 Dashboard                        │
│ 📦 Products                         │
│ 🔲 Categories                       │
│ 📋 Orders                           │
│ 👥 Customers                        │
│ 🏷️  Promotions                      │
│                                     │
│ 📄 Content                    [▼]   │ ← Parent menu (expandable)
│   ├─ Pages                          │
│   ├─ FAQs                           │
│   ├─ Banners                        │
│   ├─ Homepage Sections              │
│   └─ 🖼️  Media Library       [NEW]  │ ← New navigation item
│                                     │
│ 📊 Analytics                        │
│ 💰 Payment Settings                 │
│ ⚙️  Footer Settings                 │
└─────────────────────────────────────┘
```

## Active State Behavior

### When on Media Library page (`/admin/content-media`):

```
┌─────────────────────────────────────┐
│ 📄 Content                    [▼]   │ ← Highlighted (blue background)
│   ├─ Pages                          │
│   ├─ FAQs                           │
│   ├─ Banners                        │
│   ├─ Homepage Sections              │
│   └─ 🖼️  Media Library              │ ← Highlighted (blue background)
│      ^^^^^^^^^^^^^^^^                │    Active state
└─────────────────────────────────────┘
```

### Auto-Expansion

When navigating to `/admin/content-media`:
1. Content menu automatically expands
2. Media Library item is highlighted
3. Parent Content menu is also highlighted
4. State is saved to sessionStorage

## Styling

### Normal State
- Text: `text-gray-600`
- Background: `transparent`
- Hover: `bg-gray-50 text-gray-900`

### Active State
- Text: `text-blue-700`
- Background: `bg-blue-50`
- Font: `font-medium`

### Parent Menu (when sub-item active)
- Text: `text-blue-700`
- Background: `bg-blue-50`
- Chevron: Rotated 90° (pointing down)

## Accessibility

- **ARIA Labels:** Navigation items have proper aria-current attributes
- **Keyboard Navigation:** Full keyboard support for menu navigation
- **Screen Readers:** Proper semantic HTML with nav, ul, li elements
- **Focus Management:** Visible focus indicators on all interactive elements
