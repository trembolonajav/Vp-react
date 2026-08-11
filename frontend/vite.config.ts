import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const launcherDownloadUrl =
  "https://github.com/ekooll/poke-multi-labs/releases/download/v0.9.4/VpertsMultiLeve-Setup-0.9.4.exe";

function launcherRedirects(): Plugin {
  const redirect = (req: { url?: string }, res: { statusCode: number; setHeader(name: string, value: string): void; end(): void }, next: () => void) => {
    const pathname = req.url?.split("?", 1)[0].replace(/\/$/, "");
    if (pathname === "/download/vplauncher") {
      res.statusCode = 302;
      res.setHeader("Location", launcherDownloadUrl);
      res.end();
      return;
    }
    next();
  };

  return {
    name: "vperts-launcher-redirects",
    configureServer(server) {
      server.middlewares.use(redirect);
    },
    configurePreviewServer(server) {
      server.middlewares.use(redirect);
    },
  };
}

// Em dev, /api é encaminhado para o backend Spring (porta 8080), evitando CORS
// e URLs hardcoded. Em produção o nginx faz esse proxy.
export default defineConfig({
  plugins: [launcherRedirects(), react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY ?? "http://localhost:8080",
        changeOrigin: true,
      },
      "/media": {
        target: process.env.VITE_API_PROXY ?? "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
