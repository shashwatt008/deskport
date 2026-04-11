import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@deskport/shared"],
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
