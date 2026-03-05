/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    // Set BACKEND_URL in Vercel: https://subsgen-api-XXXX.onrender.com (after Render deploy)
    const backend = process.env.BACKEND_URL || 'http://localhost:7860';
    return [{ source: '/api/:path*', destination: `${backend}/api/:path*` }];
  },
}

module.exports = nextConfig

