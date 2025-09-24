import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "localhost",
    port: 5173,
    hmr: {
      port: 5173,
      host: "localhost",
    },
    watch: {
      usePolling: true,
    },
  },
  preview: {
    port: 5173,
    host: "localhost",
  },
});
