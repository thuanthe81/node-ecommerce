# Handmade E-commerce Platform

A full-featured e-commerce platform for selling handmade products, built with Next.js and NestJS.

## Project Structure

```
handmade-ecommerce/
├── frontend/          # Next.js 14+ frontend application
├── backend/           # NestJS backend API
├── shared/            # Shared TypeScript types and utilities
├── docker-compose.yml # Local development services
└── dev.sh             # Development script to run both servers
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

Install dependencies for each workspace separately:

```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install

# Install shared dependencies (if any)
cd ../shared && npm install
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

### 3. Configure OAuth Authentication

This application uses OAuth-only authentication with Google and Facebook. You must configure OAuth credentials before running the application.

**Quick Setup:**
1. Follow the [OAuth Setup Guide](./OAUTH_SETUP.md) to create OAuth apps
2. Copy credentials to `backend/.env` (see `backend/.env.example`)
3. Configure callback URLs in provider consoles

**Required OAuth Providers:**
- Google OAuth (via Google Cloud Console)
- Facebook OAuth (via Facebook Developers)

See [OAUTH_SETUP.md](./OAUTH_SETUP.md) for detailed step-by-step instructions.

### 4. Set Up Environment Variables

Create `.env` files in both frontend and backend directories:

**Backend (`backend/.env`):**
```bash
cp backend/.env.example backend/.env
# Edit backend/.env and add your OAuth credentials
```

**Frontend (`frontend/.env.local`):**
```bash
cp frontend/.env.local.example frontend/.env.local
# Edit frontend/.env.local if needed
```

See respective README files and [OAUTH_SETUP.md](./OAUTH_SETUP.md) for details.

### 5. Run Database Migrations

```bash
cd backend
npm run prisma:migrate
```

### 6. Run Development Servers

```bash
./dev.sh
```

This will start both frontend (http://localhost:3000) and backend (http://localhost:3001) servers.

Alternatively, you can run them separately:

```bash
# Terminal 1 - Backend
cd backend && npm run start:dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

**Note:** The backend will validate OAuth configuration on startup. If credentials are missing, you'll see a detailed error message with setup instructions.

## Available Scripts

### Development
- `./dev.sh` - Start both frontend and backend in development mode
- `cd backend && npm run start:dev` - Start only backend
- `cd frontend && npm run dev` - Start only frontend
- `cd backend && npm run build` - Build backend
- `cd frontend && npm run build` - Build frontend
- `cd backend && npm run lint` - Lint backend code
- `cd frontend && npm run lint` - Lint frontend code
- `cd backend && npm run format` - Format backend code with Prettier
- `cd frontend && npm run format` - Format frontend code with Prettier

### Deployment
- `npm run deploy` - Deploy to staging environment
- `npm run deploy:staging` - Deploy to staging with full checks
- `npm run deploy:production` - Deploy to production with safety checks
- `npm run rollback:migration` - Rollback image storage migration

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Technology Stack

- **Frontend**: Next.js 14+, React 18+, TypeScript, TailwindCSS
- **Backend**: NestJS, TypeScript
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **ORM**: Prisma
- **Authentication**: OAuth 2.0 (Google, Facebook)

## Authentication

This application uses **OAuth-only authentication**. Traditional email/password registration and login have been removed in favor of secure third-party authentication.

### Supported Providers

- **Google OAuth**: Sign in with Google account
- **Facebook OAuth**: Sign in with Facebook account

### Key Features

- Automatic account creation on first OAuth login
- Email-based account linking (same email across providers = one account)
- Checkout requires authentication
- Admin panel shows OAuth provider information

### Setup

OAuth credentials are required to run the application. See [OAUTH_SETUP.md](./OAUTH_SETUP.md) for complete setup instructions including:

- Google Cloud Console configuration
- Facebook Developers configuration
- Environment variable setup
- Callback URL configuration
- Production deployment guide

### Quick Reference

**Environment Variables (backend/.env):**
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback

FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_CALLBACK_URL=http://localhost:3001/auth/facebook/callback
```

For detailed setup instructions, see [OAUTH_SETUP.md](./OAUTH_SETUP.md).

## License

MIT
