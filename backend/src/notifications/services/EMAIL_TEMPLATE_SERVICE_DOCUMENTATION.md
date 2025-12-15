# EmailTemplateService Documentation

## Overview

The `EmailTemplateService` is a comprehensive email template generation system that creates modern, accessible, and cross-client compatible HTML email templates. The service implements a sophisticated design system with modern typography, responsive layouts, accessibility compliance, and extensive email client compatibility.

## Key Features

- **Modern Design System**: Sophisticated typography, color schemes, and visual hierarchy
- **Responsive Design**: Mobile-first approach with breakpoints for desktop, tablet, and mobile
- **Accessibility Compliance**: WCAG 2.1 AA standards with proper ARIA labels and semantic HTML
- **Cross-Client Compatibility**: Support for Gmail, Outlook, Apple Mail, Yahoo Mail, and more
- **Dark Mode Support**: Comprehensive dark mode styling with proper contrast ratios
- **Component-Based Architecture**: Reusable components for buttons, cards, tables, and status badges

## Architecture

The service is built around a modular architecture with the following components:

```
EmailTemplateService
├── Design System (email-design-tokens.ts)
├── Button Components (email-button-generators.ts)
├── Status Badge Components (email-status-badge-generators.ts)
├── Layout System (wrapInModernEmailLayout)
├── Component Generators (cards, tables, headers, footers)
└── Style Generators (responsive, accessibility, dark mode)
```

## Design System

### Colors

The service uses a comprehensive color palette defined in `MODERN_EMAIL_STYLES`:

- **Primary**: `#2c3e50` - Dark blue-gray for headers and primary elements
- **Secondary**: `#3498db` - Bright blue for links and secondary elements
- **Accent**: `#e74c3c` - Red for important items and alerts
- **Success**: `#27ae60` - Green for success states
- **Warning**: `#f39c12` - Orange for warnings and pending states
- **Background**: `#f8f9fa` - Light gray background
- **Card Background**: `#ffffff` - White background for content cards

### Typography

- **Font Family**: `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`
- **Heading Font**: `'Georgia', 'Times New Roman', serif`
- **Font Sizes**: 12px (small), 14px (body), 16px (large), 20px (heading), 24px (title)
- **Line Heights**: 1.2 (tight), 1.5 (normal), 1.7 (relaxed)

### Spacing

- **XS**: 4px
- **SM**: 8px
- **MD**: 16px
- **LG**: 24px
- **XL**: 32px
- **XXL**: 48px

## Core Methods

### Layout Methods

#### `wrapInModernEmailLayout(content: string, locale: 'en' | 'vi'): string`

Creates a complete HTML email with modern design, responsive layout, and accessibility features.

**Features:**
- Semantic HTML structure with proper ARIA labels
- Comprehensive CSS with responsive breakpoints
- Dark mode support with media queries
- Email client compatibility fixes
- Accessibility compliance (WCAG 2.1 AA)

**Parameters:**
- `content`: The main email content HTML
- `locale`: Language locale ('en' or 'vi')

**Returns:** Complete HTML email string

### Template Generation Methods

#### `getOrderConfirmationTemplate(data: OrderEmailData, locale: 'en' | 'vi'): { subject: string; html: string }`

Generates order confirmation emails with modern card-based design.

**Features:**
- Enhanced product display with improved styling
- Complete payment method information
- Visual icons and improved typography
- Responsive design for all devices

#### `getAdminOrderNotificationTemplate(data: AdminOrderEmailData, locale: 'en' | 'vi'): { subject: string; html: string }`

Creates admin notification emails for new orders.

**Features:**
- Modern styling for admin review
- Enhanced customer information display
- Improved order items table
- Better visual hierarchy

#### `getShippingNotificationTemplate(data: OrderEmailData, locale: 'en' | 'vi'): { subject: string; html: string }`

Generates shipping notification emails.

**Features:**
- Modern styling for shipping information
- Enhanced tracking number display
- Consistent card-based layout

#### `getOrderStatusUpdateTemplate(data: OrderEmailData, locale: 'en' | 'vi'): { subject: string; html: string }`

Creates order status update emails.

**Features:**
- Modern status badge styling
- Enhanced status-specific messaging
- Visual indicators for different order statuses

#### `getWelcomeEmailTemplate(data: UserEmailData, locale: 'en' | 'vi'): { subject: string; html: string }`

Generates welcome emails for new users.

**Features:**
- Modern styling for user authentication emails
- Enhanced call-to-action buttons
- Improved visual appeal and consistency

#### `getPasswordResetTemplate(data: UserEmailData, locale: 'en' | 'vi'): { subject: string; html: string }`

Creates password reset emails.

**Features:**
- Secure styling for sensitive information
- Clear call-to-action buttons
- Security-focused messaging

### Component Generator Methods

#### `generateModernHeader(locale: 'en' | 'vi'): string`

Creates a modern header with improved branding and accessibility.

**Features:**
- Semantic HTML structure with proper heading hierarchy
- ARIA labels for accessibility
- Gradient backgrounds with fallbacks
- Responsive design

#### `generateModernFooter(locale: 'en' | 'vi'): string`

Generates a comprehensive footer with contact information and social links.

**Features:**
- Contact information with proper formatting
- Social media integration
- Accessibility compliance
- Responsive layout

#### `generateCardSection(title: string, content: string, variant?: string): string`

Creates card-based content sections with modern styling.

**Features:**
- Subtle shadows and rounded corners
- Proper padding and spacing
- Visual hierarchy
- Multiple variants (default, highlighted, bordered)

#### `generateProductCard(product: any, locale: 'en' | 'vi'): string`

Generates product display cards for emails.

**Features:**
- Modern card layout with product images
- Responsive behavior for mobile devices
- Proper image accessibility with alt text
- Price formatting with currency support

#### `generateAddressCard(address: any, title: string, locale?: 'en' | 'vi'): string`

Creates address display cards for shipping/billing information.

**Features:**
- Clean card layout with typography hierarchy
- Visual separation between address components
- Icons for better visual recognition
- Accessibility compliance

#### `generatePaymentInfoCard(paymentInfo: any, locale: 'en' | 'vi'): string`

Generates payment information cards.

**Features:**
- Complete payment method information
- QR code support for bank transfers
- Secure styling for sensitive information
- Localized payment method names

### Style Generator Methods

#### `getModernStyles(): string`

Generates comprehensive modern CSS styles.

**Features:**
- Modern typography and color schemes
- Card-based layouts with shadows
- Button and interactive element styling
- Table styling with alternating rows

#### `getResponsiveStyles(): string`

Creates responsive CSS with mobile-first approach.

**Features:**
- Breakpoints for mobile (480px), tablet (768px), and desktop (769px+)
- Touch-friendly sizing for interactive elements
- Responsive table behavior
- Mobile-optimized typography

#### `getAccessibilityStyles(): string`

Generates accessibility-compliant CSS styles.

**Features:**
- WCAG 2.1 AA compliance
- Screen reader optimizations
- Keyboard navigation support
- High contrast mode support
- Minimum font sizes and touch targets

#### `getDarkModeStyles(): string`

Creates comprehensive dark mode CSS styles.

**Features:**
- Dark mode compatible color palette
- Proper contrast ratios for readability
- Email client compatibility
- Semantic color adjustments

#### `getEmailClientCompatibilityStyles(): string`

Generates cross-client compatibility CSS.

**Features:**
- CSS Grid and Flexbox with table-based fallbacks
- Outlook-specific VML for gradients and rounded corners
- Gmail-compatible inline styling approach
- Progressive enhancement with graceful degradation

## Email Client Compatibility

### Supported Clients

- **Gmail**: Inline styles, simplified backgrounds, mobile app compatibility
- **Outlook**: VML for gradients, table-based layouts, specific CSS resets
- **Apple Mail**: Auto-link disable, text size adjustments, high DPI support
- **Yahoo Mail**: Center fixes, table fixes, spacing adjustments
- **Windows Mail**: Line height fixes, font fallbacks
- **Thunderbird**: Display fixes, image optimizations

### Compatibility Features

#### Progressive Enhancement

The service uses progressive enhancement to provide modern features while maintaining compatibility:

```html
<!-- Fallback for older clients -->
<div class="fallback-content">
  <!-- Table-based layout -->
</div>

<!-- Modern content for supported clients -->
<div class="modern-content">
  <!-- CSS Grid/Flexbox layout -->
</div>
```

#### Outlook VML Support

For Outlook clients, the service generates VML (Vector Markup Language) for:
- Gradient backgrounds
- Rounded corners
- Complex button styling

#### Gmail Inline Styles

Gmail doesn't support CSS in the `<head>`, so the service provides:
- Comprehensive inline styling
- Gmail-safe CSS classes
- Fallback styling for unsupported features

## Accessibility Features

### WCAG 2.1 AA Compliance

- **Color Contrast**: All color combinations meet 4.5:1 contrast ratio
- **Font Sizes**: Minimum 14px for body text
- **Touch Targets**: Minimum 44px for interactive elements
- **Semantic HTML**: Proper heading hierarchy and ARIA labels

### Screen Reader Support

- **Skip Links**: Keyboard navigation support
- **ARIA Labels**: Descriptive labels for all interactive elements
- **Alt Text**: Proper image descriptions and fallbacks
- **Status Announcements**: Live regions for dynamic content

### Keyboard Navigation

- **Focus Indicators**: Visible focus states for all interactive elements
- **Tab Order**: Logical tab sequence through content
- **Skip Links**: Direct navigation to main content

## Usage Examples

### Basic Order Confirmation

```typescript
const orderData: OrderEmailData = {
  orderNumber: 'ORD-123',
  customerName: 'John Doe',
  orderDate: new Date().toISOString(),
  items: [
    { name: 'Handmade Vase', quantity: 1, price: 50000 }
  ],
  subtotal: 50000,
  shippingCost: 10000,
  total: 60000,
  shippingAddress: {
    fullName: 'John Doe',
    addressLine1: '123 Main St',
    city: 'Ho Chi Minh City',
    state: 'Ho Chi Minh',
    postalCode: '70000',
    country: 'Vietnam'
  }
};

const template = emailTemplateService.getOrderConfirmationTemplate(orderData, 'en');
// Returns: { subject: 'Order Confirmation #ORD-123', html: '<html>...</html>' }
```

### Custom Button Generation

```typescript
import { ModernButtonGenerator } from './email-button-generators';

const primaryButton = ModernButtonGenerator.generatePrimaryButton(
  'View Order',
  'https://example.com/orders/123',
  false // not full width
);

const secondaryButton = ModernButtonGenerator.generateSecondaryButton(
  'Contact Support',
  'https://example.com/support',
  true // full width
);
```

### Status Badge Generation

```typescript
import { StatusBadgeGenerator } from './email-status-badge-generators';

const orderBadge = StatusBadgeGenerator.generateOrderStatusBadge(
  'shipped',
  'en',
  'medium'
);

const paymentBadge = StatusBadgeGenerator.generatePaymentStatusBadge(
  'paid',
  'vi',
  'large'
);
```

## Customization

### Adding New Button Styles

To add a new button style:

1. Add the style to `ButtonStyleType` in `email-button-generators.ts`
2. Update `getBaseButtonStyle()` method
3. Add Gmail compatibility in `getGmailStyleProperties()`
4. Update Outlook VML generation if needed

### Adding New Status Types

To add a new status type:

1. Add to the appropriate type union in `email-status-badge-generators.ts`
2. Update `getBaseStatusStyle()` method with semantic colors
3. Add translations in `getStatusDisplayText()`
4. Update ARIA labels in `getAriaLabel()`

### Modifying Design Tokens

All design tokens are centralized in `email-design-tokens.ts`:

```typescript
export const MODERN_EMAIL_STYLES = {
  colors: {
    primary: '#2c3e50',    // Update primary color
    secondary: '#3498db',  // Update secondary color
    // ... other colors
  },
  // ... other design tokens
};
```

## Testing

### Email Client Testing

Test templates in major email clients:

1. **Desktop Clients**: Outlook 2016/2019/365, Apple Mail, Thunderbird
2. **Web Clients**: Gmail, Outlook.com, Yahoo Mail
3. **Mobile Clients**: iOS Mail, Gmail Mobile, Samsung Email

### Accessibility Testing

1. **Screen Readers**: Test with NVDA, JAWS, VoiceOver
2. **Keyboard Navigation**: Ensure all interactive elements are accessible
3. **Color Contrast**: Verify all color combinations meet WCAG standards
4. **High Contrast Mode**: Test in Windows High Contrast mode

### Responsive Testing

Test at different viewport sizes:
- **Mobile**: 320px - 480px
- **Tablet**: 481px - 768px
- **Desktop**: 769px and above

## Performance Considerations

### Image Optimization

- Use appropriate image formats (JPEG for photos, PNG for graphics)
- Provide alt text for all images
- Include fallback background colors for blocked images

### CSS Optimization

- Inline critical styles for Gmail compatibility
- Use progressive enhancement for modern features
- Minimize CSS specificity conflicts

### Email Size

- Keep total email size under 102KB for Gmail
- Optimize images and compress when possible
- Use efficient HTML structure

## Security Considerations

### Content Sanitization

All user-provided content is sanitized to prevent XSS attacks:

```typescript
static sanitizeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
```

### URL Validation

All URLs are validated before inclusion in templates:

```typescript
static isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
```

## Troubleshooting

### Common Issues

1. **Images not displaying**: Check image URLs and provide fallback colors
2. **Styles not applying in Gmail**: Use inline styles instead of CSS classes
3. **Layout broken in Outlook**: Ensure table-based fallbacks are present
4. **Dark mode issues**: Verify dark mode color overrides are applied

### Debug Mode

Enable debug mode by adding debug classes to elements:

```html
<div class="debug-info" style="border: 1px solid red; background: yellow;">
  Debug information here
</div>
```

## Migration Guide

### From Legacy Templates

To migrate from legacy email templates:

1. Replace `wrapInEmailLayout()` with `wrapInModernEmailLayout()`
2. Update button generation to use `ModernButtonGenerator`
3. Replace status text with `StatusBadgeGenerator`
4. Add accessibility attributes and ARIA labels
5. Test in multiple email clients

### Version Compatibility

The service maintains backward compatibility with:
- Legacy template methods (deprecated but functional)
- Existing email data interfaces
- Current translation keys

## Contributing

### Code Style

- Use TypeScript for type safety
- Follow existing naming conventions
- Add comprehensive JSDoc comments
- Include accessibility considerations

### Testing Requirements

- Test in multiple email clients
- Verify accessibility compliance
- Check responsive behavior
- Validate HTML and CSS

### Documentation

- Update this documentation for new features
- Include usage examples
- Document breaking changes
- Provide migration guides