import { type Clearance } from "#harness/clearance.js";
import { type ToolSet } from "ai";
import type { ModelProfile } from "#harness/model-profile.js";
import type { HarnessToolDefinition } from "#harness/execute-tool.js";
import type { HarnessToolMap } from "#harness/types.js";
import { type ApprovalMemory } from "#approval/evaluation.js";
import type { ApprovalDecision } from "#approval/status.js";
import type { ToolExecuteOptions } from "#tools/definition.js";
/**
 * Describes harness tools to the AI SDK, each as `describe` words it. The SDK only calls the
 * model, so it gets no `execute`: eve runs every call itself (`#harness/call-executor.js`).
 *
 * Entries listed in `disabledProviderTools` are skipped entirely. Used
 * by the harness recovery path when a gateway fallback provider has
 * rejected a provider-specific tool — the tool is dropped for the
 * retry call so the request can proceed without it.
 */
export declare function buildToolSet(input: {
    readonly describe: (definition: HarnessToolDefinition) => string;
    readonly disabledProviderTools?: ReadonlySet<string>;
    readonly tools: HarnessToolMap;
}): ToolSet;
/** A tool eve runs inside the step, rather than the runtime or the provider. */
export type RunnableTool = HarnessToolDefinition & {
    readonly execute: NonNullable<HarnessToolDefinition["execute"]>;
};
export declare function isRunnableTool(definition: HarnessToolDefinition | undefined): definition is RunnableTool;
/**
 * Runs a tool's `execute` for one call, through its stub when an eval stubs it, as the caller who
 * approved the call. Outputs are normalized to JSON, except an {@link AuthorizationSignal}, which
 * the executor turns into a sign-in.
 */
export declare function invokeTool(definition: RunnableTool, input: unknown, options: ToolExecuteOptions, clearance: Clearance): Promise<unknown> | AsyncIterable<unknown>;
/**
 * Builds the AI SDK ToolSet for one harness step.
 *
 * Most tools have local executors and are assembled by {@link buildToolSet}.
 * Provider-managed tools (e.g. web_search) have no local `execute` — the
 * execution layer intentionally omits it. This function detects the gap and
 * injects the real AI SDK provider tool in their place.
 * If the current model cannot supply that provider tool, the framework
 * sentinel is removed instead of being exposed as an unexecutable tool.
 *
 * When a user overrides a provider-managed tool via `defineTool()`, their
 * tool has a real executor and flows through the normal path — no
 * replacement occurs.
 *
 * Tool names listed in `disabledProviderTools` are skipped entirely —
 * both the framework definition and the injected provider tool are
 * omitted from the returned set. Used by the harness recovery path when
 * a gateway fallback provider has rejected a provider-specific tool.
 */
export declare function buildToolSetWithProviderTools(input: {
    readonly describe: (definition: HarnessToolDefinition) => string;
    readonly disabledProviderTools?: ReadonlySet<string>;
    readonly profile: ModelProfile;
    readonly tools: HarnessToolMap;
}): Promise<ToolSet>;
interface ApprovalCall {
    readonly callId: string;
    readonly input: unknown;
    readonly abortSignal?: AbortSignal;
    readonly approvalMemory?: ApprovalMemory;
    readonly recheck?: boolean;
}
/** The gate's answer for one call: an approval decision, and the clearance a call that runs gets. */
export interface GateDecision extends ApprovalDecision {
    /** Set exactly when the call may run now: neither denied nor waiting on a person. */
    readonly clearance?: Clearance;
}
/** Decides whether a call runs, needs a person's approval, or is denied. */
export declare function decideApproval(definition: HarnessToolDefinition, call: ApprovalCall): Promise<GateDecision>;
export {};
