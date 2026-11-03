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
    "@tarima/api/db/schema": join(apiRoot, "src/db/schema.ts"),
    "@tarima/obs": join(apiRoot, "../../packages/obs/src/index.ts"),
    "@tarima/auth-core/otp": join(apiRoot, "../../packages/auth-core/src/otp.ts"),
    "@tarima/auth-core/rate-limit": join(apiRoot, "../../packages/auth-core/src/rate-limit.ts"),
    "@tarima/auth-core/session": join(apiRoot, "../../packages/auth-core/src/session.ts"),
    "@tarima/contract": join(apiRoot, "../../packages/contract/src/index.ts"),
    "@tarima/api-keys": join(apiRoot, "../../packages/api-keys/src/index.ts"),
    // engine and chase expose subpath exports only, so alias each one
    // separately; a bare "@tarima/engine" alias would point at a file that
    // does not exist and break the artifact build.
    "@tarima/engine/types": join(apiRoot, "../../packages/engine/src/types.ts"),
    "@tarima/engine/journal": join(apiRoot, "../../packages/engine/src/journal.ts"),
    "@tarima/engine/runner": join(apiRoot, "../../packages/engine/src/runner.ts"),
    "@tarima/engine/store": join(apiRoot, "../../packages/engine/src/store.ts"),
    "@tarima/engine/db": join(apiRoot, "../../packages/engine/src/db.ts"),
    "@tarima/chase/sfm": join(apiRoot, "../../packages/chase/src/sfm.ts"),
    "@tarima/chase/template": join(apiRoot, "../../packages/chase/src/template.ts"),
    "@tarima/chase/handlers": join(apiRoot, "../../packages/chase/src/handlers.ts"),
    "@tarima/chase/llm": join(apiRoot, "../../packages/chase/src/llm.ts"),
    "@tarima/chase/register": join(apiRoot, "../../packages/chase/src/register.ts"),
    "@tarima/venuesearch/types": join(apiRoot, "../../packages/venuesearch/src/types.ts"),
    "@tarima/venuesearch/photon": join(apiRoot, "../../packages/venuesearch/src/photon.ts"),
    "@tarima/venuesearch/overpass": join(apiRoot, "../../packages/venuesearch/src/overpass.ts"),
    "@tarima/venuesearch/cities": join(apiRoot, "../../packages/venuesearch/src/cities.ts"),
    "@tarima/venuesearch/providers": join(apiRoot, "../../packages/venuesearch/src/providers.ts"),
    "@tarima/telegram": join(apiRoot, "../../packages/telegram/src/index.ts"),
    "@tarima/channels": join(apiRoot, "../../packages/channels/src/index.ts"),
    "@tarima/llm": join(apiRoot, "../../packages/llm/src/index.ts"),
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
