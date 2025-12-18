# Design Document

## Overview

This design addresses the shipping method localization issue where the backend API only returns English text fields and the frontend cannot display shipping methods in Vietnamese. The solution involves updating the shipping calculation API to accept locale parameters and return appropriate localized content, while updating the frontend to use locale-aware data.

The system already has the necessary database fields (`nameVi`, `descriptionVi`) but the API layer doesn't expose them based on user locale preferences. This design will bridge that gap while maintaining backward compatibility.

## Architecture

The localization enhancement follows a layered approach:

1. **API Layer**: Extend the shipping calculation endpoint to accept locale parameters
2. **Service Layer**: Modify the shipping service to return locale-appropriate data
3. **Frontend Layer**: Update the ShippingMethodSelector to pass locale and use localized fields
4. **Fallback Strategy**: Implement graceful degradation when translations are missing

## Components and Interfaces

### Backend API Changes

**Updated CalculateShippingDto**
```typescript
export class CalculateShippingDto {
  // ... existing fields

  @IsString()
  @IsOptional()
  @IsIn(['en', 'vi'])
  locale?: 'en' | 'vi';
}
```

**Enhanced ShippingRate Interface**
```typescript
export interface ShippingRate {
  method: string;
  name: string;           // Localized name based on requested locale
  description: string;    // Localized description based on requested locale
  nameEn: string;        // Always include English for fallback
  nameVi: string;        // Always include Vietnamese for frontend switching
  descriptionEn: string; // Always include English for fallback
  descriptionVi: string; // Always include Vietnamese for frontend switching
  cost: number;
  estimatedDays: string;
  carrier?: string;
  isFreeShipping: boolean;
  originalCost?: number;
}
```

### Frontend Changes

**Updated ShippingMethodSelector Props**
```typescript
interface ShippingMethodSelectorProps {
  // ... existing props
  locale?: string; // Current user locale
}
```

**Enhanced CalculateShippingData Interface**
```typescript
export interface CalculateShippingData {
  // ... existing fields
  locale?: 'en' | 'vi';
}
```

## Data Models

### Existing Database Schema
The `ShippingMethod` model already contains the necessary localization fields:
- `nameEn`: English name
- `nameVi`: Vietnamese name
- `descriptionEn`: English description
- `descriptionVi`: Vietnamese description

### API Response Model
The enhanced response will include both localized primary fields and all language variants for frontend flexibility:

```typescript
{
  method: "standard",
  name: "Giao hàng tiêu chuẩn",        // Vietnamese (requested locale)
  description: "Giao hàng trong 3-5 ngày", // Vietnamese (requested locale)
  nameEn: "Standard Shipping",
  nameVi: "Giao hàng tiêu chuẩn",
  descriptionEn: "Delivery in 3-5 days",
  descriptionVi: "Giao hàng trong 3-5 ngày",
  cost: 25000,
  estimatedDays: "3-5 days",
  carrier: "Vietnam Post",
  isFreeShipping: false
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Vietnamese locale returns Vietnamese primary fields
*For any* shipping calculation request with Vietnamese locale, all returned shipping methods should have Vietnamese text in the primary name and description fields
**Validates: Requirements 1.1, 1.2**

### Property 2: English locale returns English primary fields
*For any* shipping calculation request with English locale, all returned shipping methods should have English text in the primary name and description fields
**Validates: Requirements 1.3, 1.4**

### Property 3: Complete locale data inclusion
*For any* shipping calculation request regardless of locale, all returned shipping methods should include both English and Vietnamese text fields (nameEn, nameVi, descriptionEn, descriptionVi)
**Validates: Requirements 1.5, 2.5**

### Property 4: Locale parameter acceptance
*For any* valid locale parameter ('en' or 'vi'), the shipping calculation API should accept the request without errors
**Validates: Requirements 2.1**

### Property 5: Default locale behavior
*For any* shipping calculation request without a locale parameter, the API should return English text in the primary name and description fields
**Validates: Requirements 2.2**

### Property 6: Invalid locale fallback
*For any* shipping calculation request with an invalid locale parameter, the API should fall back to English locale gracefully without errors
**Validates: Requirements 2.3**

### Property 7: Locale-based field prioritization
*For any* shipping calculation request with a specific locale, the primary name and description fields should match the text from the corresponding locale-specific fields (nameEn/nameVi, descriptionEn/descriptionVi)
**Validates: Requirements 2.4**

### Property 8: Frontend locale passing
*For any* shipping method request from the frontend, the current user locale should be included in the API call parameters
**Validates: Requirements 3.1**

### Property 9: Frontend localized field usage
*For any* shipping method display in the frontend, the rendered text should match the locale-appropriate fields from the API response
**Validates: Requirements 3.2**

### Property 10: Dynamic locale switching
*For any* locale change during checkout, the shipping methods should be re-fetched with the new locale parameter
**Validates: Requirements 3.3**

### Property 11: Frontend fallback behavior
*For any* shipping method with missing translation data, the frontend should display English text gracefully
**Validates: Requirements 3.4**

### Property 12: Cross-component consistency
*For any* shipping method data, the localized text should be identical across PDF generation, order confirmations, and email notifications for the same locale
**Validates: Requirements 4.1, 4.2, 4.3**

### Property 13: Translation update propagation
*For any* shipping method translation update, the changes should be reflected consistently across all system components that display shipping methods
**Validates: Requirements 4.4**

### Property 14: Complete translation validation
*For any* active shipping method, both English and Vietnamese translations should exist and be non-empty
**Validates: Requirements 4.5**

### Property 15: Missing translation fallback
*For any* shipping method with missing Vietnamese translation, the system should fall back to English text and log the missing translation
**Validates: Requirements 5.1**

### Property 16: Service unavailability resilience
*For any* shipping calculation when localization services are unavailable, the API should continue functioning with English text
**Validates: Requirements 5.2**

### Property 17: Missing key fallback
*For any* shipping method with missing translation keys, the system should display the method ID as fallback and log the error
**Validates: Requirements 5.3**

### Property 18: Frontend error handling
*For any* locale switching failure in the frontend, the current display should be maintained with an appropriate error message
**Validates: Requirements 5.4**

### Property 19: Corrupted data handling
*For any* shipping calculation with corrupted method data, invalid methods should be excluded while processing continues for valid methods
**Validates: Requirements 5.5**

## Error Handling

### API Level Error Handling
- Invalid locale parameters fall back to English ('en') with warning logs
- Missing translation fields fall back to English equivalents
- Database connection failures return cached data when available
- Malformed shipping method data is excluded from results with error logging

### Frontend Error Handling
- API failures display user-friendly error messages in current locale
- Missing translation data falls back to English text
- Network timeouts retry with exponential backoff
- Locale switching failures maintain current state

### Logging Strategy
- Missing translations logged at WARN level with method ID and missing field
- Invalid locale parameters logged at INFO level
- Service unavailability logged at ERROR level
- Data corruption logged at ERROR level with affected method details

## Testing Strategy

### Unit Testing
- Test locale parameter validation and fallback logic
- Test shipping method data transformation for different locales
- Test error handling for missing translations and invalid data
- Test frontend component locale switching and display logic

### Property-Based Testing
The system will use **fast-check** (JavaScript/TypeScript property-based testing library) for comprehensive testing. Each property-based test will run a minimum of 100 iterations to ensure thorough coverage of the input space.

**Property-based testing requirements:**
- Each correctness property will be implemented as a single property-based test
- Tests will be tagged with comments referencing the design document property
- Format: `**Feature: shipping-method-localization, Property {number}: {property_text}**`
- Generators will create realistic shipping method data with various locale combinations
- Tests will verify both happy path scenarios and edge cases

### Integration Testing
- Test end-to-end locale switching from frontend to backend
- Test consistency across PDF generation, emails, and checkout flow
- Test cache invalidation when shipping method translations are updated
- Test fallback behavior when external services are unavailable

### Performance Testing
- Verify locale-aware API responses maintain acceptable performance
- Test cache effectiveness for localized shipping method data
- Validate memory usage with complete locale data inclusion