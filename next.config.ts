import type { NextConfig } from "next";
import { getSecurityHeaders } from "./src/lib/security/security-headers";

const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: getSecurityHeaders(isProduction),
      },
    ];
  },
};

export default nextConfig;
