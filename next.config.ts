import type { NextConfig } from "next";
import {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
} from "next/constants.js";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https" as const,
        hostname: "cdn.disalud.org",
        pathname: "/**",
      },
    ],
  },
  serverExternalPackages: ["bcrypt"],
  experimental: {
    serverActions: {
      bodySizeLimit: 1 * 1024 * 1024, // 1MB in bytes
    },
  },
  // Will only be available on the server
  reactStrictMode: true, // Enable React strict mode for improved error handling
  compiler: {
    removeConsole: process.env.NODE_ENV !== "development" ? { exclude: ["error", "warn"] } : false,
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nextConfigFunction = async (phase: any) => {
  if (phase === PHASE_DEVELOPMENT_SERVER || phase === PHASE_PRODUCTION_BUILD) {
    const withPWA = (await import("@ducanh2912/next-pwa")).default({
      dest: "public",
      disable: process.env.NODE_ENV === "development",
      fallbacks: {
        document: "/offline.html",
      },
    });
    return withPWA(nextConfig);
  }
  return nextConfig;
};

export default nextConfigFunction;