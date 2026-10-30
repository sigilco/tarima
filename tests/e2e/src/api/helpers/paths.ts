/**
 * Repository paths for the e2e helpers.
 *
 * The helpers live deep inside `tests/e2e/src/api/helpers`, so the repo
 * root is found by walking up to the `pnpm-workspace.yaml` instead of
 * counting `..` segments (which break when a file moves).
 */
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

function findRepoRoot(): string {
  let dir = resolve(import.meta.dirname);
  for (let i = 0; i < 10; i++) {
    if (existsSync(join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("could not locate the repo root (pnpm-workspace.yaml not found)");
}

/** Absolute path of the repository root. */
export const repoRoot = findRepoRoot();

/** The api app directory (the process the e2e suite boots). */
export const apiDir = join(repoRoot, "apps/api");

/** The `tsx` binary that runs the api sources without a build step. */
export const tsxBin = join(apiDir, "node_modules/.bin/tsx");
