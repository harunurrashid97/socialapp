/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Local development
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      // Render.com production backend
      {
        protocol: 'https',
        hostname: '*.onrender.com',
        pathname: '/media/**',
      },
    ],
  },
}

module.exports = nextConfig
