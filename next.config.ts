import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite testar pelo celular na rede local sem bloqueio de HMR
  allowedDevOrigins: ['192.168.15.10', 'localhost:3000'],
};

export default nextConfig;
