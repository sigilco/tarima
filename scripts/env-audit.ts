#!/usr/bin/env node
/**
 * Env-var audit helpers (pure — no fs, no process reads).
 *
 * `collectEnvVars` extracts every environment variable a source file
 * reads, across the access patterns first-party code uses:
 *
 *   process.env.<NAME>        import.meta.env.<NAME>
 *   process.env["<NAME>"]     import.meta.env["<NAME>"]
 *   process.env[CONST]        (CONST = "<NAME>" declared in the same file)
 *   env.<NAME>                (env is a ProcessEnv alias, e.g. `deps.env ??
 *                              process.env` in the provider services)
 *   getEnv("<NAME>")          (packages/obs logtape sinks)
 *   envInt(env, "<NAME>")     (numeric env readers in provider services)
 *
 * `undocumentedVars` diffs the collected names against the names listed
 * in .env.example (active `NAME=` lines AND commented `# NAME=` lines —
 * a commented secret placeholder still counts as documented) minus an
 * explicit allowlist of platform/framework-injected names.
 *
 * The vitest suite (apps/api/src/lib/env-audit.test.ts) runs the real
 * repo scan through these functions and fails when code reads a var
 * that is neither in .env.example nor allowlisted here.
 */

export interface EnvVarUse {
  /** Variable name, e.g. "DATABASE_URL". */
  name: string;
  /** Repo-relative file it was read in. */
  file: string;
}

export interface SourceFile {
  /** Repo-relative path, used only for reporting. */
  path: string;
  text: string;
}

/**
 * Names that are injected by the platform or framework, never user
 * config: documenting them in .env.example would be noise. Everything
 * else a first-party file reads must appear in .env.example.
 */
export const ENV_AUDIT_ALLOWLIST: ReadonlySet<string> = new Set([
  // Runtime/CI flags every Node tool reads.
  "CI",
  "NODE_ENV",
  // nitro/eve internals: written by agent/runtime.ts for the in-process
  // eve listener, consumed inside the vendored runtime (packages/eve).
  "NITRO_HOST",
  "NITRO_PORT",
  "NITRO_PRERENDER",
  "WORKFLOW_LOCAL_BASE_URL",
]);

const NAME = "[A-Z][A-Z0-9_]*";
// `(?![A-Z0-9_])` forces maximal munch: without it a failed trailing
// lookahead makes the name give back its last char ("DATABASE_URL" →
// "DATABASE_UR") and still match.
const DOT_NAME = `(${NAME})(?![A-Z0-9_])`;

/**
 * Extract env-var names read by one source file. Pure: pass the text,
 * get names back. Order is first-seen; duplicates collapse.
 */
export function extractEnvVars(text: string): string[] {
  const found = new Set<string>();
  const add = (name: string | undefined) => {
    if (name && name.length >= 2) found.add(name);
  };

  // process.env.<NAME> / import.meta.env.<NAME> (not writes: `env.X =`)
  for (const m of text.matchAll(
    new RegExp(`(?:process|import\\.meta)\\.env\\.${DOT_NAME}(?!\\s*=[^=])`, "g"),
  )) {
    add(m[1]);
  }
  // process.env["<NAME>"] / import.meta.env["<NAME>"]
  for (const m of text.matchAll(
    new RegExp(`(?:process|import\\.meta)\\.env\\[["'](${NAME})["']\\]`, "g"),
  )) {
    add(m[1]);
  }
  // process.env[CONST] where the const holds an all-caps name declared
  // in the same file (the bundler-fold-proof NODE_ENV/DEV_LOGIN/TARIMA_EVE_* pattern).
  const consts = new Map<string, string>();
  for (const m of text.matchAll(
    new RegExp(`const\\s+([A-Z][A-Z0-9_]*)\\s*=\\s*["'](${NAME})["']`, "g"),
  )) {
    consts.set(m[1]!, m[2]!);
  }
  for (const m of text.matchAll(/(?:process|import\.meta)\.env\[([A-Z][A-Z0-9_]*)\]/g)) {
    const resolved = consts.get(m[1]!);
    if (resolved) add(resolved);
  }
  // env.<NAME> — `env` is a ProcessEnv alias in the provider services and
  // test harnesses (`const env = deps.env ?? process.env`).
  for (const m of text.matchAll(new RegExp(`\\benv\\.${DOT_NAME}(?!\\s*=[^=])`, "g"))) {
    add(m[1]);
  }
  // getEnv("<NAME>") — the obs sink reader's injected accessor.
  for (const m of text.matchAll(new RegExp(`\\bgetEnv\\(\\s*["'](${NAME})["']`, "g"))) {
    add(m[1]);
  }
  // Two-arg numeric/bool readers: envInt(env, "<NAME>", fallback).
  for (const m of text.matchAll(new RegExp(`\\w+\\(\\s*env\\s*,\\s*["'](${NAME})["']`, "g"))) {
    add(m[1]);
  }
  return [...found];
}

/** Collect uses across files; returns name → sorted file list. */
export function collectEnvVars(files: SourceFile[]): Map<string, Set<string>> {
  const uses = new Map<string, Set<string>>();
  for (const file of files) {
    for (const name of extractEnvVars(file.text)) {
      let set = uses.get(name);
      if (!set) uses.set(name, (set = new Set()));
      set.add(file.path);
    }
  }
  return uses;
}

/**
 * Names documented in .env.example. Both live assignments (`NAME=`)
 * and commented placeholders (`# NAME=...`) count — the file documents
 * optional secrets as comments on purpose.
 */
export function parseEnvExample(text: string): Set<string> {
  const names = new Set<string>();
  for (const line of text.split("\n")) {
    const m = line.match(new RegExp(`^\\s*#?\\s*(${NAME})\\s*=`));
    if (m) names.add(m[1]!);
  }
  return names;
}

/** Vars read by code but absent from .env.example and not allowlisted. */
export function undocumentedVars(
  files: SourceFile[],
  envExampleText: string,
  allowlist: ReadonlySet<string> = ENV_AUDIT_ALLOWLIST,
): EnvVarUse[] {
  const documented = parseEnvExample(envExampleText);
  const uses = collectEnvVars(files);
  const missing: EnvVarUse[] = [];
  for (const [name, paths] of [...uses.entries()].sort()) {
    if (documented.has(name) || allowlist.has(name)) continue;
    for (const file of [...paths].sort()) missing.push({ name, file });
  }
  return missing;
}
