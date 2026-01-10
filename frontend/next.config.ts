import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { config } from 'dotenv';

// Initialize build timeout monitoring
if (process.env.NODE_ENV === 'production') {
  try {
    require('./lib/build-timeout-init');
    console.log('[BUILD] Timeout monitoring initialized');
  } catch (error) {
    console.warn('[BUILD] Failed to initialize timeout monitoring:', error);
  }
}

// Load custom .env file if needed
// config({ path: '.env.custom' });
config({ path: '.env' })
config({ path: '.env.local' })
config({ path: '.env.production' })

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'standalone',
  /* config options here */
  reactCompiler: false, // Moved from experimental

  // URL structure configuration
  trailingSlash: false, // Consistent no trailing slash policy

  // Server external packages (moved from experimental in Next.js 16)
  serverExternalPackages: [],

  // Performance optimizations - aggressive CPU reduction
  experimental: {
    // Disable all experimental features to reduce CPU load
    parallelServerCompiles: false,
    // workerThreads: false,
    staticGenerationRetryCount: 1,
    staticGenerationMaxConcurrency: 2, // Limit to 2 workers
    staticGenerationMinPagesPerWorker: 9, // Increase pages per worker to reduce worker count
    // Note: staticGenerationTimeout may not be available in all Next.js versions
    // Use environment variables for timeout configuration instead
  },

  // Aggressive caching configuration for lower CPU usage
  cacheMaxMemorySize: 16 * 1024 * 1024, // Reduced to 16MB
  // cacheHandler: './cache-handler-minimal.js', // Re-enable fixed minimal cache handler

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

  // Webpack optimizations - aggressive CPU reduction
  webpack: (config, { dev, isServer }) => {
    // Fix for @alacraft/shared module resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@alacraft/shared': require.resolve('@alacraft/shared'),
    };
    // Aggressive optimizations for production builds
    if (!dev) {
      // Minimize bundle splitting to reduce processing overhead
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxSize: 200000, // Smaller chunks (200KB)
          minSize: 20000,
          maxAsyncRequests: 5, // Reduce async requests
          maxInitialRequests: 3, // Reduce initial requests
          cacheGroups: {
            default: false, // Disable default cache group
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              enforce: true,
            },
          },
        },
        // Force single-threaded processing
        minimize: true,
        // Keep default minimizers to avoid plugin issues
      };

      // Aggressive parallelism reduction
      config.parallelism = 1;

      // Disable source maps completely
      config.devtool = false;

      // Reduce module resolution complexity
      config.resolve = {
        ...config.resolve,
        symlinks: false,
        cacheWithContext: false,
      };
    }

    // Filesystem cache configuration for better performance
    config.cache = {
      type: 'filesystem',
      maxAge: 300000, // 5 minutes
      buildDependencies: {
        config: [__filename],
      },
    };

    // Reduce file system watching overhead
    config.watchOptions = {
      ignored: /node_modules/,
      aggregateTimeout: 300,
      poll: false,
    };

    // Disable performance hints to reduce processing
    config.performance = {
      hints: false,
    };

    return config;
  },
};

export default withNextIntl(nextConfig);