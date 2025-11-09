# Handmade E-commerce Platform

A full-featured e-commerce platform for selling handmade products, built with Next.js and NestJS.

## Project Structure

```
handmade-ecommerce/
├── frontend/          # Next.js 14+ frontend application
├── backend/           # NestJS backend API
├── docker-compose.yml # Local development services
└── package.json       # Root workspace configuration
```

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+ (running locally on port 5432)
- Redis 7+ (running locally on port 6379)

### Installing Prerequisites

**macOS (using Homebrew):**
```bash
brew install postgresql@15 redis
brew services start postgresql@15
brew services start redis
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install postgresql-15 redis-server
sudo systemctl start postgresql
sudo systemctl start redis
```

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

Create the database:

```bash
createdb handmade_ecommerce
```

Or using psql:
```bash
psql -U postgres -c "CREATE DATABASE handmade_ecommerce;"
```

### 3. Set Up Environment Variables

Create `.env` files in both frontend and backend directories (see respective README files).

### 4. Run Development Servers

```bash
npm run dev
```

This will start both frontend (http://localhost:3000) and backend (http://localhost:3001) servers.

## Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:frontend` - Start only frontend
- `npm run dev:backend` - Start only backend
- `npm run build` - Build both applications
- `npm run lint` - Lint all workspaces
- `npm run format` - Format code with Prettier

## Technology Stack

- **Frontend**: Next.js 14+, React 18+, TypeScript, TailwindCSS
- **Backend**: NestJS, TypeScript
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **ORM**: Prisma

## License

MIT
