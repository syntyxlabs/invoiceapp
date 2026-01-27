import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
  serverExternalPackages: [
    '@react-pdf/renderer',
    '@react-pdf/layout',
    '@react-pdf/image',
  ],
};

export default nextConfig;
