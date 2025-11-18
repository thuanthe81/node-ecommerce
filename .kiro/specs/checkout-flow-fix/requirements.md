# Requirements Document

## Introduction

This specification addresses the checkout flow to support bank transfer as the only payment method. Since the business only accepts bank transfer payments, the payment method selection step should be removed from the checkout flow, simplifying the process to: (1) Shipping address, (2) Shipping method selection, and (3) Order review.

## Glossary

- **Checkout System**: The multi-step e-commerce checkout interface that collects shipping and order information
- **Shipping Address Form**: The form component that allows users to enter or select a shipping address
- **Shipping Method Selector**: The component that allows users to choose their preferred shipping speed
- **Guest User**: A user who is not authenticated and is checking out without an account
- **Authenticated User**: A user who is logged in with an account
- **Bank Transfer**: The only supported payment method where customers transfer funds directly to the business bank account

## Requirements

### Requirement 1

**User Story:** As a user, I want to complete checkout without selecting a payment method, so that I can quickly place my order knowing bank transfer is the only option

#### Acceptance Criteria

1. WHEN a user views the checkout flow, THE Checkout System SHALL display only two steps: shipping address and shipping method selection
2. THE Checkout System SHALL automatically set the payment method to bank transfer without user interaction
3. WHEN a user completes the shipping method selection, THE Checkout System SHALL proceed directly to order review
4. THE Checkout System SHALL not display any payment method selection interface to the user
5. WHEN an order is placed, THE Checkout System SHALL record the payment method as bank transfer

### Requirement 2

**User Story:** As a user, I want to select my preferred shipping method, so that I can control delivery speed and cost

#### Acceptance Criteria

1. WHEN a user reaches step 2, THE Checkout System SHALL display available shipping methods with costs
2. THE Shipping Method Selector SHALL show standard, express, and overnight shipping options
3. WHEN a user selects a shipping method, THE Checkout System SHALL update the order total with the shipping cost
4. THE Checkout System SHALL enable the "Next" button when a shipping method is selected
5. WHEN a user proceeds from shipping method selection, THE Checkout System SHALL advance to order review

### Requirement 3

**User Story:** As a user, I want to review my complete order before placing it, so that I can verify all details are correct

#### Acceptance Criteria

1. WHEN a user reaches the order review step, THE Checkout System SHALL display all order items with quantities and prices
2. THE Checkout System SHALL show the selected shipping address and shipping method
3. THE Checkout System SHALL display the order total including subtotal, shipping, tax, and any discounts
4. THE Checkout System SHALL provide a "Place Order" button to complete the purchase
5. WHEN a user places an order, THE Checkout System SHALL create the order with bank transfer as the payment method
