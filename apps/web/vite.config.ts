import { defineConfig } from "vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import { nitro } from "nitro/vite";

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
    tanstackStart({
      srcDirectory: "src",
      server: { entry: "server.ts" },
      prerender: {
        enabled: true,
        crawlLinks: false,
        autoStaticPathsDiscovery: false,
        filter: (page) => page.path === "/",
      },
      pages: [{ path: "/" }],
    }),
    viteReact(),
    // Preset pinned: nitro auto-detects the build-time runtime; deploy
    // runtime is node, so pin node-server for a deterministic artifact
    // served by `node .output/server/index.mjs`.
    nitro({ preset: "node-server" }),
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
  nitro: {
    // The web server functions call the API on the same origin (see
    // src/lib/api-server.ts apiOrigin). In production the API was the same
    // process; with nitro standalone the API lives on its own port, so
    // proxy the API prefixes there (same set as the dev proxy below).
    routeRules: {
      "/api/**": { proxy: { to: `${process.env.API_ORIGIN ?? "http://localhost:3001"}/api/**` } },
      "/auth/**": { proxy: { to: `${process.env.API_ORIGIN ?? "http://localhost:3001"}/auth/**` } },
      "/webhooks/**": {
        proxy: { to: `${process.env.API_ORIGIN ?? "http://localhost:3001"}/webhooks/**` },
      },
    },
    // Keep the prerendered landing (TanStack Start emits it into the nitro
    // public dir) and serve the node-server build from dist/server.
    output: {
      dir: "dist/server",
      publicDir: "dist/client",
    },
  },
});

export default config;
