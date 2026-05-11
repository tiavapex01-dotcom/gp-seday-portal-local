import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Necessário para o @cloudflare/next-on-pages processar corretamente
  // Sem 'standalone' e sem serverExternalPackages conflitantes
  images: {
    unoptimized: true, // Cloudflare Pages não suporta Image Optimization nativa do Next.js
  },
};

export default nextConfig;
