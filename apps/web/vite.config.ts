import { defineConfig } from "vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { paraglideVitePlugin } from "@inlang/paraglide-js";

import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    paraglideVitePlugin({
      project: "./project.inlang",
      outdir: "./src/paraglide",
      strategy: ["preferredLanguage", "baseLocale"],
    }),
    tanstackStart({ srcDirectory: "src", server: { entry: "server.ts" } }),
    viteReact(),
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/auth": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/webhooks": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  // Node SSR build consumed by apps/api/src/server.ts. No Cloudflare/wrangler.
  environments: {
    ssr: {
      // Bundle browser-only deps (motion, react-rough-notation) into the
      // SSR output: the Node artifact is loaded from apps/api/dist/server,
      // where bare specifiers cannot be resolved at runtime.
      resolve: {
        noExternal: ["motion", "framer-motion", "react-rough-notation"],
      },
      build: {
        outDir: "dist/ssr",
        rollupOptions: {
          external: [/^node:/],
        },
      },
    },
    client: {
      build: {
        outDir: "dist/client",
      },
    },
  },
});

export default config;
