# Requirements Document

## Introduction

The e-commerce platform currently displays products with zero stock quantity as "Out of Stock". This feature will replace the "Out of Stock" terminology with "Pre-Order" to better reflect the business model where customers can order products that are temporarily unavailable, with the understanding that these items will be fulfilled when stock becomes available.

## Glossary

- **Product Catalog System**: The system component responsible for displaying product information to customers
- **Inventory Management System**: The system component that tracks product stock quantities
- **Admin Interface**: The administrative interface used by store administrators to manage products
- **SEO System**: The system component that generates search engine optimization metadata
- **Translation System**: The system that provides multi-language support (English and Vietnamese)

## Requirements

### Requirement 1

**User Story:** As a customer, I want to see "Pre-Order" instead of "Out of Stock" for unavailable products, so that I understand I can still order these items for future fulfillment.

#### Acceptance Criteria

1. WHEN a product has zero stock quantity, THE Product Catalog System SHALL display "Pre-Order" text instead of "Out of Stock"
2. WHEN displaying product availability in Vietnamese, THE Product Catalog System SHALL display "Đặt trước" instead of "Hết hàng"
3. WHEN a product has zero stock quantity, THE Product Catalog System SHALL maintain the visual styling and prominence of the availability indicator
4. WHEN generating SEO metadata for products with zero stock, THE SEO System SHALL use "PreOrder" schema.org availability status instead of "OutOfStock"
5. WHEN a product has zero stock quantity, THE Product Catalog System SHALL display the product image without any dark overlay or opacity reduction
6. WHEN a product has zero stock quantity, THE Product Catalog System SHALL position the "Pre-Order" label at the bottom right corner of the product image

### Requirement 2

**User Story:** As a store administrator, I want the admin interface to use "Pre-Order" terminology, so that the interface is consistent with customer-facing terminology.

#### Acceptance Criteria

1. WHEN filtering products by stock status in the admin interface, THE Admin Interface SHALL display "Pre-Order" option instead of "Out of Stock"
2. WHEN viewing product forms in the admin interface, THE Admin Interface SHALL display "Pre-Order" status for products with zero stock
3. WHEN filtering products by stock status in Vietnamese, THE Admin Interface SHALL display "Đặt trước" instead of "Hết hàng"

### Requirement 3

**User Story:** As a developer, I want all translation keys and code references updated consistently, so that the codebase is maintainable and consistent.

#### Acceptance Criteria

1. THE Translation System SHALL update all translation keys from "outOfStock" to "preOrder" while maintaining backward compatibility
2. THE Translation System SHALL update all translation keys from "inStock" to remain as "inStock" for available products
3. WHEN code references stock availability status, THE system SHALL use "pre-order" terminology in type definitions and interfaces
4. THE system SHALL update all test descriptions and assertions to reflect "pre-order" terminology

### Requirement 4

**User Story:** As a customer, I want the low stock warning to remain unchanged, so that I can still see when products have limited availability.

#### Acceptance Criteria

1. WHEN a product has low stock (greater than zero but below threshold), THE Product Catalog System SHALL continue to display the low stock warning unchanged
2. THE system SHALL NOT modify the "In Stock" terminology for products with available inventory
