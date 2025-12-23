# Email Templates Directory

This directory contains HTML template files for the email template system. Templates use Handlebars.js syntax for variable replacement and support conditional sections and iteration.

## Directory Structure

```
templates/
├── orders/                          # Order-related email templates
│   ├── template-order-confirmation.html
│   ├── template-admin-order-notification.html
│   ├── template-shipping-notification.html
│   └── template-order-status-update.html
├── auth/                           # Authentication-related templates
│   ├── template-welcome-email.html
│   └── template-password-reset.html
└── shared/                         # Shared components and layouts
    ├── partials/                   # Reusable template partials
    │   ├── header.hbs
    │   ├── footer.hbs
    │   └── button.hbs
    └── layouts/                    # Base layouts
        └── base.hbs
```

## Template Naming Convention

- All template files use the prefix `template-` followed by a descriptive name
- File extension is `.html` for main templates
- Partial templates use `.hbs` extension
- Use kebab-case for file names (e.g., `template-order-confirmation.html`)

## Template Syntax

Templates use Handlebars.js syntax for dynamic content:

### Variables
```handlebars
{{customerName}}
{{data.orderNumber}}
{{translations.greeting}}
```

### Conditionals
```handlebars
{{#if data.trackingNumber}}
  <p>Tracking: {{data.trackingNumber}}</p>
{{/if}}
```

### Iteration
```handlebars
{{#each data.items}}
  <div class="item">
    <span>{{this.name}}</span>
    <span>{{helpers.formatCurrency this.price ../locale}}</span>
  </div>
{{/each}}
```

### Helpers
```handlebars
{{{helpers.generateButton translations.viewOrder data.orderUrl 'primary'}}}
{{helpers.formatDate data.orderDate locale}}
```

## Available Template Variables

### Common Variables
- `locale` - Current locale ('en' | 'vi')
- `translations` - Locale-specific text translations
- `designTokens` - Design system tokens (colors, typography, spacing)
- `helpers` - Utility functions for formatting and components

### Data Variables
- `data` - Main data object (varies by template type)
  - OrderEmailData for order templates
  - AdminOrderEmailData for admin templates
  - UserEmailData for auth templates

### Design System Variables
- `designSystemCSS` - Complete CSS from design tokens
- `buttonStyles` - CSS for button components
- `statusBadgeStyles` - CSS for status badges

## Template Structure

Each template should follow this basic structure:

```html
<!DOCTYPE html>
<html lang="{{locale}}" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{translations.emailTitle}}</title>
  <style type="text/css">
    {{{designSystemCSS}}}
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Template-specific content -->
  </div>
</body>
</html>
```

## Development Guidelines

1. **Accessibility**: Include proper ARIA labels and semantic HTML
2. **Email Client Compatibility**: Use table-based layouts for complex designs
3. **Responsive Design**: Use media queries for mobile optimization
4. **Localization**: Use translation variables instead of hardcoded text
5. **Security**: All user data is automatically HTML-escaped unless using triple braces `{{{}}}`

## Testing Templates

Templates can be tested by:
1. Using the EmailTemplateService methods with sample data
2. Creating unit tests that verify template output
3. Using property-based tests to validate template behavior with various inputs

## Validation

Templates are automatically validated for:
- Valid HTML structure
- Required template variables
- Handlebars syntax correctness
- Accessibility compliance (basic checks)