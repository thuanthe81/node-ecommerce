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

## SVG Management

This project uses a centralized SVG management system to ensure consistency and maintainability:

- **All SVG icons are centralized** in `components/Svgs.tsx`
- **No inline SVG elements** should be used in components
- **Import SVG components** using `import { SvgIconName } from '@/components/Svgs'`

### Adding New SVG Icons

1. Add the SVG component to `components/Svgs.tsx` following the naming convention
2. Import and use the component in your React components
3. Run `npm run svg:check` to ensure compliance

See [SVG_COMPONENT_GUIDE.md](./SVG_COMPONENT_GUIDE.md) for detailed instructions and [SVG_DEVELOPMENT_GUIDELINES.md](./SVG_DEVELOPMENT_GUIDELINES.md) for best practices.

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
│   └── Svgs.tsx      # Centralized SVG components
├── lib/              # Utility functions and configurations
├── public/           # Static assets
├── scripts/          # Development and build scripts
└── styles/           # Global styles
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run svg:check` - Check for inline SVG violations
- `npm run svg:audit` - Run comprehensive SVG audit

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
