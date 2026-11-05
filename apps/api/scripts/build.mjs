// Assemble the deployable artifact: the API server (bundled) plus the web
// SSR + client builds, under apps/api/dist/server.
import { build } from "esbuild";
import { cpSync, mkdirSync, readFileSync } from "node:fs";
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
    "@tarima/api/db/schema": join(apiRoot, "src/db/schema.ts"),
    "@tarima/obs": join(apiRoot, "../../packages/obs/src/index.ts"),
    "@tarima/auth-core/otp": join(apiRoot, "../../packages/auth-core/src/otp.ts"),
    "@tarima/auth-core/rate-limit": join(apiRoot, "../../packages/auth-core/src/rate-limit.ts"),
    "@tarima/auth-core/session": join(apiRoot, "../../packages/auth-core/src/session.ts"),
    "@tarima/contract": join(apiRoot, "../../packages/contract/src/index.ts"),
    "@tarima/channels": join(apiRoot, "../../packages/channels/src/index.ts"),
  },
  nodePaths: [join(process.cwd(), "apps/web/node_modules")],
  outfile: join(outDir, "index.mjs"),
  sourcemap: true,
});

// Keep the native sqlite binding external (packages: external already does);
// copy the web SSR + client builds next to it so the artifact is standalone.
// The sp1 nitro migration moved the web build to dist/server (nitro
// node-server output; server/ holds the SSR entry, client/ the browser
// assets), so the artifact mirrors that layout.
mkdirSync(outDir, { recursive: true });
cpSync(join(apiRoot, "../web/dist/server"), join(outDir, "web/ssr"), { recursive: true });
cpSync(join(apiRoot, "../web/dist/client"), join(outDir, "web/client"), { recursive: true });

// The artifact ships without node_modules: every "@tarima/*" import left in
// the bundle is a runtime crash on the VPS (ERR_MODULE_NOT_FOUND on boot).
// A workspace export added in source but missing from the alias map above
// fails the build here instead of failing the service.
const bundled = readFileSync(join(outDir, "index.mjs"), "utf8");
const leaked = [...new Set(bundled.match(/from\s*"[^"]*@tarima\/[^"]*"/g) ?? [])];
if (leaked.length > 0) {
  console.error(
    `build: the artifact still imports workspace packages at runtime:\n` +
      leaked.map((x) => `  ${x}`).join("\n") +
      `\nadd the missing alias to apps/api/scripts/build.mjs`,
  );
  process.exit(1);
}

console.log("artifact at apps/api/dist/server");
