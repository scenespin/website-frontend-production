/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Force new build ID to invalidate cache
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
  
  // Disable ESLint during production builds (warnings won't block deployment)
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // CDN & Performance Optimization
  compress: true, // Enable gzip/brotli compression
  
  // Enable larger body size for API routes (for video uploads)
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  
  // Redirects for deprecated routes (Feature 0100)
  async redirects() {
    return [
      {
        source: '/workflows',
        destination: '/production?tab=workflows',
        permanent: true, // 301 redirect
      },
    ];
  },
  
  images: {
    remotePatterns: [
      // NextJS <Image> component needs to whitelist domains for src={}
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https", 
        hostname: "pbs.twimg.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "logos-world.net",
      },
    ],
    formats: ['image/webp'], // Use modern image format
    deviceSizes: [640, 750, 828, 1080, 1200, 1920], // Responsive image sizes
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // Icon sizes
  },
  
  // Cache-Control headers for optimal CloudFront caching
  async headers() {
    return [
      // Static assets with content hash - cache aggressively (1 year)
      // Next.js automatically adds content hashes to these files
      {
        source: '/_next/static/chunks/:hash*.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // CSS files with content hash
      {
        source: '/_next/static/css/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Build manifest and other metadata - shorter cache
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
        ],
      },
      // Images - cache for 1 week
      {
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=86400',
          },
        ],
      },
      // Public assets - cache for 1 day
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=43200',
          },
        ],
      },
      // API routes - no cache
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      // HTML pages - revalidate after 1 hour
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
  webpack: (config, { webpack, isServer }) => {
    // Ignore MongoDB's optional dependencies to prevent build warnings
    if (isServer) {
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(kerberos|@mongodb-js\/zstd|@aws-sdk\/credential-providers|gcp-metadata|snappy|socks|aws4|mongodb-client-encryption)$/,
        })
      );
    }
    
    return config;
  },
};

module.exports = nextConfig;
