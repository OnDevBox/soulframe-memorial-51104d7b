// Vite config used ONLY for the static SPA build deployed to Vercel / Netlify / etc.
// The Lovable preview keeps using the TanStack Start config in vite.config.ts.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  root: path.resolve(__dirname, "vercel-build"),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
    sourcemap: false,
  },
});
