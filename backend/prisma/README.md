# Database Setup

This directory contains the Prisma schema, migrations, and seed scripts for the handmade e-commerce platform.

## Prerequisites

- PostgreSQL 15+ installed and running
- Node.js 18+ installed

## Setup

1. **Configure Database Connection**

   Update the `DATABASE_URL` in your `.env` file:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/database_name
   ```

2. **Run Migrations**

   Apply all database migrations:
   ```bash
   npm run prisma:migrate
   ```

3. **Seed Development Data**

   Populate the database with sample data:
   ```bash
   npm run prisma:seed
   ```

## Database Schema

The database includes the following main entities:

- **Users & Authentication**: User accounts with role-based access (Customer, Admin)
- **Product Catalog**: Products, Categories, ProductImages
- **Shopping Cart**: Cart and CartItems
- **Orders**: Orders and OrderItems with payment tracking
- **Reviews**: Product reviews with ratings
- **Wishlist**: User wishlists
- **Promotions**: Discount codes and promotional campaigns
- **Content**: CMS pages and content
- **Analytics**: Event tracking for analytics

## Seed Data

The seed script creates:

- **Admin User**: 
  - Email: `admin@handmade.com`
  - Password: `admin123`

- **Customer User**: 
  - Email: `customer@example.com`
  - Password: `customer123`

- **Categories**: Jewelry, Home Decor, Accessories, Art

- **Products**: 6 sample products across different categories

- **Promotion**: `WELCOME10` - 10% off orders over $50

- **Content Pages**: About Us, Shipping Policy, Return Policy

## Useful Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Create a new migration
npm run prisma:migrate

# Run seed script
npm run prisma:seed

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## Connection Pooling

The Prisma service is configured with connection pooling for optimal performance:

- Connections are managed automatically by Prisma
- The service connects on module initialization
- Connections are properly closed on module destruction
- Logging is enabled in development mode for debugging

## Migrations

All migrations are stored in `prisma/migrations/`. Each migration includes:

- A timestamp-based directory name
- A `migration.sql` file with the SQL commands

To create a new migration after schema changes:

```bash
npx prisma migrate dev --name description_of_changes
```

## Production Considerations

1. **Connection Pooling**: Use PgBouncer or similar for production connection pooling
2. **Backups**: Implement automated daily backups
3. **Monitoring**: Set up database performance monitoring
4. **Indexes**: All frequently queried columns are indexed
5. **Security**: Use strong passwords and restrict database access

## Troubleshooting

**Migration fails**:
- Ensure PostgreSQL is running
- Check DATABASE_URL is correct
- Verify database user has necessary permissions

**Seed script fails**:
- Run migrations first: `npm run prisma:migrate`
- Check for existing data conflicts
- Verify bcrypt is installed: `npm install bcrypt`

**Connection issues**:
- Verify PostgreSQL is accepting connections
- Check firewall settings
- Ensure database exists
