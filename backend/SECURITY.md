# Security Implementation Guide

## Overview

This document outlines the security measures implemented in the backend API to protect against common vulnerabilities and ensure data protection.

## Security Features Implemented

### 1. HTTPS and SSL Configuration

#### HTTPS Redirect
- **Location**: `src/main.ts`
- **Implementation**: Automatic redirect from HTTP to HTTPS in production
- **Configuration**: Checks `x-forwarded-proto` header (for reverse proxy setups)

#### HSTS (HTTP Strict Transport Security)
- **Implementation**: Helmet middleware with HSTS enabled
- **Configuration**:
  - `maxAge`: 31536000 seconds (1 year)
  - `includeSubDomains`: true
  - `preload`: true

#### SSL Certificate Setup (Production)
For production deployment, you need to:

1. **Obtain SSL Certificate**:
   - Use Let's Encrypt (free, automated)
   - Or purchase from a Certificate Authority
   - Or use cloud provider's certificate manager (AWS ACM, Google Cloud SSL)

2. **Configure Reverse Proxy** (Recommended approach):
   ```nginx
   server {
       listen 443 ssl http2;
       server_name yourdomain.com;
       
       ssl_certificate /path/to/certificate.crt;
       ssl_certificate_key /path/to/private.key;
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_ciphers HIGH:!aNULL:!MD5;
       
       location / {
           proxy_pass http://localhost:3001;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_set_header Host $host;
       }
   }
   
   # HTTP to HTTPS redirect
   server {
       listen 80;
       server_name yourdomain.com;
       return 301 https://$server_name$request_uri;
   }
   ```

3. **Or Configure Node.js Directly** (Not recommended for production):
   ```typescript
   import * as https from 'https';
   import * as fs from 'fs';
   
   const httpsOptions = {
     key: fs.readFileSync('./secrets/private-key.pem'),
     cert: fs.readFileSync('./secrets/certificate.pem'),
   };
   
   await app.listen(443, httpsOptions);
   ```

### 2. Security Headers (Helmet)

All security headers are configured via Helmet middleware:

#### Content Security Policy (CSP)
- Restricts resource loading to prevent XSS attacks
- Default source: self only
- Images: self, data URIs, and HTTPS sources
- Scripts: self only (no inline scripts)

#### X-Frame-Options
- Set to `DENY` to prevent clickjacking attacks
- Prevents the site from being embedded in iframes

#### X-Content-Type-Options
- Set to `nosniff`
- Prevents MIME type sniffing

#### X-XSS-Protection
- Enables browser's XSS filter
- Provides additional XSS protection for older browsers

### 3. CORS (Cross-Origin Resource Sharing)

#### Configuration
- **Whitelist-based**: Only specified origins are allowed
- **Credentials**: Enabled for cookie-based authentication
- **Methods**: GET, POST, PUT, DELETE, PATCH, OPTIONS
- **Headers**: Content-Type, Authorization, X-Requested-With

#### Environment Variables
```bash
# Single origin
FRONTEND_URL=https://yourdomain.com

# Multiple origins (comma-separated)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://admin.yourdomain.com
```

### 4. Rate Limiting

#### Global Rate Limiting
- **Implementation**: @nestjs/throttler
- **Default**: 10 requests per 60 seconds per IP
- **Location**: Applied globally via APP_GUARD

#### Custom Rate Limits
You can override rate limits for specific endpoints:

```typescript
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  // Stricter limit for login endpoint
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login() {
    // ...
  }
}
```

#### Skip Rate Limiting
For endpoints that should not be rate limited:

```typescript
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Get('public-data')
async getPublicData() {
  // ...
}
```

### 5. Input Validation and Sanitization

#### Validation Pipeline
- **Implementation**: class-validator with ValidationPipe
- **Features**:
  - `whitelist: true` - Strips unknown properties
  - `forbidNonWhitelisted: true` - Rejects requests with unknown properties
  - `transform: true` - Transforms payloads to DTO instances
  - Detailed errors hidden in production

#### Example DTO with Validation
```typescript
import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and number',
  })
  password: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Transform(({ value }) => value.trim())
  firstName: string;
}
```

### 6. SQL Injection Protection

#### Prisma ORM
- **Implementation**: All database queries use Prisma ORM
- **Protection**: Prisma automatically uses parameterized queries
- **Safe by default**: No raw SQL concatenation

#### Example Safe Query
```typescript
// Safe - Prisma handles parameterization
const user = await this.prisma.user.findUnique({
  where: { email: userInput },
});

// Also safe - Prisma escapes parameters
const products = await this.prisma.product.findMany({
  where: {
    name: { contains: searchTerm },
  },
});
```

#### Raw Queries (When Necessary)
If you must use raw SQL, always use parameterized queries:

```typescript
// Safe - uses parameterized query
const result = await this.prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${email}
`;

// NEVER do this (vulnerable to SQL injection):
// const result = await this.prisma.$queryRawUnsafe(
//   `SELECT * FROM users WHERE email = '${email}'`
// );
```

### 7. Password Security

#### Bcrypt Hashing
- **Implementation**: bcrypt with 10 salt rounds
- **Location**: `src/auth/auth.service.ts`
- **Features**:
  - Automatic salt generation
  - Slow hashing (resistant to brute force)
  - Industry-standard algorithm

#### Password Requirements
Enforced via validation:
- Minimum 8 characters
- Maximum 100 characters
- Must contain uppercase letter
- Must contain lowercase letter
- Must contain number

#### Example Implementation
```typescript
import * as bcrypt from 'bcrypt';

// Hashing
const passwordHash = await bcrypt.hash(password, 10);

// Verification
const isValid = await bcrypt.compare(password, passwordHash);
```

### 8. Authentication and Session Security

#### JWT Tokens
- **Access Token**: 15 minutes expiry
- **Refresh Token**: 7 days expiry
- **Storage**: Refresh tokens stored in httpOnly cookies (recommended)

#### Token Security
- Tokens signed with secret keys
- Separate secrets for access and refresh tokens
- Token rotation on refresh
- Tokens invalidated on logout

#### Environment Variables
```bash
JWT_SECRET=your-secret-key-change-in-production-use-long-random-string
JWT_REFRESH_SECRET=your-refresh-secret-change-in-production-use-different-long-random-string
```

**Important**: Generate strong secrets for production:
```bash
# Generate secure random secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 9. Data Encryption

#### Sensitive Data Encryption
Implemented via `EncryptionService` in `src/common/services/encryption.service.ts`:

**Currently Encrypted:**
- Passwords: bcrypt hashing (one-way, 10 salt rounds)
- JWT tokens: Signed with secret keys
- Session data: Encrypted in Redis using AES-256-GCM
- Sensitive user data: Can be encrypted using EncryptionService

#### Using the Encryption Service

**Basic Encryption/Decryption:**
```typescript
import { EncryptionService } from './common/services/encryption.service';

@Injectable()
export class MyService {
  constructor(private encryptionService: EncryptionService) {}

  async storeSensitiveData(data: string) {
    // Encrypt before storing
    const encrypted = this.encryptionService.encrypt(data);
    await this.database.save(encrypted);
  }

  async retrieveSensitiveData(id: string) {
    const encrypted = await this.database.findById(id);
    // Decrypt when retrieving
    return this.encryptionService.decrypt(encrypted);
  }
}
```

**One-Way Hashing:**
```typescript
// For data that needs comparison but not decryption
const hash = this.encryptionService.hash(sensitiveValue);

// Later, compare without decrypting
const isMatch = this.encryptionService.compareHash(inputValue, hash);
```

**Generate Secure Tokens:**
```typescript
// Generate a secure random token (e.g., for password reset)
const resetToken = this.encryptionService.generateToken(32);
```

#### Session Security

**Secure Session Management:**
Implemented via `SessionService` in `src/auth/services/session.service.ts`:

```typescript
import { SessionService } from './auth/services/session.service';

@Injectable()
export class AuthService {
  constructor(private sessionService: SessionService) {}

  async createUserSession(user: User, ipAddress: string, userAgent: string) {
    const sessionData = {
      userId: user.id,
      email: user.email,
      role: user.role,
      createdAt: new Date(),
      lastActivity: new Date(),
      ipAddress,
      userAgent,
    };

    const sessionId = await this.sessionService.createSession(sessionData);
    return sessionId;
  }

  async validateUserSession(sessionId: string, ipAddress: string, userAgent: string) {
    return await this.sessionService.validateSession(sessionId, ipAddress, userAgent);
  }
}
```

**Session Features:**
- Encrypted storage in Redis
- Automatic expiration (7 days)
- Session validation with IP/User-Agent tracking
- Secure session ID generation
- Session refresh capability

#### Encryption Configuration

**Environment Variable:**
```bash
# Generate a strong encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env
ENCRYPTION_KEY=your-generated-key-here
```

**Important Notes:**
- The encryption key must be kept secret
- Use different keys for different environments
- Rotate encryption keys periodically
- Store keys securely (use secrets management in production)
- Never commit encryption keys to version control

### 10. Additional Security Best Practices

#### Environment Variables
- Never commit `.env` files to version control
- Use different secrets for each environment
- Rotate secrets regularly
- Use strong, random values for all secrets

#### Database Security
- Use connection pooling
- Limit database user permissions
- Enable SSL for database connections in production
- Regular backups with encryption

#### Logging and Monitoring
- Log security events (failed logins, rate limit hits)
- Monitor for suspicious patterns
- Set up alerts for security incidents
- Never log sensitive data (passwords, tokens, credit cards)

#### Dependencies
- Regularly update dependencies
- Run `npm audit` to check for vulnerabilities
- Use `npm audit fix` to automatically fix issues
- Review security advisories

## Security Checklist for Production

- [ ] SSL/TLS certificate installed and configured
- [ ] HTTPS redirect enabled
- [ ] HSTS headers configured
- [ ] Strong JWT secrets generated and configured
- [ ] CORS whitelist configured with production domains
- [ ] Rate limiting enabled and tested
- [ ] Database connection uses SSL
- [ ] Environment variables secured (not in version control)
- [ ] Helmet security headers enabled
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive information
- [ ] Logging configured (without sensitive data)
- [ ] Monitoring and alerting set up
- [ ] Regular security updates scheduled
- [ ] Backup strategy implemented
- [ ] Incident response plan documented

## Testing Security

### Manual Testing

1. **HTTPS Redirect**:
   ```bash
   curl -I http://yourdomain.com
   # Should return 301 redirect to https://
   ```

2. **Security Headers**:
   ```bash
   curl -I https://yourdomain.com
   # Check for: Strict-Transport-Security, X-Frame-Options, etc.
   ```

3. **Rate Limiting**:
   ```bash
   # Send multiple requests quickly
   for i in {1..20}; do curl https://yourdomain.com/api/products; done
   # Should get 429 Too Many Requests after limit
   ```

4. **CORS**:
   ```bash
   curl -H "Origin: https://malicious-site.com" https://yourdomain.com/api/products
   # Should be blocked
   ```

### Automated Security Testing

```bash
# Check for vulnerabilities
npm audit

# Security scanning tools
npm install -g snyk
snyk test

# OWASP ZAP for penetration testing
# https://www.zaproxy.org/
```

## Incident Response

If a security incident occurs:

1. **Immediate Actions**:
   - Isolate affected systems
   - Revoke compromised credentials
   - Enable additional logging

2. **Investigation**:
   - Review logs for suspicious activity
   - Identify scope of breach
   - Document findings

3. **Remediation**:
   - Patch vulnerabilities
   - Reset all secrets and tokens
   - Notify affected users if required

4. **Prevention**:
   - Update security measures
   - Conduct security review
   - Update incident response plan

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security](https://docs.nestjs.com/security/helmet)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
