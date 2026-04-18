import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 3000,
    strictPort: true,
    /** Forward /api/* to Spring Boot so VITE_API_BASE_URL=/api/v1 hits the backend instead of static files. */
    proxy: {
      "/api": {
        target: "http://127.0.0.1:18081",
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:18081",
        changeOrigin: true,
      },
    },
  },
});
