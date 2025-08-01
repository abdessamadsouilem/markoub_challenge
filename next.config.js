/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['postgres'],
  output: 'standalone',
};

module.exports = nextConfig;
