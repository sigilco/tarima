/**
 * Pure parsers for Vercel Connect CLI/API payloads used by Slackbot
 * provisioning: connector-list shapes, the `connect create` stdout, and the
 * connector detail response. No subprocesses or I/O — just shape validation —
 * so the provisioning orchestrator ({@link import("./slackbot.js")}) stays
 * focused on flow and these stay trivially testable.
 */
import { z } from "#compiled/zod/index.js";
declare const SlackConnectorRefSchema: z.ZodObject<{
    uid: z.ZodString;
    id: z.ZodString;
}, z.core.$strip>;
/** Identifiers returned by Vercel Connect for a Slack connector. */
export type SlackConnectorRef = z.infer<typeof SlackConnectorRefSchema>;
/** Slack workspace metadata exposed by a connected Slack connector. */
export interface SlackWorkspaceConnection {
    workspaceUrl: string;
    workspaceName?: string;
}
/**
 * One place Vercel Connect forwards Slack events. A destination without
 * `branch` or `customEnvironmentId` targets the project's default deployment.
 */
export interface SlackTriggerDestination {
    projectId: string;
    path?: string;
    branch?: string;
    customEnvironmentId?: string;
}
/** Parsed Slack connector state returned by Vercel's connector detail API. */
export interface SlackConnectorDetails {
    ref: SlackConnectorRef;
    workspace?: SlackWorkspaceConnection;
    triggerDestinations: readonly SlackTriggerDestination[];
}
/**
 * Parses the exact connector response. Vercel reports a completed Slack
 * workspace connection in `data.slackTeam`; its installations collection can
 * remain empty even after browser setup succeeds.
 */
export declare function parseSlackConnectorDetails(body: unknown): SlackConnectorDetails | undefined;
/**
 * Reads the connector identifiers from `vercel connect create … -F json`
 * stdout, the authoritative source for the just-created connector's UID.
 * Returns `undefined` when stdout is empty or not the expected JSON.
 */
export declare function parseCreatedSlackConnector(stdout: string): SlackConnectorRef | undefined;
/**
 * Turns a Slack `app_redirect` install URL into a deep link that opens the
 * Messages tab, a DM compose with the bot, instead of the app's about page.
 * Slack honors `tab=messages` only on `app_redirect` links, the ones carrying
 * `app` and `team` ids; any other URL is returned unchanged.
 * See https://docs.slack.dev/interactivity/deep-linking/.
 */
export declare function slackMessageDeepLink(url: string): string;
/** A project attached to a connector. */
export interface SlackConnectorProject {
    id: string;
    name?: string;
}
/** A Slack connector plus the projects it is attached to. */
export interface RawSlackConnector {
    uid: string;
    id: string;
    /** Attached projects, possibly truncated to the first few. */
    projects: readonly SlackConnectorProject[];
    createdAt: number;
}
/** One page of `GET /v1/connect/connectors?include=projects`. */
export interface SlackConnectorPage {
    connectors: RawSlackConnector[];
    /** Cursor for the next page, absent on the last one. */
    next?: string;
}
/** Parses one connector list page, keeping only Slack connectors. */
export declare function parseSlackConnectorPage(body: unknown): SlackConnectorPage | undefined;
/** Parses one page of `GET /v1/connect/connectors/<id>/projects`. */
export declare function parseConnectorProjects(body: unknown): SlackConnectorProject[] | undefined;
export {};
