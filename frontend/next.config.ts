import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // O navegador conversa com o Next.js; ele encaminha os produtos à API local.
  async rewrites() {
    return [{
      source: '/api/products',
      destination: 'http://127.0.0.1:3001/api/products',
    }, {
      source: '/api/products/:id/image',
      destination: 'http://127.0.0.1:3001/api/products/:id/image',
    }, {
      source: '/api/products/:id/category',
      destination: 'http://127.0.0.1:3001/api/products/:id/category',
    }, {
      source: '/api/auth/:action',
      destination: 'http://127.0.0.1:3001/api/auth/:action',
    }];
  },
};

export default nextConfig;
