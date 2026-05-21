import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const serverEnv = loadEnv(mode, path.resolve(__dirname, "../server"), "");
  const apiPort = Number(serverEnv.PORT) || 4000;
  const apiTarget = `http://localhost:${apiPort}`;

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": { target: apiTarget, changeOrigin: true },
        "/uploads": { target: apiTarget, changeOrigin: true },
        "/socket.io": { target: apiTarget, ws: true, changeOrigin: true }
      }
    }
  };
});
