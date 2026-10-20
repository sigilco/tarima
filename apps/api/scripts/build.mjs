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
  // Bundle workspace packages (@tarima/*) so the artifact resolves their
  // sources at build time; leave third-party packages external so native
  // bindings (better-sqlite3) and node builtins stay as real requires.
  packages: "external",
  alias: {
    "@tarima/obs": join(apiRoot, "../../packages/obs/src/index.ts"),
    "@tarima/auth-core/otp": join(apiRoot, "../../packages/auth-core/src/otp.ts"),
    "@tarima/auth-core/rate-limit": join(apiRoot, "../../packages/auth-core/src/rate-limit.ts"),
    "@tarima/auth-core/session": join(apiRoot, "../../packages/auth-core/src/session.ts"),
    "@tarima/contract": join(apiRoot, "../../packages/contract/src/index.ts"),
    "@tarima/engine": join(apiRoot, "../../packages/engine/src/index.ts"),
    "@tarima/chase": join(apiRoot, "../../packages/chase/src/index.ts"),
  },
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
