import type { EveEvalConfig, EveEvalConfigContext, EveEvalDefinition, EveEvalInput } from "#evals/types.js";
/**
 * Defines one eve eval. Each eval file is exactly one case: an imperative
 * `test(t)` function that drives the agent (`t.session`, `t.send`, …) and
 * asserts on what it produced (`t.succeeded()`, `t.check(...)`,
 * `t.judge(...)`). Organize related evals with directory nesting under
 * `evals/`, or default-export an array of evals to fan one file out over a
 * dataset.
 *
 * Pass `defineEval<typeof config>(...)` with a type-only config import to
 * infer the setup context available as `t.context`.
 *
 * A `judge` is optional: `t.judge(...)` assertions fall back to the `judge`
 * declared in `evals.config.ts`, then the shared decision default. The judge model
 * is used solely for scoring, never for the agent under test. Eval identity is
 * derived from the `evals/<path>.eval.ts` file path by the discovery layer, so
 * authoring `id` or `name` throws.
 *
 * Throws on invalid input: a missing `test` function, a removed legacy key
 * (`input`/`run`/`checks`/`scores`/`expected`/`thresholds`/`parseOutput`/
 * `model`/`requires`), or a negative or non-finite `timeoutMs`.
 */
export declare function defineEval<TConfig extends EveEvalConfig = EveEvalConfig>(input: EveEvalInput<EveEvalConfigContext<TConfig>>): EveEvalDefinition<EveEvalConfigContext<TConfig>>;
