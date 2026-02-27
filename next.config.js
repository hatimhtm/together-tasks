/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true // Required for next export
  }
};

// Only use PWA plugin in normal dev/build, not for Capacitor static exports
// Capacitor handles offline/caching natively
const isExport = process.argv.includes('export') || process.env.CAPACITOR_BUILD === 'true';

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development' || isExport,
  register: true,
  skipWaiting: true,
});

module.exports = isExport ? nextConfig : withPWA(nextConfig);
