# Email Template Style Guide

## Overview

This style guide defines the visual design system for AlaCraft email templates. It provides comprehensive guidelines for colors, typography, spacing, components, and layout patterns to ensure consistency across all email communications.

## Brand Identity

### Brand Values
- **Premium Quality**: Sophisticated design that reflects handmade craftsmanship
- **Accessibility**: Inclusive design that works for everyone
- **Trust**: Professional appearance that builds customer confidence
- **Clarity**: Clear communication with excellent readability

### Visual Principles
- **Modern Minimalism**: Clean, uncluttered layouts with purposeful white space
- **Warm Professionalism**: Approachable yet sophisticated aesthetic
- **Consistent Hierarchy**: Clear information architecture and visual flow
- **Cross-Platform Reliability**: Consistent experience across all email clients

## Color Palette

### Primary Colors

#### Primary Blue-Gray (`#2c3e50`)
- **Usage**: Headers, primary buttons, main headings, brand elements
- **Accessibility**: 4.5:1 contrast ratio on white backgrounds
- **Emotional Impact**: Trust, stability, professionalism
- **Email Client Support**: Universal support

```css
.primary-color {
  color: #2c3e50;
  background-color: #2c3e50; /* for backgrounds */
}
```

#### Secondary Blue (`#3498db`)
- **Usage**: Links, secondary buttons, accent elements, call-to-action highlights
- **Accessibility**: 4.5:1 contrast ratio on white backgrounds
- **Emotional Impact**: Reliability, communication, action
- **Email Client Support**: Universal support

```css
.secondary-color {
  color: #3498db;
  background-color: #3498db; /* for backgrounds */
}
```

### Semantic Colors

#### Success Green (`#27ae60`)
- **Usage**: Success messages, positive status badges, confirmation elements
- **Context**: Order delivered, payment successful, positive feedback
- **Accessibility**: WCAG AA compliant contrast ratios

#### Warning Orange (`#f39c12`)
- **Usage**: Warning messages, pending status badges, attention elements
- **Context**: Order pending, payment processing, important notices
- **Accessibility**: High contrast with white text

#### Accent Red (`#e74c3c`)
- **Usage**: Error messages, urgent alerts, cancelled status badges
- **Context**: Order cancelled, payment failed, critical notifications
- **Accessibility**: High contrast with white text

### Neutral Colors

#### Background Gray (`#f8f9fa`)
- **Usage**: Email body background, subtle section backgrounds
- **Purpose**: Provides contrast for white content cards
- **Accessibility**: Subtle enough to not interfere with content

#### Card White (`#ffffff`)
- **Usage**: Content card backgrounds, primary content areas
- **Purpose**: Maximum readability and clean appearance
- **Accessibility**: Perfect contrast base for all text colors

#### Text Primary (`#2c3e50`)
- **Usage**: Main body text, headings, important content
- **Accessibility**: 4.5:1 contrast ratio on white backgrounds
- **Readability**: Optimized for extended reading

#### Text Secondary (`#7f8c8d`)
- **Usage**: Supporting text, captions, less important information
- **Accessibility**: 4.5:1 contrast ratio on white backgrounds
- **Hierarchy**: Creates clear information hierarchy

#### Border Light (`#ecf0f1`)
- **Usage**: Card borders, table borders, subtle separators
- **Purpose**: Defines sections without being distracting
- **Accessibility**: Sufficient contrast for visual separation

### Dark Mode Colors

#### Dark Background (`#121212`)
- **Usage**: Email body background in dark mode
- **Purpose**: True dark for better OLED support and eye comfort
- **Accessibility**: Optimized for dark mode readability

#### Dark Card (`#1e1e1e`)
- **Usage**: Content card backgrounds in dark mode
- **Purpose**: Elevated surface that maintains hierarchy
- **Accessibility**: Sufficient contrast with dark background

#### Dark Text Primary (`#ffffff`)
- **Usage**: Main text in dark mode
- **Accessibility**: Maximum contrast for readability
- **Purpose**: Ensures text remains highly legible

### Color Usage Guidelines

#### Do's
- Use primary colors for brand elements and main actions
- Maintain consistent color meanings across all templates
- Ensure sufficient contrast ratios for accessibility
- Test colors in both light and dark modes
- Use semantic colors appropriately (green for success, red for errors)

#### Don'ts
- Don't use colors as the only way to convey information
- Don't use low-contrast color combinations
- Don't mix warm and cool tones inappropriately
- Don't use more than 3-4 colors in a single email
- Don't ignore dark mode color requirements

## Typography

### Font Families

#### Primary Font Stack
```css
font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
```
- **Usage**: Body text, UI elements, modern content
- **Characteristics**: Clean, readable, widely supported
- **Email Client Support**: Excellent across all platforms
- **Accessibility**: Optimized for screen readers

#### Heading Font Stack
```css
font-family: 'Georgia', 'Times New Roman', serif;
```
- **Usage**: Main headings, brand elements, emphasis text
- **Characteristics**: Elegant, traditional, authoritative
- **Email Client Support**: Universal support
- **Brand Alignment**: Reflects handmade craftsmanship values

### Font Sizes

#### Size Scale
- **Small (12px)**: Captions, fine print, secondary information
- **Body (14px)**: Main body text, standard content
- **Large (16px)**: Emphasized text, button labels, important information
- **Heading (20px)**: Section headings, card titles
- **Title (24px)**: Main email title, primary headings

#### Accessibility Requirements
- **Minimum Size**: 14px for body text (WCAG AA compliance)
- **Touch Targets**: Minimum 44px height for interactive elements
- **Line Height**: 1.5 for body text, 1.2 for headings
- **Contrast**: All text meets WCAG AA contrast requirements

### Line Heights

#### Standard Line Heights
- **Tight (1.2)**: Headings, titles, compact text
- **Normal (1.5)**: Body text, standard content
- **Relaxed (1.7)**: Long-form content, improved readability

#### Usage Guidelines
```css
/* Headings */
h1, h2, h3 {
  line-height: 1.2;
}

/* Body text */
p, td, li {
  line-height: 1.5;
}

/* Long-form content */
.content-block {
  line-height: 1.7;
}
```

### Typography Hierarchy

#### Level 1: Email Title (H1)
- **Font**: Georgia, serif
- **Size**: 24px
- **Weight**: 400 (normal)
- **Color**: Primary (#2c3e50) or white on colored backgrounds
- **Usage**: Main email subject, brand name in header

#### Level 2: Section Headings (H2)
- **Font**: Georgia, serif
- **Size**: 20px
- **Weight**: 600 (semi-bold)
- **Color**: Primary (#2c3e50)
- **Usage**: Major section titles, order summaries

#### Level 3: Subsection Headings (H3)
- **Font**: Segoe UI, sans-serif
- **Size**: 16px
- **Weight**: 600 (semi-bold)
- **Color**: Primary (#2c3e50)
- **Usage**: Card titles, product names, address labels

#### Body Text
- **Font**: Segoe UI, sans-serif
- **Size**: 14px
- **Weight**: 400 (normal)
- **Color**: Text Primary (#2c3e50)
- **Usage**: Main content, descriptions, information

#### Supporting Text
- **Font**: Segoe UI, sans-serif
- **Size**: 12px
- **Weight**: 400 (normal)
- **Color**: Text Secondary (#7f8c8d)
- **Usage**: Captions, metadata, fine print

## Spacing System

### Spacing Scale

#### Base Unit: 4px
All spacing values are multiples of 4px for consistent rhythm and alignment.

- **XS (4px)**: Tight spacing, inline elements, small gaps
- **SM (8px)**: Close related elements, button padding
- **MD (16px)**: Standard spacing, paragraph margins, card padding
- **LG (24px)**: Section spacing, larger card padding
- **XL (32px)**: Major section separation, header/footer padding
- **XXL (48px)**: Large section breaks, major layout spacing

### Spacing Applications

#### Vertical Spacing
```css
/* Paragraph spacing */
p {
  margin-bottom: 16px; /* MD */
}

/* Section spacing */
.section {
  margin-bottom: 32px; /* XL */
}

/* Major breaks */
.major-section {
  margin-bottom: 48px; /* XXL */
}
```

#### Horizontal Spacing
```css
/* Button groups */
.button-group .btn {
  margin-right: 16px; /* MD */
}

/* Card padding */
.card {
  padding: 24px; /* LG */
}

/* Container padding */
.email-content {
  padding: 32px 24px; /* XL LG */
}
```

#### Responsive Spacing
```css
/* Mobile adjustments */
@media (max-width: 480px) {
  .email-content {
    padding: 24px 16px; /* LG MD */
  }

  .card {
    padding: 16px; /* MD */
  }
}
```

### Layout Guidelines

#### Content Width
- **Maximum Width**: 600px (optimal for email clients)
- **Mobile Width**: 100% with 16px side padding
- **Content Cards**: Full width minus container padding

#### Vertical Rhythm
- Maintain consistent spacing between elements
- Use the spacing scale for all margins and padding
- Align elements to a baseline grid when possible

## Component Library

### Buttons

#### Primary Button
- **Purpose**: Main call-to-action, primary actions
- **Style**: Gradient background (primary to secondary)
- **Text**: White, 16px, semi-bold
- **Padding**: 16px horizontal, 16px vertical
- **Border Radius**: 8px
- **Minimum Size**: 44px height (accessibility)

```html
<a href="#" style="
  display: inline-block;
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  color: #ffffff;
  padding: 16px 32px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 16px;
  min-height: 44px;
  line-height: 1.2;
">
  Primary Action
</a>
```

#### Secondary Button
- **Purpose**: Secondary actions, alternative options
- **Style**: White background with border
- **Text**: Primary color, 16px, semi-bold
- **Border**: 2px solid border color
- **Hover**: Subtle background color change

#### Success Button
- **Purpose**: Positive actions, confirmations
- **Style**: Green gradient background
- **Usage**: Confirm order, complete payment, positive actions

#### Warning Button
- **Purpose**: Caution actions, important decisions
- **Style**: Orange gradient background
- **Usage**: Cancel order, modify details, attention-required actions

### Status Badges

#### Order Status Badges
- **Pending**: Orange background, white text
- **Processing**: Blue background, white text
- **Shipped**: Purple background, white text
- **Delivered**: Green background, white text
- **Cancelled**: Red background, white text
- **Refunded**: Gray background, white text

```html
<span style="
  display: inline-block;
  background-color: #f39c12;
  color: #ffffff;
  padding: 4px 16px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
">
  PENDING
</span>
```

### Cards

#### Content Card
- **Background**: White (#ffffff)
- **Border**: 1px solid light gray (#ecf0f1)
- **Border Radius**: 8px
- **Padding**: 24px
- **Shadow**: Subtle (0 1px 3px rgba(0,0,0,0.1))
- **Margin**: 16px vertical

```html
<div style="
  background-color: #ffffff;
  border: 1px solid #ecf0f1;
  border-radius: 8px;
  padding: 24px;
  margin: 16px 0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
">
  Card content here
</div>
```

#### Highlighted Card
- **Purpose**: Important information, featured content
- **Border Left**: 4px solid secondary color
- **Background**: Slightly tinted background
- **Usage**: Order summaries, important notices

### Tables

#### Data Table
- **Header**: Primary color background, white text
- **Rows**: Alternating white and light gray backgrounds
- **Borders**: Light gray borders between cells
- **Padding**: 16px in cells
- **Typography**: 14px body text, 12px for mobile

```html
<table style="width: 100%; border-collapse: collapse;">
  <thead>
    <tr>
      <th style="
        background-color: #2c3e50;
        color: #ffffff;
        padding: 16px;
        text-align: left;
        font-weight: 600;
      ">
        Product
      </th>
      <th style="
        background-color: #2c3e50;
        color: #ffffff;
        padding: 16px;
        text-align: right;
        font-weight: 600;
      ">
        Price
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="
        padding: 16px;
        border-bottom: 1px solid #ecf0f1;
      ">
        Handmade Vase
      </td>
      <td style="
        padding: 16px;
        border-bottom: 1px solid #ecf0f1;
        text-align: right;
      ">
        50,000 ₫
      </td>
    </tr>
  </tbody>
</table>
```

## Layout Patterns

### Email Structure

#### Standard Email Layout
1. **Header**: Brand name, tagline, gradient background
2. **Content Area**: White background, card-based sections
3. **Footer**: Contact information, social links, legal text

#### Content Organization
- **Hero Section**: Main message or primary call-to-action
- **Information Cards**: Organized content in digestible sections
- **Action Areas**: Clear calls-to-action with prominent buttons
- **Supporting Information**: Secondary details and context

### Responsive Patterns

#### Mobile-First Approach
- Design for mobile screens first (320px+)
- Progressive enhancement for larger screens
- Touch-friendly interactive elements (44px minimum)
- Readable text without zooming

#### Breakpoints
- **Mobile**: 320px - 480px
- **Tablet**: 481px - 768px
- **Desktop**: 769px and above

#### Mobile Optimizations
- Single column layout
- Larger touch targets
- Simplified navigation
- Condensed information hierarchy

### Grid System

#### Two-Column Layout
```html
<table style="width: 100%;">
  <tr>
    <td style="width: 50%; vertical-align: top; padding: 8px;">
      Left column content
    </td>
    <td style="width: 50%; vertical-align: top; padding: 8px;">
      Right column content
    </td>
  </tr>
</table>
```

#### Three-Column Layout
```html
<table style="width: 100%;">
  <tr>
    <td style="width: 33.33%; vertical-align: top; padding: 8px;">
      Column 1
    </td>
    <td style="width: 33.33%; vertical-align: top; padding: 8px;">
      Column 2
    </td>
    <td style="width: 33.33%; vertical-align: top; padding: 8px;">
      Column 3
    </td>
  </tr>
</table>
```

## Accessibility Guidelines

### Color Accessibility

#### Contrast Requirements
- **Normal Text**: 4.5:1 contrast ratio minimum
- **Large Text**: 3:1 contrast ratio minimum
- **Interactive Elements**: 3:1 contrast ratio for focus indicators

#### Color Independence
- Don't rely solely on color to convey information
- Use icons, text labels, and patterns in addition to color
- Provide alternative ways to understand status and meaning

### Typography Accessibility

#### Font Size Requirements
- **Minimum Body Text**: 14px
- **Minimum Interactive Text**: 16px
- **Maximum Line Length**: 75 characters for optimal readability

#### Font Weight and Style
- Use sufficient font weight for readability
- Avoid all-caps text except for short labels
- Provide adequate line spacing (1.5 minimum)

### Interactive Element Accessibility

#### Touch Targets
- **Minimum Size**: 44px × 44px
- **Spacing**: 8px minimum between touch targets
- **Visual Feedback**: Clear hover and focus states

#### Focus Indicators
- **Outline**: 2px solid secondary color
- **Offset**: 2px from element edge
- **Visibility**: High contrast against all backgrounds

### Screen Reader Support

#### Semantic HTML
- Use proper heading hierarchy (H1, H2, H3)
- Include alt text for all images
- Use table headers for data tables
- Provide ARIA labels for complex interactions

#### Content Structure
- Logical reading order
- Descriptive link text
- Clear section boundaries
- Meaningful page titles

## Email Client Compatibility

### Universal Support Features
- Table-based layouts
- Inline CSS styles
- Web-safe fonts
- Basic color support
- Standard image formats (JPEG, PNG, GIF)

### Progressive Enhancement Features
- CSS Grid (modern clients)
- Flexbox (modern clients)
- Gradient backgrounds (with solid fallbacks)
- Box shadows (with fallback styling)
- Border radius (with square fallbacks)

### Client-Specific Considerations

#### Gmail
- No CSS in `<head>` tag
- Limited CSS support
- Inline styles required
- Mobile app differences

#### Outlook
- Limited CSS support
- VML for advanced graphics
- Table-based layouts essential
- Font rendering differences

#### Apple Mail
- Excellent CSS support
- Auto-link detection issues
- High DPI display support
- Dark mode support

### Testing Checklist

#### Visual Testing
- [ ] Layout renders correctly in all major clients
- [ ] Colors display consistently
- [ ] Typography appears as intended
- [ ] Images load with proper fallbacks
- [ ] Responsive behavior works on mobile

#### Functional Testing
- [ ] All links work correctly
- [ ] Buttons are clickable and accessible
- [ ] Forms function properly (if present)
- [ ] Email forwards correctly
- [ ] Print version is readable

#### Accessibility Testing
- [ ] Screen reader compatibility
- [ ] Keyboard navigation works
- [ ] Color contrast meets standards
- [ ] Focus indicators are visible
- [ ] Alternative text is provided

## Implementation Examples

### Complete Email Template Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AlaCraft Email</title>
  <style>
    /* Responsive and accessibility styles */
  </style>
</head>
<body style="
  margin: 0;
  padding: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f8f9fa;
  color: #2c3e50;
">
  <!-- Email wrapper -->
  <table style="width: 100%; background-color: #f8f9fa;">
    <tr>
      <td style="padding: 32px 16px;">
        <!-- Email container -->
        <table style="
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        ">
          <!-- Header -->
          <tr>
            <td style="
              background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
              color: #ffffff;
              padding: 32px 24px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            ">
              <h1 style="
                margin: 0;
                font-family: 'Georgia', serif;
                font-size: 24px;
                font-weight: 400;
              ">
                AlaCraft
              </h1>
              <p style="
                margin: 8px 0 0 0;
                font-size: 14px;
                opacity: 0.9;
              ">
                Premium Handmade Products
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px 24px;">
              <!-- Content sections go here -->
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="
              background-color: #f8f9fa;
              padding: 24px;
              text-align: center;
              font-size: 12px;
              color: #7f8c8d;
              border-radius: 0 0 8px 8px;
            ">
              <!-- Footer content -->
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

### Order Confirmation Card Example

```html
<div style="
  background-color: #ffffff;
  border: 1px solid #ecf0f1;
  border-left: 4px solid #3498db;
  border-radius: 8px;
  padding: 24px;
  margin: 16px 0;
">
  <h3 style="
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 600;
    color: #2c3e50;
  ">
    Order Summary
  </h3>

  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="
        padding: 8px 0;
        border-bottom: 1px solid #ecf0f1;
        font-weight: 600;
        color: #7f8c8d;
      ">
        Order Number:
      </td>
      <td style="
        padding: 8px 0;
        border-bottom: 1px solid #ecf0f1;
        text-align: right;
      ">
        #ORD-123
      </td>
    </tr>
    <tr>
      <td style="
        padding: 8px 0;
        border-bottom: 1px solid #ecf0f1;
        font-weight: 600;
        color: #7f8c8d;
      ">
        Status:
      </td>
      <td style="
        padding: 8px 0;
        border-bottom: 1px solid #ecf0f1;
        text-align: right;
      ">
        <span style="
          display: inline-block;
          background-color: #f39c12;
          color: #ffffff;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
        ">
          PENDING
        </span>
      </td>
    </tr>
  </table>
</div>
```

## Best Practices

### Design Principles

#### Consistency
- Use the same colors, fonts, and spacing throughout
- Maintain consistent component styling
- Follow established patterns and conventions
- Create predictable user experiences

#### Clarity
- Use clear, descriptive headings
- Organize information logically
- Provide sufficient white space
- Avoid cluttered layouts

#### Accessibility
- Meet WCAG 2.1 AA standards
- Test with screen readers
- Ensure keyboard navigation works
- Provide alternative text for images

#### Performance
- Optimize images for email
- Keep file sizes reasonable
- Use efficient HTML structure
- Test loading times

### Common Mistakes to Avoid

#### Design Mistakes
- Using too many colors or fonts
- Insufficient contrast ratios
- Inconsistent spacing
- Cluttered layouts
- Missing mobile optimization

#### Technical Mistakes
- Relying on CSS in `<head>` for Gmail
- Using unsupported CSS properties
- Missing fallback styles
- Broken layouts in Outlook
- Inaccessible interactive elements

#### Content Mistakes
- Missing alt text for images
- Poor heading hierarchy
- Unclear call-to-action buttons
- Inconsistent tone and messaging
- Missing contact information

## Maintenance and Updates

### Regular Reviews
- Review color accessibility annually
- Update email client compatibility
- Test new features across clients
- Gather user feedback and iterate

### Version Control
- Document all style guide changes
- Maintain backward compatibility
- Provide migration guides for updates
- Test thoroughly before deployment

### Team Collaboration
- Share style guide with all team members
- Provide training on implementation
- Establish review processes
- Maintain design system documentation

This style guide serves as the foundation for all AlaCraft email communications, ensuring consistent, accessible, and professional email experiences across all customer touchpoints.