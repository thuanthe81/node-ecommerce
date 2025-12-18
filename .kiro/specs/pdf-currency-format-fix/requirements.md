# Requirements Document

## Introduction

The PDF generation system currently uses incorrect currency formatting for Vietnamese locale. While other parts of the system (email templates, notifications) correctly use the Vietnamese dong symbol (₫), the PDF localization service incorrectly uses the dollar sign ($) for both English and Vietnamese locales. This creates inconsistency across the application and provides incorrect currency information to Vietnamese customers.

## Glossary

- **PDF Generator Service**: The backend service responsible for generating PDF documents for orders and invoices
- **PDF Localization Service**: The service component that handles translation and locale-specific formatting within PDF generation
- **Vietnamese Dong (VND)**: The official currency of Vietnam, represented by the symbol ₫
- **Currency Formatting**: The process of displaying monetary amounts with appropriate symbols, decimal places, and number formatting according to locale conventions

## Requirements

### Requirement 1

**User Story:** As a Vietnamese customer, I want to see prices in PDFs displayed with the correct Vietnamese dong symbol (₫), so that the currency information is accurate and consistent with other parts of the application.

#### Acceptance Criteria

1. WHEN generating PDFs for Vietnamese locale, THE PDF Localization Service SHALL use the Vietnamese dong symbol (₫) instead of the dollar sign ($)
2. WHEN formatting currency amounts in Vietnamese locale, THE PDF Localization Service SHALL position the currency symbol after the amount (e.g., "100,000 ₫")
3. WHEN formatting currency amounts in Vietnamese locale, THE PDF Localization Service SHALL use Vietnamese number formatting with comma separators (e.g., "1,000,000 ₫")
4. WHEN generating PDFs for English locale, THE PDF Localization Service SHALL continue using appropriate English currency formatting
5. WHEN displaying zero-price items in Vietnamese locale, THE PDF Localization Service SHALL show "0 ₫" instead of "$0.00"

### Requirement 2

**User Story:** As a system administrator, I want currency formatting in PDFs to be consistent with other parts of the application, so that customers receive coherent financial information across all touchpoints.

#### Acceptance Criteria

1. WHEN comparing PDF currency formatting with email template formatting, THE PDF Localization Service SHALL use identical currency symbols and formatting rules
2. WHEN generating order confirmation PDFs, THE PDF Localization Service SHALL format all monetary amounts (subtotal, shipping, tax, discount, total) consistently with the same currency symbol
3. WHEN generating invoice PDFs, THE PDF Localization Service SHALL format unit prices and total prices using the same currency formatting rules
4. WHEN processing orders with multiple items, THE PDF Localization Service SHALL apply consistent currency formatting to all line items
5. WHEN generating PDFs with payment information, THE PDF Localization Service SHALL format payment amounts using the correct currency symbol for the locale

### Requirement 3

**User Story:** As a developer, I want the PDF currency formatting to follow established patterns in the codebase, so that maintenance and future updates are consistent and predictable.

#### Acceptance Criteria

1. WHEN implementing currency formatting, THE PDF Localization Service SHALL use the same formatting logic as the email template service
2. WHEN formatting Vietnamese currency, THE PDF Localization Service SHALL use `toLocaleString('vi-VN')` for number formatting
3. WHEN handling currency symbols, THE PDF Localization Service SHALL define currency symbols in the translation configuration object
4. WHEN positioning currency symbols, THE PDF Localization Service SHALL respect the `currencyPosition` configuration for each locale
5. WHEN formatting decimal places, THE PDF Localization Service SHALL use zero decimal places for Vietnamese dong and two decimal places for other currencies