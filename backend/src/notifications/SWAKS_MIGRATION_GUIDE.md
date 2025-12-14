# Migration Guide: mail → swaks

## Overview

This guide explains the migration from the Linux `mail` command to `swaks` (Swiss Army Knife for SMTP) for email sending in the AlaCraft e-commerce platform.

## Why Migrate?

### Problems with `mail` command:
- ❌ Limited HTML support (requires conversion to plain text)
- ❌ No built-in SMTP authentication
- ❌ Difficult to configure for external SMTP servers
- ❌ Poor error messages
- ❌ Not production-ready without additional mail server setup

### Benefits of `swaks`:
- ✅ Native HTML email support
- ✅ Built-in SMTP authentication (LOGIN, PLAIN, CRAM-MD5, etc.)
- ✅ Works with all major email providers out of the box
- ✅ Excellent debugging and error messages
- ✅ Production-ready
- ✅ Easy to configure via environment variables

## Installation

### Ubuntu/Debian
```bash
sudo apt-get update
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

### Verify Installation
```bash
swaks --version
```

## Configuration

### 1. Update Environment Variables

Add the following to your `.env` file:

```env
# SMTP Configuration
SMTP_SERVER=localhost              # SMTP server hostname or IP
SMTP_PORT=25                       # SMTP server port (25, 587, or 465)
SMTP_FROM=noreply@alacraft.com    # From email address
SMTP_USER=                         # SMTP username (optional)
SMTP_PASSWORD=                     # SMTP password (optional)
```

### 2. Configuration Examples

#### Local Mail Server (No Authentication)
```env
SMTP_SERVER=localhost
SMTP_PORT=25
SMTP_FROM=noreply@alacraft.com
SMTP_USER=
SMTP_PASSWORD=
```

#### Gmail SMTP
```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_FROM=your-email@gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

**Note**: For Gmail, you need to create an [App Password](https://support.google.com/accounts/answer/185833).

#### SendGrid SMTP
```env
SMTP_SERVER=smtp.sendgrid.net
SMTP_PORT=587
SMTP_FROM=noreply@alacraft.com
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

#### AWS SES SMTP
```env
SMTP_SERVER=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_FROM=noreply@alacraft.com
SMTP_USER=your-ses-smtp-username
SMTP_PASSWORD=your-ses-smtp-password
```

#### Mailgun SMTP
```env
SMTP_SERVER=smtp.mailgun.org
SMTP_PORT=587
SMTP_FROM=noreply@yourdomain.com
SMTP_USER=postmaster@yourdomain.com
SMTP_PASSWORD=your-mailgun-password
```

## Testing

### 1. Test swaks Installation

Run the test script to verify swaks is working:

```bash
cd backend
ts-node scripts/test-swaks-email.ts your-email@example.com
```

This will send a test HTML email to the specified address.

### 2. Test Application Emails

Test the various email types in your application:

#### Order Confirmation Email
```bash
# Create an order through the API or frontend
# Check the customer's email inbox
```

#### Welcome Email
```bash
# Register a new user
# Check the user's email inbox
```

#### Password Reset Email
```bash
# Request a password reset
# Check the user's email inbox
```

## Code Changes

### What Changed

The `EmailService` (`backend/src/notifications/services/email.service.ts`) was updated to:

1. Use `swaks` command instead of `mail`
2. Send HTML emails directly (no conversion to plain text)
3. Support SMTP authentication
4. Read SMTP configuration from environment variables

### What Stayed the Same

- ✅ All email templates remain unchanged
- ✅ All method signatures remain the same
- ✅ No changes needed in OrdersService, AuthService, or ContactService
- ✅ Error handling behavior is identical
- ✅ Bilingual support works the same way

### Migration is Transparent

The migration is completely transparent to the rest of the application. No code changes are needed outside of the `EmailService`.

## Troubleshooting

### swaks: command not found

**Problem**: swaks is not installed on the system.

**Solution**: Install swaks using the instructions above.

### Connection refused

**Problem**: Cannot connect to SMTP server.

**Solution**:
- Check that `SMTP_SERVER` and `SMTP_PORT` are correct
- Verify the SMTP server is running and accessible
- Check firewall rules

### Authentication failed

**Problem**: SMTP authentication is failing.

**Solution**:
- Verify `SMTP_USER` and `SMTP_PASSWORD` are correct
- For Gmail, ensure you're using an App Password, not your regular password
- Check that the SMTP provider allows authentication from your IP

### Emails not being received

**Problem**: Emails are sent but not received.

**Solution**:
- Check spam/junk folders
- Verify the `SMTP_FROM` address is valid and authorized
- Check SMTP provider logs for delivery issues
- Ensure SPF/DKIM records are configured (for production)

### HTML not rendering

**Problem**: Emails show HTML code instead of formatted content.

**Solution**: This should not happen with swaks as it sets the Content-Type header correctly. If it does:
- Check email client settings
- Verify the email client supports HTML emails
- Check the swaks command output for errors

## Production Deployment

### Recommended Setup

1. **Use a dedicated SMTP service**:
   - SendGrid (recommended for ease of use)
   - AWS SES (recommended for AWS deployments)
   - Mailgun
   - Postmark

2. **Configure SPF and DKIM records**:
   - Add SPF record to your domain's DNS
   - Configure DKIM signing with your SMTP provider
   - This improves email deliverability

3. **Monitor email delivery**:
   - Set up logging for email failures
   - Monitor bounce rates
   - Track delivery rates

4. **Use environment-specific configuration**:
   ```env
   # Development
   SMTP_SERVER=localhost
   SMTP_PORT=25

   # Staging
   SMTP_SERVER=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASSWORD=staging-api-key

   # Production
   SMTP_SERVER=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASSWORD=production-api-key
   ```

## Rollback Plan

If you need to rollback to the `mail` command:

1. Revert the changes in `EmailService`:
   ```typescript
   // Old implementation using mail command
   const plainText = this.htmlToPlainText(html);
   const command = `echo "${plainText.replace(/"/g, '\\"')}" | mail -s "${subject.replace(/"/g, '\\"')}" "${to}"`;
   ```

2. Remove SMTP configuration from `.env`

3. Ensure `mailutils` is installed:
   ```bash
   sudo apt-get install mailutils
   ```

However, we recommend staying with swaks as it provides better functionality and production-readiness.

## Support

For issues or questions:
1. Check the [swaks documentation](http://www.jetmore.org/john/code/swaks/)
2. Review the test script: `backend/scripts/test-swaks-email.ts`
3. Check application logs for error messages
4. Consult your SMTP provider's documentation

## Summary

The migration from `mail` to `swaks` provides:
- ✅ Better HTML email support
- ✅ Production-ready SMTP authentication
- ✅ Compatibility with all major email providers
- ✅ Improved error messages and debugging
- ✅ No changes needed in application code (except EmailService)

The migration is straightforward and provides significant benefits for production deployments.
