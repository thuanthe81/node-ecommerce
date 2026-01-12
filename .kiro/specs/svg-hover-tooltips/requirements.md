# Requirements Document

## Introduction

This feature adds simple hover tooltips to SVG components throughout the application. When users hover over an SVG icon, a tooltip will appear showing the name or description of that SVG, improving user experience and accessibility.

## Glossary

- **SVG_Component**: Any SVG icon component defined in the Svgs.tsx file
- **Tooltip**: A small popup that appears on hover showing descriptive text
- **Hover_State**: The UI state when a user's mouse cursor is positioned over an element
- **Tooltip_System**: The complete implementation including tooltip component, positioning logic, and integration with SVG components

## Requirements

### Requirement 1

**User Story:** As a user, I want to see descriptive tooltips when I hover over SVG icons, so that I can understand what each icon represents.

#### Acceptance Criteria

1. WHEN a user hovers over any SVG component, THE Tooltip_System SHALL display a tooltip with the SVG's name
2. WHEN a user moves their mouse away from an SVG component, THE Tooltip_System SHALL hide the tooltip
3. WHEN a tooltip is displayed, THE Tooltip_System SHALL position it appropriately to avoid screen edge overflow
4. THE Tooltip_System SHALL show tooltips within 200ms of hover start
5. THE Tooltip_System SHALL hide tooltips within 100ms of hover end

### Requirement 2

**User Story:** As a developer, I want SVG components to automatically support tooltips, so that I don't need to manually implement tooltip logic for each icon.

#### Acceptance Criteria

1. WHEN an SVG component is rendered with a tooltip prop, THE SVG_Component SHALL automatically display tooltips on hover
2. WHEN an SVG component is rendered without a tooltip prop, THE SVG_Component SHALL function normally without tooltips
3. THE SVG_Component SHALL maintain all existing functionality and styling
4. THE SVG_Component SHALL support both string and translated tooltip content
5. THE SVG_Component SHALL be backward compatible with existing implementations

### Requirement 3

**User Story:** As a user, I want tooltips to be accessible and properly localized, so that I can understand icons regardless of my language preference or accessibility needs.

#### Acceptance Criteria

1. THE Tooltip_System SHALL support both English and Vietnamese translations
2. WHEN tooltip content is provided as a translation key, THE Tooltip_System SHALL display the appropriate localized text
3. THE Tooltip_System SHALL include proper ARIA attributes for screen readers
4. THE Tooltip_System SHALL be keyboard accessible for users who cannot use a mouse
5. THE Tooltip_System SHALL respect user preferences for reduced motion

### Requirement 4

**User Story:** As a developer, I want tooltip styling to be consistent with the application's design system, so that tooltips feel integrated with the overall user interface.

#### Acceptance Criteria

1. THE Tooltip_System SHALL use consistent colors, fonts, and spacing with the existing design system
2. THE Tooltip_System SHALL have a dark background with light text for good contrast
3. THE Tooltip_System SHALL include a subtle drop shadow for visual depth
4. THE Tooltip_System SHALL have rounded corners consistent with other UI elements
5. THE Tooltip_System SHALL scale appropriately on different screen sizes

### Requirement 5

**User Story:** As a developer, I want tooltip positioning to be intelligent, so that tooltips are always visible and don't interfere with user interactions.

#### Acceptance Criteria

1. WHEN a tooltip would extend beyond the right screen edge, THE Tooltip_System SHALL position it to the left of the cursor
2. WHEN a tooltip would extend beyond the left screen edge, THE Tooltip_System SHALL position it to the right of the cursor
3. WHEN a tooltip would extend beyond the top screen edge, THE Tooltip_System SHALL position it below the cursor
4. WHEN a tooltip would extend beyond the bottom screen edge, THE Tooltip_System SHALL position it above the cursor
5. THE Tooltip_System SHALL maintain a minimum 8px margin from screen edges