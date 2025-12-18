# Design Document

## Overview

This design addresses the currency formatting inconsistency in the PDF generation system. The current implementation incorrectly uses dollar signs ($) for both English and Vietnamese locales, while the application should use the Vietnamese dong symbol (đ) for both locales. The solution involves updating the PDF Localization Service to use consistent Vietnamese dong formatting across all locales.

## Architecture

The fix will be implemented within the existing PDF generation architecture:

```
PDFGeneratorService
├── PDFLocalizationService (MODIFIED)
│   ├── formatCurrency() (UPDATED)
│   └── translations configuration (UPDATED)
├── PDFTemplateEngine (uses PDFLocalizationService)
└── PDFDocumentStructureService (uses formatCurrency)
```

The change is isolated to the PDFLocalizationService, ensuring minimal impact on other components while maintaining backward compatibility.

## Components and Interfaces

### PDFLocalizationService Updates

**Modified Methods:**
- `formatCurrency(amount: number, locale: 'en' | 'vi'): string`

**Updated Configuration:**
```typescript
private readonly translations = {
  en: {
    currencySymbol: 'đ',
    currencyPosition: 'after',
    // ... other translations
  },
  vi: {
    currencySymbol: 'đ',
    currencyPosition: 'after',
    // ... other translations
  }
}
```

**Enhanced formatCurrency Implementation:**
```typescript
formatCurrency(amount: number, locale: 'en' | 'vi'): string {
  // Both locales use Vietnamese dong symbol with consistent formatting
  const formattedAmount = amount.toLocaleString('vi-VN');
  return `${formattedAmount} đ`;
}
```

## Data Models

No new data models are required. The existing translation configuration structure will be updated:

```typescript
interface LocaleTranslations {
  currencySymbol: string;      // 'đ' for both en and vi
  currencyPosition: 'after';   // 'after' for both locales
  // ... existing translation fields
}
```

## Correctness Properties
*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Consistent dong symbol usage
*For any* monetary amount formatted in either English or Vietnamese locale, the output should contain the Vietnamese dong symbol "đ" and never contain "$"
**Validates: Requirements 1.1, 1.4**

### Property 2: Symbol positioning consistency
*For any* monetary amount formatted in either locale, the currency symbol should appear after the amount with a space separator
**Validates: Requirements 1.2**

### Property 3: Vietnamese number formatting
*For any* monetary amount formatted in either locale, the number should use Vietnamese locale formatting with comma separators
**Validates: Requirements 1.3**

### Property 4: Cross-service formatting consistency
*For any* monetary amount, when formatted by both PDF Localization Service and Email Template Service, the output should be identical
**Validates: Requirements 2.1**

### Property 5: Internal PDF consistency
*For any* PDF document containing multiple monetary amounts, all amounts should use the same currency symbol and formatting pattern
**Validates: Requirements 2.2, 2.3, 2.4, 2.5**

### Property 6: Vietnamese locale string usage
*For any* monetary amount formatting, the implementation should use `toLocaleString('vi-VN')` for number formatting
**Validates: Requirements 3.2**

### Property 7: Configuration-based symbol definition
*For any* locale configuration, the currency symbol should be defined as "đ" in the translations configuration object
**Validates: Requirements 3.3**

### Property 8: Simplified formatting logic
*For any* monetary amount, the formatting should use the same logic regardless of locale, eliminating conditional branching
**Validates: Requirements 3.1, 3.4, 3.5**

## Error Handling

The currency formatting fix maintains existing error handling patterns:

- **Invalid amounts**: Zero and negative amounts are handled gracefully
- **Missing locale**: Defaults to English locale behavior (now identical to Vietnamese)
- **Null/undefined amounts**: Returns appropriate zero value formatting ("0 đ")

## Testing Strategy

### Unit Testing
- Test formatCurrency method with various amount values
- Verify currency symbol consistency across locales
- Test edge cases (zero, negative, large numbers)
- Validate number formatting patterns

### Property-Based Testing
The design specifies property-based tests using a suitable testing library for TypeScript/Node.js (such as fast-check). Each property test should run a minimum of 100 iterations to ensure comprehensive coverage.

**Property Test Requirements:**
- Generate random monetary amounts and verify consistent "đ" symbol usage
- Test cross-service consistency by comparing PDF and email formatting outputs
- Verify internal document consistency across multiple amounts
- Test configuration compliance and implementation details

**Property Test Tagging:**
Each property-based test must include a comment with the format:
`// **Feature: pdf-currency-format-fix, Property {number}: {property_text}**`

### Integration Testing
- Test PDF generation with various order types and amounts
- Verify consistency across different PDF document types (orders, invoices)
- Test locale switching behavior
- Validate end-to-end currency display in generated PDFs

## Implementation Notes

### Backward Compatibility
The change maintains backward compatibility by:
- Keeping the same method signature for `formatCurrency`
- Preserving existing translation structure
- Not affecting other PDF generation functionality

### Performance Considerations
- Simplified logic reduces conditional branching
- Consistent use of `toLocaleString('vi-VN')` for all formatting
- No additional computational overhead

### Maintenance Benefits
- Eliminates locale-specific formatting logic
- Reduces code complexity and potential bugs
- Aligns with established patterns in the codebase
- Simplifies future currency formatting updates