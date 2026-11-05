import { readProjectLink } from "#setup/project-resolution.js";
import { type ChannelSetupAwaitChoice, type ChannelSetupLog } from "#setup/cli/index.js";
import type { SlackConnectorProject, SlackTriggerDestination } from "./slack-connect.js";
import { type SlackConnectorCreateDeps } from "./slack-connect-create.js";
import { type SlackConnectLifecycleDeps } from "./slack-connect-lifecycle.js";
import { type SlackConnectorInUse, type SlackConnectorCandidate } from "./slack-setup-plan.js";
export type { SlackConnectorCandidate } from "./slack-setup-plan.js";
/** Injected for tests; defaults to the real Vercel CLI subprocess primitives. */
interface SlackbotProvisionDeps extends SlackConnectLifecycleDeps, SlackConnectorCreateDeps {
    /** Test seam for the linked Vercel project and team lookup. */
    readProjectLink?: typeof readProjectLink;
    /** Test seam for the workspace poll's pacing; defaults to a real sleep. */
    delay?: (ms: number, signal?: AbortSignal) => Promise<void>;
    /** Monotonic-enough clock for enforcing the workspace lookup deadline. */
    now?: () => number;
}
/** A Slack connector that delivers this project's events to eve's Slack route. */
interface SlackbotConnection {
    connectorUid: string;
    /** Deep link that opens a DM compose with the bot ("chat with your agent"). */
    chatUrl?: string;
    workspaceName?: string;
}
/**
 * Outcome of Slackbot provisioning. `attached` means a connector exists, this
 * project receives its events at eve's Slack route, and the app is installed
 * into a Slack workspace. `already-configured` is the same state reached
 * without changing anything. `not-installed` means the workspace-install
 * deadline elapsed and any connector created by this attempt was removed.
 * `cleanup-failed` means it may remain and callers must stop rather than
 * create another connector. `trigger-limit-reached` changed nothing because
 * the connector already has the maximum number of trigger destinations.
 * `connector-in-use` changed nothing because another project now uses the
 * chosen connector.
 */
export type ProvisionSlackbotResult = {
    state: "connector-lookup-failed";
}
/** `detail` is the Vercel CLI's own error line, when it printed one. */
 | {
    state: "create-failed";
    detail?: string;
} | {
    state: "cancelled";
} | {
    state: "existing-not-installed";
    connectorUid: string;
} | {
    state: "cleanup-failed";
    connectorUids: readonly string[];
} | {
    state: "attach-failed";
    connectorUid: string;
} | {
    state: "connector-in-use";
    connectorUid: string;
    projects: readonly SlackConnectorProject[];
} | {
    state: "trigger-limit-reached";
    connectorUid: string;
    destinations: readonly SlackTriggerDestination[];
} | {
    state: "not-installed";
} | {
    state: "installation-check-failed";
    connectorUid: string;
} | ({
    state: "attached";
} & SlackbotConnection) | ({
    state: "already-configured";
} & SlackbotConnection);
/** Explains why setup won't attach a connector another project uses. */
export declare function connectorInUseMessage(candidate: SlackConnectorInUse): string;
/** A reusable connector from {@link inspectSlackbotConnectors}, or a request to create one. */
export type SlackConnectorSelection = SlackConnectorCandidate | "create";
/**
 * Read-only snapshot of the Slack connectors setup may reuse for the linked
 * project. Setup takes it once, asks its questions from it, and hands it to
 * {@link provisionSlackbot}.
 */
export interface SlackbotConnectorInspection {
    projectId: string;
    orgId: string | undefined;
    /** Preferred short-name for `connect create slack --name`; suffixed when taken. */
    slug: string;
    /**
     * Reusable connectors in question order: the suggestion first, then
     * attached, then the rest. Connectors other projects use are excluded.
     */
    candidates: readonly SlackConnectorCandidate[];
    preferred?: SlackConnectorCandidate;
    /** Connectors other projects use, which setup never attaches to this one. */
    inUse: readonly SlackConnectorInUse[];
}
/**
 * Inspects the connectors attached to the linked project, plus
 * `slack/<slug>` and the channel file's UID looked up by name. Throws when
 * the project isn't linked or any connector can't be read, so setup never
 * creates a connector on a guess.
 */
export declare function inspectSlackbotConnectors(log: ChannelSetupLog, projectRoot: string, slug: string, options?: {
    signal?: AbortSignal;
    channelConnectorUid?: string | undefined;
}, deps?: SlackbotProvisionDeps): Promise<SlackbotConnectorInspection>;
interface ProvisionSlackbotOptions {
    /**
     * Cancels the caller's whole operation. The promise rejects after attempting
     * cleanup; only the explicit interactive Cancel action returns `cancelled`.
     */
    signal?: AbortSignal;
    /** Concurrent retry/cancel controls supplied by an interactive prompter. */
    awaitChoice?: ChannelSetupAwaitChoice;
}
/**
 * Reuses the selected connector or creates a new one, then points its event
 * destination at eve, running only the steps the connector still needs.
 * Re-running it after a partial failure resumes where the previous run
 * stopped; it never detaches a project. A successful `connect create` is the
 * completion boundary for a new browser flow.
 */
export declare function provisionSlackbot(log: ChannelSetupLog, projectRoot: string, inspection: SlackbotConnectorInspection, selection: SlackConnectorSelection, deps?: SlackbotProvisionDeps, options?: ProvisionSlackbotOptions): Promise<ProvisionSlackbotResult>;
/**
 * Patches a connector UID chosen by Connect before the caller deploys the channel definition.
 */
export declare function reconcileSlackUid(log: ChannelSetupLog, projectRoot: string, slackbot: ProvisionSlackbotResult, expectedUid: string): Promise<boolean>;
