# Frontend - Handmade E-commerce Platform

Next.js 14+ frontend application with TypeScript, App Router, and TailwindCSS.

## Features

- Next.js 14+ with App Router
- TypeScript for type safety
- TailwindCSS for styling
- ESLint and Prettier for code quality
- Internationalization support (Vietnamese and English)

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
