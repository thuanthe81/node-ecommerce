# Database Configuration

## Overview

This project uses **Prisma** as the ORM with **PostgreSQL** as the database. The database schema supports a full-featured e-commerce platform with bilingual content (English and Vietnamese).

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Copy `.env.example` to `.env` and update the `DATABASE_URL`:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/database_name
   ```

3. **Run migrations**:
   ```bash
   npm run prisma:migrate
   ```

4. **Seed the database**:
   ```bash
   npm run prisma:seed
   ```

5. **Verify setup**:
   ```bash
   npx ts-node prisma/verify-setup.ts
   ```

## Database Schema

### Core Entities

#### Users & Authentication
- **User**: Customer and admin accounts with role-based access
- **Address**: Multiple shipping/billing addresses per user

#### Product Catalog
- **Category**: Hierarchical product categories with bilingual names
- **Product**: Products with bilingual content, pricing, and inventory
- **ProductImage**: Multiple images per product with alt text

#### Shopping & Orders
- **Cart**: Shopping carts (session-based or user-based)
- **CartItem**: Items in shopping carts
- **Order**: Customer orders with payment and shipping info
- **OrderItem**: Line items in orders

#### Reviews & Wishlist
- **Review**: Product reviews with ratings and verification
- **Wishlist**: User wishlists
- **WishlistItem**: Products in wishlists

#### Promotions & Content
- **Promotion**: Discount codes with usage limits
- **Content**: CMS pages and content (FAQ, policies, etc.)

#### Analytics
- **AnalyticsEvent**: Event tracking for analytics

## Connection Pooling

Prisma automatically manages database connections with built-in connection pooling:

- **Development**: Connections are managed per Prisma Client instance
- **Production**: Consider using PgBouncer for additional connection pooling at the infrastructure level

### Configuration

The `PrismaService` is configured as a global module and includes:

- Automatic connection on module initialization
- Proper disconnection on module destruction
- Query logging in development mode
- Connection pooling managed by Prisma

### Production Recommendations

For production environments:

1. **Use PgBouncer** for connection pooling:
   ```
   DATABASE_URL=postgresql://user:password@pgbouncer:6432/database
   ```

2. **Configure connection limits** in your PostgreSQL server:
   ```sql
   ALTER SYSTEM SET max_connections = 100;
   ```

3. **Monitor connection usage** with tools like pgAdmin or DataDog

## Migrations

### Creating Migrations

After modifying `prisma/schema.prisma`:

```bash
npx prisma migrate dev --name description_of_changes
```

### Applying Migrations in Production

```bash
npx prisma migrate deploy
```

### Rolling Back Migrations

Prisma doesn't support automatic rollbacks. To rollback:

1. Restore database from backup
2. Or manually write and execute rollback SQL

## Seeding

The seed script (`prisma/seed.ts`) creates:

- 2 users (1 admin, 1 customer)
- 4 product categories
- 6 sample products with images
- 1 promotional code
- 3 content pages

### Running Seeds

```bash
npm run prisma:seed
```

### Custom Seed Data

Modify `prisma/seed.ts` to add your own seed data.

## Indexes

The schema includes indexes on frequently queried columns:

- User email
- Product slug, SKU, category
- Order number, status, dates
- Category slug, parent
- All foreign keys

## Data Types

### Decimal Fields

Price and monetary values use `Decimal` type for precision:
- `price`, `compareAtPrice`, `costPrice`
- `subtotal`, `total`, `shippingCost`, `taxAmount`

### Enums

- `UserRole`: CUSTOMER, ADMIN
- `OrderStatus`: PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED
- `PaymentStatus`: PENDING, PAID, FAILED, REFUNDED
- `PromotionType`: PERCENTAGE, FIXED
- `ContentType`: PAGE, FAQ, BANNER
- `AnalyticsEventType`: PAGE_VIEW, PRODUCT_VIEW, ADD_TO_CART, PURCHASE, SEARCH

### JSON Fields

- `AnalyticsEvent.metadata`: Flexible JSON storage for event data

## Bilingual Content

Products, categories, and content support both English and Vietnamese:

- Product: `nameEn`, `nameVi`, `descriptionEn`, `descriptionVi`
- Category: `nameEn`, `nameVi`, `descriptionEn`, `descriptionVi`
- Content: `titleEn`, `titleVi`, `contentEn`, `contentVi`
- ProductImage: `altTextEn`, `altTextVi`

## Useful Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Create migration
npm run prisma:migrate

# Seed database
npm run prisma:seed

# Open Prisma Studio (GUI)
npm run prisma:studio

# Format schema file
npx prisma format

# Validate schema
npx prisma validate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## Troubleshooting

### Connection Issues

**Error: Can't reach database server**
- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL is correct
- Ensure PostgreSQL is accepting connections

**Error: Authentication failed**
- Verify username and password in DATABASE_URL
- Check PostgreSQL user permissions

### Migration Issues

**Error: Migration failed**
- Check for conflicting data
- Review migration SQL in `prisma/migrations/`
- Consider manual data migration if needed

**Error: Database is out of sync**
- Run `npx prisma migrate dev` to sync
- Or `npx prisma db push` for prototyping

### Performance Issues

**Slow queries**
- Check query execution with Prisma query logging
- Add indexes to frequently queried columns
- Use `include` and `select` to optimize data fetching

**Too many connections**
- Implement connection pooling with PgBouncer
- Reduce connection pool size in application
- Monitor active connections: `SELECT count(*) FROM pg_stat_activity;`

## Security

### Best Practices

1. **Never commit `.env` files** - Use `.env.example` as template
2. **Use strong passwords** for database users
3. **Restrict database access** to application servers only
4. **Enable SSL** for database connections in production
5. **Regular backups** - Implement automated backup strategy
6. **Monitor access** - Log and review database access patterns

### Production DATABASE_URL

For production, use SSL and connection pooling:

```
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require&connection_limit=10
```

## Backup & Recovery

### Manual Backup

```bash
pg_dump -U username -d database_name > backup.sql
```

### Restore from Backup

```bash
psql -U username -d database_name < backup.sql
```

### Automated Backups

Set up automated backups using:
- AWS RDS automated backups
- Google Cloud SQL automated backups
- Cron jobs with pg_dump

## Monitoring

### Key Metrics to Monitor

- Connection count
- Query execution time
- Database size
- Index usage
- Cache hit ratio
- Replication lag (if using replicas)

### Tools

- **Prisma Studio**: Visual database browser
- **pgAdmin**: PostgreSQL administration
- **DataDog**: Application performance monitoring
- **New Relic**: Database performance monitoring

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
