# Implementation Plan: OAuth-Only Customer Authentication with Admin Login Separation

## Overview

This implementation plan converts the current hybrid authentication system to an OAuth-only system for customers while maintaining email/password authentication for administrators through a dedicated admin login page.

## Tasks

- [x] 1. Update database schema for OAuth support
  - Add nullable `googleId` field to User table with unique constraint
  - Add nullable `facebookId` field to User table with unique constraint
  - Add nullable `username` field to User table
  - Make `passwordHash` field nullable
  - Add database indexes on `googleId` and `facebookId` fields
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ]* 1.1 Write property test for database schema
  - **Property 7: OAuth Provider Information Storage**
  - **Validates: Requirements 3.1, 3.6**

- [x] 2. Install and configure OAuth dependencies
  - Install `passport-google-oauth20` package in backend
  - Install `passport-facebook` package in backend
  - Add OAuth environment variables to `.env.example`
  - Configure OAuth callback URLs in environment variables
  - _Requirements: 5.1, 5.2, 12.1, 12.2, 12.5_

- [x] 3. Implement Google OAuth Strategy
  - [x] 3.1 Create Google OAuth strategy file
    - Implement `GoogleStrategy` class extending Passport strategy
    - Configure strategy with client ID, secret, and callback URL from environment
    - Implement `validate` method to process Google profile data
    - Extract email, first name, last name, and username from profile
    - _Requirements: 1.1, 1.2, 5.1, 5.4_

  - [ ]* 3.2 Write property test for Google profile extraction
    - **Property 2: OAuth Profile Processing**
    - **Validates: Requirements 1.2, 2.2, 5.4**

- [x] 4. Implement Facebook OAuth Strategy
  - [x] 4.1 Create Facebook OAuth strategy file
    - Implement `FacebookStrategy` class extending Passport strategy
    - Configure strategy with app ID, secret, and callback URL from environment
    - Implement `validate` method to process Facebook profile data
    - Extract email, first name, last name, and username from profile
    - _Requirements: 2.1, 2.2, 5.2, 5.4_

  - [ ]* 4.2 Write property test for Facebook profile extraction
    - **Property 2: OAuth Profile Processing**
    - **Validates: Requirements 1.2, 2.2, 5.4**

- [x] 5. Update Auth Service for OAuth user management
  - [x] 5.1 Implement `findOrCreateOAuthUser` method
    - Check if user exists by email
    - If user exists, link OAuth provider to existing account
    - If user doesn't exist, create new user with OAuth data
    - Set email verification to true and role to CUSTOMER for new users
    - Store provider name, provider ID, and username
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 13.1, 13.2_

  - [ ]* 5.2 Write property test for OAuth user creation
    - **Property 6: OAuth User Creation with Defaults**
    - **Validates: Requirements 3.3, 3.4, 3.5, 3.6**

  - [ ]* 5.3 Write property test for returning OAuth users
    - **Property 8: Returning OAuth User Handling**
    - **Validates: Requirements 3.2**

  - [x] 5.4 Implement `linkOAuthProvider` method
    - Update user record with new OAuth provider information
    - Handle both Google and Facebook provider linking
    - Maintain multiple provider IDs in user record
    - _Requirements: 13.4, 13.5_

  - [x] 5.5 Implement `validateOAuthUser` method
    - Process OAuth profile data
    - Call `findOrCreateOAuthUser` to get user
    - Generate JWT tokens for user
    - Return user and tokens
    - _Requirements: 1.3, 2.3, 5.3, 5.5_

  - [ ]* 5.6 Write property test for OAuth token generation
    - **Property 3: OAuth Token Generation**
    - **Validates: Requirements 1.3, 2.3, 5.5**

- [ ] 6. Update Auth Controller to remove register endpoint
  - [ ] 6.1 Remove register endpoint
    - Remove `POST /auth/register` endpoint
    - Keep existing `POST /auth/login` endpoint for admin authentication
    - Ensure register endpoint returns 404 Not Found
    - _Requirements: 8.2, 9.1, 9.2_

  - [ ]* 6.2 Write property test for admin authentication
    - **Property 14: Admin Login Authentication**
    - **Validates: Requirements 8.2**

  - [ ]* 6.3 Write property test for admin credential validation
    - **Property 18: Admin Credential Validation**
    - **Validates: Requirements 9.1, 9.2**

  - [ ]* 6.4 Write property test for admin login error handling
    - **Property 15: Admin Login Error Handling**
    - **Validates: Requirements 8.3**

  - [x] 6.5 Maintain existing OAuth endpoints
    - Keep `GET /auth/google` endpoint with Google guard
    - Keep `GET /auth/google/callback` endpoint
    - Keep `GET /auth/facebook` endpoint with Facebook guard
    - Keep `GET /auth/facebook/callback` endpoint
    - Keep existing `POST /auth/login` endpoint for admin authentication
    - Handle redirect parameter for post-login navigation
    - _Requirements: 1.1, 1.3, 1.4, 2.1, 2.3, 2.4, 9.1_

  - [ ]* 6.6 Write property test for OAuth redirect
    - **Property 4: OAuth Post-Authentication Redirect**
    - **Validates: Requirements 1.4, 2.4**

  - [x] 6.7 Maintain OAuth error handling
    - Keep error handling for OAuth failures
    - Redirect to login page with error message
    - Handle user cancellation, provider errors, and network issues
    - _Requirements: 1.5, 2.5, 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 6.8 Write property test for OAuth error handling
    - **Property 5: OAuth Error Handling**
    - **Validates: Requirements 1.5, 2.5**

- [x] 7. Update Auth Module configuration
  - Register Google OAuth strategy in providers
  - Register Facebook OAuth strategy in providers
  - Configure Passport module with OAuth strategies
  - Ensure JWT strategy remains for token validation
  - _Requirements: 5.1, 5.2_

- [ ] 8. Update frontend Auth Context for admin login
  - [ ] 8.1 Remove customer registration method
    - Remove `register` method from Auth Context
    - Keep existing `login` method for admin authentication
    - Update Auth Context interface to remove register method
    - _Requirements: 9.4_

  - [x] 8.2 Maintain OAuth callback token handling
    - Keep useEffect to extract tokens from URL parameters
    - Store access token and refresh token in localStorage
    - Fetch user data after storing tokens
    - Clean URL after extracting tokens
    - _Requirements: 1.4, 2.4_

  - [x] 8.3 Maintain session expiration handling
    - Keep detection when access token expires
    - Redirect to appropriate login page based on context
    - Preserve current page URL for post-login redirect
    - _Requirements: 4.4_

  - [ ]* 8.4 Write property test for session expiration
    - **Property 12: Session Expiration Handling**
    - **Validates: Requirements 4.4**

- [x] 9. Update frontend Auth API client
  - [x] 9.1 Remove customer registration function
    - Remove `register` function from auth API
    - Keep existing `login` function for admin authentication
    - _Requirements: 9.3_

  - [x] 9.2 Maintain existing functions
    - Keep `logout` and `refreshToken` functions
    - Keep `getCurrentUser` function
    - _Requirements: 9.3_

  - [ ]* 9.3 Write property test for admin API functionality
    - **Property 20: Admin API Functionality**
    - **Validates: Requirements 9.3, 9.4**

- [x] 10. Update customer login page for OAuth-only
  - [x] 10.1 Remove email/password form
    - Remove email and password input fields
    - Remove form submission handler
    - Remove registration link
    - _Requirements: 7.3, 7.4_

  - [x] 10.2 Maintain OAuth buttons
    - Keep Google sign-in button with proper styling and branding
    - Keep Facebook sign-in button with proper styling and branding
    - _Requirements: 7.1, 7.2_

  - [x] 10.3 Add admin login link
    - Add link to `/admin/login` for administrative access
    - Style appropriately to distinguish from OAuth buttons
    - _Requirements: 7.6_

  - [x] 10.4 Maintain OAuth button click handlers
    - Keep `handleGoogleLogin` to redirect to backend OAuth endpoint
    - Keep `handleFacebookLogin` to redirect to backend OAuth endpoint
    - Preserve redirect parameter in OAuth flow
    - _Requirements: 1.1, 2.1, 7.5_

  - [ ]* 10.5 Write property test for OAuth flow initiation
    - **Property 1: OAuth Flow Initiation**
    - **Validates: Requirements 1.1, 2.1, 7.5**

  - [x] 10.6 Maintain OAuth error message display
    - Keep error parameter extraction from URL
    - Display error message to user
    - Provide retry button for failed authentication
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 10.7 Update translations for OAuth-only UI
    - Update existing OAuth button translations (EN/VI)
    - Add admin login link translations
    - Remove email/password form translations
    - _Requirements: 7.1, 7.2, 7.6_

- [x] 11. Create admin login page
  - [x] 11.1 Create admin login page component
    - Create `/admin/login/page.tsx` file
    - Implement email and password input fields
    - Add form submission handler for admin login
    - Handle loading and error states
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 11.2 Implement admin authentication flow
    - Call admin login API on form submission using existing `/auth/login` endpoint
    - Store tokens on successful authentication
    - Redirect to admin dashboard or specified redirect URL
    - Handle role-based redirection for non-admin users
    - _Requirements: 8.2, 8.6_

  - [x] 11.3 Add admin login page styling
    - Style form to match admin theme
    - Ensure no OAuth buttons are displayed
    - Add link back to customer login
    - _Requirements: 8.4_

  - [x] 11.4 Add admin login translations
    - Add "Admin Login" translations (EN/VI)
    - Add admin-specific error messages
    - Add "Customer Login" link translations
    - _Requirements: 8.1, 8.3_

  - [ ]* 11.5 Write property test for non-admin user redirect
    - **Property 17: Non-Admin User Redirect**
    - **Validates: Requirements 8.6**

- [-] 12. Update admin route protection
  - [x] 12.1 Update AdminProtectedRoute component
    - Change redirect destination from `/login` to `/admin/login`
    - Preserve redirect parameter for admin pages
    - Maintain role checking for ADMIN users
    - _Requirements: 8.5_

  - [ ]* 12.2 Write property test for admin route protection
    - **Property 16: Admin Route Protection**
    - **Validates: Requirements 8.5**

  - [ ]* 12.3 Write property test for admin role verification
    - **Property 19: Admin Role Verification**
    - **Validates: Requirements 9.5**

- [x] 13. Maintain checkout authentication protection
  - [x] 13.1 Keep authentication check on checkout page
    - Keep `isAuthenticated` check from Auth Context on page load
    - Redirect unauthenticated users to main login page (not admin login)
    - Include checkout URL as redirect parameter
    - Show loading state during authentication check
    - _Requirements: 4.1_

  - [ ]* 13.2 Write property test for checkout authentication
    - **Property 9: Checkout Authentication Requirement**
    - **Validates: Requirements 4.1**

  - [x] 13.3 Maintain post-login redirect to checkout
    - Keep redirect parameter extraction from URL on login page
    - Pass redirect parameter through OAuth flow
    - Redirect to checkout after successful authentication
    - _Requirements: 4.2, 15.1_

  - [ ]* 13.4 Write property test for post-login redirect
    - **Property 10: Post-Login Checkout Redirect**
    - **Validates: Requirements 4.2**

  - [ ]* 13.5 Write property test for authenticated checkout access
    - **Property 11: Authenticated Checkout Access**
    - **Validates: Requirements 4.3**

  - [x] 13.6 Maintain cart preservation during authentication
    - Ensure cart data persists through OAuth redirect
    - Test cart contents remain unchanged after login
    - _Requirements: 15.2_

  - [x] 13.7 Maintain order association with user account
    - Ensure orders created by authenticated users have correct userId
    - Test order history shows orders for authenticated users
    - _Requirements: 15.3_

- [x] 14. Maintain admin customer management interface
  - [x] 14.1 Keep customer list OAuth provider display
    - Keep OAuth provider column in customer table
    - Display Google and Facebook badges for linked providers
    - Show provider icons or labels
    - _Requirements: 14.1_

  - [x] 14.2 Keep customer detail view OAuth information
    - Display all linked OAuth providers in detail view
    - Show provider-specific information (provider ID, username)
    - Display OAuth email address for each provider
    - Show username extracted from OAuth provider
    - _Requirements: 14.2, 14.3, 14.4, 14.5_

  - [x] 14.3 Keep translations for OAuth provider display
    - Keep "OAuth Providers" translations (EN/VI)
    - Keep "Google" and "Facebook" label translations
    - Keep provider-specific field labels
    - _Requirements: 14.1, 14.2_

- [x] 15. Maintain backend user API for admin OAuth visibility
  - Keep user list endpoint with OAuth provider information
  - Keep user detail endpoint with full OAuth data
  - Ensure OAuth fields are included in user serialization for admin
  - _Requirements: 14.1, 14.2_

- [x] 16. Maintain environment variable validation
  - Keep Google OAuth credentials validation on startup
  - Keep Facebook OAuth credentials validation on startup
  - Log clear error messages if credentials are missing
  - Prevent application startup if OAuth is not configured
  - _Requirements: 12.1, 12.2, 12.3_

- [x] 17. Maintain documentation
  - Keep README with OAuth setup instructions
  - Keep Google Cloud Console setup steps
  - Keep Facebook Developers setup steps
  - Keep environment variable documentation
  - Keep OAuth callback URL configuration
  - _Requirements: 12.1, 12.2, 12.5_

- [ ] 18. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 19. Test authentication flows end-to-end
  - Test complete Google OAuth flow for customers
  - Test complete Facebook OAuth flow for customers
  - Test admin login flow with email/password
  - Test admin route protection redirects to admin login
  - Test customer checkout protection redirects to main login
  - Test role-based access control for admin features
  - Test error handling for various failure scenarios
  - _Requirements: All_
