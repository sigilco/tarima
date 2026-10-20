// Assemble the deployable artifact: the API server (bundled) plus the web
// SSR + client builds, under apps/api/dist/server.
import { build } from "esbuild";
import { cpSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const apiRoot = fileURLToPath(new URL("..", import.meta.url));
const outDir = join(apiRoot, "dist/server");

await build({
  entryPoints: [join(apiRoot, "src/server.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  packages: "external",
  nodePaths: [join(process.cwd(), "apps/web/node_modules")],
  outfile: join(outDir, "index.mjs"),
  sourcemap: true,
});

// Keep the native sqlite binding external (packages: external already does);
// copy the web SSR + client builds next to it so the artifact is standalone.
mkdirSync(outDir, { recursive: true });
cpSync(join(apiRoot, "../web/dist/ssr"), join(outDir, "web/ssr"), { recursive: true });
cpSync(join(apiRoot, "../web/dist/client"), join(outDir, "web/client"), { recursive: true });

console.log("artifact at apps/api/dist/server");
