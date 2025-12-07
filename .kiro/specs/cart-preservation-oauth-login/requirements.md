# Requirements Document

## Introduction

This document outlines the requirements for fixing a critical issue where the shopping cart is reset when customers authenticate via OAuth (Google/Facebook) during the checkout process. The solution simplifies cart management by storing guest carts only in the frontend (localStorage) and only syncing to the backend after the user authenticates. This approach eliminates the complexity of managing session IDs on the backend and reduces potential synchronization issues.

Currently, guest carts are stored on the backend with session IDs, which creates complexity and synchronization problems. The new approach will:
1. Store guest carts in localStorage only (no backend storage for unauthenticated users)
2. When a user logs in, push all guest cart items to the backend
3. Merge with any existing user cart items on the backend
4. Clear the localStorage guest cart after successful sync

## Glossary

- **Cart System**: The e-commerce shopping cart functionality that stores products users intend to purchase
- **OAuth Authentication**: The authentication process using Google or Facebook credentials
- **Guest Cart**: A shopping cart stored in localStorage for unauthenticated users (frontend only)
- **User Cart**: A shopping cart stored on the backend and associated with an authenticated user's account
- **Cart Sync**: The process of pushing guest cart items from localStorage to the backend after authentication
- **Checkout Flow**: The multi-step process where users provide shipping information and place orders
- **Auth Context**: The React context managing authentication state in the frontend
- **Cart Context**: The React context managing cart state in the frontend
- **localStorage**: Browser storage mechanism for persisting data across page reloads

## Requirements

### Requirement 1

**User Story:** As a guest user, I want my cart to be preserved when I log in during checkout, so that I don't have to re-add all my items.

#### Acceptance Criteria

1. WHEN a guest user adds items to their cart THEN the Cart System SHALL store the cart items in localStorage only
2. WHEN a guest user clicks checkout and is redirected to login THEN the Cart System SHALL maintain the cart items in localStorage
3. WHEN a guest user completes OAuth authentication THEN the Cart System SHALL preserve the localStorage cart through the OAuth redirect flow
4. WHEN a user returns from OAuth authentication THEN the Cart System SHALL push all guest cart items to the backend
5. WHEN the cart sync completes THEN the Cart System SHALL display all items from both the guest cart and any existing user cart

### Requirement 2

**User Story:** As a developer, I want the Cart Context to detect when a user logs in and automatically sync the guest cart to the backend, so that guest cart items are transferred to the user's account.

#### Acceptance Criteria

1. WHEN the Auth Context updates with a newly authenticated user THEN the Cart Context SHALL detect the authentication state change
2. WHEN the Cart Context detects a new user login THEN the Cart Context SHALL check if guest cart items exist in localStorage
3. WHEN guest cart items exist in localStorage THEN the Cart Context SHALL push each item to the backend via the add item API
4. WHEN all items are successfully added THEN the Cart Context SHALL clear the guest cart from localStorage
5. WHEN the cart sync completes THEN the Cart Context SHALL fetch the user's cart from the backend to display all merged items

### Requirement 3

**User Story:** As a user with an existing cart, I want my guest cart items to be added to my existing cart when I log in, so that I don't lose any items.

#### Acceptance Criteria

1. WHEN a user has items in their backend cart THEN the Cart System SHALL preserve those items during login
2. WHEN a guest cart contains items that already exist in the user cart THEN the Backend Service SHALL combine the quantities
3. WHEN combining quantities would exceed stock limits THEN the Backend Service SHALL set the quantity to the maximum available stock
4. WHEN the cart sync completes THEN the Cart System SHALL clear the guest cart from localStorage
5. WHEN the cart sync completes THEN the Cart System SHALL invalidate the user cart cache on the backend

### Requirement 4

**User Story:** As a developer, I want proper error handling during cart sync, so that users receive clear feedback if something goes wrong.

#### Acceptance Criteria

1. WHEN the cart sync fails due to network error THEN the Cart System SHALL display an error message and allow retry
2. WHEN the cart sync fails due to stock issues THEN the Cart System SHALL display which items couldn't be added and why
3. WHEN the cart sync fails due to server error THEN the Cart System SHALL log the error and display a user-friendly message
4. WHEN the cart sync partially succeeds THEN the Cart System SHALL display which items were successfully added
5. WHEN the cart sync encounters an error THEN the Cart System SHALL not clear the guest cart from localStorage until sync is confirmed successful

### Requirement 5

**User Story:** As a user, I want the cart sync to happen automatically and seamlessly, so that I don't need to take any manual action.

#### Acceptance Criteria

1. WHEN a user completes OAuth authentication THEN the Cart System SHALL automatically initiate the cart sync without user action
2. WHEN the cart sync is in progress THEN the Cart System SHALL display a loading indicator
3. WHEN the cart sync completes successfully THEN the Cart System SHALL refresh the cart display with synced items
4. WHEN the cart sync completes THEN the Cart System SHALL redirect the user to their intended destination (checkout or home)
5. WHEN the cart sync completes THEN the Cart System SHALL clear the guest cart from localStorage

### Requirement 6

**User Story:** As a developer, I want comprehensive logging of the cart sync process, so that I can diagnose issues when they occur.

#### Acceptance Criteria

1. WHEN the cart sync initiates THEN the Cart System SHALL log the user ID and number of guest cart items
2. WHEN items are being synced THEN the Cart System SHALL log each item being pushed to the backend
3. WHEN quantities are combined THEN the Backend Service SHALL log the original and new quantities
4. WHEN the cart sync completes THEN the Cart System SHALL log the final cart state
5. WHEN the cart sync fails THEN the Cart System SHALL log the error with full context for debugging

### Requirement 7

**User Story:** As a user, I want my cart to be preserved even if I navigate away during the OAuth flow, so that I don't lose my items if I change my mind.

#### Acceptance Criteria

1. WHEN a user cancels the OAuth flow THEN the Cart System SHALL maintain the guest cart in localStorage
2. WHEN a user returns to the site after canceling OAuth THEN the Cart System SHALL display their original guest cart from localStorage
3. WHEN a user closes the browser during OAuth THEN the Cart System SHALL preserve the cart in localStorage
4. WHEN a user reopens the browser THEN the Cart System SHALL restore the cart from localStorage
5. WHEN localStorage is cleared THEN the Cart System SHALL start with an empty guest cart

### Requirement 8

**User Story:** As a developer, I want the cart sync to handle edge cases gracefully, so that the system is robust and reliable.

#### Acceptance Criteria

1. WHEN a guest cart is empty THEN the Cart System SHALL skip the sync and fetch the user's existing backend cart
2. WHEN a user cart is empty THEN the Cart System SHALL add all guest cart items to the backend
3. WHEN both carts are empty THEN the Cart System SHALL display an empty cart
4. WHEN a product in the guest cart no longer exists THEN the Backend Service SHALL return an error and the Cart System SHALL skip that item and log a warning
5. WHEN a product in the guest cart is out of stock THEN the Backend Service SHALL return an error and the Cart System SHALL skip that item and notify the user

### Requirement 9

**User Story:** As a developer, I want to remove backend storage for guest carts, so that the system is simpler and has fewer synchronization issues.

#### Acceptance Criteria

1. WHEN a guest user adds items to cart THEN the Frontend Client SHALL store items only in localStorage and not send requests to the backend
2. WHEN a guest user views their cart THEN the Frontend Client SHALL read items from localStorage only
3. WHEN a guest user updates cart quantities THEN the Frontend Client SHALL update localStorage only
4. WHEN a guest user removes items THEN the Frontend Client SHALL update localStorage only
5. WHEN the backend receives cart requests without authentication THEN the Backend Service SHALL reject the request with an authentication required error
