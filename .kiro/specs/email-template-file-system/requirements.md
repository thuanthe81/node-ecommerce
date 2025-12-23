# Requirements Document

## Introduction

This specification defines the refactoring of the email template system from programmatic TypeScript generation to a file-based HTML template system. The new system will use static HTML template files with variable placeholders that are replaced at runtime, supporting multiple locales through a single template file with locale-specific variable replacement.

## Glossary

- **Email_Template_Service**: The NestJS service responsible for loading HTML templates and replacing variables with actual data
- **Template_File**: An HTML file containing the email structure with variable placeholders (e.g., `template-order-confirmation.html`)
- **Variable_Placeholder**: A marker in the template file that will be replaced with actual data (e.g., `{{orderNumber}}`, `{{customerName}}`)
- **Locale**: Language/region setting (en for English, vi for Vietnamese)
- **Template_Loader**: Component responsible for reading template files and CSS design files from the file system
- **Variable_Replacer**: Component responsible for substituting placeholders with actual values
- **CSS_Design_File**: A CSS file containing email-specific styles that will be injected into templates (e.g., `styles-order-confirmation.css`)
- **CSS_Injector**: Component responsible for loading CSS design files and injecting them into template content

## Requirements

### Requirement 1: HTML Template and CSS Design File Structure

**User Story:** As a developer, I want all email templates stored as HTML files with corresponding CSS design files, so that I can easily edit and maintain email layouts and styling without modifying TypeScript code.

#### Acceptance Criteria

1. THE Email_Template_Service SHALL store all email templates as HTML files with the naming pattern `template-<name>.html`
2. THE Email_Template_Service SHALL store all email CSS designs as CSS files with the naming pattern `styles-<name>.css`
3. WHEN a template file is needed, THE Template_Loader SHALL read both the HTML template file and its corresponding CSS design file from designated directories
4. THE Email_Template_Service SHALL support the following template and CSS file pairs:
   - `template-order-confirmation.html` with `styles-order-confirmation.css`
   - `template-admin-order-notification.html` with `styles-admin-order-notification.css`
   - `template-shipping-notification.html` with `styles-shipping-notification.css`
   - `template-order-status-update.html` with `styles-order-status-update.css`
   - `template-welcome-email.html` with `styles-welcome-email.css`
   - `template-password-reset.html` with `styles-password-reset.css`
5. WHEN a template file does not exist, THE Email_Template_Service SHALL throw a descriptive error indicating which template is missing
6. WHEN a CSS design file does not exist, THE CSS_Injector SHALL use default styling and log a warning
7. THE Email_Template_Service SHALL validate that template files contain valid HTML structure
8. THE CSS_Injector SHALL validate that CSS design files contain valid CSS syntax

### Requirement 2: Locale-Agnostic Template Files

**User Story:** As a developer, I want to use the same template file for all locales, so that I can maintain a single source of truth for email structure.

#### Acceptance Criteria

1. THE Email_Template_Service SHALL use a single template file for all supported locales (en and vi)
2. WHEN generating an email, THE Variable_Replacer SHALL provide locale-specific content through variable replacement
3. THE Email_Template_Service SHALL NOT create separate template files for different locales
4. WHEN a locale is specified, THE Email_Template_Service SHALL pass locale-specific translated strings as variables to the template

### Requirement 3: Variable Replacement System

**User Story:** As a developer, I want to replace placeholders in templates with actual data, so that emails contain dynamic, personalized content.

#### Acceptance Criteria

1. THE Variable_Replacer SHALL support placeholder syntax using double curly braces (e.g., `{{variableName}}`)
2. WHEN processing a template, THE Variable_Replacer SHALL replace all placeholders with corresponding values from the provided data object
3. WHEN a placeholder has no corresponding value, THE Variable_Replacer SHALL replace it with an empty string
4. THE Variable_Replacer SHALL support nested object access in placeholders (e.g., `{{shippingAddress.city}}`)
5. THE Variable_Replacer SHALL escape HTML special characters in replaced values to prevent XSS vulnerabilities
6. THE Variable_Replacer SHALL support conditional sections using `{{#if condition}}...{{/if}}` syntax
7. THE Variable_Replacer SHALL support iteration over arrays using `{{#each items}}...{{/each}}` syntax

### Requirement 4: Template and CSS Loading and Caching

**User Story:** As a system administrator, I want template files and CSS design files to be cached in memory, so that email generation is performant and doesn't require repeated file system reads.

#### Acceptance Criteria

1. WHEN the Email_Template_Service initializes, THE Template_Loader SHALL load all template files and CSS design files into memory
2. THE Template_Loader SHALL cache loaded templates and CSS files to avoid repeated file system access
3. WHEN a template file or CSS design file is modified during development, THE Template_Loader SHALL provide a method to reload templates and styles
4. WHEN running in production mode, THE Template_Loader SHALL cache templates and CSS files indefinitely
5. WHEN running in development mode, THE Template_Loader SHALL support hot-reloading of template files and CSS design files

### Requirement 5: Backward Compatibility

**User Story:** As a developer, I want the refactored system to maintain the same public API, so that existing code using the email service continues to work without modifications.

#### Acceptance Criteria

1. THE Email_Template_Service SHALL maintain all existing public method signatures:
   - `getOrderConfirmationTemplate(data, locale)`
   - `getAdminOrderNotificationTemplate(data, locale)`
   - `getShippingNotificationTemplate(data, locale)`
   - `getOrderStatusUpdateTemplate(data, locale)`
   - `getWelcomeEmailTemplate(data, locale)`
   - `getPasswordResetTemplate(data, locale)`
2. WHEN any public method is called, THE Email_Template_Service SHALL return an object with `subject` and `html` properties
3. THE Email_Template_Service SHALL continue to accept the same data interfaces (OrderEmailData, AdminOrderEmailData, UserEmailData)
4. WHEN generating emails, THE Email_Template_Service SHALL produce HTML output that is visually equivalent to the current implementation

### Requirement 6: Template and CSS Directory Structure

**User Story:** As a developer, I want templates and CSS design files organized in a clear directory structure, so that I can easily locate and manage template and style files.

#### Acceptance Criteria

1. THE Email_Template_Service SHALL store all template files in `backend/src/notifications/templates/` directory
2. THE Email_Template_Service SHALL store all CSS design files in `backend/src/notifications/styles/` directory
3. WHEN the application starts, THE Template_Loader SHALL verify that both the templates and styles directories exist
4. WHEN the templates or styles directory does not exist, THE Email_Template_Service SHALL throw a descriptive error during initialization
5. THE Email_Template_Service SHALL support organizing templates and CSS files in subdirectories (e.g., `templates/orders/`, `styles/orders/`)
6. THE CSS_Injector SHALL maintain the same subdirectory structure between templates and styles directories for easy pairing

### Requirement 7: Error Handling and Logging

**User Story:** As a developer, I want clear error messages when template or CSS processing fails, so that I can quickly diagnose and fix issues.

#### Acceptance Criteria

1. WHEN a template file cannot be read, THE Template_Loader SHALL log an error with the file path and reason
2. WHEN a CSS design file cannot be read, THE CSS_Injector SHALL log a warning with the file path and use default styling
3. WHEN variable replacement fails, THE Variable_Replacer SHALL log the template name and problematic variable
4. WHEN a required variable is missing, THE Email_Template_Service SHALL log a warning but continue processing
5. THE Email_Template_Service SHALL provide detailed error messages that include template name, locale, and failure reason
6. WHEN template validation fails, THE Email_Template_Service SHALL throw an error with specific validation failures
7. WHEN CSS validation fails, THE CSS_Injector SHALL log a warning with specific validation failures and continue with default styles

### Requirement 8: CSS Design System Integration

**User Story:** As a developer, I want templates to use CSS design files that integrate with the existing design system tokens, so that emails maintain consistent styling and branding while allowing easy customization.

#### Acceptance Criteria

1. THE CSS_Injector SHALL load CSS design files that can reference design tokens from `email-design-tokens.ts`
2. WHEN generating templates, THE CSS_Injector SHALL inject CSS styles from the loaded design files into the template
3. THE CSS_Injector SHALL support passing design token values as CSS variables in the design files
4. THE CSS_Injector SHALL maintain support for modern button styles, status badges, and responsive layouts through CSS files
5. WHEN templates are rendered, THE CSS_Injector SHALL ensure email client compatibility is preserved
6. THE CSS_Injector SHALL support CSS preprocessing to replace design token placeholders with actual values
7. WHEN a CSS design file is missing, THE CSS_Injector SHALL fall back to generating CSS from design tokens programmatically
