/** @type {import('next').NextConfig} */
import fs from 'fs';
import path from 'path';

// next.config.mjs
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true, // Falls du Bilder mit `next/image` nutzt
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glb|gltf|png|jpe?g)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/media/[name].[hash][ext]',
      },
    });
    return config;
  },
};

export default nextConfig;
