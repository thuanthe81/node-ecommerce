# Implementation Plan

- [x] 1. Update Cart Context to support guest cart in localStorage
  - Modify CartContext to store guest cart items in localStorage instead of calling backend for unauthenticated users
  - Add state for tracking guest cart items
  - Add logic to load guest cart from localStorage on mount
  - Update addToCart, updateQuantity, removeItem, clearCart methods to handle both authenticated and guest users
  - _Requirements: 1.1, 9.1, 9.2, 9.3, 9.4_

- [x] 2. Implement cart sync logic in Cart Context
  - Add syncGuestCartToBackend method to Cart Context
  - Add useEffect to detect when user logs in (authentication state change)
  - Implement logic to push each guest cart item to backend via addItem API
  - Handle partial sync failures (some items succeed, some fail)
  - Clear localStorage guest cart only after all items successfully sync
  - Add comprehensive logging for sync process
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 6.1, 6.2, 6.4_

- [x] 3. Update Cart API client to remove session ID logic
  - Remove getSessionId() helper function
  - Remove syncSessionId() helper function
  - Remove session ID headers from all API calls
  - Simplify all cart API methods to only work with authenticated requests
  - _Requirements: 9.1_

- [x] 4. Update backend Cart Controller to require authentication
  - Add @UseGuards(JwtAuthGuard) to all cart endpoints
  - Remove sessionId parameter extraction from requests
  - Update all methods to only use userId from authenticated request
  - Remove /cart/merge endpoint
  - _Requirements: 9.5_

- [x] 5. Update backend Cart Service to remove session ID support
  - Remove sessionId parameters from all service methods
  - Update getCart to only accept userId
  - Update addItem to only accept userId
  - Update updateItem to only accept userId and remove session validation
  - Update removeItem to only accept userId and remove session validation
  - Update clearCart to only accept userId
  - Remove mergeGuestCart method
  - Update findOrCreateCart to only use userId
  - Update getCacheKey to only use userId
  - Update invalidateCache to only use userId
  - _Requirements: 9.5_

- [x] 6. Create database migration to remove sessionId from Cart model
  - Create Prisma migration to make userId required in Cart model
  - Add migration step to delete carts without userId (orphaned guest carts)
  - Add migration step to remove sessionId column
  - Update Prisma schema to remove sessionId field
  - Update Prisma schema to make userId required (remove ?)
  - _Requirements: 9.5_

- [x] 7. Update Cart UI components to display guest cart from localStorage
  - Update cart display logic to show items from localStorage for guest users
  - Update cart item count badge to include guest cart items
  - Update cart subtotal calculation to include guest cart items
  - Fetch product details for guest cart items to display in UI
  - _Requirements: 1.1, 9.2_

- [x] 8. Add error handling and user feedback for cart sync
  - Display loading indicator during cart sync
  - Display success message after successful sync
  - Display error messages for failed items with specific reasons
  - Add retry button for failed sync attempts
  - Show which items were successfully added vs failed
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.2, 5.3_

- [x] 9. Handle edge cases in cart sync
  - Skip sync if guest cart is empty
  - Handle product not found errors gracefully
  - Handle out of stock errors gracefully
  - Handle localStorage unavailable scenario
  - Preserve guest cart if user cancels OAuth flow
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 8.1, 8.4, 8.5_

- [x] 10. Add comprehensive logging for debugging
  - Log when guest cart items are added/updated/removed in localStorage
  - Log when cart sync is triggered
  - Log each item being synced to backend
  - Log quantity merging operations
  - Log sync completion status
  - Log any errors during sync with full context
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 11. Update checkout flow to handle guest cart
  - Ensure checkout redirects to login for unauthenticated users
  - Preserve guest cart in localStorage during OAuth redirect
  - Verify cart sync happens before showing checkout page
  - Display merged cart items in checkout summary
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 5.4_

- [ ] 12. Test OAuth login flow with cart preservation
  - Test adding items as guest
  - Test OAuth login redirect
  - Test cart sync after OAuth callback
  - Test localStorage cleared after sync
  - Test merged cart displayed correctly
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 13. Test quantity merging scenarios
  - Test guest cart item + existing user cart item merging
  - Test quantity merging respects stock limits
  - Test quantity set to max stock when combined exceeds limit
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 14. Test error scenarios
  - Test network error during sync
  - Test partial sync failure
  - Test product not found error
  - Test out of stock error
  - Test localStorage unavailable
  - Test OAuth cancellation preserves guest cart
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.1, 7.2, 8.4, 8.5_

- [ ] 15. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
