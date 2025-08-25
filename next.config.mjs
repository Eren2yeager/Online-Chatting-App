/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for better performance
  serverExternalPackages: ['mongoose'],
  
  // Configure image domains for Cloudinary
  images: {
    domains: ['res.cloudinary.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://res.cloudinary.com; media-src 'self' https://res.cloudinary.com; connect-src 'self' ws://localhost:3001 wss://localhost:3001;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
