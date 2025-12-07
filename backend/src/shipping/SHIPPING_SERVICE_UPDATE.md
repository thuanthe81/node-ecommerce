# Shipping Service Update - Database-Driven Implementation

## Overview

The `ShippingService` has been updated to use database-driven shipping methods instead of hardcoded logic. This change enables administrators to dynamically configure shipping methods through the admin panel.

## Changes Made

### 1. Service Dependencies

- Added `ShippingMethodsService` as a dependency to fetch shipping methods from the database
- Updated imports to include `ShippingMethod` from Prisma client

### 2. Updated `calculateShipping()` Method

**Before:** Hardcoded shipping methods with fixed pricing logic for domestic and international shipping.

**After:**
- Fetches active shipping methods from the database using `shippingMethodsService.findAllActive()`
- Dynamically calculates costs for each method based on configured pricing rules
- Returns shipping rates with all applicable pricing rules applied

### 3. New Helper Methods

#### `calculateMethodCost()`
Calculates the total cost for a specific shipping method by applying:
1. Base rate or regional rate
2. Weight-based charges
3. Free shipping threshold

#### `getRegionalRate()`
Determines the appropriate rate based on destination country:
- Checks for country-specific rates (highest precedence)
- Falls back to region-specific rates (asia, europe, north_america, etc.)
- Falls back to base rate if no regional pricing configured

Supported regions:
- Asia: china, japan, korea, thailand, singapore, malaysia, indonesia, philippines, india
- Europe: uk, france, germany, italy, spain, netherlands, belgium, switzerland, austria
- North America: usa, canada, mexico
- South America: brazil, argentina, chile, colombia, peru
- Africa: south africa, egypt, nigeria, kenya, morocco, algeria
- Oceania: australia, new zealand, fiji

#### `applyWeightCharges()`
Adds weight-based charges when package weight exceeds the configured threshold:
- If weight ≤ threshold: no additional charges
- If weight > threshold: adds `(weight - threshold) × weightRate` to base cost

#### `applyFreeShipping()`
Applies free shipping when order value meets or exceeds the threshold:
- Returns cost of 0 with `isFreeShipping: true`
- Preserves original cost in `originalCost` field for display purposes

### 4. Updated `getShippingMethodDetails()` Method

**Before:** Returned hardcoded method details from a static map.

**After:**
- Fetches method details from database using `shippingMethodsService.findByMethodId()`
- Falls back to default values for backward compatibility if method not found

### 5. Enhanced `ShippingRate` Interface

Added new optional fields:
- `isFreeShipping?: boolean` - Indicates if free shipping was applied
- `originalCost?: number` - Original cost before free shipping (for display)

## Backward Compatibility

- The method signature of `calculateShipping()` remains unchanged
- The `ShippingRate` interface is backward compatible (new fields are optional)
- Existing code using the service will continue to work without modifications
- The `getShippingMethodDetails()` method now returns a Promise (async) but maintains the same return structure

## Requirements Validated

This implementation addresses the following requirements:
- **4.2**: Weight-based pricing calculation
- **5.2**: Regional pricing lookup
- **5.4**: Regional pricing precedence (country > region > base)
- **6.2**: Free shipping threshold application
- **10.1**: Fetch active methods from database
- **10.2**: Apply all pricing rules in combination

## Testing

A test script has been created at `backend/scripts/test-shipping-calculation.ts` to verify:
1. Domestic shipping calculation
2. International shipping calculation
3. Weight-based pricing
4. Free shipping threshold
5. Regional pricing

Run the test with:
```bash
npx ts-node -r tsconfig-paths/register scripts/test-shipping-calculation.ts
```

## Migration Notes

1. Ensure the `shipping_methods` table is populated with active methods before using the updated service
2. The seed data should include the previously hardcoded methods (standard, express, overnight, international_standard, international_express)
3. Existing orders will continue to reference shipping methods by their `methodId` string
