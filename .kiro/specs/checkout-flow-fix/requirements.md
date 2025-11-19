# Requirements Document

## Introduction

This specification addresses the complete checkout and order confirmation flow to support bank transfer as the only payment method. Since the business only accepts bank transfer payments, the payment method selection step should be removed from the checkout flow, simplifying the process to: (1) Shipping address, (2) Shipping method selection, and (3) Order review. After successful order placement, customers must be shown an order confirmation page with complete order details and bank transfer payment instructions, including bank account details and a QR code for easy payment. The system must support both authenticated and guest users accessing their order confirmation.

## Glossary

- **Checkout System**: The multi-step e-commerce checkout interface that collects shipping and order information
- **Shipping Address Form**: The form component that allows users to enter or select a shipping address
- **Shipping Method Selector**: The component that allows users to choose their preferred shipping speed
- **Guest User**: A user who is not authenticated and is checking out without an account
- **Authenticated User**: A user who is logged in with an account
- **Bank Transfer**: The only supported payment method where customers transfer funds directly to the business bank account
- **Order Confirmation Page**: The page displayed after successful order placement showing order details and payment instructions
- **Bank Transfer Information**: The bank account details and QR code required for customers to complete payment
- **Payment Settings**: Admin-configurable settings that store bank account details and QR code image for bank transfers

## Requirements

### Requirement 1

**User Story:** As a user, I want to complete checkout without selecting a payment method, so that I can quickly place my order knowing bank transfer is the only option

#### Acceptance Criteria

1. WHEN a user views the checkout flow, THE Checkout System SHALL display only two steps: shipping address and shipping method selection
2. THE Checkout System SHALL automatically set the payment method to bank transfer without user interaction
3. WHEN a user completes the shipping method selection, THE Checkout System SHALL proceed directly to order review
4. THE Checkout System SHALL not display any payment method selection interface to the user
5. WHEN an order is placed, THE Checkout System SHALL record the payment method as bank transfer
6. WHEN a guest user enters a shipping address, THE Checkout System SHALL create an address record without requiring user authentication

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

### Requirement 4

**User Story:** As a user, I want to see my order details and bank transfer payment instructions immediately after placing an order, so that I can complete the payment

#### Acceptance Criteria

1. WHEN an order is successfully placed, THE Checkout System SHALL redirect the user to an order confirmation page
2. THE Order Confirmation Page SHALL display the order number, order date, and order status
3. THE Order Confirmation Page SHALL show all order items with quantities, prices, and subtotal
4. THE Order Confirmation Page SHALL display the shipping address and selected shipping method
5. THE Order Confirmation Page SHALL show the order total including subtotal, shipping cost, tax, and any applied discounts
6. THE Order Confirmation Page SHALL retrieve and display bank transfer information from the backend
7. THE Order Confirmation Page SHALL show bank account details including account name, account number, and bank name
8. WHEN bank transfer QR code is available, THE Order Confirmation Page SHALL display the QR code image for easy scanning
9. THE Order Confirmation Page SHALL be accessible to both authenticated users and guest users using the order ID
10. WHEN a guest user accesses the order confirmation page, THE Order Confirmation Page SHALL display the same information as for authenticated users

### Requirement 5

**User Story:** As an administrator, I want to configure bank transfer payment information, so that customers receive accurate payment instructions

#### Acceptance Criteria

1. THE Payment Settings SHALL store bank account name as a text field
2. THE Payment Settings SHALL store bank account number as a text field
3. THE Payment Settings SHALL store bank name as a text field
4. THE Payment Settings SHALL store a QR code image for bank transfer
5. WHEN an administrator updates payment settings, THE Payment Settings SHALL persist the changes to the database
6. WHEN the order confirmation page requests payment information, THE Payment Settings SHALL return the current bank transfer details
7. THE Payment Settings SHALL provide a default response when no QR code image is configured

### Requirement 6

**User Story:** As a user, I want the checkout process to handle authentication errors gracefully without page reloads, so that I can maintain my session and debug network issues

#### Acceptance Criteria

1. WHEN an authentication error occurs during checkout, THE Checkout System SHALL handle the error without triggering a full page reload
2. WHEN token refresh fails during checkout, THE Checkout System SHALL use client-side navigation instead of window.location redirects
3. WHEN redirecting to login after authentication failure, THE Checkout System SHALL preserve the current locale in the redirect URL
4. WHEN an authentication error occurs on the order confirmation page, THE Checkout System SHALL not redirect guest users to login
5. WHEN an authentication error occurs, THE Checkout System SHALL preserve browser network activity for debugging purposes

### Requirement 7

**User Story:** As a system administrator, I want guest users to be able to create addresses without authentication, so that guest checkout can function properly

#### Acceptance Criteria

1. THE Address model SHALL allow the userId field to be optional
2. WHEN a guest user creates an address, THE Checkout System SHALL create an address record with a null userId
3. WHEN an authenticated user creates an address, THE Checkout System SHALL create an address record with their userId
4. THE Checkout System SHALL validate address data regardless of whether the user is authenticated
5. WHEN an address has a null userId, THE Checkout System SHALL allow it to be used for order creation
6. THE Checkout System SHALL implement a cleanup process to remove orphaned guest addresses older than 90 days
