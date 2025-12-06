# Frontend - Handmade E-commerce Platform

Next.js 14+ frontend application with TypeScript, App Router, and TailwindCSS.

## Features

- Next.js 14+ with App Router
- TypeScript for type safety
- TailwindCSS for styling
- ESLint and Prettier for code quality
- Internationalization support (Vietnamese and English)
- OAuth 2.0 authentication (Google, Facebook)
- Protected checkout flow

## Getting Started

### Install Dependencies

```bash
npm install
```

### Environment Variables

Copy `.env.local.example` to `.env.local` and configure:

```bash
cp .env.local.example .env.local
```

**Required Configuration:**

- `NEXT_PUBLIC_API_URL` — Backend API URL (e.g., `http://localhost:3001`)

**OAuth Authentication:**

The frontend uses OAuth-only authentication. Users can sign in with Google or Facebook accounts. The backend must be configured with OAuth credentials before the frontend authentication will work.

See the [OAuth Setup Guide](../OAUTH_SETUP.md) for complete setup instructions.

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
frontend/
├── app/              # Next.js App Router pages
├── components/       # React components
├── lib/              # Utility functions and configurations
├── public/           # Static assets
└── styles/           # Global styles
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
