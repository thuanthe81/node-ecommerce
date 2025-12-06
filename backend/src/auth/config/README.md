# OAuth Configuration Validation

## Overview

This module provides automatic validation of OAuth credentials on application startup. It ensures that all required OAuth environment variables are properly configured before the application starts accepting requests.

## How It Works

The `OAuthConfigValidator` service is integrated into the `AuthModule` and runs during module initialization (`onModuleInit`). If any required OAuth credentials are missing, the application will fail to start with a clear error message.

## Validated Credentials

### Google OAuth
- `GOOGLE_CLIENT_ID` - OAuth 2.0 Client ID from Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - OAuth 2.0 Client Secret from Google Cloud Console
- `GOOGLE_CALLBACK_URL` - Callback URL for Google OAuth flow

### Facebook OAuth
- `FACEBOOK_APP_ID` - App ID from Facebook Developers
- `FACEBOOK_APP_SECRET` - App Secret from Facebook Developers
- `FACEBOOK_CALLBACK_URL` - Callback URL for Facebook OAuth flow

## Error Messages

When credentials are missing, the validator provides:
- Clear list of missing environment variables
- Setup instructions for each OAuth provider
- Links to provider documentation
- Example .env configuration
- Prevents application startup to ensure proper configuration

## Example Error Output

```
╔════════════════════════════════════════════════════════════════╗
║  OAUTH CONFIGURATION ERROR                                     ║
╚════════════════════════════════════════════════════════════════╝

The following OAuth environment variables are missing or empty:

  ✗ GOOGLE_CLIENT_ID
  ✗ GOOGLE_CLIENT_SECRET
  ✗ GOOGLE_CALLBACK_URL

OAuth authentication is required for this application.
Please configure the missing credentials in your .env file.

Setup instructions:

Google OAuth:
  1. Visit: https://console.cloud.google.com/apis/credentials
  2. Create OAuth 2.0 credentials
  3. Add authorized redirect URI
  4. Copy Client ID and Client Secret to .env

Example .env configuration:

  GOOGLE_CLIENT_ID=your-google-client-id
  GOOGLE_CLIENT_SECRET=your-google-client-secret
  GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

Application startup has been prevented to ensure OAuth is properly configured.
```

## Configuration

### Development

For local development, configure your `.env` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# Facebook OAuth
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_CALLBACK_URL=http://localhost:3001/api/auth/facebook/callback
```

### Production

For production, ensure:
1. All callback URLs use HTTPS
2. Credentials are stored securely (environment variables, secrets manager)
3. OAuth apps are configured for production domains
4. Redirect URIs are whitelisted in provider consoles

## Testing

The validator includes comprehensive unit tests:

```bash
npm test -- oauth-config.validator.spec.ts
```

Test coverage includes:
- Valid configuration scenarios
- Missing Google credentials
- Missing Facebook credentials
- Missing all credentials
- Empty string handling
- Error message formatting

## Integration

The validator is automatically integrated into the `AuthModule`:

```typescript
@Module({
  // ...
  providers: [
    // ...
    OAuthConfigValidator,
  ],
})
export class AuthModule implements OnModuleInit {
  constructor(private readonly oauthConfigValidator: OAuthConfigValidator) {}

  onModuleInit() {
    this.oauthConfigValidator.validateOAuthConfiguration();
  }
}
```

## Troubleshooting

### Application Won't Start

If the application fails to start with an OAuth configuration error:

1. Check your `.env` file exists in the `backend/` directory
2. Verify all required OAuth variables are set
3. Ensure no variables are empty strings
4. Check for typos in variable names
5. Restart the application after updating `.env`

### Provider Setup

#### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs (e.g., `http://localhost:3001/api/auth/google/callback`)
6. Copy Client ID and Client Secret to `.env`

#### Facebook OAuth Setup
1. Go to [Facebook Developers](https://developers.facebook.com/apps/)
2. Create a new app or select existing
3. Add "Facebook Login" product
4. Configure OAuth redirect URIs in Facebook Login settings
5. Copy App ID and App Secret to `.env`
6. For production, submit app for review

## Security Considerations

- Never commit `.env` files to version control
- Use different credentials for development and production
- Rotate credentials regularly
- Use HTTPS for all production callback URLs
- Implement rate limiting on OAuth endpoints
- Monitor for suspicious authentication attempts
