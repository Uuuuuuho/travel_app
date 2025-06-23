import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // For App Router, we handle i18n through react-i18next
  // instead of Next.js built-in i18n routing
};

export default nextConfig;
