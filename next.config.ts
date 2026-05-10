import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.86.90', 'https://192.168.86.90:3001'],
  turbopack: {
    root: '/Users/stanleybaptista/Projects/orb',
  },
};

export default nextConfig;
