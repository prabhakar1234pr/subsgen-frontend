/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    const backend = process.env.BACKEND_URL || 'http://34.121.45.9:7860';
    return [{ source: '/api/:path*', destination: `${backend}/api/:path*` }];
  },
}

module.exports = nextConfig

