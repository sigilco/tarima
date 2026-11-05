import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// Isolation harness for src/components/ui — renders each shadcn component
// outside the app shell so states/animations can be verified visually.
// Run: pnpm -C apps/web cosmos  →  http://localhost:5050
export default defineConfig({
  plugins: [viteReact(), tailwindcss()],
  resolve: {
    alias: {
      "#": path.resolve(import.meta.dirname, "./src"),
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    port: 5050,
  },
});
