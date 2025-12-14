# swaks Email Service - Quick Reference

## Installation

```bash
# Ubuntu/Debian
sudo apt-get install swaks

# macOS
brew install swaks

# Verify
swaks --version
```

## Environment Variables

```env
SMTP_SERVER=localhost              # SMTP server
SMTP_PORT=25                       # Port (25, 587, 465)
SMTP_FROM=noreply@alacraft.com    # From address
SMTP_USER=                         # Username (optional)
SMTP_PASSWORD=                     # Password (optional)
```

## Quick Test

```bash
ts-node backend/scripts/test-swaks-email.ts your-email@example.com
```

## Common Configurations

### Local Mail Server
```env
SMTP_SERVER=localhost
SMTP_PORT=25
SMTP_FROM=noreply@alacraft.com
```

### Gmail
```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_FROM=your-email@gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### SendGrid
```env
SMTP_SERVER=smtp.sendgrid.net
SMTP_PORT=587
SMTP_FROM=noreply@alacraft.com
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

### AWS SES
```env
SMTP_SERVER=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_FROM=noreply@alacraft.com
SMTP_USER=your-ses-smtp-username
SMTP_PASSWORD=your-ses-smtp-password
```

## Troubleshooting

| Error | Solution |
|-------|----------|
| `swaks: command not found` | Install swaks |
| `Connection refused` | Check SMTP_SERVER and SMTP_PORT |
| `Authentication failed` | Verify SMTP_USER and SMTP_PASSWORD |
| `Emails not received` | Check spam folder, verify SMTP_FROM |

## Email Types Sent

- ✉️ Order confirmation (customer)
- ✉️ Order notification (admin)
- ✉️ Shipping notification (customer)
- ✉️ Order status update (customer)
- ✉️ Welcome email (new users)
- ✉️ Password reset (users)
- ✉️ Contact form (admin)

## Code Usage

No changes needed! The EmailService handles everything:

```typescript
// In OrdersService, AuthService, ContactService
await this.emailService.sendEmail({
  to: 'customer@example.com',
  subject: 'Order Confirmation',
  html: '<h1>Thank you!</h1>',
  locale: 'en'
});
```

## Documentation

- Full guide: `SWAKS_MIGRATION_GUIDE.md`
- Implementation: `README.md`
- Summary: `SWAKS_UPDATE_SUMMARY.md`
