/**
 * Plain Vite config for the Cosmos playground. The app's vite.config.ts is
 * TanStack Start flavoured (ssr environment, cloudflare, route generation);
 * Cosmos only renders components in the browser, so this file keeps just the
 * plugins the preview components need: react + tailwind.
 *
 * Paraglide is deliberately omitted: it requires the compiled
 * `src/paraglide` output and preview components stay copy-free for now. If a
 * preview variation needs messages, compile them first
 * (`pnpm --filter web exec paraglide compile`) and add
 * `paraglideVitePlugin({ project: './project.inlang', outdir:
 * './src/paraglide', strategy: ['baseLocale'] })` below.
 */
import { defineConfig } from 'vite';

import viteReact from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [tailwindcss(), viteReact()],
});

export default config;
