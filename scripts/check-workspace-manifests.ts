#!/usr/bin/env node
/**
 * Workspace-manifest hygiene: every `@tarima/*` import in source must be
 * declared in that package's package.json (no phantom deps across workspace
 * boundaries). Cheap readdir + regex pass, safe for pre-commit.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC_EXT = /\.(ts|tsx|mjs|js)$/;

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "dist" || entry === ".git" || entry === "paraglide")
      continue;
    const p = path.join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) yield* walk(p);
    else if (SRC_EXT.test(entry)) yield p;
  }
}

interface Pkg {
  name: string;
  dir: string;
  manifest: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
}

function loadPackages(): Pkg[] {
  const pkgs: Pkg[] = [];
  const workspaces = ["apps", "packages"];
  for (const ws of workspaces) {
    const wsDir = path.join(ROOT, ws);
    if (!existsSync(wsDir)) continue;
    for (const child of readdirSync(wsDir)) {
      const dir = path.join(wsDir, child);
      const manifestPath = path.join(dir, "package.json");
      if (existsSync(manifestPath)) {
        const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
        pkgs.push({ name: manifest.name, dir, manifest });
      }
    }
  }
  return pkgs;
}

const pkgs = loadPackages();
let failures = 0;

for (const pkg of pkgs) {
  const declared = new Set(
    Object.keys({ ...pkg.manifest.dependencies, ...pkg.manifest.devDependencies }),
  );
  for (const file of walk(pkg.dir)) {
    const src = readFileSync(file, "utf8");
    const matches = src.matchAll(/from\s+["'](@tarima\/[\w-]+)(?:\/[\w-]+)?["']/g);
    for (const m of matches) {
      const dep = m[1]!;
      if (!declared.has(dep)) {
        console.error(
          `${path.relative(ROOT, file)}: imports ${dep} but it is not in ${pkg.name}/package.json`,
        );
        failures++;
      }
    }
  }
}

if (failures > 0) {
  console.error(`\nFAIL: ${failures} undeclared workspace import(s)`);
  process.exit(1);
}
console.log("OK workspace-manifests: all @tarima/* imports declared");
