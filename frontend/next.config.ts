import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'standalone',
  /* config options here */
  reactCompiler: true,

  // URL structure configuration
  trailingSlash: false, // Consistent no trailing slash policy

  // Server external packages (moved from experimental in Next.js 16)
  serverExternalPackages: [],

  // Performance optimizations
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: ['@/lib', '@/components'],
    // Enable partial prerendering for better performance
    ppr: false, // Enable when stable
  },

  // Caching configuration
  // cacheHandler: process.env.NODE_ENV === 'production' ? require.resolve('./cache-handler.js') : undefined,
  cacheMaxMemorySize: 50 * 1024 * 1024, // 50MB

  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/uploads/:path*`,
      },
    ];
  },

  async redirects() {
    return [
      // Redirect old URL patterns to new SEO-friendly URLs
      {
        source: '/product/:id',
        destination: '/products/:id',
        permanent: true,
      },
      {
        source: '/category/:slug',
        destination: '/categories/:slug',
        permanent: true,
      },
    ];
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
  },

  // Enable compression
  compress: true,

  // Optimization for production
  poweredByHeader: false,

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/sitemap-api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=600',
          },
        ],
      },
      {
        source: '/(.*\\.xml)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=7200',
          },
          {
            key: 'Content-Type',
            value: 'application/xml',
          },
        ],
      },
    ];
  },

  // Webpack optimizations
  webpack: (config, { dev }) => {
    // Production optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        },
      };
    }

    return config;
  },
};

export default withNextIntl(nextConfig);