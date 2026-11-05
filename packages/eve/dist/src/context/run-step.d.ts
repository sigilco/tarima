import type { HarnessSession, HarnessSessionBase, StepResult } from "#harness/types.js";
import { type ContextContainer } from "#context/container.js";
interface ContextScopeResult<T, S extends HarnessSessionBase> {
    readonly result: T;
    readonly session: S;
}
/**
 * Runs `callback` inside a fully-initialized ALS scope with all framework
 * providers (session, connection, sandbox) built and committed.
 *
 * The callback receives the enriched session and must return both its own
 * result and the (possibly mutated) session so provider commit hooks can
 * persist provider-owned state (e.g. sandbox snapshots).
 */
export declare function withContextScope<T, S extends HarnessSessionBase>(ctx: ContextContainer, session: S, callback: (session: S) => Promise<ContextScopeResult<T, S>>): Promise<ContextScopeResult<T, S>>;
/**
 * Runs one harness step inside the unified context.
 *
 * Delegates to {@link withContextScope} for provider lifecycle, then
 * reassembles the {@link StepResult}.
 */
export declare function runStep(ctx: ContextContainer, harnessSession: HarnessSession, callback: (session: HarnessSession) => Promise<StepResult>): Promise<StepResult>;
export {};
