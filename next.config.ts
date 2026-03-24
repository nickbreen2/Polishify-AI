import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Security headers for all routes
        source: "/:path*",
        headers: [
          // Prevent browsers from sniffing MIME types
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Prevent clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // Enable XSS filter in older browsers
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // Only send origin in referrer header
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Enforce HTTPS for 1 year (only active over HTTPS)
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          // Disable browser features that aren't needed
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(self)",
          },
        ],
      },
      {
        // CORS headers scoped to API routes only
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "https://polishify.app" },
          { key: "Access-Control-Allow-Methods", value: "POST, GET, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
          { key: "Vary", value: "Origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
