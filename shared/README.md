# @alacraft/shared

Shared constants and translations library for ALA Craft applications.

## Overview

This package provides centralized constants and translations used by both the frontend and backend applications, eliminating duplication and ensuring consistency across the entire system.

## Features

- **Status Constants**: Order status, payment status, and user role enums
- **Business Constants**: Company information, contact details, and social media URLs
- **System Constants**: MIME types, API configuration, and email settings
- **Cache Keys**: Centralized cache key generators and patterns
- **Translations**: Localized text for status values and email templates (EN/VI)
- **Utilities**: Validation functions and translation helpers

## Installation

```bash
npm install @alacraft/shared
```

## Usage

### Constants

```typescript
import { CONSTANTS } from '@alacraft/shared';

// Status constants
const orderStatus = CONSTANTS.STATUS.ORDER_STATUS.PENDING;
const paymentStatus = CONSTANTS.STATUS.PAYMENT_STATUS.PAID;

// Business constants
const companyName = CONSTANTS.BUSINESS.COMPANY.NAME.EN;
const contactEmail = CONSTANTS.BUSINESS.CONTACT.EMAIL.PRIMARY;

// System constants
const mimeTypes = CONSTANTS.SYSTEM.MIME_TYPES;
const apiConfig = CONSTANTS.SYSTEM.API;

// Cache keys
const productCacheKey = CONSTANTS.CACHE_KEYS.PRODUCTS.BY_ID('123');
```

### Translations

```typescript
import {
  translateOrderStatus,
  translatePaymentStatus,
  getEmailTemplateTranslations
} from '@alacraft/shared';

// Status translations
const orderStatusText = translateOrderStatus('PENDING', 'vi'); // "Chờ xử lý"
const paymentStatusText = translatePaymentStatus('PAID', 'en'); // "Paid"

// Email translations
const emailTranslations = getEmailTemplateTranslations('vi');
```

### Validation

```typescript
import { isValidOrderStatus, isValidPaymentStatus } from '@alacraft/shared';

const isValid = isValidOrderStatus('PENDING'); // true
const isInvalid = isValidPaymentStatus('INVALID'); // false
```

## Development

### Building

```bash
npm run build          # Build all formats (CommonJS, ESM, types)
npm run build:cjs      # Build CommonJS only
npm run build:esm      # Build ES modules only
npm run build:types    # Build type definitions only
```

### Testing

```bash
npm test               # Run all tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage
npm run test:property  # Run property-based tests only
```

### Development Mode

```bash
npm run dev            # Start TypeScript compiler in watch mode
```

## Package Structure

```
shared/
├── src/
│   ├── constants/     # Status, business, system, and cache constants
│   ├── translations/  # Status and email translations
│   ├── utils/         # Validation and helper utilities
│   └── index.ts       # Main export file
├── tests/             # Test files
├── dist/              # Built output (CommonJS, ESM, types)
└── package.json
```

## Requirements

- Node.js >= 18
- TypeScript >= 5.0

## License

Private - ALA Craft Internal Use Only