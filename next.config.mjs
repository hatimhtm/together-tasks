/** @type {import('next').NextConfig} */
import withPWAInit from 'next-pwa';

// Capacitor builds (Android wrapper) need a static export. Vercel builds use the
// normal server runtime. Toggle via CAPACITOR_BUILD=true (see package.json:capacitor:build).
const isCapacitor = process.env.CAPACITOR_BUILD === 'true';

const withPWA = withPWAInit({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development' || isCapacitor,
    register: true,
    skipWaiting: true,
});

const nextConfig = {
    eslint: { ignoreDuringBuilds: true },
    typescript: { ignoreBuildErrors: true },
    ...(isCapacitor && {
        output: 'export',
        images: { unoptimized: true },
    }),
};

export default isCapacitor ? nextConfig : withPWA(nextConfig);
