import type { EveEvalConfig, EveEvalConfigInput } from "#evals/types.js";
/**
 * Defines the run-wide configuration shared by every eval, authored as the
 * default export of `evals.config.ts` at the root of the `evals/` directory.
 *
 * Exactly one `evals.config.ts` is required. It supplies the optional default
 * `judge` model for `t.judge(...)` assertions (so individual evals need not
 * repeat it), run-level `reporters`, `maxConcurrency`, `timeoutMs`, and `repeat`
 * defaults, and optional run-wide `setup` and `teardown`. CLI flags
 * (`--max-concurrency`, `--timeout`, `--repeat`) and per-eval values take
 * precedence over the config defaults.
 *
 * Throws on invalid input: a non-positive or non-integer `maxConcurrency` or `repeat`,
 * a negative or non-finite `timeoutMs`, non-array `reporters`, or a
 * non-function `setup` or `teardown`.
 */
export declare function defineEvalConfig<TContext = undefined>(input: EveEvalConfigInput<TContext>): EveEvalConfig<TContext>;
