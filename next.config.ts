import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'classical-meal-adequate-mia.trycloudflare.com',
    '*.trycloudflare.com',
    '10.95.25.25:3000',
    'localhost:3000'
  ]
};

export default nextConfig;
