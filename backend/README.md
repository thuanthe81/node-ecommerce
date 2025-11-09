# Backend - Handmade E-commerce Platform

NestJS backend API with TypeScript, PostgreSQL, and Redis.

## Features

- NestJS framework with TypeScript
- PostgreSQL database with Prisma ORM
- Redis for caching and session management
- JWT authentication
- RESTful API design
- Swagger API documentation

## Getting Started

### Install Dependencies

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### Database Setup

Make sure PostgreSQL and Redis are running locally:

**Check PostgreSQL:**
```bash
pg_isready -h localhost -p 5432
```

**Check Redis:**
```bash
redis-cli ping
```

**Create Database:**
```bash
createdb handmade_ecommerce
```

### Run Development Server

```bash
npm run start:dev
```

The API will be available at [http://localhost:3001](http://localhost:3001).

## Project Structure

```
backend/
├── src/
│   ├── auth/           # Authentication module
│   ├── users/          # User management
│   ├── products/       # Product catalog
│   ├── orders/         # Order processing
│   ├── common/         # Shared utilities
│   └── main.ts         # Application entry point
├── prisma/             # Database schema and migrations
└── test/               # E2E tests
```

## Available Scripts

- `npm run start:dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start:prod` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run E2E tests

## API Documentation

Swagger documentation is available at [http://localhost:3001/api](http://localhost:3001/api) when running in development mode.

## Learn More

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
