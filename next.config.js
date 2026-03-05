/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    // BACKEND_URL: Cloud Run or Render. Default Cloud Run for production.
    const backend = process.env.BACKEND_URL
      || (process.env.VERCEL ? 'https://subsgen-api-ejvxiquyrq-uc.a.run.app' : 'http://localhost:7860');
    return [{ source: '/api/:path*', destination: `${backend}/api/:path*` }];
  },
}

module.exports = nextConfig

