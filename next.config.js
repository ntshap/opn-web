/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  // No API rewrites - direct connection to backend
  async rewrites() {
    return [];
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'beopn.penaku.site',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        pathname: '/**',
      },
    ],
    unoptimized: true,
    domains: ['beopn.penaku.site', 'ui-avatars.com'],
  },

  // Add headers to allow CORS for images
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
      // Add specific headers for backend image requests
      {
        source: '/uploads/:path*',
        headers: [
          { key: 'Authorization', value: 'Bearer {{token}}' }, // This will be replaced by middleware
        ],
      },
    ];
  },

  // Allow builds to complete even with errors
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Use standalone output for better performance
  output: 'standalone',
};

module.exports = nextConfig;
