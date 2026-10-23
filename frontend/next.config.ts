import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  async redirects() {
    return ["categoria", "busca", "favoritos"].map((key) => ({
      source: "/",
      has: [{ type: "query" as const, key }],
      destination: "/colecao",
      permanent: false,
    }));
  },
  // O navegador conversa com o Next.js; ele encaminha os produtos à API local.
  async rewrites() {
    return [
      {
        source: "/api/orders/:path*",
        destination: "http://127.0.0.1:3001/api/orders/:path*",
      },
      {
        source: "/api/products",
        destination: "http://127.0.0.1:3001/api/products",
      },
      {
        source: "/api/feedback/:path*",
        destination: "http://127.0.0.1:3001/api/feedback/:path*",
      },
      {
        source: "/api/products/:id/image",
        destination: "http://127.0.0.1:3001/api/products/:id/image",
      },
      {
        source: "/api/products/:id/category",
        destination: "http://127.0.0.1:3001/api/products/:id/category",
      },
      {
        source: "/api/auth/:path*",
        destination: "http://127.0.0.1:3001/api/auth/:path*",
      },
    ];
  },
};

export default nextConfig;
