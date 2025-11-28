# Requirements Document

## Introduction

This feature enables the e-commerce system to support products with a price of zero, which indicates that customers should contact the shop to inquire about pricing. This is useful for custom items, made-to-order products, or items with variable pricing based on specifications.

## Glossary

- **Product**: An item available for sale in the e-commerce system
- **Price Field**: The numeric field storing the product's price value
- **Contact for Price**: A product pricing model where the price is not displayed and customers must contact the shop
- **Product Form**: The administrative interface for creating and editing products
- **Product Display**: The customer-facing interface showing product information
- **Cart System**: The shopping cart functionality that manages items for purchase
- **Checkout Flow**: The process of completing a purchase

## Requirements

### Requirement 1

**User Story:** As a shop administrator, I want to create products with a price of zero, so that I can list items that require price inquiries.

#### Acceptance Criteria

1. WHEN an administrator creates a product with price set to zero THEN the system SHALL accept and save the product
2. WHEN an administrator edits a product and sets the price to zero THEN the system SHALL update the product without validation errors
3. WHEN the price field is zero THEN the system SHALL store the value as 0 in the database
4. WHEN an administrator views a product with zero price in the admin panel THEN the system SHALL display the price as 0

### Requirement 2

**User Story:** As a customer, I want to see clear messaging when a product requires price inquiry, so that I understand I need to contact the shop.

#### Acceptance Criteria

1. WHEN a customer views a product with zero price THEN the system SHALL display "Contact for Price" instead of a numeric price
2. WHEN a customer views a product listing with zero price items THEN the system SHALL show "Contact for Price" on the product card
3. WHEN a product has zero price THEN the system SHALL display contact information or a contact link
4. WHEN a customer views product details with zero price THEN the system SHALL provide clear instructions for obtaining pricing information

### Requirement 3

**User Story:** As a customer, I want to add contact-for-price items to my cart and place orders, so that the shop can provide me with a custom quote.

#### Acceptance Criteria

1. WHEN a customer adds a zero-price product to cart THEN the system SHALL accept the addition and display the item with "Price TBD" or similar indicator
2. WHEN a customer views their cart with zero-price products THEN the system SHALL display a message indicating that final pricing will be provided by the shop
3. WHEN a customer proceeds to checkout with zero-price products THEN the system SHALL allow order creation with zero total
4. WHEN an order contains zero-price products THEN the system SHALL set the order status to require admin pricing review

### Requirement 4

**User Story:** As a shop administrator, I want to set prices for zero-price products in orders, so that I can provide custom quotes to customers.

#### Acceptance Criteria

1. WHEN viewing an order with zero-price products THEN the system SHALL display an interface for setting prices for each zero-price item
2. WHEN an administrator sets a price for a zero-price product in an order THEN the system SHALL update the order item price without modifying the product's base price
3. WHEN all zero-price products in an order have prices set THEN the system SHALL calculate and display the order total
4. WHEN an order has unpriced zero-price products THEN the system SHALL prevent order fulfillment until all prices are set
5. WHEN an administrator updates a price for an order item THEN the system SHALL recalculate the order total immediately

### Requirement 5

**User Story:** As a developer, I want the system to handle zero-price products consistently across all components, so that the feature works reliably throughout the application.

#### Acceptance Criteria

1. WHEN the cart system processes items with zero price THEN the system SHALL accept them and display appropriate pricing indicators
2. WHEN product filtering or sorting by price occurs THEN the system SHALL handle zero-price products appropriately
3. WHEN calculating order totals THEN the system SHALL use admin-set prices for zero-price products if available, otherwise treat them as zero

### Requirement 6

**User Story:** As a shop administrator, I want to distinguish between zero-price products and regular products in the admin panel, so that I can easily identify items requiring custom pricing.

#### Acceptance Criteria

1. WHEN viewing product lists in the admin panel THEN the system SHALL visually indicate zero-price products
2. WHEN viewing orders in the admin panel THEN the system SHALL highlight orders containing zero-price products that need pricing
3. WHEN filtering orders in admin THEN the system SHALL provide an option to filter by orders requiring price quotes
