import { createPromptCommandOutput, type ChannelSetupLog } from "#setup/cli/index.js";
import { captureVercel, runVercel } from "#setup/primitives/run-vercel.js";
import { type SlackConnectorDetails, type SlackConnectorRef, type SlackWorkspaceConnection } from "./slack-connect.js";
import type { SlackConnectorCandidate, SlackRoutingPlan } from "./slack-setup-plan.js";
export declare const CONNECT_LOOKUP_TIMEOUT_MS = 60000;
/** Connect subprocess operations needed to inspect and remove Slack connectors. */
export interface SlackConnectLifecycleDeps {
    captureVercel: typeof captureVercel;
    runVercel: typeof runVercel;
}
export type SlackConnectorCleanupResult = {
    state: "clean";
} | {
    state: "failed";
    connectorUids: readonly string[];
};
type CommandOutput = ReturnType<typeof createPromptCommandOutput>;
type LookupFailure = {
    state: "failed";
    message: string;
};
/** Shared dependencies and output routing for one connector cleanup operation. */
interface SlackConnectorCleanupContext {
    log: ChannelSetupLog;
    deps: SlackConnectLifecycleDeps;
    projectRoot: string;
    orgId: string | undefined;
    onOutput: CommandOutput;
}
export type SlackConnectorInspection = {
    state: "ok";
    /** Connectors attached to this project or found by UID, with details. */
    candidates: readonly SlackConnectorCandidate[];
} | LookupFailure;
/**
 * Read-only snapshot of the Slack connectors that matter to the linked
 * project: those attached to it, plus `namedUids` looked up directly. Each
 * carries its attachment, workspace installation, and trigger destination.
 * Any unreadable connector fails the whole snapshot so setup never guesses.
 */
export declare function inspectSlackConnectors(input: {
    deps: SlackConnectLifecycleDeps;
    projectRoot: string;
    projectId: string;
    orgId: string | undefined;
    /**
     * UIDs to look up even when this project isn't attached: the channel
     * file's connector and `slack/<slug>`, the names a connector made for this
     * agent would carry. No other unattached connector is ever reused.
     */
    namedUids: ReadonlySet<string>;
    onOutput: CommandOutput;
    signal?: AbortSignal;
}): Promise<SlackConnectorInspection>;
/** Rechecks the chosen connector before changing its project access or destinations. */
export declare function refreshSlackCandidate(input: {
    deps: SlackConnectLifecycleDeps;
    projectRoot: string;
    candidate: SlackConnectorCandidate;
    projectId: string;
    orgId: string | undefined;
    onOutput: CommandOutput;
    signal?: AbortSignal;
}): Promise<{
    state: "ok";
    candidate: SlackConnectorCandidate;
} | LookupFailure>;
/**
 * Picks the `--name` for a new connector: `slug`, then `slug-2`, `slug-3`,
 * and so on. Connect derives the UID `slack/<name>` from it, and a UID a
 * team connector already uses fails the create, so each name is checked by
 * looking its UID up directly.
 */
export declare function findFreeSlackConnectorName(input: {
    deps: Pick<SlackConnectLifecycleDeps, "captureVercel">;
    projectRoot: string;
    orgId: string | undefined;
    slug: string;
    onOutput: CommandOutput;
    signal?: AbortSignal;
}): Promise<{
    state: "ok";
    name: string;
} | LookupFailure>;
/** Result of making a connector deliver this project's events to eve's Slack route. */
export type SlackRoutingResult = {
    state: "configured";
} | {
    state: "attach-failed";
    message?: string;
};
/**
 * Applies the planned routing mutation. Never detaches: attach only adds
 * token access, and the trigger-destinations replacement keeps the project's
 * token access and every other project's entries intact.
 */
export declare function applySlackRouting(input: {
    deps: SlackConnectLifecycleDeps;
    projectRoot: string;
    ref: SlackConnectorRef;
    plan: Extract<SlackRoutingPlan, {
        kind: "apply";
    }>;
    orgId: string | undefined;
    onOutput: CommandOutput;
    signal?: AbortSignal;
}): Promise<SlackRoutingResult>;
type SlackWorkspaceLookup = {
    state: "connected";
    workspace: SlackWorkspaceConnection;
} | {
    state: "pending";
} | {
    state: "failed";
    message: string;
};
type SlackConnectorDetailsLookup = {
    state: "found";
    details: SlackConnectorDetails;
} | {
    state: "failed";
    message: string;
};
/** Fetches and validates one team-scoped connector detail payload. */
export declare function fetchSlackConnectorDetails(input: {
    deps: Pick<SlackConnectLifecycleDeps, "captureVercel">;
    projectRoot: string;
    connectorId: string;
    orgId: string | undefined;
    onOutput: CommandOutput;
    timeoutMs: number;
    signal?: AbortSignal;
}): Promise<SlackConnectorDetailsLookup>;
/** Fetches the Slack workspace connected to a connector, if one exists yet. */
export declare function fetchSlackWorkspace(input: {
    deps: Pick<SlackConnectLifecycleDeps, "captureVercel">;
    projectRoot: string;
    connectorId: string;
    orgId: string | undefined;
    onOutput: CommandOutput;
    timeoutMs: number;
    signal?: AbortSignal;
}): Promise<SlackWorkspaceLookup>;
/**
 * Removes the exact connector returned by `connect create`. A run the CLI
 * rejected before its browser flow cannot have created a connector, so there
 * is nothing to remove. Otherwise, when no UID was returned, ownership cannot be
 * proven: the browser page may still create one, and a concurrent or
 * eventually-consistent connector looks the same as this attempt's. So
 * cleanup fails closed. It removes nothing and instead surfaces
 * `expectedUid`, which was free before this attempt, if it now exists, so the
 * caller can stop rather than risk removing a bystander's connector.
 */
export declare function cleanupCreatedAttempt(context: SlackConnectorCleanupContext, input: {
    expectedUid: string;
    createdRef: SlackConnectorRef | undefined;
    /** The CLI reported its own error before printing the browser URL. */
    rejected: boolean;
}): Promise<SlackConnectorCleanupResult>;
export {};
