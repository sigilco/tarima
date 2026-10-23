/**
 * Plain Vite config for the Cosmos playground. The app's vite.config.ts is
 * TanStack Start flavoured (ssr environment, cloudflare, route generation);
 * Cosmos only renders components in the browser, so this file keeps just the
 * plugins the preview components need: react + tailwind.
 *
 * Paraglide is wired in because the landing hero imports compiled
 * messages. Requires `compile-messages` to have run first.
 */
import { defineConfig } from "vite";

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
      strategy: ["baseLocale"],
    }),
    viteReact(),
  ],
});

export default config;
