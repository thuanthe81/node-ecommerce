# OAuth Authentication Setup Guide

This application uses OAuth-only authentication with Google and Facebook providers. Traditional email/password authentication has been removed in favor of secure, third-party authentication.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Google OAuth Setup](#google-oauth-setup)
- [Facebook OAuth Setup](#facebook-oauth-setup)
- [Environment Configuration](#environment-configuration)
- [Callback URL Configuration](#callback-url-configuration)
- [Testing OAuth Integration](#testing-oauth-integration)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

## Overview

The application requires both Google and Facebook OAuth credentials to function. Users can sign in using either provider, and accounts are automatically linked if the same email is used across providers.

### Key Features

- **OAuth-only authentication**: No email/password registration
- **Automatic account creation**: First-time OAuth users are automatically registered
- **Email-based account linking**: Same email across providers links to one account
- **Checkout protection**: Authentication required before checkout
- **Admin visibility**: OAuth provider information visible in admin panel

## Prerequisites

Before setting up OAuth, ensure you have:

- A Google account for Google Cloud Console access
- A Facebook account for Facebook Developers access
- Access to your application's backend environment variables
- Your application's public URL (for production) or localhost URL (for development)

## Google OAuth Setup

### Step 1: Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account

### Step 2: Create or Select a Project

1. Click the project dropdown in the top navigation bar
2. Click **"New Project"** or select an existing project
3. If creating new:
   - Enter a project name (e.g., "Handmade Ecommerce")
   - Click **"Create"**

### Step 3: Enable Google+ API

1. In the left sidebar, navigate to **"APIs & Services" > "Library"**
2. Search for **"Google+ API"**
3. Click on **"Google+ API"** in the results
4. Click **"Enable"**

### Step 4: Create OAuth 2.0 Credentials

1. Navigate to **"APIs & Services" > "Credentials"**
2. Click **"Create Credentials"** at the top
3. Select **"OAuth client ID"**
4. If prompted, configure the OAuth consent screen:
   - Choose **"External"** user type
   - Fill in required fields:
     - App name: Your application name
     - User support email: Your email
     - Developer contact email: Your email
   - Click **"Save and Continue"**
   - Skip scopes (click **"Save and Continue"**)
   - Add test users if needed (for development)
   - Click **"Save and Continue"**

### Step 5: Configure OAuth Client

1. Select **"Web application"** as the application type
2. Enter a name (e.g., "Handmade Ecommerce Web Client")
3. Under **"Authorized JavaScript origins"**, add:
   - Development: `http://localhost:3001`
   - Production: `https://yourdomain.com`
4. Under **"Authorized redirect URIs"**, add:
   - Development: `http://localhost:3001/auth/google/callback`
   - Production: `https://yourdomain.com/auth/google/callback`
5. Click **"Create"**

### Step 6: Copy Credentials

1. A dialog will appear with your credentials
2. Copy the **Client ID** (looks like: `xxxxx.apps.googleusercontent.com`)
3. Copy the **Client Secret**
4. Store these securely - you'll need them for environment configuration

### Step 7: Configure OAuth Consent Screen (Optional)

For production, you may want to customize the consent screen:

1. Navigate to **"APIs & Services" > "OAuth consent screen"**
2. Add your app logo, privacy policy URL, and terms of service URL
3. Configure scopes (email, profile, openid are sufficient)
4. Submit for verification if needed (for production)

## Facebook OAuth Setup

### Step 1: Access Facebook Developers

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Sign in with your Facebook account

### Step 2: Create a New App

1. Click **"My Apps"** in the top navigation
2. Click **"Create App"**
3. Select **"Consumer"** as the app type
4. Click **"Next"**
5. Fill in the app details:
   - App name: Your application name (e.g., "Handmade Ecommerce")
   - App contact email: Your email
   - Business account: Optional
6. Click **"Create App"**

### Step 3: Add Facebook Login Product

1. In the app dashboard, find **"Facebook Login"** in the products list
2. Click **"Set Up"** on the Facebook Login card
3. Select **"Web"** as the platform
4. Enter your site URL:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`
5. Click **"Save"** and **"Continue"**

### Step 4: Configure Facebook Login Settings

1. In the left sidebar, navigate to **"Facebook Login" > "Settings"**
2. Under **"Valid OAuth Redirect URIs"**, add:
   - Development: `http://localhost:3001/auth/facebook/callback`
   - Production: `https://yourdomain.com/auth/facebook/callback`
3. Ensure **"Client OAuth Login"** is enabled
4. Ensure **"Web OAuth Login"** is enabled
5. Click **"Save Changes"**

### Step 5: Configure App Settings

1. In the left sidebar, navigate to **"Settings" > "Basic"**
2. Add an **App Domain**:
   - Development: `localhost`
   - Production: `yourdomain.com`
3. Add a **Privacy Policy URL** (required for production)
4. Add **Terms of Service URL** (optional but recommended)
5. Click **"Save Changes"**

### Step 6: Copy Credentials

1. In **"Settings" > "Basic"**, find:
   - **App ID**: Copy this value
   - **App Secret**: Click **"Show"**, then copy this value
2. Store these securely - you'll need them for environment configuration

### Step 7: Configure App for Production

For production deployment:

1. Switch the app from **Development** to **Live** mode:
   - In the top navigation, toggle the switch from "Development" to "Live"
2. Submit for **App Review** if required:
   - Navigate to **"App Review"**
   - Submit required permissions (email, public_profile)
   - Provide test credentials and instructions
   - Wait for approval (can take several days)

## Environment Configuration

### Backend Environment Variables

Create or update `backend/.env` with your OAuth credentials:

```env
# OAuth - Google
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback

# OAuth - Facebook
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_CALLBACK_URL=http://localhost:3001/auth/facebook/callback

# Frontend URL (for OAuth redirects)
FRONTEND_URL=http://localhost:3000
```

### Frontend Environment Variables

Create or update `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Environment Variable Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID from Google Cloud Console | `xxxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Client Secret from Google Cloud Console | `GOCSPX-xxxxx` |
| `GOOGLE_CALLBACK_URL` | Backend callback URL for Google OAuth | `http://localhost:3001/auth/google/callback` |
| `FACEBOOK_APP_ID` | App ID from Facebook Developers | `1234567890123456` |
| `FACEBOOK_APP_SECRET` | App Secret from Facebook Developers | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `FACEBOOK_CALLBACK_URL` | Backend callback URL for Facebook OAuth | `http://localhost:3001/auth/facebook/callback` |
| `FRONTEND_URL` | Frontend application URL for post-auth redirects | `http://localhost:3000` |

## Callback URL Configuration

OAuth callback URLs are critical for the authentication flow. They must match exactly between your environment configuration and the OAuth provider settings.

### URL Structure

**Google Callback URL:**
```
{BACKEND_URL}/auth/google/callback
```

**Facebook Callback URL:**
```
{BACKEND_URL}/auth/facebook/callback
```

### Development URLs

For local development:
- Backend: `http://localhost:3001`
- Google callback: `http://localhost:3001/auth/google/callback`
- Facebook callback: `http://localhost:3001/auth/facebook/callback`

### Production URLs

For production deployment:
- Backend: `https://api.yourdomain.com` (or `https://yourdomain.com` if backend is on same domain)
- Google callback: `https://api.yourdomain.com/auth/google/callback`
- Facebook callback: `https://api.yourdomain.com/auth/facebook/callback`

### Important Notes

1. **Exact Match Required**: The callback URL in your `.env` file must exactly match the URL configured in the OAuth provider console
2. **Protocol Matters**: Use `http://` for development, `https://` for production
3. **No Trailing Slash**: Do not include a trailing slash in callback URLs
4. **Port Numbers**: Include port numbers for development (e.g., `:3001`)
5. **Multiple Environments**: Configure separate OAuth apps for development, staging, and production

## Testing OAuth Integration

### Automated Validation

The application includes automatic OAuth configuration validation. When you start the backend, it will check for required credentials:

```bash
cd backend
npm run start:dev
```

If credentials are missing, you'll see a detailed error message with setup instructions.

### Manual Testing

1. **Start the backend:**
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Start the frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Google OAuth:**
   - Navigate to `http://localhost:3000/login`
   - Click "Sign in with Google"
   - Complete the OAuth consent flow
   - Verify you're redirected back and authenticated

4. **Test Facebook OAuth:**
   - Navigate to `http://localhost:3000/login`
   - Click "Sign in with Facebook"
   - Complete the OAuth consent flow
   - Verify you're redirected back and authenticated

5. **Test Checkout Protection:**
   - Log out if authenticated
   - Navigate to `http://localhost:3000/checkout`
   - Verify you're redirected to login
   - Complete OAuth authentication
   - Verify you're redirected back to checkout

### Test Scripts

The backend includes test scripts for OAuth validation:

```bash
# Test OAuth configuration validation
cd backend
npm run test:oauth-validation

# Test OAuth API responses
npm run test:oauth-api

# Verify OAuth visibility in admin
npm run test:oauth-visibility
```

## Production Deployment

### Pre-Deployment Checklist

- [ ] Create production OAuth apps in Google Cloud Console
- [ ] Create production OAuth apps in Facebook Developers
- [ ] Configure production callback URLs in both providers
- [ ] Set up production environment variables
- [ ] Use HTTPS for all production URLs
- [ ] Test OAuth flows in staging environment
- [ ] Submit Facebook app for review (if required)
- [ ] Configure OAuth consent screen for Google (if required)
- [ ] Set up monitoring for OAuth errors
- [ ] Document OAuth credentials in secure location

### Production Environment Variables

Update your production environment with:

```env
# OAuth - Google (Production)
GOOGLE_CLIENT_ID=production-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=production-client-secret
GOOGLE_CALLBACK_URL=https://api.yourdomain.com/auth/google/callback

# OAuth - Facebook (Production)
FACEBOOK_APP_ID=production-app-id
FACEBOOK_APP_SECRET=production-app-secret
FACEBOOK_CALLBACK_URL=https://api.yourdomain.com/auth/facebook/callback

# Frontend URL (Production)
FRONTEND_URL=https://yourdomain.com
```

### Security Best Practices

1. **Use Environment Variables**: Never hardcode credentials in source code
2. **Separate Credentials**: Use different OAuth apps for dev, staging, and production
3. **HTTPS Only**: Always use HTTPS in production
4. **Rotate Secrets**: Regularly rotate OAuth secrets
5. **Monitor Access**: Set up logging and monitoring for OAuth endpoints
6. **Rate Limiting**: Implement rate limiting on authentication endpoints
7. **Secure Storage**: Store credentials in a secrets manager (AWS Secrets Manager, Azure Key Vault, etc.)

### Deployment Steps

1. **Update OAuth Provider Settings:**
   - Add production callback URLs to Google Cloud Console
   - Add production callback URLs to Facebook Developers
   - Verify redirect URIs are whitelisted

2. **Configure Production Environment:**
   - Set all required environment variables
   - Verify HTTPS is configured
   - Test environment variable loading

3. **Deploy Application:**
   - Deploy backend with OAuth configuration
   - Deploy frontend with API URL configuration
   - Verify both services are running

4. **Test OAuth Flows:**
   - Test Google OAuth in production
   - Test Facebook OAuth in production
   - Test account linking
   - Test checkout protection
   - Verify error handling

5. **Monitor and Verify:**
   - Check application logs for OAuth errors
   - Monitor authentication success rates
   - Verify user accounts are created correctly
   - Test admin OAuth visibility

## Troubleshooting

### Application Won't Start

**Error: "OAuth configuration error"**

**Solution:**
1. Check that `backend/.env` file exists
2. Verify all required OAuth variables are set
3. Ensure no variables are empty strings
4. Check for typos in variable names
5. Restart the application after updating `.env`

### OAuth Redirect Fails

**Error: "redirect_uri_mismatch"**

**Solution:**
1. Verify callback URL in `.env` matches provider console exactly
2. Check for trailing slashes (should not have them)
3. Verify protocol (http vs https)
4. Ensure port numbers match (for development)
5. Check that redirect URI is whitelisted in provider console

### Google OAuth Errors

**Error: "Access blocked: This app's request is invalid"**

**Solution:**
1. Verify Google+ API is enabled
2. Check OAuth consent screen is configured
3. Ensure authorized redirect URIs are added
4. Verify client ID and secret are correct
5. Check that app is not restricted to specific users

**Error: "invalid_client"**

**Solution:**
1. Verify `GOOGLE_CLIENT_ID` is correct
2. Verify `GOOGLE_CLIENT_SECRET` is correct
3. Check that credentials are from the correct project
4. Ensure OAuth client is not deleted or disabled

### Facebook OAuth Errors

**Error: "Can't Load URL: The domain of this URL isn't included in the app's domains"**

**Solution:**
1. Add your domain to **App Domains** in Facebook app settings
2. For localhost, add `localhost` as an app domain
3. Verify **Valid OAuth Redirect URIs** includes your callback URL
4. Check that app is in correct mode (Development vs Live)

**Error: "App Not Set Up: This app is still in development mode"**

**Solution:**
1. Add your Facebook account as a test user
2. Or switch app to Live mode (requires app review for production)
3. Verify app has required permissions

### User Can't Sign In

**Issue: User clicks OAuth button but nothing happens**

**Solution:**
1. Check browser console for JavaScript errors
2. Verify `NEXT_PUBLIC_API_URL` is set correctly in frontend
3. Check that backend is running and accessible
4. Verify CORS is configured correctly
5. Test OAuth endpoints directly in browser

**Issue: User completes OAuth but isn't authenticated**

**Solution:**
1. Check backend logs for errors
2. Verify JWT secrets are configured
3. Check that user creation/linking logic works
4. Verify tokens are being stored in frontend
5. Check browser localStorage for tokens

### Account Linking Issues

**Issue: Same email creates multiple accounts**

**Solution:**
1. Verify email-based account linking logic in `auth.service.ts`
2. Check database for duplicate users with same email
3. Verify OAuth providers return email addresses
4. Check that email field is properly indexed in database

### Admin Panel Issues

**Issue: OAuth provider information not showing**

**Solution:**
1. Verify user service includes OAuth fields in responses
2. Check that admin API endpoints return OAuth data
3. Verify frontend components display OAuth information
4. Check database that OAuth fields are populated

### Getting Help

If you continue to experience issues:

1. Check the detailed OAuth configuration documentation: `backend/src/auth/config/README.md`
2. Review application logs for specific error messages
3. Test OAuth endpoints using the provided test scripts
4. Verify environment variables are loaded correctly
5. Check provider console for any service outages or issues

For additional support:
- Review NestJS Passport documentation: https://docs.nestjs.com/security/authentication
- Review Google OAuth documentation: https://developers.google.com/identity/protocols/oauth2
- Review Facebook Login documentation: https://developers.facebook.com/docs/facebook-login

