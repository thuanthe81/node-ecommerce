# Requirements Document

## Introduction

This feature enables administrators to manage shipping methods and pricing through the admin panel. Currently, shipping methods are hardcoded in the backend service with fixed pricing logic. This feature will allow admins to create, edit, and configure shipping methods dynamically, including setting base rates, weight-based pricing, regional variations, and free shipping thresholds.

## Glossary

- **Shipping Method**: A delivery option offered to customers (e.g., Standard Shipping, Express Shipping) with associated pricing and delivery timeframes
- **Admin Panel**: The administrative interface accessible only to users with ADMIN role
- **Base Rate**: The starting cost for a shipping method before additional charges
- **Weight-Based Pricing**: Additional charges calculated based on package weight
- **Regional Pricing**: Different shipping costs based on destination country or region
- **Free Shipping Threshold**: A minimum order value above which shipping becomes free for specific methods
- **Shipping Calculator**: The backend service that determines available shipping options and costs for an order
- **Carrier**: The shipping company or service provider (e.g., Vietnam Post, DHL, FedEx)

## Requirements

### Requirement 1

**User Story:** As an administrator, I want to view all configured shipping methods, so that I can understand what shipping options are available to customers.

#### Acceptance Criteria

1. WHEN an administrator navigates to the shipping management page THEN the system SHALL display a list of all shipping methods
2. WHEN displaying shipping methods THEN the system SHALL show method name, description, base cost, carrier, estimated delivery time, and active status
3. WHEN no shipping methods exist THEN the system SHALL display an empty state with a prompt to create the first method
4. WHEN viewing the shipping methods list THEN the system SHALL order methods by display order and then by creation date

### Requirement 2

**User Story:** As an administrator, I want to create new shipping methods, so that I can offer different delivery options to customers.

#### Acceptance Criteria

1. WHEN an administrator clicks the create shipping method button THEN the system SHALL display a form with all required fields
2. WHEN creating a shipping method THEN the system SHALL require method name (English and Vietnamese), description (English and Vietnamese), base cost, and estimated delivery days
3. WHEN creating a shipping method THEN the system SHALL allow optional fields for carrier name, weight-based pricing rules, and regional pricing
4. WHEN a shipping method is successfully created THEN the system SHALL save it to the database and display a success message
5. WHEN creating a shipping method with a duplicate method identifier THEN the system SHALL prevent creation and display an error message

### Requirement 3

**User Story:** As an administrator, I want to edit existing shipping methods, so that I can update pricing and delivery information as business needs change.

#### Acceptance Criteria

1. WHEN an administrator clicks edit on a shipping method THEN the system SHALL display a form pre-populated with current values
2. WHEN editing a shipping method THEN the system SHALL allow modification of all fields except the method identifier
3. WHEN a shipping method is successfully updated THEN the system SHALL save changes to the database and display a success message
4. WHEN editing a shipping method that is currently in use by pending orders THEN the system SHALL allow the edit and apply changes only to new orders

### Requirement 4

**User Story:** As an administrator, I want to configure weight-based pricing for shipping methods, so that heavier packages cost more to ship.

#### Acceptance Criteria

1. WHEN configuring weight-based pricing THEN the system SHALL allow setting a weight threshold and additional cost per unit weight
2. WHEN weight-based pricing is configured THEN the system SHALL apply additional charges for packages exceeding the threshold
3. WHEN calculating shipping costs THEN the system SHALL add weight-based charges to the base rate
4. WHEN weight-based pricing is not configured THEN the system SHALL use only the base rate

### Requirement 5

**User Story:** As an administrator, I want to configure regional pricing for shipping methods, so that shipping costs reflect different destination countries or regions.

#### Acceptance Criteria

1. WHEN configuring regional pricing THEN the system SHALL allow defining different base rates for specific countries or regions
2. WHEN a customer selects a destination THEN the system SHALL apply the appropriate regional rate if configured
3. WHEN no regional rate is configured for a destination THEN the system SHALL use the default base rate
4. WHEN multiple regional rates could apply THEN the system SHALL use the most specific rate (country over region)

### Requirement 6

**User Story:** As an administrator, I want to configure free shipping thresholds, so that customers receive free shipping on orders above a certain value.

#### Acceptance Criteria

1. WHEN configuring a shipping method THEN the system SHALL allow setting a minimum order value for free shipping
2. WHEN an order value meets or exceeds the threshold THEN the system SHALL set the shipping cost to zero for that method
3. WHEN an order value is below the threshold THEN the system SHALL calculate shipping cost normally
4. WHEN free shipping is applied THEN the system SHALL indicate this in the shipping method description

### Requirement 7

**User Story:** As an administrator, I want to activate or deactivate shipping methods, so that I can control which options are available to customers without deleting them.

#### Acceptance Criteria

1. WHEN an administrator toggles a shipping method's active status THEN the system SHALL update the status in the database
2. WHEN a shipping method is deactivated THEN the system SHALL exclude it from customer-facing shipping calculations
3. WHEN a shipping method is activated THEN the system SHALL include it in customer-facing shipping calculations
4. WHEN a shipping method is deactivated THEN the system SHALL preserve all configuration data for potential reactivation

### Requirement 8

**User Story:** As an administrator, I want to delete shipping methods, so that I can remove options that are no longer needed.

#### Acceptance Criteria

1. WHEN an administrator clicks delete on a shipping method THEN the system SHALL display a confirmation dialog
2. WHEN deletion is confirmed THEN the system SHALL remove the shipping method from the database
3. WHEN a shipping method is used by existing orders THEN the system SHALL prevent deletion and display an informative error message
4. WHEN a shipping method has no order references THEN the system SHALL allow deletion

### Requirement 9

**User Story:** As an administrator, I want to reorder shipping methods, so that I can control the display order presented to customers.

#### Acceptance Criteria

1. WHEN an administrator changes a shipping method's display order THEN the system SHALL update the order value in the database
2. WHEN displaying shipping methods to customers THEN the system SHALL sort by display order ascending
3. WHEN multiple methods have the same display order THEN the system SHALL use creation date as a secondary sort
4. WHEN reordering methods THEN the system SHALL provide visual feedback of the new order

### Requirement 10

**User Story:** As a customer, I want to see accurate shipping costs during checkout, so that I can make informed decisions about delivery options.

#### Acceptance Criteria

1. WHEN a customer reaches the checkout shipping step THEN the system SHALL calculate and display all active shipping methods with costs
2. WHEN calculating shipping costs THEN the system SHALL apply base rates, weight-based charges, regional pricing, and free shipping thresholds
3. WHEN displaying shipping options THEN the system SHALL show method name, description, cost, and estimated delivery time
4. WHEN no shipping methods are active THEN the system SHALL display an error message and prevent checkout completion
5. WHEN shipping costs are calculated THEN the system SHALL use the customer's destination address and cart contents
