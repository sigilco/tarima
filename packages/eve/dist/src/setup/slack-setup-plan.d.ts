/**
 * Pure decisions for resumable Slack setup: which mutation (if any) finishes
 * event delivery and which connector setup suggests.
 */
import type { SlackConnectorProject, SlackConnectorRef, SlackTriggerDestination, SlackWorkspaceConnection } from "./slack-connect.js";
/** Connect rejects a fourth trigger destination on one connector. */
export declare const MAX_SLACK_TRIGGER_DESTINATIONS = 3;
/** A connector other projects use, which setup never attaches to this one. */
export interface SlackConnectorInUse {
    uid: string;
    otherProjects: readonly SlackConnectorProject[];
}
/** One team Slack connector as setup sees it before changing anything. */
export interface SlackConnectorCandidate extends SlackConnectorRef {
    /** Whether the linked project has token access to this connector. */
    attached: boolean;
    /** Present once the Slack app is installed into a workspace. */
    workspace?: SlackWorkspaceConnection;
    triggerDestinations: readonly SlackTriggerDestination[];
    /**
     * Other projects that use this connector, by attachment or by trigger
     * destination. Setup never changes their attachments or destinations.
     */
    otherProjects: readonly SlackConnectorProject[];
    createdAt: number;
}
/**
 * Whether setup may reuse a connector: it already belongs to this project, or
 * no other project uses it (for example, one created by hand for this agent).
 * One Slack app forwards every event to every destination, so attaching a
 * second agent would make both respond.
 */
export declare function isReusableSlackConnector(candidate: SlackConnectorCandidate): boolean;
/**
 * What finishes event delivery for one connector. `attach` gives the project
 * token access; `destinations`, when present, is the full destination set to
 * write, changing only this project's default-deployment entry. Each half is
 * idempotent, so a run that stops between them resumes on the next one.
 */
export type SlackRoutingPlan = {
    kind: "apply";
    attach: boolean;
    destinations?: readonly SlackTriggerDestination[];
} | {
    kind: "limit-reached";
    destinations: readonly SlackTriggerDestination[];
};
/**
 * Plans the routing mutation. An attached project is never re-attached,
 * because `connect attach` without `--environment` resets its environment
 * scoping.
 */
export declare function planSlackRouting(input: {
    attached: boolean;
    destinations: readonly SlackTriggerDestination[];
    projectId: string;
    route: string;
}): SlackRoutingPlan;
/**
 * Orders candidates for the connector question and picks the suggestion:
 * the channel file's UID, then `slack/<slug>`, then the newest connector
 * already attached to this project. `undefined` suggests a new connector.
 */
export declare function orderSlackConnectorCandidates(candidates: readonly SlackConnectorCandidate[], input: {
    channelConnectorUid?: string | undefined;
    expectedUid: string;
}): {
    candidates: SlackConnectorCandidate[];
    preferred?: SlackConnectorCandidate;
};
/** Human-readable destination list for the trigger-limit report. */
export declare function describeSlackDestinations(destinations: readonly SlackTriggerDestination[], projectNames: ReadonlyMap<string, string>): string[];
