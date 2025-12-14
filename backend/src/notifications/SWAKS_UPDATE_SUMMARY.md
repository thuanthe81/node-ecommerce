# Email Service Update: mail → swaks

## Summary

Successfully migrated the email notification system from the Linux `mail` command to `swaks` (Swiss Army Knife for SMTP) to provide better HTML email support, SMTP authentication, and production-ready email delivery.

## Changes Made

### 1. Core Service Update

**File**: `backend/src/notifications/services/email.service.ts`

**Changes**:
- Replaced `mail` command with `swaks` command
- Added SMTP configuration support via environment variables
- Added SMTP authentication support (LOGIN method)
- Removed HTML-to-plain-text conversion (swaks sends HTML directly)
- Added proper Content-Type header for HTML emails

**New Environment Variables**:
- `SMTP_SERVER` - SMTP server hostname or IP (default: localhost)
- `SMTP_PORT` - SMTP server port (default: 25)
- `SMTP_FROM` - From email address (default: noreply@alacraft.com)
- `SMTP_USER` - SMTP username for authentication (optional)
- `SMTP_PASSWORD` - SMTP password for authentication (optional)

### 2. Configuration Files

**File**: `backend/.env.example`

**Added**:
```env
# SMTP Configuration (for swaks email sending)
SMTP_SERVER=localhost
SMTP_PORT=25
SMTP_FROM=noreply@alacraft.com
SMTP_USER=
SMTP_PASSWORD=
```

### 3. Documentation Updates

**Files Updated**:
- `backend/src/notifications/README.md`
  - Updated prerequisites to use swaks instead of mail
  - Added SMTP configuration section
  - Added configuration examples for Gmail, SendGrid, AWS SES, Mailgun
  - Updated email service description
  - Added migration note

- `backend/src/notifications/IMPLEMENTATION_SUMMARY.md`
  - Updated overview to mention swaks
  - Updated EmailService description
  - Added SMTP configuration section
  - Updated testing recommendations
  - Updated production considerations

**Files Created**:
- `backend/src/notifications/SWAKS_MIGRATION_GUIDE.md`
  - Complete migration guide from mail to swaks
  - Installation instructions for all platforms
  - Configuration examples for major SMTP providers
  - Testing procedures
  - Troubleshooting guide
  - Production deployment recommendations

- `backend/scripts/test-swaks-email.ts`
  - Test script to verify swaks installation and configuration
  - Sends a test HTML email
  - Validates email format
  - Provides helpful error messages

- `backend/src/notifications/SWAKS_UPDATE_SUMMARY.md` (this file)
  - Summary of all changes made

## Benefits

### Before (mail command):
- ❌ Limited HTML support (required conversion to plain text)
- ❌ No built-in SMTP authentication
- ❌ Difficult to configure for external SMTP servers
- ❌ Poor error messages
- ❌ Not production-ready without additional setup

### After (swaks):
- ✅ Native HTML email support
- ✅ Built-in SMTP authentication
- ✅ Works with all major email providers
- ✅ Excellent debugging and error messages
- ✅ Production-ready
- ✅ Easy configuration via environment variables

## Backward Compatibility

### What Stayed the Same:
- ✅ All email templates remain unchanged
- ✅ All method signatures remain the same
- ✅ No changes needed in OrdersService, AuthService, or ContactService
- ✅ Error handling behavior is identical
- ✅ Bilingual support works the same way
- ✅ Email validation works the same way

### What Changed:
- Email sending mechanism (internal to EmailService)
- Configuration method (environment variables instead of system mail config)
- HTML emails are sent directly (no conversion to plain text)

## Installation

### Ubuntu/Debian
```bash
sudo apt-get install swaks
```

### CentOS/RHEL
```bash
sudo yum install swaks
```

### macOS
```bash
brew install swaks
```

## Configuration

### Minimal Configuration (Local Mail Server)
```env
SMTP_SERVER=localhost
SMTP_PORT=25
SMTP_FROM=noreply@alacraft.com
```

### Production Configuration (SendGrid Example)
```env
SMTP_SERVER=smtp.sendgrid.net
SMTP_PORT=587
SMTP_FROM=noreply@alacraft.com
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

## Testing

### 1. Test swaks Installation
```bash
swaks --version
```

### 2. Test Email Sending
```bash
cd backend
ts-node scripts/test-swaks-email.ts your-email@example.com
```

### 3. Test Application Emails
- Create an order → Check for confirmation email
- Register a new user → Check for welcome email
- Request password reset → Check for reset email

## Migration Steps for Existing Deployments

1. **Install swaks** on your server
   ```bash
   sudo apt-get install swaks  # Ubuntu/Debian
   ```

2. **Add SMTP configuration** to your `.env` file
   ```env
   SMTP_SERVER=localhost
   SMTP_PORT=25
   SMTP_FROM=noreply@alacraft.com
   ```

3. **Deploy the updated code**
   ```bash
   git pull
   npm install
   npm run build
   pm2 restart all
   ```

4. **Test email functionality**
   ```bash
   ts-node scripts/test-swaks-email.ts admin@example.com
   ```

5. **Monitor logs** for any email-related errors
   ```bash
   pm2 logs
   ```

## Production Recommendations

### 1. Use a Dedicated SMTP Service

Instead of a local mail server, use a professional SMTP service:

- **SendGrid** (recommended for ease of use)
  - Reliable delivery
  - Good free tier
  - Excellent documentation

- **AWS SES** (recommended for AWS deployments)
  - Cost-effective
  - Integrates with AWS infrastructure
  - High deliverability

- **Mailgun** (good alternative)
  - Developer-friendly
  - Good API
  - Reliable

### 2. Configure DNS Records

For production email delivery:
- Add SPF record to your domain
- Configure DKIM signing
- Set up DMARC policy

### 3. Monitor Email Delivery

- Set up logging for email failures
- Monitor bounce rates
- Track delivery rates
- Set up alerts for email issues

## Troubleshooting

### swaks: command not found
**Solution**: Install swaks using the instructions above

### Connection refused
**Solution**: Check SMTP_SERVER and SMTP_PORT are correct

### Authentication failed
**Solution**: Verify SMTP_USER and SMTP_PASSWORD are correct

### Emails not received
**Solution**: Check spam folder, verify SMTP_FROM is authorized

See `SWAKS_MIGRATION_GUIDE.md` for detailed troubleshooting.

## Files Modified

### Modified:
- `backend/src/notifications/services/email.service.ts`
- `backend/.env.example`
- `backend/src/notifications/README.md`
- `backend/src/notifications/IMPLEMENTATION_SUMMARY.md`

### Created:
- `backend/scripts/test-swaks-email.ts`
- `backend/src/notifications/SWAKS_MIGRATION_GUIDE.md`
- `backend/src/notifications/SWAKS_UPDATE_SUMMARY.md`

## Testing Status

✅ TypeScript compilation successful
✅ No diagnostic errors
✅ All existing tests still pass (using mocks)
✅ Test script created for manual testing

## Next Steps

1. Install swaks on development/staging/production servers
2. Configure SMTP settings in environment files
3. Test email functionality in each environment
4. Monitor email delivery in production
5. Consider setting up email queue for better reliability (future enhancement)

## Support

For questions or issues:
- Review `SWAKS_MIGRATION_GUIDE.md` for detailed instructions
- Check `README.md` for configuration examples
- Run test script: `ts-node scripts/test-swaks-email.ts`
- Check application logs for error messages

---

**Migration Date**: December 2025
**Status**: ✅ Complete and Ready for Deployment
