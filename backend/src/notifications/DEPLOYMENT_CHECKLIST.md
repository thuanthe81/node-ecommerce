# swaks Email Service - Deployment Checklist

Use this checklist when deploying the swaks email service update to any environment.

## Pre-Deployment

### 1. Code Review
- [ ] Review changes in `email.service.ts`
- [ ] Review updated documentation
- [ ] Verify no breaking changes in method signatures
- [ ] Check TypeScript compilation passes
- [ ] Verify existing tests still pass

### 2. Environment Preparation
- [ ] Identify target environment (dev/staging/production)
- [ ] Determine SMTP provider to use
- [ ] Obtain SMTP credentials if needed
- [ ] Document SMTP configuration

## Installation

### 3. Install swaks
- [ ] SSH into server
- [ ] Run installation command:
  ```bash
  # Ubuntu/Debian
  sudo apt-get update
  sudo apt-get install swaks

  # CentOS/RHEL
  sudo yum install swaks

  # macOS
  brew install swaks
  ```
- [ ] Verify installation:
  ```bash
  swaks --version
  ```

## Configuration

### 4. Update Environment Variables
- [ ] Backup existing `.env` file
- [ ] Add SMTP configuration to `.env`:
  ```env
  SMTP_SERVER=your-smtp-server
  SMTP_PORT=587
  SMTP_FROM=noreply@alacraft.com
  SMTP_USER=your-username
  SMTP_PASSWORD=your-password
  ```
- [ ] Verify all required variables are set
- [ ] Ensure sensitive credentials are secure

### 5. DNS Configuration (Production Only)
- [ ] Add SPF record to domain DNS
- [ ] Configure DKIM with SMTP provider
- [ ] Set up DMARC policy
- [ ] Verify DNS propagation

## Deployment

### 6. Deploy Code
- [ ] Pull latest code:
  ```bash
  git pull origin main
  ```
- [ ] Install dependencies:
  ```bash
  npm install
  ```
- [ ] Build application:
  ```bash
  npm run build
  ```
- [ ] Restart application:
  ```bash
  pm2 restart all
  # or
  systemctl restart your-app
  ```

## Testing

### 7. Verify Installation
- [ ] Check application logs for startup errors
- [ ] Verify no email-related errors in logs
- [ ] Confirm application is running

### 8. Test Email Sending
- [ ] Run test script:
  ```bash
  ts-node scripts/test-swaks-email.ts admin@example.com
  ```
- [ ] Verify test email is received
- [ ] Check email formatting (HTML rendering)
- [ ] Verify sender address is correct

### 9. Test Application Emails
- [ ] Test order confirmation email:
  - [ ] Create a test order
  - [ ] Verify customer receives email
  - [ ] Check email content and formatting

- [ ] Test admin order notification:
  - [ ] Create a test order
  - [ ] Verify admin receives email
  - [ ] Check all order details are present

- [ ] Test welcome email:
  - [ ] Register a new test user
  - [ ] Verify welcome email is received
  - [ ] Check email content

- [ ] Test password reset email:
  - [ ] Request password reset
  - [ ] Verify reset email is received
  - [ ] Test reset link works

- [ ] Test contact form email:
  - [ ] Submit contact form
  - [ ] Verify admin receives email
  - [ ] Check message content

### 10. Test Both Languages
- [ ] Test emails in English (locale: 'en')
- [ ] Test emails in Vietnamese (locale: 'vi')
- [ ] Verify translations are correct
- [ ] Check character encoding (UTF-8)

## Monitoring

### 11. Set Up Monitoring
- [ ] Configure log monitoring for email errors
- [ ] Set up alerts for email failures
- [ ] Monitor email delivery rates
- [ ] Track bounce rates (if available)

### 12. Initial Monitoring Period
- [ ] Monitor logs for 24 hours
- [ ] Check for any email-related errors
- [ ] Verify email delivery is working
- [ ] Address any issues immediately

## Post-Deployment

### 13. Documentation
- [ ] Update deployment documentation
- [ ] Document SMTP configuration used
- [ ] Note any issues encountered
- [ ] Update runbook if needed

### 14. Team Communication
- [ ] Notify team of successful deployment
- [ ] Share any configuration changes
- [ ] Provide troubleshooting contacts
- [ ] Update team documentation

## Rollback Plan

### 15. If Issues Occur
- [ ] Check application logs for errors
- [ ] Verify SMTP configuration is correct
- [ ] Test swaks command manually
- [ ] Check SMTP provider status
- [ ] Review troubleshooting guide
- [ ] Contact SMTP provider support if needed

### 16. Emergency Rollback (if necessary)
- [ ] Revert to previous code version:
  ```bash
  git checkout <previous-commit>
  npm install
  npm run build
  pm2 restart all
  ```
- [ ] Verify application is working
- [ ] Document rollback reason
- [ ] Plan fix for next deployment

## Environment-Specific Notes

### Development
- [ ] Can use localhost SMTP (no authentication)
- [ ] Test emails may go to spam
- [ ] Use test email addresses

### Staging
- [ ] Use staging SMTP credentials
- [ ] Test with real email addresses
- [ ] Verify production-like behavior

### Production
- [ ] Use production SMTP credentials
- [ ] Ensure DNS records are configured
- [ ] Monitor delivery rates closely
- [ ] Have support contacts ready

## Sign-Off

- [ ] Deployment completed by: ________________
- [ ] Date: ________________
- [ ] Environment: ________________
- [ ] All tests passed: Yes / No
- [ ] Issues encountered: ________________
- [ ] Resolution: ________________

## Support Contacts

- SMTP Provider Support: ________________
- DevOps Team: ________________
- On-Call Engineer: ________________

---

**Note**: Keep this checklist with your deployment documentation and update it based on your experience.
