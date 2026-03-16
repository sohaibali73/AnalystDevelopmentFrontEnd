/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // SWC Compiler is the default in Next.js 16
  // Babel is NOT used - Next.js uses the Rust-based SWC compiler for faster builds
  // swcMinify is enabled by default and no longer needs to be specified
  
  // Enable Turbopack for faster builds (enabled by default in Next.js 16)
  experimental: {
    // Turbopack is enabled by default in Next.js 16
    // No additional experimental config needed for basic usage
  },
  
  // Turbopack configuration
  turbopack: {
    root: __dirname,
  },
  
  // Optimize build cache for Windows
  onDemandEntries: {
    // Extend page keep-alive timeout for better development experience
    maxInactiveAge: 60 * 1000,
    // Reduce build pages kept in memory to prevent memory issues
    pagesBufferLength: 5,
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  async rewrites() {
    const backendUrl = (process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === 'development'
        ? 'http://localhost:8000'
        : 'https://potomac-analyst-workbench-production.up.railway.app')).replace(/\/+$/, '');
    return [
      {
        source: '/api/backend/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
  
  // Webpack customization removed — Turbopack (default in Next.js 16) does not
  // support the webpack() callback.  The previous filesystem-cache and
  // Windows-specific watchOptions were only relevant when running under Webpack.
};

module.exports = nextConfig;
