# Design Document

## Overview

This feature adds comprehensive shipping method management to the admin panel, replacing the current hardcoded shipping logic with a database-driven, configurable system. Administrators will be able to create, edit, and manage shipping methods with flexible pricing rules including base rates, weight-based charges, regional variations, and free shipping thresholds.

The design follows the existing admin management patterns established in the codebase (categories, products, content) and integrates with the current shipping calculation service used during checkout.

## Architecture

### System Components

1. **Database Layer** (Prisma Schema)
   - New `ShippingMethod` model to store shipping configurations
   - Migration to create the shipping_methods table

2. **Backend API** (NestJS)
   - `ShippingMethodsService`: CRUD operations and business logic
   - `ShippingMethodsController`: Admin-only REST endpoints
   - Updated `ShippingService`: Modified to use database shipping methods instead of hardcoded logic

3. **Frontend Admin UI** (Next.js/React)
   - Shipping methods list page with create/edit/delete actions
   - Shipping method form component with validation
   - Integration with existing admin layout and navigation

4. **Frontend Checkout Integration**
   - Updated shipping calculator to fetch methods from API
   - Display active shipping methods with calculated costs

### Data Flow

```
Admin creates/updates shipping method
  ↓
ShippingMethodsController validates and saves to database
  ↓
Cache invalidation (if caching is implemented)
  ↓
Customer reaches checkout
  ↓
ShippingService fetches active methods from database
  ↓
Applies pricing rules (base + weight + regional + free shipping)
  ↓
Returns calculated shipping options to customer
```

## Components and Interfaces

### Database Schema

```prisma
model ShippingMethod {
  id                    String   @id @default(uuid())
  methodId              String   @unique  // e.g., "standard", "express"
  nameEn                String
  nameVi                String
  descriptionEn         String
  descriptionVi         String
  carrier               String?
  baseRate              Decimal  @db.Decimal(10, 2)
  estimatedDaysMin      Int
  estimatedDaysMax      Int
  weightThreshold       Decimal? @db.Decimal(10, 2)  // kg
  weightRate            Decimal? @db.Decimal(10, 2)  // cost per kg over threshold
  freeShippingThreshold Decimal? @db.Decimal(10, 2)  // minimum order value
  regionalPricing       Json?    // { "vietnam": 5.00, "usa": 30.00, "asia": 15.00 }
  isActive              Boolean  @default(true)
  displayOrder          Int      @default(0)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([isActive, displayOrder])
  @@index([methodId])
  @@map("shipping_methods")
}
```

### Backend DTOs

```typescript
// create-shipping-method.dto.ts
export class CreateShippingMethodDto {
  methodId: string;
  nameEn: string;
  nameVi: string;
  descriptionEn: string;
  descriptionVi: string;
  carrier?: string;
  baseRate: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  weightThreshold?: number;
  weightRate?: number;
  freeShippingThreshold?: number;
  regionalPricing?: Record<string, number>;
  isActive?: boolean;
  displayOrder?: number;
}

// update-shipping-method.dto.ts
export class UpdateShippingMethodDto {
  nameEn?: string;
  nameVi?: string;
  descriptionEn?: string;
  descriptionVi?: string;
  carrier?: string;
  baseRate?: number;
  estimatedDaysMin?: number;
  estimatedDaysMax?: number;
  weightThreshold?: number;
  weightRate?: number;
  freeShippingThreshold?: number;
  regionalPricing?: Record<string, number>;
  isActive?: boolean;
  displayOrder?: number;
}
```

### Backend Service Interface

```typescript
export class ShippingMethodsService {
  // CRUD operations
  create(dto: CreateShippingMethodDto): Promise<ShippingMethod>;
  findAll(): Promise<ShippingMethod[]>;
  findAllActive(): Promise<ShippingMethod[]>;
  findOne(id: string): Promise<ShippingMethod>;
  findByMethodId(methodId: string): Promise<ShippingMethod>;
  update(id: string, dto: UpdateShippingMethodDto): Promise<ShippingMethod>;
  remove(id: string): Promise<ShippingMethod>;

  // Validation helpers
  validateMethodIdUnique(methodId: string, excludeId?: string): Promise<boolean>;
  canDelete(id: string): Promise<boolean>;
}
```

### Updated ShippingService Interface

```typescript
export class ShippingService {
  // Modified to use database shipping methods
  async calculateShipping(dto: CalculateShippingDto): Promise<ShippingRate[]> {
    // 1. Fetch active shipping methods from database
    // 2. For each method, calculate cost based on:
    //    - Base rate (or regional rate if applicable)
    //    - Weight-based charges
    //    - Free shipping threshold
    // 3. Return sorted by displayOrder
  }

  // Helper methods
  private calculateMethodCost(
    method: ShippingMethod,
    weight: number,
    orderValue: number,
    country: string
  ): number;

  private getRegionalRate(
    method: ShippingMethod,
    country: string
  ): number;

  private applyWeightCharges(
    baseRate: number,
    method: ShippingMethod,
    weight: number
  ): number;

  private applyFreeShipping(
    cost: number,
    method: ShippingMethod,
    orderValue: number
  ): number;
}
```

### Frontend API Client

```typescript
// lib/shipping-method-api.ts
export interface ShippingMethod {
  id: string;
  methodId: string;
  nameEn: string;
  nameVi: string;
  descriptionEn: string;
  descriptionVi: string;
  carrier?: string;
  baseRate: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  weightThreshold?: number;
  weightRate?: number;
  freeShippingThreshold?: number;
  regionalPricing?: Record<string, number>;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export const shippingMethodApi = {
  getAll: () => Promise<ShippingMethod[]>;
  getActive: () => Promise<ShippingMethod[]>;
  getOne: (id: string) => Promise<ShippingMethod>;
  create: (data: CreateShippingMethodDto) => Promise<ShippingMethod>;
  update: (id: string, data: UpdateShippingMethodDto) => Promise<ShippingMethod>;
  delete: (id: string) => Promise<void>;
};
```

### Frontend Components

```typescript
// ShippingMethodForm component structure
interface ShippingMethodFormProps {
  initialData?: ShippingMethod;
  onSubmit: (data: CreateShippingMethodDto | UpdateShippingMethodDto) => Promise<void>;
  onCancel: () => void;
}

// Component hierarchy
ShippingMethodForm/
├── ShippingMethodForm.tsx       // Main form component
├── index.tsx                     // Export entry point
├── types.ts                      // TypeScript interfaces
├── components/
│   ├── BasicInfoSection.tsx     // Name, description, carrier
│   ├── PricingSection.tsx       // Base rate, weight pricing
│   ├── RegionalPricingSection.tsx  // Country/region rates
│   └── SettingsSection.tsx      // Active status, display order
└── hooks/
    ├── useShippingMethodForm.ts // Form state and validation
    └── useRegionalPricing.ts    // Regional pricing management
```

## Data Models

### ShippingMethod Entity

```typescript
interface ShippingMethod {
  id: string;
  methodId: string;              // Unique identifier (e.g., "standard", "express")
  nameEn: string;                // Display name in English
  nameVi: string;                // Display name in Vietnamese
  descriptionEn: string;         // Description in English
  descriptionVi: string;         // Description in Vietnamese
  carrier: string | null;        // Carrier name (e.g., "Vietnam Post", "DHL")
  baseRate: number;              // Base shipping cost
  estimatedDaysMin: number;      // Minimum delivery days
  estimatedDaysMax: number;      // Maximum delivery days
  weightThreshold: number | null; // Weight threshold in kg
  weightRate: number | null;     // Additional cost per kg over threshold
  freeShippingThreshold: number | null; // Order value for free shipping
  regionalPricing: Record<string, number> | null; // Country/region specific rates
  isActive: boolean;             // Whether method is available to customers
  displayOrder: number;          // Sort order for display
  createdAt: Date;
  updatedAt: Date;
}
```

### Regional Pricing Structure

```typescript
interface RegionalPricing {
  [countryOrRegion: string]: number;
}

// Example:
{
  "vietnam": 5.00,
  "usa": 30.00,
  "uk": 25.00,
  "asia": 15.00,      // Regional fallback
  "europe": 25.00,    // Regional fallback
  "default": 20.00    // Global fallback
}
```

### Shipping Rate Calculation Result

```typescript
interface ShippingRate {
  methodId: string;
  name: string;
  description: string;
  cost: number;
  originalCost?: number;  // Before free shipping applied
  estimatedDays: string;
  carrier?: string;
  isFreeShipping: boolean;
}
```

##
Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

After analyzing the acceptance criteria, several properties are redundant and can be consolidated. The following properties provide comprehensive coverage:

**Property 1: Shipping method display contains required fields**
*For any* shipping method rendered in the admin list, the display should include method name, description, base cost, carrier, estimated delivery time, and active status.
**Validates: Requirements 1.2**

**Property 2: Shipping methods are sorted by display order then creation date**
*For any* collection of shipping methods, when displayed to administrators or customers, they should be ordered by displayOrder ascending, with creationDate as the secondary sort for methods with equal displayOrder.
**Validates: Requirements 1.4**

**Property 3: Required fields are validated on creation**
*For any* shipping method creation attempt with missing required fields (nameEn, nameVi, descriptionEn, descriptionVi, baseRate, estimatedDaysMin, estimatedDaysMax), the system should reject the creation and return a validation error.
**Validates: Requirements 2.2**

**Property 4: Optional fields can be omitted**
*For any* shipping method creation with all required fields but no optional fields (carrier, weightThreshold, weightRate, freeShippingThreshold, regionalPricing), the creation should succeed.
**Validates: Requirements 2.3**

**Property 5: Created shipping methods are persisted**
*For any* valid shipping method data, after successful creation, querying the database by the returned ID should retrieve an equivalent shipping method.
**Validates: Requirements 2.4**

**Property 6: Method identifier uniqueness is enforced**
*For any* existing shipping method with methodId M, attempting to create another shipping method with the same methodId M should be rejected with a uniqueness error.
**Validates: Requirements 2.5**

**Property 7: Method identifier is immutable**
*For any* shipping method, attempting to update its methodId field should be rejected, while updates to all other fields should succeed.
**Validates: Requirements 3.2**

**Property 8: Updates are persisted**
*For any* shipping method and any valid update data, after successful update, querying the database should return the shipping method with the updated values.
**Validates: Requirements 3.3**

**Property 9: Weight-based pricing is calculated correctly**
*For any* shipping method with weightThreshold T and weightRate R, and any package weight W where W > T, the calculated cost should equal baseRate + ((W - T) * R).
**Validates: Requirements 4.2**

**Property 10: Regional pricing lookup is correct**
*For any* shipping method with regionalPricing configuration and any destination country, the system should return the country-specific rate if it exists, otherwise the region rate if it exists, otherwise the base rate.
**Validates: Requirements 5.2**

**Property 11: Regional pricing precedence is enforced**
*For any* shipping method with overlapping regional rates (e.g., both "asia" and "vietnam" defined), when calculating for a country that matches both, the country-specific rate should be used over the regional rate.
**Validates: Requirements 5.4**

**Property 12: Free shipping threshold is applied correctly**
*For any* shipping method with freeShippingThreshold T and any order value V, if V >= T then the shipping cost should be 0, otherwise the cost should be calculated normally.
**Validates: Requirements 6.2**

**Property 13: Free shipping indication is added to description**
*For any* shipping method where free shipping is applied (order value >= threshold), the returned description should contain an indicator such as "(FREE)" or "Free Shipping".
**Validates: Requirements 6.4**

**Property 14: Active status toggle is persisted**
*For any* shipping method, toggling its isActive status should persist the change, and querying the method should return the new status.
**Validates: Requirements 7.1**

**Property 15: Inactive methods are excluded from customer calculations**
*For any* collection of shipping methods including both active and inactive methods, when calculating shipping options for customers, only methods where isActive=true should be returned.
**Validates: Requirements 7.2**

**Property 16: Deactivation preserves configuration data**
*For any* shipping method, deactivating it (setting isActive=false) should not modify any other fields, and all configuration data should remain unchanged.
**Validates: Requirements 7.4**

**Property 17: Deletion removes method from database**
*For any* shipping method with no order references, after successful deletion, querying the database by that ID should return not found.
**Validates: Requirements 8.2**

**Property 18: Methods with order references cannot be deleted**
*For any* shipping method that is referenced by at least one order, attempting to delete it should be rejected with a referential integrity error.
**Validates: Requirements 8.3**

**Property 19: Checkout returns all active methods with calculated costs**
*For any* cart contents and destination address, the shipping calculation should return all active shipping methods, each with a cost calculated according to all applicable pricing rules.
**Validates: Requirements 10.1**

**Property 20: Comprehensive pricing calculation**
*For any* shipping method and order context (weight, destination, order value), the calculated cost should correctly apply base rate (or regional rate), weight-based charges, and free shipping threshold in combination.
**Validates: Requirements 10.2**

**Property 21: Shipping rate structure is complete**
*For any* calculated shipping rate, it should contain methodId, name, description, cost, estimatedDays, and optionally carrier and isFreeShipping flag.
**Validates: Requirements 10.3**

## Error Handling

### Validation Errors

1. **Missing Required Fields**
   - Return 400 Bad Request with field-specific error messages
   - Frontend displays validation errors inline on form fields

2. **Duplicate Method Identifier**
   - Return 409 Conflict with message indicating methodId already exists
   - Frontend displays error message and suggests using a different identifier

3. **Invalid Data Types**
   - Return 400 Bad Request for type mismatches (e.g., negative baseRate)
   - Frontend validates types before submission

### Business Logic Errors

1. **Method Not Found**
   - Return 404 Not Found when querying non-existent shipping method
   - Frontend displays "Method not found" message

2. **Cannot Delete Referenced Method**
   - Return 409 Conflict with message indicating method is in use by orders
   - Frontend displays error with count of orders using the method

3. **Cannot Modify Method Identifier**
   - Return 400 Bad Request when attempting to change methodId
   - Frontend prevents methodId field from being editable in edit mode

### System Errors

1. **Database Connection Failures**
   - Return 503 Service Unavailable
   - Frontend displays generic error message and retry option

2. **Concurrent Modification**
   - Use optimistic locking with updatedAt timestamp
   - Return 409 Conflict if version mismatch detected
   - Frontend prompts user to refresh and retry

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

1. **Service Layer Tests**
   - Creating shipping method with all required fields
   - Creating shipping method with optional fields
   - Updating shipping method fields
   - Deleting shipping method without order references
   - Attempting to delete method with order references (should fail)
   - Toggling active status
   - Empty state (no shipping methods)
   - Single method with no pricing rules
   - Method with only weight-based pricing
   - Method with only regional pricing
   - Method with only free shipping threshold

2. **Controller Tests**
   - Authentication and authorization (admin-only endpoints)
   - Request validation
   - Response formatting

3. **Calculation Tests**
   - Base rate only calculation
   - Weight-based pricing with package under threshold
   - Weight-based pricing with package over threshold
   - Regional pricing lookup for specific country
   - Regional pricing fallback to region
   - Regional pricing fallback to base rate
   - Free shipping applied when threshold met
   - Free shipping not applied when below threshold
   - Combined pricing rules (all factors together)

### Property-Based Testing

Property-based tests will verify universal properties across many randomly generated inputs using a PBT library (fast-check for TypeScript/JavaScript):

1. **Data Integrity Properties**
   - Property 5: Created shipping methods are persisted
   - Property 8: Updates are persisted
   - Property 14: Active status toggle is persisted
   - Property 16: Deactivation preserves configuration data
   - Property 17: Deletion removes method from database

2. **Validation Properties**
   - Property 3: Required fields are validated on creation
   - Property 4: Optional fields can be omitted
   - Property 6: Method identifier uniqueness is enforced
   - Property 7: Method identifier is immutable

3. **Calculation Properties**
   - Property 9: Weight-based pricing is calculated correctly
   - Property 10: Regional pricing lookup is correct
   - Property 11: Regional pricing precedence is enforced
   - Property 12: Free shipping threshold is applied correctly
   - Property 20: Comprehensive pricing calculation

4. **Display and Filtering Properties**
   - Property 1: Shipping method display contains required fields
   - Property 2: Shipping methods are sorted by display order then creation date
   - Property 13: Free shipping indication is added to description
   - Property 15: Inactive methods are excluded from customer calculations
   - Property 21: Shipping rate structure is complete

5. **Business Logic Properties**
   - Property 18: Methods with order references cannot be deleted
   - Property 19: Checkout returns all active methods with calculated costs

**Configuration**: Each property-based test should run a minimum of 100 iterations to ensure thorough coverage of the input space.

**Tagging**: Each property-based test must include a comment tag in the format:
```typescript
// Feature: admin-shipping-management, Property X: [property description]
// Validates: Requirements Y.Z
```

### Integration Testing

Integration tests will verify end-to-end workflows:

1. **Admin Workflow**
   - Create shipping method → Verify in list → Edit → Verify changes → Delete
   - Create method with regional pricing → Verify calculation uses regional rates
   - Deactivate method → Verify not shown to customers → Reactivate → Verify shown again

2. **Customer Checkout Workflow**
   - Add items to cart → Proceed to checkout → Verify shipping methods displayed
   - Change destination country → Verify shipping costs recalculated
   - Reach free shipping threshold → Verify shipping becomes free

3. **Data Migration**
   - Seed database with hardcoded methods → Verify they work in new system
   - Create orders with old methods → Verify they display correctly

## Implementation Notes

### Migration Strategy

1. **Create Database Table**
   - Run Prisma migration to create shipping_methods table
   - Seed with current hardcoded methods (standard, express, overnight, international_standard, international_express)

2. **Update Backend Service**
   - Modify ShippingService.calculateShipping() to fetch from database
   - Keep calculation logic but make it data-driven
   - Add caching layer for active shipping methods (30-minute TTL)

3. **Add Admin Endpoints**
   - Implement ShippingMethodsService and Controller
   - Add admin-only routes for CRUD operations

4. **Build Frontend UI**
   - Create admin shipping management page
   - Build shipping method form component
   - Add to admin navigation menu

5. **Update Checkout**
   - Ensure checkout uses updated ShippingService
   - Test with various cart configurations

### Caching Strategy

- Cache active shipping methods for 30 minutes
- Invalidate cache on any create/update/delete operation
- Cache key: `shipping:methods:active`
- Use Redis if available, fallback to in-memory cache

### Backward Compatibility

- Existing orders reference shipping methods by string (e.g., "standard")
- New system uses methodId field to maintain compatibility
- Order display should show method name from order data, not lookup from shipping_methods table
- This prevents display issues if a method is deleted or renamed

### Performance Considerations

- Index on `isActive` and `displayOrder` for fast filtering and sorting
- Index on `methodId` for quick lookups
- Limit regional pricing to reasonable size (< 50 countries/regions)
- Consider pagination for admin list if > 50 methods (unlikely but good practice)

### Security Considerations

- All admin endpoints require ADMIN role
- Validate all numeric inputs are non-negative
- Sanitize string inputs to prevent XSS
- Rate limit admin endpoints to prevent abuse
- Audit log for create/update/delete operations (future enhancement)
