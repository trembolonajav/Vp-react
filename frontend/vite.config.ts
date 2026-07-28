import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Em dev, /api é encaminhado para o backend Spring (porta 8080), evitando CORS
// e URLs hardcoded. Em produção o nginx faz esse proxy.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY ?? "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
