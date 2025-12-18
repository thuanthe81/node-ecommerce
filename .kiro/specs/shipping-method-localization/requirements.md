# Requirements Document

## Introduction

The shipping method calculation API currently only returns English text fields (nameEn, descriptionEn) and does not provide localized content for Vietnamese users. The frontend checkout flow needs to display shipping methods in the user's selected locale, but the backend API does not return the necessary Vietnamese translations (nameVi, descriptionVi). This creates an inconsistent user experience where Vietnamese users see English shipping method names and descriptions during checkout.

## Glossary

- **Shipping_API**: The backend API endpoint `/shipping/calculate` that returns available shipping methods and rates
- **Shipping_Method**: A delivery option with name, description, cost, and estimated delivery time
- **Locale_Data**: Localized text content including both English and Vietnamese translations
- **Frontend_Checkout**: The checkout flow components that display shipping method selection
- **ShippingMethodSelector**: The React component responsible for displaying shipping method options

## Requirements

### Requirement 1

**User Story:** As a Vietnamese user, I want to see shipping method names and descriptions in Vietnamese during checkout, so that I can understand my delivery options in my preferred language.

#### Acceptance Criteria

1. WHEN a user requests shipping calculation with Vietnamese locale THEN the Shipping_API SHALL return shipping method names in Vietnamese (nameVi field)
2. WHEN a user requests shipping calculation with Vietnamese locale THEN the Shipping_API SHALL return shipping method descriptions in Vietnamese (descriptionVi field)
3. WHEN a user requests shipping calculation with English locale THEN the Shipping_API SHALL return shipping method names in English (nameEn field)
4. WHEN a user requests shipping calculation with English locale THEN the Shipping_API SHALL return shipping method descriptions in English (descriptionEn field)
5. WHEN the Shipping_API returns shipping methods THEN each method SHALL include both English and Vietnamese text fields for frontend locale switching

### Requirement 2

**User Story:** As a developer, I want the shipping API to accept locale parameters, so that the system can return appropriately localized shipping method data.

#### Acceptance Criteria

1. WHEN calling the shipping calculation endpoint THEN the Shipping_API SHALL accept an optional locale parameter ('en' or 'vi')
2. WHEN no locale parameter is provided THEN the Shipping_API SHALL default to English locale
3. WHEN an invalid locale parameter is provided THEN the Shipping_API SHALL fall back to English locale gracefully
4. WHEN processing shipping calculations THEN the Shipping_API SHALL use the locale parameter to determine which text fields to prioritize in the response
5. WHEN returning shipping method data THEN the Shipping_API SHALL include complete locale information regardless of the requested locale for frontend flexibility

### Requirement 3

**User Story:** As a user, I want the frontend checkout to display shipping methods in my selected language, so that the entire checkout experience is consistent with my locale preference.

#### Acceptance Criteria

1. WHEN the Frontend_Checkout loads shipping methods THEN the ShippingMethodSelector SHALL pass the current locale to the shipping calculation API
2. WHEN displaying shipping method options THEN the ShippingMethodSelector SHALL use the localized name and description fields from the API response
3. WHEN the user switches language during checkout THEN the ShippingMethodSelector SHALL re-fetch shipping methods with the new locale
4. WHEN shipping method data is unavailable in the requested locale THEN the ShippingMethodSelector SHALL fall back to English text gracefully
5. WHEN rendering shipping methods THEN the ShippingMethodSelector SHALL maintain consistent formatting and layout regardless of text length differences between locales

### Requirement 4

**User Story:** As a system administrator, I want shipping method localization to be consistent across all system components, so that users see the same terminology everywhere.

#### Acceptance Criteria

1. WHEN shipping methods are displayed in PDFs THEN the system SHALL use the same localized text as the checkout flow
2. WHEN shipping methods are shown in order confirmations THEN the system SHALL use the same localized text as the checkout flow
3. WHEN shipping methods appear in email notifications THEN the system SHALL use the same localized text as the checkout flow
4. WHEN updating shipping method translations THEN changes SHALL be reflected consistently across all system components
5. WHEN validating shipping method data THEN the system SHALL ensure both English and Vietnamese translations exist for all active methods

### Requirement 5

**User Story:** As a developer, I want proper error handling for localization failures, so that the system remains functional even when translation data is incomplete.

#### Acceptance Criteria

1. WHEN a shipping method lacks Vietnamese translation THEN the system SHALL fall back to English text and log the missing translation
2. WHEN the localization service is unavailable THEN the Shipping_API SHALL continue to function using default English text
3. WHEN translation keys are missing THEN the system SHALL display the method ID as a fallback and log the error
4. WHEN locale switching fails THEN the Frontend_Checkout SHALL maintain the current display and show an appropriate error message
5. WHEN shipping method data is corrupted THEN the system SHALL exclude the invalid method from results and continue processing other methods