# Security Quick Reference Guide

## For Developers

### 1. Input Validation & Sanitization

**Always use DTOs with validation decorators:**

```typescript
import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';
import { SanitizeString, SanitizeEmail } from '../common/decorators/sanitize.decorator';

export class MyDto {
  @IsEmail()
  @SanitizeEmail()
  email: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @SanitizeString()
  name: string;
}
```

### 2. Rate Limiting

**Apply custom rate limits to sensitive endpoints:**

```typescript
import { Throttle } from '@nestjs/throttler';

@Controller('sensitive')
export class SensitiveController {
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  @Post('action')
  async sensitiveAction() {
    // ...
  }
}
```

### 3. Encrypting Sensitive Data

**Use EncryptionService for sensitive data:**

```typescript
import { EncryptionService } from '../common/services/encryption.service';

@Injectable()
export class MyService {
  constructor(private encryptionService: EncryptionService) {}

  async storeSensitiveData(data: string) {
    const encrypted = this.encryptionService.encrypt(data);
    await this.repository.save({ data: encrypted });
  }

  async retrieveSensitiveData(id: string) {
    const record = await this.repository.findById(id);
    return this.encryptionService.decrypt(record.data);
  }
}
```

### 4. Session Management

**Create and validate sessions:**

```typescript
import { SessionService } from '../auth/services/session.service';

@Injectable()
export class MyService {
  constructor(private sessionService: SessionService) {}

  async createSession(user: User, req: Request) {
    const sessionData = {
      userId: user.id,
      email: user.email,
      role: user.role,
      createdAt: new Date(),
      lastActivity: new Date(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };

    return await this.sessionService.createSession(sessionData);
  }
}
```

### 5. Password Requirements

**Enforce strong passwords:**
- Minimum 8 characters
- Maximum 100 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

```typescript
@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
  message: 'Password must contain uppercase, lowercase, and number',
})
password: string;
```

### 6. Public Endpoints

**Mark public endpoints explicitly:**

```typescript
import { Public } from '../auth/decorators/public.decorator';

@Controller('public')
export class PublicController {
  @Public()
  @Get('data')
  async getPublicData() {
    // This endpoint doesn't require authentication
  }
}
```

### 7. Database Queries

**Always use Prisma's parameterized queries:**

```typescript
// ✅ SAFE - Prisma handles parameterization
const user = await this.prisma.user.findUnique({
  where: { email: userInput },
});

// ✅ SAFE - Prisma escapes parameters
const products = await this.prisma.product.findMany({
  where: {
    name: { contains: searchTerm },
  },
});

// ⚠️ Use with caution - only when necessary
const result = await this.prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${email}
`;

// ❌ NEVER DO THIS - SQL injection vulnerability
// const result = await this.prisma.$queryRawUnsafe(
//   `SELECT * FROM users WHERE email = '${email}'`
// );
```

### 8. Error Handling

**Don't leak sensitive information in errors:**

```typescript
// ❌ BAD - Leaks database structure
throw new Error(`Database error: ${error.message}`);

// ✅ GOOD - Generic error message
throw new BadRequestException('Invalid request');

// ✅ GOOD - Log details, show generic message
this.logger.error(`Database error: ${error.message}`);
throw new InternalServerErrorException('An error occurred');
```

### 9. CORS Configuration

**Update allowed origins in .env:**

```bash
# Development
ALLOWED_ORIGINS=http://localhost:3000

# Production
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 10. Security Headers

**Headers are automatically applied via Helmet:**
- Content-Security-Policy
- Strict-Transport-Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection

No additional configuration needed!

## Common Security Mistakes to Avoid

### ❌ Don't Do This:

1. **Storing passwords in plain text**
   ```typescript
   // ❌ NEVER
   user.password = password;
   ```

2. **Concatenating SQL queries**
   ```typescript
   // ❌ NEVER
   const query = `SELECT * FROM users WHERE id = ${userId}`;
   ```

3. **Exposing sensitive data in responses**
   ```typescript
   // ❌ NEVER
   return user; // Includes passwordHash
   ```

4. **Using weak secrets**
   ```bash
   # ❌ NEVER
   JWT_SECRET=secret123
   ```

5. **Skipping input validation**
   ```typescript
   // ❌ NEVER
   async createUser(@Body() data: any) {
     // No validation!
   }
   ```

### ✅ Do This Instead:

1. **Hash passwords with bcrypt**
   ```typescript
   const passwordHash = await bcrypt.hash(password, 10);
   ```

2. **Use Prisma's parameterized queries**
   ```typescript
   const user = await this.prisma.user.findUnique({ where: { id: userId } });
   ```

3. **Sanitize responses**
   ```typescript
   const { passwordHash, ...sanitized } = user;
   return sanitized;
   ```

4. **Generate strong secrets**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

5. **Always use DTOs with validation**
   ```typescript
   async createUser(@Body() createUserDto: CreateUserDto) {
     // Validated and sanitized!
   }
   ```

## Security Checklist for New Features

- [ ] Input validation with DTOs
- [ ] Input sanitization applied
- [ ] Rate limiting configured (if needed)
- [ ] Authentication required (unless public)
- [ ] Authorization checks implemented
- [ ] Sensitive data encrypted
- [ ] Error messages don't leak information
- [ ] Database queries use Prisma (no raw SQL)
- [ ] Responses don't include sensitive data
- [ ] Logging doesn't include sensitive data

## Getting Help

- Review `SECURITY.md` for detailed documentation
- Check `SECURITY_IMPLEMENTATION_SUMMARY.md` for implementation details
- Consult OWASP guidelines for best practices
- Ask security questions in code reviews

## Emergency Contacts

If you discover a security vulnerability:
1. Do NOT commit the vulnerability
2. Do NOT discuss publicly
3. Report immediately to the security team
4. Document the issue privately
