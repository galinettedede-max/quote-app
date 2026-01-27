/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable static export for GitHub Pages
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Note: basePath and assetPrefix are automatically injected by
  // actions/configure-pages during the GitHub Actions workflow
}

module.exports = nextConfig
