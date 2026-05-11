import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite servir arquivos de public/uploads/ diretamente
  // Não é necessário configuração extra para /public
  experimental: {
    serverActions: {
      bodySizeLimit: "52mb",
    },
  },
};

export default nextConfig;
