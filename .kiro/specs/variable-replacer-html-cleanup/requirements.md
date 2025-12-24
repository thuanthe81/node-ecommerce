# Requirements Document

## Introduction

This specification defines the refactoring of the VariableReplacer service to remove all HTML generation and CSS styling code, moving these responsibilities to dedicated HTML template files and CSS stylesheets. The VariableReplacer should focus solely on variable replacement and template processing, while all HTML structure and styling should be defined in external template files.

## Glossary

- **Variable_Replacer_Service**: The NestJS service responsible for processing Handlebars templates and replacing variables with actual data
- **HTML_Generation_Method**: Any method in VariableReplacer that generates HTML markup programmatically
- **CSS_Styling_Method**: Any method in VariableReplacer that generates CSS styles programmatically
- **Template_Helper**: A Handlebars helper function that generates HTML or CSS content
- **Partial_Template**: A reusable HTML template fragment that can be included in other templates
- **CSS_Component_File**: A CSS file containing styles for specific UI components (buttons, badges, cards, etc.)
- **Template_Fragment**: A small, reusable piece of HTML template that can be included in larger templates

## Requirements

### Requirement 1: Remove HTML Generation Methods

**User Story:** As a developer, I want all HTML generation removed from the VariableReplacer service, so that HTML structure is defined only in template files.

#### Acceptance Criteria

1. THE Variable_Replacer_Service SHALL NOT contain any methods that generate HTML markup programmatically
2. WHEN the VariableReplacer service is refactored, THE generateEmailHeader method SHALL be removed and replaced with a header partial template
3. WHEN the VariableReplacer service is refactored, THE generateEmailFooter method SHALL be removed and replaced with a footer partial template
4. WHEN the VariableReplacer service is refactored, THE generateAddressCard method SHALL be removed and replaced with an address card partial template
5. THE Variable_Replacer_Service SHALL only handle variable replacement and template processing logic
6. WHEN HTML content is needed, THE system SHALL use Handlebars partial templates instead of programmatic generation

### Requirement 2: Remove CSS Styling Methods

**User Story:** As a developer, I want all CSS generation removed from the VariableReplacer service, so that styling is defined only in CSS files.

#### Acceptance Criteria

1. THE Variable_Replacer_Service SHALL NOT contain any methods that generate CSS styles programmatically
2. WHEN the VariableReplacer service is refactored, THE getButtonStyles method SHALL be removed and button styles SHALL be defined in CSS files
3. WHEN the VariableReplacer service is refactored, THE getStatusBadgeStyles method SHALL be removed and badge styles SHALL be defined in CSS files
4. THE Variable_Replacer_Service SHALL NOT generate inline styles for any HTML elements
5. WHEN styling is needed, THE system SHALL use CSS classes defined in external CSS files
6. THE Variable_Replacer_Service SHALL only reference CSS classes by name, not generate style attributes

### Requirement 3: Create Partial Templates for Reusable Components

**User Story:** As a developer, I want reusable HTML components defined as partial templates, so that I can maintain consistent markup across all email templates.

#### Acceptance Criteria

1. THE system SHALL create a partial template file `partials/email-header.hbs` to replace the generateEmailHeader method
2. THE system SHALL create a partial template file `partials/email-footer.hbs` to replace the generateEmailFooter method
3. THE system SHALL create a partial template file `partials/address-card.hbs` to replace the generateAddressCard method
4. THE system SHALL create a partial template file `partials/button.hbs` for generating buttons with different styles
5. THE system SHALL create a partial template file `partials/status-badge.hbs` for generating status badges
6. WHEN partial templates are created, THE system SHALL register them with Handlebars for use in main templates
7. THE partial templates SHALL accept parameters for customization (text, URLs, addresses, etc.)

### Requirement 4: Create Component CSS Files

**User Story:** As a developer, I want CSS styles for email components defined in separate CSS files, so that styling can be maintained independently from template logic.

#### Acceptance Criteria

1. THE system SHALL create a CSS file `components/buttons.css` containing all button styles (primary, secondary, success, danger)
2. THE system SHALL create a CSS file `components/badges.css` containing all status badge styles (pending, confirmed, shipped, delivered, cancelled)
3. THE system SHALL create a CSS file `components/cards.css` containing address card and other card component styles
4. THE system SHALL create a CSS file `components/layout.css` containing header, footer, and general layout styles
5. THE CSS files SHALL use CSS classes instead of inline styles for all components
6. WHEN CSS files are created, THE system SHALL ensure email client compatibility is maintained
7. THE CSS files SHALL support responsive design where appropriate for email clients

### Requirement 5: Update Template Helper Functions

**User Story:** As a developer, I want template helper functions to use partial templates and CSS classes instead of generating HTML and CSS inline.

#### Acceptance Criteria

1. WHEN the generateButton helper is refactored, THE helper SHALL render the button partial template with appropriate CSS classes
2. WHEN the generateStatusBadge helper is refactored, THE helper SHALL render the status badge partial template with appropriate CSS classes
3. WHEN the generateAddressCard helper is refactored, THE helper SHALL render the address card partial template
4. THE emailHeader helper SHALL render the email header partial template
5. THE emailFooter helper SHALL render the email footer partial template
6. THE template helpers SHALL pass data to partial templates instead of generating HTML strings
7. THE template helpers SHALL NOT contain any HTML markup or CSS style generation

### Requirement 6: Maintain Backward Compatibility

**User Story:** As a developer, I want the refactored system to maintain the same functionality and output, so that existing email templates continue to work without changes.

#### Acceptance Criteria

1. WHEN the refactoring is complete, THE generated email HTML SHALL be visually identical to the current implementation
2. THE Variable_Replacer_Service SHALL maintain all existing public method signatures
3. WHEN template helpers are called, THE output SHALL match the current HTML structure and styling
4. THE system SHALL continue to support all current email client compatibility features
5. THE system SHALL maintain all current accessibility features in the generated HTML
6. WHEN emails are generated, THE final HTML output SHALL pass the same validation as the current implementation

### Requirement 7: Template Organization and Structure

**User Story:** As a developer, I want partial templates and CSS files organized in a clear directory structure, so that components are easy to find and maintain.

#### Acceptance Criteria

1. THE system SHALL create a `partials/` subdirectory within the templates directory for partial templates
2. THE system SHALL create a `components/` subdirectory within the styles directory for component CSS files
3. THE partial templates SHALL be organized by component type (layout, forms, cards, etc.)
4. THE CSS component files SHALL follow the same organizational structure as partial templates
5. WHEN the directory structure is created, THE system SHALL update the template loader to support partial template loading
6. THE system SHALL maintain a clear mapping between partial templates and their corresponding CSS files
7. THE directory structure SHALL support easy addition of new components in the future

### Requirement 8: Error Handling and Validation

**User Story:** As a developer, I want clear error messages when partial templates or CSS components are missing or invalid, so that I can quickly diagnose and fix issues.

#### Acceptance Criteria

1. WHEN a partial template is missing, THE system SHALL throw a descriptive error indicating which partial is missing
2. WHEN a CSS component file is missing, THE system SHALL log a warning and continue with default styles
3. WHEN partial template rendering fails, THE system SHALL log the partial name and error details
4. THE system SHALL validate that all partial templates contain valid HTML structure
5. THE system SHALL validate that all CSS component files contain valid CSS syntax
6. WHEN validation fails, THE system SHALL provide specific error messages indicating the file and validation issue
7. THE system SHALL continue to function with degraded styling if CSS files are invalid, but SHALL fail if partial templates are invalid
