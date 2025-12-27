# Migration Guide: Shared Constants and Translations Library

## Overview

The backend constants and translation services have been migrated to a shared library (`@alacraft/shared`) to eliminate duplication between frontend and backend applications. This guide explains how to migrate existing code to use the new shared library.

## Breaking Changes

### 1. Constants Import Changes

**Before:**
```typescript
import { STATUS, CACHE_KEYS, BUSINESS, SYSTEM } from '../common/constants';
```

**After:**
```typescript
import { CONSTANTS } from '@alacraft/shared';

// Access constants through the CONSTANTS object:
// CONSTANTS.STATUS instead of STATUS
// CONSTANTS.CACHE_KEYS instead of CACHE_KEYS
// CONSTANTS.BUSINESS instead of BUSINESS
// CONSTANTS.SYSTEM instead of SYSTEM
```

### 2. Translation Service Changes

**Before:**
```typescript
import { TranslationService } from '../common/services/translation.service';

// In your service
constructor(private translationService: TranslationService) {}

// Usage
const orderStatus = this.translationService.translateOrderStatus(status, locale);
const paymentStatus = this.translationService.translatePaymentStatus(status, locale);
```

**After:**
```typescript
import {
  translateOrderStatus,
  translatePaymentStatus,
  translateUserRole
} from '@alacraft/shared';

// Direct function usage (no service injection needed)
const orderStatus = translateOrderStatus(status, locale);
const paymentStatus = translatePaymentStatus(status, locale);
```

### 3. Business Info Service Changes

**Before:**
```typescript
import { BusinessInfoService } from '../common/services/business-info.service';

// Usage
const companyName = this.businessInfoService.getCompanyName(locale);
```

**After:**
```typescript
import { CONSTANTS } from '@alacraft/shared';

// Direct constant access
const companyName = locale === 'vi'
  ? CONSTANTS.BUSINESS.COMPANY.NAME.VI
  : CONSTANTS.BUSINESS.COMPANY.NAME.EN;
```

## Migration Examples

### Example 1: Order Status Usage

**Before:**
```typescript
import { STATUS } from '../common/constants';

if (order.status === STATUS.ORDER_STATUS.PENDING) {
  // Handle pending order
}
```

**After:**
```typescript
import { CONSTANTS } from '@alacraft/shared';

if (order.status === CONSTANTS.STATUS.ORDER_STATUS.PENDING) {
  // Handle pending order
}
```

### Example 2: Cache Keys Usage

**Before:**
```typescript
import { CACHE_KEYS } from '../common/constants';

const cacheKey = CACHE_KEYS.PRODUCTS.BY_ID(productId);
```

**After:**
```typescript
import { CONSTANTS } from '@alacraft/shared';

const cacheKey = CONSTANTS.CACHE_KEYS.PRODUCTS.BY_ID(productId);
```

### Example 3: Email Translation Usage

**Before:**
```typescript
import { TranslationService } from '../common/services/translation.service';

constructor(private translationService: TranslationService) {}

const translations = {
  orderStatus: this.translationService.translateOrderStatus(order.status, locale),
  paymentStatus: this.translationService.translatePaymentStatus(order.paymentStatus, locale)
};
```

**After:**
```typescript
import {
  translateOrderStatus,
  translatePaymentStatus,
  getEmailTemplateTranslations
} from '@alacraft/shared';

const translations = {
  orderStatus: translateOrderStatus(order.status, locale),
  paymentStatus: translatePaymentStatus(order.paymentStatus, locale)
};

// For email templates, use the comprehensive email translation functions
const emailTranslations = getEmailTemplateTranslations(locale);
```

## Deprecated Services

The following services are now deprecated and will be removed in a future version:

### TranslationService
- **Status**: Deprecated
- **Replacement**: Use translation functions from `@alacraft/shared`
- **Migration**: Replace service injection with direct function imports

### BusinessInfoService.getCompanyName()
- **Status**: Deprecated
- **Replacement**: Use `CONSTANTS.BUSINESS.COMPANY.NAME` from `@alacraft/shared`
- **Migration**: Replace method calls with direct constant access

## Benefits of Migration

1. **Consistency**: Same constants and translations used across frontend and backend
2. **Type Safety**: Full TypeScript support with proper type definitions
3. **Performance**: No service injection overhead for simple constant access
4. **Maintainability**: Single source of truth for all constants and translations
5. **Extensibility**: Easy to add new constants and translations in one place

## Validation

After migration, ensure:

1. All imports are updated to use `@alacraft/shared`
2. All constant references use the `CONSTANTS` object structure
3. Translation service calls are replaced with direct function calls
4. Tests are updated to use the new import structure
5. No references to the old `../common/constants` file remain

## Support

If you encounter issues during migration:

1. Check that `@alacraft/shared` is properly installed in your package.json
2. Verify that the shared library is built (`npm run build` in the shared directory)
3. Ensure all old imports are removed
4. Check the console for deprecation warnings that indicate incomplete migration

## Timeline

- **Current**: Old services marked as deprecated with console warnings
- **Next Release**: Deprecated services will be removed
- **Migration Deadline**: Complete migration before the next major version release