# Implementation Plan

- [x] 1. Update database schema for OAuth support
  - Add nullable `googleId` field to User table with unique constraint
  - Add nullable `facebookId` field to User table with unique constraint
  - Add nullable `username` field to User table
  - Make `passwordHash` field nullable
  - Add database indexes on `googleId` and `facebookId` fields
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 1.1 Write property test for database schema
  - **Property 10: OAuth Provider Information Storage**
  - **Validates: Requirements 6.2, 6.6, 6.7**

- [x] 2. Install and configure OAuth dependencies
  - Install `passport-google-oauth20` package in backend
  - Install `passport-facebook` package in backend
  - Add OAuth environment variables to `.env.example`
  - Configure OAuth callback URLs in environment variables
  - _Requirements: 5.1, 5.2, 11.1, 11.2, 11.5_

- [x] 3. Implement Google OAuth Strategy
  - [x] 3.1 Create Google OAuth strategy file
    - Implement `GoogleStrategy` class extending Passport strategy
    - Configure strategy with client ID, secret, and callback URL from environment
    - Implement `validate` method to process Google profile data
    - Extract email, first name, last name, and username from profile
    - _Requirements: 1.1, 1.2, 5.1, 5.4_

  - [ ]* 3.2 Write property test for Google profile extraction
    - **Property 1: OAuth Callback Profile Processing**
    - **Validates: Requirements 1.2, 2.2, 5.4**

- [x] 4. Implement Facebook OAuth Strategy
  - [x] 4.1 Create Facebook OAuth strategy file
    - Implement `FacebookStrategy` class extending Passport strategy
    - Configure strategy with app ID, secret, and callback URL from environment
    - Implement `validate` method to process Facebook profile data
    - Extract email, first name, last name, and username from profile
    - _Requirements: 2.1, 2.2, 5.2, 5.4_

  - [ ]* 4.2 Write property test for Facebook profile extraction
    - **Property 1: OAuth Callback Profile Processing**
    - **Validates: Requirements 1.2, 2.2, 5.4**

- [x] 5. Update Auth Service for OAuth user management
  - [x] 5.1 Implement `findOrCreateOAuthUser` method
    - Check if user exists by email
    - If user exists, link OAuth provider to existing account
    - If user doesn't exist, create new user with OAuth data
    - Set email verification to true and role to CUSTOMER for new users
    - Store provider name, provider ID, and username
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 12.1, 12.2_

  - [ ]* 5.2 Write property test for OAuth user creation
    - **Property 9: OAuth User Creation with Defaults**
    - **Validates: Requirements 6.1, 6.4, 6.5**

  - [ ]* 5.3 Write property test for email-based account linking
    - **Property 12: Email-Based Account Linking**
    - **Validates: Requirements 12.1, 12.2, 12.4**

  - [ ]* 5.4 Write property test for returning OAuth users
    - **Property 11: Returning OAuth User Handling**
    - **Validates: Requirements 6.3**

  - [x] 5.5 Implement `linkOAuthProvider` method
    - Update user record with new OAuth provider information
    - Handle both Google and Facebook provider linking
    - Maintain multiple provider IDs in user record
    - _Requirements: 12.4, 12.5_

  - [ ]* 5.6 Write property test for multi-provider consistency
    - **Property 13: Multi-Provider Account Consistency**
    - **Validates: Requirements 12.3, 12.5**

  - [x] 5.7 Implement `validateOAuthUser` method
    - Process OAuth profile data
    - Call `findOrCreateOAuthUser` to get user
    - Generate JWT tokens for user
    - Return user and tokens
    - _Requirements: 1.3, 2.3, 5.3, 5.5_

  - [ ]* 5.8 Write property test for OAuth token generation
    - **Property 2: OAuth Token Generation**
    - **Validates: Requirements 1.3, 2.3, 5.5**

- [x] 6. Update Auth Controller with OAuth endpoints
  - [x] 6.1 Add Google OAuth endpoints
    - Implement `GET /auth/google` endpoint with Google guard
    - Implement `GET /auth/google/callback` endpoint
    - Extract tokens from OAuth validation
    - Redirect to frontend with tokens in URL parameters
    - Handle redirect parameter for post-login navigation
    - _Requirements: 1.1, 1.3, 1.4_

  - [ ]* 6.2 Write property test for OAuth redirect
    - **Property 3: OAuth Post-Authentication Redirect**
    - **Validates: Requirements 1.4, 2.4**

  - [x] 6.3 Add Facebook OAuth endpoints
    - Implement `GET /auth/facebook` endpoint with Facebook guard
    - Implement `GET /auth/facebook/callback` endpoint
    - Extract tokens from OAuth validation
    - Redirect to frontend with tokens in URL parameters
    - Handle redirect parameter for post-login navigation
    - _Requirements: 2.1, 2.3, 2.4_

  - [x] 6.4 Add OAuth error handling
    - Implement error handling for OAuth failures
    - Redirect to login page with error message
    - Handle user cancellation, provider errors, and network issues
    - _Requirements: 1.5, 2.5, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 6.5 Write property test for OAuth error handling
    - **Property 4: OAuth Error Handling**
    - **Validates: Requirements 1.5, 2.5**

  - [x] 6.6 Remove email/password authentication endpoints
    - Remove or disable `POST /auth/register` endpoint
    - Remove or disable `POST /auth/login` endpoint
    - Ensure removed endpoints return 404 Not Found
    - _Requirements: 3.1, 3.5, 8.4_

- [x] 7. Update Auth Module configuration
  - Register Google OAuth strategy in providers
  - Register Facebook OAuth strategy in providers
  - Configure Passport module with OAuth strategies
  - Ensure JWT strategy remains for token validation
  - _Requirements: 5.1, 5.2_

- [x] 8. Update frontend Auth Context for OAuth
  - [x] 8.1 Remove email/password authentication methods
    - Remove `register` method from Auth Context
    - Remove `login` method from Auth Context
    - Update Auth Context interface to remove these methods
    - _Requirements: 3.4, 8.1, 8.2_

  - [x] 8.2 Implement OAuth callback token handling
    - Add useEffect to extract tokens from URL parameters
    - Store access token and refresh token in localStorage
    - Fetch user data after storing tokens
    - Clean URL after extracting tokens
    - _Requirements: 1.4, 2.4_

  - [x] 8.3 Implement session expiration handling
    - Detect when access token expires
    - Redirect to login with session expiration message
    - Preserve current page URL for post-login redirect
    - _Requirements: 4.4_

  - [ ]* 8.4 Write property test for session expiration
    - **Property 7: Session Expiration Handling**
    - **Validates: Requirements 4.4**

- [x] 9. Update frontend Auth API client
  - Remove `register` function from auth API
  - Remove `login` function from auth API
  - Keep `logout` and `refreshToken` functions
  - Add `getCurrentUser` function if not present
  - _Requirements: 8.3_

- [x] 10. Update Login Page for OAuth-only authentication
  - [x] 10.1 Replace email/password form with OAuth buttons
    - Remove email and password input fields
    - Remove form submission handler
    - Add Google sign-in button with proper styling and branding
    - Add Facebook sign-in button with proper styling and branding
    - Remove link to registration page
    - _Requirements: 3.3, 7.1, 7.2, 7.3, 7.4_

  - [x] 10.2 Implement OAuth button click handlers
    - Implement `handleGoogleLogin` to redirect to backend OAuth endpoint
    - Implement `handleFacebookLogin` to redirect to backend OAuth endpoint
    - Preserve redirect parameter in OAuth flow
    - _Requirements: 1.1, 2.1, 7.5_

  - [x] 10.3 Add OAuth error message display
    - Extract error parameter from URL
    - Display error message to user
    - Provide retry button for failed authentication
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 10.4 Add translations for OAuth UI
    - Add "Sign in with Google" translations (EN/VI)
    - Add "Sign in with Facebook" translations (EN/VI)
    - Add OAuth error message translations
    - Add "Authentication required" message translations
    - _Requirements: 7.1, 7.2, 9.1, 9.2, 9.3, 9.4_

- [x] 11. Remove Register Page
  - Delete register page component file
  - Remove register route from routing configuration
  - Add redirect from `/register` to `/login` in middleware or routing
  - _Requirements: 3.2, 3.5, 8.5_

- [x] 12. Implement checkout authentication protection
  - [x] 12.1 Add authentication check to checkout page
    - Check `isAuthenticated` from Auth Context on page load
    - Redirect unauthenticated users to login page
    - Include checkout URL as redirect parameter
    - Show loading state during authentication check
    - _Requirements: 4.1_

  - [ ]* 12.2 Write property test for checkout authentication
    - **Property 5: Checkout Authentication Requirement**
    - **Validates: Requirements 4.1**

  - [x] 12.3 Implement post-login redirect to checkout
    - Extract redirect parameter from URL on login page
    - Pass redirect parameter through OAuth flow
    - Redirect to checkout after successful authentication
    - _Requirements: 4.2, 14.1_

  - [ ]* 12.4 Write property test for post-login redirect
    - **Property 6: Post-Login Checkout Redirect**
    - **Validates: Requirements 4.2, 14.1**

  - [x] 12.5 Verify cart preservation during authentication
    - Ensure cart data persists through OAuth redirect
    - Test cart contents remain unchanged after login
    - _Requirements: 14.2_

  - [ ]* 12.6 Write property test for cart preservation
    - **Property 14: Cart Preservation During Authentication**
    - **Validates: Requirements 14.2**

  - [x] 12.7 Verify order association with user account
    - Ensure orders created by authenticated users have correct userId
    - Test order history shows orders for authenticated users
    - _Requirements: 14.3_

  - [ ]* 12.8 Write property test for order association
    - **Property 15: Order Association with User Account**
    - **Validates: Requirements 14.3**

- [x] 13. Update admin customer management interface
  - [x] 13.1 Update customer list to display OAuth providers
    - Add OAuth provider column to customer table
    - Display Google and Facebook badges for linked providers
    - Show provider icons or labels
    - _Requirements: 13.1_

  - [x] 13.2 Update customer detail view for OAuth information
    - Display all linked OAuth providers in detail view
    - Show provider-specific information (provider ID, username)
    - Display OAuth email address for each provider
    - Show username extracted from OAuth provider
    - _Requirements: 13.2, 13.3, 13.4, 13.5_

  - [x] 13.3 Add translations for OAuth provider display
    - Add "OAuth Providers" translations (EN/VI)
    - Add "Google" and "Facebook" label translations
    - Add provider-specific field labels
    - _Requirements: 13.1, 13.2_

- [x] 14. Update backend user API for admin OAuth visibility
  - Update user list endpoint to include OAuth provider information
  - Update user detail endpoint to include full OAuth data
  - Ensure OAuth fields are included in user serialization for admin
  - _Requirements: 13.1, 13.2_

- [x] 15. Add environment variable validation
  - Validate Google OAuth credentials are present on startup
  - Validate Facebook OAuth credentials are present on startup
  - Log clear error messages if credentials are missing
  - Prevent application startup if OAuth is not configured
  - _Requirements: 11.1, 11.2, 11.3_

- [x] 16. Update documentation
  - Update README with OAuth setup instructions
  - Document Google Cloud Console setup steps
  - Document Facebook Developers setup steps
  - Add environment variable documentation
  - Document OAuth callback URL configuration
  - _Requirements: 11.1, 11.2, 11.5_

- [ ] 17. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 18. Test OAuth flows end-to-end
  - Test complete Google OAuth flow in development
  - Test complete Facebook OAuth flow in development
  - Test account linking with same email across providers
  - Test checkout protection and redirect flow
  - Test admin OAuth provider visibility
  - Test error handling for various failure scenarios
  - _Requirements: All_
