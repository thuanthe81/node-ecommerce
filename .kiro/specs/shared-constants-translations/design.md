# Design Document: Shared Constants and Translations Library

## Overview

This design outlines the implementation of a shared constants and translations library that will eliminate duplication between the frontend and backend applications. The library will be implemented as a separate npm package within the existing monorepo structure, providing centralized access to constants, translations, and utility functions.

The current codebase has significant duplication:
- Backend has comprehensive constants in `backend/src/common/constants.ts`
- Frontend has minimal constants in `frontend/app/constants.ts`
- Status translations exist in both `backend/src/common/services/translation.service.ts` and `frontend/locales/translations.json`
- Business information and configuration values are scattered across both applications

## Architecture

### Package Structure

The shared library will be organized as a new workspace package:

```
shared/
├── package.json
├── tsconfig.json
├── src/
│   ├── constants/
│   │   ├── index.ts
│   │   ├── status.ts
│   │   ├── business.ts
│   │   ├── system.ts
│   │   └── cache.ts
│   ├── translations/
│   │   ├── index.ts
│   │   ├── status-translations.ts
│   │   └── types.ts
│   ├── utils/
│   │   ├── index.ts
│   │   ├── validation.ts
│   │   └── translation-helpers.ts
│   └── index.ts
├── dist/
│   ├── cjs/
│   └── esm/
├── tests/
└── README.md
```

### Module Organization

#### Constants Module (`src/constants/`)

**Status Constants (`status.ts`)**
- Order status enums and constants
- Payment status enums and constants
- User role enums and constants
- Type definitions and validation utilities

**Business Constants (`business.ts`)**
- Company information (names, legal info)
- Contact details (emails, phones)
- Social media URLs
- Asset paths and branding information

**System Constants (`system.ts`)**
- MIME types for file validation
- API configuration (pagination, timeouts, rate limits)
- Email configuration and templates

**Cache Constants (`cache.ts`)**
- Cache key patterns and generators
- TTL configurations
- Cache namespace definitions

#### Translations Module (`src/translations/`)

**Status Translations (`status-translations.ts`)**
- Order status translations (EN/VI)
- Payment status translations (EN/VI)
- User role translations (EN/VI)
- Translation function implementations

**Email Translations (`email-translations.ts`)**
- Order confirmation email translations
- Admin order notification translations
- Order status update email translations
- Common email template translations
- Layout and branding translations for emails

**Common Translations (`common-translations.ts`)**
- Shared UI text (buttons, labels, messages)
- Error messages and success notifications
- Navigation and layout text
- Form validation messages

**Translation Types (`types.ts`)**
- Locale type definitions
- Translation key interfaces
- Translation function signatures

#### Utilities Module (`src/utils/`)

**Validation Utilities (`validation.ts`)**
- Status validation functions
- MIME type validation
- Email format validation
- URL validation helpers

**Translation Helpers (`translation-helpers.ts`)**
- Locale detection utilities
- Fallback translation logic
- Translation key generation

## Components and Interfaces

### Core Interfaces

```typescript
// Locale support
export type SupportedLocale = 'en' | 'vi';

// Status enums (matching Prisma enums)
export enum OrderStatus {
  PENDING = 'PENDING',
  PENDING_QUOTE = 'PENDING_QUOTE',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER'
}

// Translation interfaces
export interface StatusTranslations {
  [key: string]: {
    en: string;
    vi: string;
  };
}

export interface TranslationFunction {
  (status: string, locale: SupportedLocale): string;
}

// Business information interfaces
export interface CompanyInfo {
  name: {
    en: string;
    vi: string;
  };
  legalName: string;
}

export interface ContactInfo {
  email: {
    primary: string;
    vietnamese: string;
    orders: string;
  };
  phone: {
    primary: string;
    international: string;
  };
}
```

### Constants Export Structure

```typescript
// Main constants export
export const CONSTANTS = {
  STATUS: {
    ORDER_STATUS: OrderStatus,
    PAYMENT_STATUS: PaymentStatus,
    USER_ROLES: UserRole
  },
  BUSINESS: {
    COMPANY: CompanyInfo,
    CONTACT: ContactInfo,
    SOCIAL: SocialMediaUrls,
    ASSETS: AssetPaths
  },
  SYSTEM: {
    MIME_TYPES: MimeTypes,
    EMAIL: EmailConfig,
    API: ApiConfig
  },
  CACHE_KEYS: CacheKeyGenerators
} as const;
```

### Translation Functions

```typescript
// Status translation functions
export function translateOrderStatus(
  status: OrderStatus,
  locale: SupportedLocale = 'en'
): string;

export function translatePaymentStatus(
  status: PaymentStatus,
  locale: SupportedLocale = 'en'
): string;

export function translateUserRole(
  role: UserRole,
  locale: SupportedLocale = 'en'
): string;

// Email translation functions
export function getEmailTemplateTranslations(
  locale: SupportedLocale = 'en'
): Record<string, string>;

export function getOrderConfirmationTranslations(
  locale: SupportedLocale = 'en'
): Record<string, string>;

export function getAdminOrderNotificationTranslations(
  locale: SupportedLocale = 'en'
): Record<string, string>;

export function getOrderStatusUpdateTranslations(
  locale: SupportedLocale = 'en'
): Record<string, string>;

// Generic translation helper
export function translateStatus(
  status: string,
  type: 'order' | 'payment' | 'user',
  locale: SupportedLocale = 'en'
): string;

// Generic email translation helper
export function getTranslation(
  key: string,
  locale: SupportedLocale = 'en'
): string;

// Get all translations for a locale
export function getAllTranslations(
  locale: SupportedLocale = 'en'
): Record<string, string>;
```

## Data Models

### Translation Data Structure

The translation data will be structured to support both current and future status types:

```typescript
export const STATUS_TRANSLATIONS: StatusTranslations = {
  // Order Status Translations
  order: {
    PENDING: { en: 'Pending', vi: 'Chờ xử lý' },
    PENDING_QUOTE: { en: 'Pending Quote', vi: 'Chờ báo giá' },
    PROCESSING: { en: 'Processing', vi: 'Đang xử lý' },
    SHIPPED: { en: 'Shipped', vi: 'Đã giao vận' },
    DELIVERED: { en: 'Delivered', vi: 'Đã giao hàng' },
    CANCELLED: { en: 'Cancelled', vi: 'Đã hủy' },
    REFUNDED: { en: 'Refunded', vi: 'Đã hoàn tiền' }
  },
  // Payment Status Translations
  payment: {
    PENDING: { en: 'Pending', vi: 'Chờ thanh toán' },
    PAID: { en: 'Paid', vi: 'Đã thanh toán' },
    FAILED: { en: 'Failed', vi: 'Thất bại' },
    REFUNDED: { en: 'Refunded', vi: 'Đã hoàn tiền' }
  },
  // User Role Translations
  user: {
    ADMIN: { en: 'Administrator', vi: 'Quản trị viên' },
    CUSTOMER: { en: 'Customer', vi: 'Khách hàng' }
  }
};
```

### Email Translation Data Structure

The email translation data will support comprehensive email template localization:

```typescript
export const EMAIL_TRANSLATIONS = {
  // Order Confirmation Email
  orderConfirmation: {
    subject: { en: 'Order Confirmation', vi: 'Xác nhận đơn hàng' },
    greeting: { en: 'Hello', vi: 'Xin chào' },
    thankYou: { en: 'Thank you for your order!', vi: 'Cảm ơn bạn đã đặt hàng!' },
    orderReceived: { en: 'We have received your order', vi: 'Chúng tôi đã nhận được đơn hàng của bạn' },
    orderDetails: { en: 'Order Details', vi: 'Chi tiết đơn hàng' },
    orderNumber: { en: 'Order Number', vi: 'Mã đơn hàng' },
    orderDate: { en: 'Order Date', vi: 'Ngày đặt hàng' },
    items: { en: 'Items', vi: 'Sản phẩm' },
    quantity: { en: 'Quantity', vi: 'Số lượng' },
    price: { en: 'Price', vi: 'Giá' },
    total: { en: 'Total', vi: 'Tổng' },
    subtotal: { en: 'Subtotal', vi: 'Tạm tính' },
    shipping: { en: 'Shipping', vi: 'Phí vận chuyển' },
    tax: { en: 'Tax', vi: 'Thuế' },
    discount: { en: 'Discount', vi: 'Giảm giá' },
    grandTotal: { en: 'Grand Total', vi: 'Tổng cộng' },
    shippingAddress: { en: 'Shipping Address', vi: 'Địa chỉ giao hàng' },
    paymentMethod: { en: 'Payment Method', vi: 'Phương thức thanh toán' },
    contactUs: { en: 'Contact us if you have any questions.', vi: 'Liên hệ với chúng tôi nếu bạn có bất kỳ câu hỏi nào.' },
    trackOrder: { en: 'Track Order', vi: 'Theo dõi đơn hàng' }
  },

  // Admin Order Notification Email
  adminOrderNotification: {
    subject: { en: 'New Order', vi: 'Đơn hàng mới' },
    newOrder: { en: 'New Order Received', vi: 'Đơn hàng mới đã được đặt' },
    greeting: { en: 'Hello', vi: 'Xin chào' },
    orderDetails: { en: 'Order Details', vi: 'Chi tiết đơn hàng' },
    customerInformation: { en: 'Customer Information', vi: 'Thông tin khách hàng' },
    customerName: { en: 'Name', vi: 'Tên' },
    customerEmail: { en: 'Email', vi: 'Email' },
    customerPhone: { en: 'Phone', vi: 'Số điện thoại' },
    viewOrder: { en: 'View Order', vi: 'Xem đơn hàng' },
    processOrder: { en: 'Process Order', vi: 'Xử lý đơn hàng' }
  },

  // Order Status Update Email
  orderStatusUpdate: {
    subject: { en: 'Order Status Update', vi: 'Cập nhật trạng thái đơn hàng' },
    greeting: { en: 'Hello', vi: 'Xin chào' },
    statusUpdated: { en: 'Your order status has been updated', vi: 'Trạng thái đơn hàng của bạn đã được cập nhật' },
    newStatus: { en: 'New Status', vi: 'Trạng thái mới' },
    trackingNumber: { en: 'Tracking Number', vi: 'Mã theo dõi' },
    trackYourOrder: { en: 'Track Your Order', vi: 'Theo dõi đơn hàng của bạn' },
    contactUs: { en: 'Contact us if you have any questions.', vi: 'Liên hệ với chúng tôi nếu bạn có bất kỳ câu hỏi nào.' }
  },

  // Common Email Elements
  common: {
    signature: { en: 'Best regards,<br>AlaCraft Team', vi: 'Trân trọng,<br>Đội ngũ AlaCraft' },
    emailLabel: { en: 'Email from AlaCraft', vi: 'Email từ AlaCraft' },
    copyright: { en: '© 2024 AlaCraft. All rights reserved.', vi: '© 2024 AlaCraft. Tất cả quyền được bảo lưu.' },
    companyName: { en: 'AlaCraft', vi: 'AlaCraft' }
  }
} as const;
```

### Cache Key Generators

Cache key generators will be migrated from the backend with enhanced type safety:

```typescript
export const CACHE_KEYS = {
  CATEGORIES: {
    TREE: 'categories:tree',
    BY_SLUG: (slug: string) => `category:slug:${slug}`,
    BY_ID: (id: string) => `category:id:${id}`
  },
  PRODUCTS: {
    LIST: 'products:list',
    BY_ID: (id: string) => `product:id:${id}`,
    BY_SLUG: (slug: string) => `product:slug:${slug}`,
    FEATURED: 'products:featured',
    BY_CATEGORY: (categoryId: string) => `products:category:${categoryId}`
  },
  // ... other cache key patterns
} as const;
```

## Build Configuration

### Package.json Configuration

```json
{
  "name": "@alacraft/shared",
  "version": "1.0.0",
  "description": "Shared constants and translations for ALA Craft applications",
  "main": "dist/cjs/index.js",
  "module": "dist/esm/index.js",
  "types": "dist/types/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js",
      "types": "./dist/types/index.d.ts"
    }
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "npm run build:cjs && npm run build:esm && npm run build:types",
    "build:cjs": "tsc -p tsconfig.cjs.json",
    "build:esm": "tsc -p tsconfig.esm.json",
    "build:types": "tsc -p tsconfig.types.json",
    "dev": "tsc -w",
    "test": "jest",
    "lint": "eslint src/**/*.ts",
    "clean": "rimraf dist"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "eslint": "^8.0.0",
    "rimraf": "^5.0.0"
  }
}
```

### TypeScript Configuration

**Base tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "module": "ESNext",
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**CommonJS build (tsconfig.cjs.json):**
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "CommonJS",
    "outDir": "./dist/cjs"
  }
}
```

**ES Modules build (tsconfig.esm.json):**
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "ESNext",
    "outDir": "./dist/esm"
  }
}
```

## Integration Strategy

### Backend Integration

The backend will import the shared library and update all existing constant usage:

```typescript
// Before (backend/src/common/constants.ts)
import { STATUS } from '../common/constants';

// After
import { CONSTANTS } from '@alacraft/shared';
const { STATUS } = CONSTANTS;

// Email translation service updates
// Before (backend/src/notifications/services/email-translation.service.ts)
export class EmailTranslationService {
  getEmailTemplateTranslations(locale: SupportedLocale): Record<string, string> { ... }
}

// After
import {
  getEmailTemplateTranslations,
  getOrderConfirmationTranslations,
  getAdminOrderNotificationTranslations,
  translateOrderStatus,
  translatePaymentStatus
} from '@alacraft/shared';

// Replace entire service with shared library functions
const translations = getEmailTemplateTranslations(locale);
const orderStatus = translateOrderStatus(status, locale);
```

### Frontend Integration

The frontend will import shared constants and integrate with existing translation system:

```typescript
// Before (frontend/app/constants.ts)
export const ShopInfo = { name: "ALA Craft", desc: "..." }

// After
import { CONSTANTS } from '@alacraft/shared';
export const ShopInfo = {
  name: CONSTANTS.BUSINESS.COMPANY.NAME.EN,
  desc: "Handmade Accessories Shop"
};

// Status translations integration
import { translateOrderStatus } from '@alacraft/shared';

// In components
const statusText = translateOrderStatus(order.status, locale);
```

### Monorepo Workspace Configuration

Update root package.json to include the shared package:

```json
{
  "workspaces": [
    "frontend",
    "backend",
    "shared"
  ],
  "devDependencies": {
    "@alacraft/shared": "workspace:*"
  }
}
```

## Development Workflow

### Hot Reloading Setup

For development, the shared package will use TypeScript project references to enable hot reloading:

1. **Shared package in watch mode:** `npm run dev` in shared/ directory
2. **Frontend/Backend with references:** Both applications will reference the shared package source directly during development
3. **Production builds:** Use compiled dist/ output for production deployments

### Build Process

```bash
# Development
npm run dev          # Start all packages in watch mode
npm run dev:shared   # Start only shared package in watch mode

# Production
npm run build        # Build all packages
npm run build:shared # Build only shared package

# Testing
npm run test         # Run all tests
npm run test:shared  # Run shared package tests
```

## Migration Plan

### Phase 1: Package Setup
1. Create shared package structure
2. Set up build configuration and tooling
3. Implement core constants and translations
4. Add comprehensive tests

### Phase 2: Backend Migration
1. Install shared package in backend
2. Update all constant imports
3. Replace translation service with shared functions
4. Update all test files
5. Verify functionality with existing tests

### Phase 3: Frontend Migration
1. Install shared package in frontend
2. Update constant usage in components
3. Integrate status translations with existing i18n system
4. Update component tests
5. Verify UI displays correctly

### Phase 4: Cleanup and Optimization
1. Remove duplicate constant files
2. Remove duplicate translation code
3. Update documentation
4. Performance testing and optimization

## Error Handling

### Validation and Type Safety

```typescript
// Runtime validation for status values
export function isValidOrderStatus(status: string): status is OrderStatus {
  return Object.values(OrderStatus).includes(status as OrderStatus);
}

// Translation with fallback
export function translateOrderStatus(
  status: OrderStatus,
  locale: SupportedLocale = 'en'
): string {
  const translation = STATUS_TRANSLATIONS.order[status];
  if (!translation) {
    console.warn(`Missing translation for order status: ${status}`);
    return status; // Fallback to raw status
  }
  return translation[locale] || translation.en; // Fallback to English
}
```

### Backward Compatibility

```typescript
// Deprecated function with warning
/** @deprecated Use translateOrderStatus from @alacraft/shared instead */
export function legacyTranslateStatus(status: string): string {
  console.warn('legacyTranslateStatus is deprecated. Use translateOrderStatus instead.');
  return translateOrderStatus(status as OrderStatus);
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property-Based Testing Overview

Property-based testing validates software correctness by testing universal properties across many generated inputs. Each property is a formal specification that should hold for all valid inputs.

### Core Correctness Properties

**Property 1: Complete Constant Export**
*For any* expected constant type (status, business, system, cache), the shared library should export all required constants with correct values and types
**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.6**

**Property 2: Translation Function Correctness**
*For any* valid status value, email template key, or translation key with supported locale, translation functions should return the correct localized string that matches the expected translation data
**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

**Property 3: Validation Function Consistency**
*For any* input value, validation functions should correctly identify valid values as true and invalid values as false, with consistent behavior across all validation utilities
**Validates: Requirements 1.7**

**Property 4: Cache Key Uniqueness and Format**
*For any* set of different input parameters, cache key generators should produce unique, properly formatted cache keys that follow consistent naming patterns
**Validates: Requirements 1.4**

**Property 5: Translation Extensibility**
*For any* new status type or locale added to the translation system, existing translation functionality should continue to work without modification
**Validates: Requirements 2.6, 6.4, 6.5**

**Property 6: Module Format Compatibility**
*For any* supported module format (CommonJS, ES modules), the shared library should be importable and provide identical functionality
**Validates: Requirements 3.3, 3.5**

**Property 7: Backward Compatibility Preservation**
*For any* existing API usage pattern, adding new constants or translations should not break existing functionality or change existing behavior
**Validates: Requirements 2.7, 4.5, 6.1, 6.2**

**Property 8: Deprecation Warning Consistency**
*For any* deprecated function call, the system should provide appropriate warnings while maintaining functional compatibility
**Validates: Requirements 6.3**

**Property 9: Test Coverage Completeness**
*For any* exported function or constant, there should exist corresponding automated tests that verify its functionality
**Validates: Requirements 3.7**

## Testing Strategy

### Unit Tests

The shared library will have comprehensive unit tests covering:

**Constants Tests:**
- Verify all constants are properly exported
- Validate constant values match expected types
- Test cache key generators produce correct formats

**Translation Tests:**
- Verify all status translations exist for both locales
- Test translation functions with valid/invalid inputs
- Test fallback behavior for missing translations

**Validation Tests:**
- Test status validation functions
- Test MIME type validation
- Test URL and email validation utilities

### Integration Tests

**Backend Integration:**
- Verify backend can import and use all shared constants
- Test translation functions work with existing backend code
- Verify cache key generators work with Redis

**Frontend Integration:**
- Verify frontend can import and use shared constants
- Test status translations integrate with existing i18n system
- Verify components display translated status correctly

### Property-Based Testing Configuration

Each property test will run a minimum of 100 iterations to ensure comprehensive coverage through randomization. Property tests will be tagged with references to their corresponding design properties:

- **Feature: shared-constants-translations, Property 1**: Complete Constant Export
- **Feature: shared-constants-translations, Property 2**: Translation Function Correctness
- **Feature: shared-constants-translations, Property 3**: Validation Function Consistency
- **Feature: shared-constants-translations, Property 4**: Cache Key Uniqueness and Format
- **Feature: shared-constants-translations, Property 5**: Translation Extensibility
- **Feature: shared-constants-translations, Property 6**: Module Format Compatibility
- **Feature: shared-constants-translations, Property 7**: Backward Compatibility Preservation
- **Feature: shared-constants-translations, Property 8**: Deprecation Warning Consistency
- **Feature: shared-constants-translations, Property 9**: Test Coverage Completeness

### Test Configuration

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:property": "jest --testNamePattern='Property'"
  },
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "collectCoverageFrom": [
      "src/**/*.ts",
      "!src/**/*.d.ts"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 90,
        "functions": 90,
        "lines": 90,
        "statements": 90
      }
    }
  }
}
```

The testing strategy ensures both individual component correctness through unit tests and system-wide correctness through property-based testing, providing confidence that the shared library maintains consistency across both frontend and backend applications.