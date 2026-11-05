import type { RequestStatus } from "#protocol/session-projection/request-status.js";
import type { SessionStreamEvent } from "#protocol/session-event.js";
import type { StandardSchemaV1 } from "#compiled/@standard-schema/spec/index.js";
import { type EveEvalSkillLoadMatchOptions, type EveEvalSubagentCallMatchOptions, type EveEvalToolCallMatchOptions } from "#evals/match.js";
import type { EveEvalEventMatch } from "#evals/match.js";
import type { RunAssertion } from "#evals/assertions/collector.js";
/** Minimal captured scope consumed by deterministic eval assertions. */
export interface EveEvalAssertionSubject {
    readonly derived: import("#evals/types.js").EveEvalDerivedFacts;
    readonly events: readonly SessionStreamEvent[];
    readonly output: unknown;
    readonly status: RequestStatus | "working";
}
/**
 * Asserts the run finished successfully: it did not fail and did not park on an
 * unanswered HITL input request.
 */
export declare function succeeded(): RunAssertion;
/**
 * Asserts the run ended cleanly parked on HITL input.
 */
export declare function awaitingInput(): RunAssertion;
/**
 * Asserts the joined assistant message text contains `token` (substring for
 * strings, `test` for RegExps).
 */
export declare function messageIncludes(token: string | RegExp): RunAssertion;
/**
 * Asserts a completed tool call with `name` happened. Options constrain the
 * call further: `input` partial-deep-matches, `output` matches the result,
 * `status` overrides the lifecycle state, and `count` constrains the number of
 * matches with either an exact number or a predicate.
 */
export declare function calledTool(name: string, options?: EveEvalToolCallMatchOptions): RunAssertion;
/**
 * Asserts the skill `skill` was loaded. `output`/`status`/`count` constrain
 * the matching load exactly as for `calledTool`.
 */
export declare function calledSkill(skill: string, options?: EveEvalSkillLoadMatchOptions): RunAssertion;
/**
 * Asserts no tool call with `name` happened.
 */
export declare function notCalledTool(name: string): RunAssertion;
/**
 * Asserts the named tools were requested in the given order (subsequence match:
 * other calls may interleave).
 */
export declare function toolOrder(names: readonly string[]): RunAssertion;
/**
 * Asserts the run made no tool calls at all.
 */
export declare function usedNoTools(): RunAssertion;
/**
 * Asserts the run made at most `max` tool calls.
 */
export declare function maxToolCalls(max: number): RunAssertion;
/**
 * Asserts no call reported a failure.
 */
export declare function noFailedCalls(): RunAssertion;
/**
 * Asserts a call to the agent tool `name` occurred. Each call to an agent
 * task counts once: its status and `output` come from `call.settled`, and the
 * session and remote metadata from the task's `child.opened` once its
 * session opened.
 */
export declare function calledAgent(name: string, options?: EveEvalSubagentCallMatchOptions): RunAssertion;
/**
 * Escape hatch: asserts an arbitrary predicate over the full typed event
 * stream. `label` names the assertion in reports.
 */
export declare function eventsSatisfy(label: string, predicate: (events: readonly SessionStreamEvent[]) => boolean): RunAssertion;
/** Asserts a typed stream event exists, optionally constraining its count. */
export declare function typedEvent(matcher: EveEvalEventMatch): RunAssertion;
/** Asserts no typed stream event matches. */
export declare function notEvent(matcher: EveEvalEventMatch): RunAssertion;
/** Asserts typed event groups occur in order, ignoring unrelated events. */
export declare function eventOrder(matchers: readonly EveEvalEventMatch[]): RunAssertion;
/**
 * Asserts `result.output` (the final assistant message) deep-equals `value`.
 */
export declare function outputEquals(value: unknown): RunAssertion;
/**
 * Asserts `result.output` validates against a Standard Schema (e.g. a Zod
 * schema).
 */
export declare function outputMatches(schema: StandardSchemaV1): RunAssertion;
