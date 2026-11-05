import type { PackageManagerKind } from "../../package-manager.js";
import { type NodeEngineOverride } from "../../node-engine.js";
import { type WorkspaceRootMutation } from "../workspace-root.js";
import { type WebAuthentication, type WebPackageVersions } from "./web-options.js";
export type { WebAuthentication, WebPackageVersions } from "./web-options.js";
export declare const SLACK_CHANNEL_DEFAULT_ROUTE = "/eve/v1/slack";
export declare const DEFAULT_SLACK_CONNECTOR_SLUG = "my-agent";
declare const slackConnectorSlugBrand: unique symbol;
export type ChannelKind = "slack" | "web";
export type SlackConnectorSlug = string & {
    readonly [slackConnectorSlugBrand]: true;
};
export interface PackageJsonMutation {
    path: string;
    dependencies: string[];
    devDependencies: string[];
    scripts: string[];
}
export type ChannelMutationResult = SlackChannelMutationResult | WebChannelMutationResult;
interface SlackChannelWrittenResult {
    kind: "slack";
    action: "created" | "overwritten";
    filesWritten: string[];
    filesOverwritten?: string[];
    filesSkipped: string[];
    packageJsonUpdated: PackageJsonMutation[];
    slackConnectorSlug: SlackConnectorSlug;
}
interface SlackChannelSkippedResult {
    kind: "slack";
    action: "skipped";
    filesWritten: [];
    filesOverwritten?: [];
    filesSkipped: [string];
    packageJsonUpdated: [];
}
type SlackChannelMutationResult = SlackChannelWrittenResult | SlackChannelSkippedResult;
interface WebChannelWrittenResult {
    kind: "web";
    action: "created" | "overwritten";
    filesWritten: string[];
    filesOverwritten?: string[];
    competingNextConfigFiles?: string[];
    nodeEngineOverride?: NodeEngineOverride;
    filesSkipped: string[];
    packageJsonUpdated: PackageJsonMutation[];
}
interface WebChannelSkippedResult {
    kind: "web";
    action: "skipped";
    skipReason: "nextjs-project";
    filesWritten: [];
    filesOverwritten?: [];
    filesSkipped: [string];
    packageJsonUpdated: [];
}
type WebChannelMutationResult = WebChannelWrittenResult | WebChannelSkippedResult;
/** The Vercel Framework Preset slug for the host framework a project declares. */
export declare function resolveVercelHostFrameworkPreset(projectRoot: string): Promise<string | undefined>;
/** Whether the root app declares a Vercel framework that owns its top-level deployment. */
export declare function hasVercelHostFramework(projectRoot: string): Promise<boolean>;
/**
 * Whether the project already carries a Next.js app: `package.json` declares a
 * `next` dependency in the same dependency fields Vercel framework detection
 * checks. This is the exact predicate the
 * web scaffold skips on (`skipReason: "nextjs-project"`), so pickers can mark
 * Web Chat as already present precisely when scaffolding would be a no-op.
 * A missing `package.json` reads as "no app".
 */
export declare function isNextJsProject(projectRoot: string): Promise<boolean>;
export declare function normalizeSlackConnectorSlug(input: string): SlackConnectorSlug;
export declare function deriveSlackConnectorSlug(projectRoot: string, projectNameHint?: string): Promise<SlackConnectorSlug>;
export interface EnsureChannelOptions {
    projectRoot: string;
    /** Root for environment files shared by workspace agents. */
    environmentRoot?: string;
    kind: ChannelKind;
    /** Manager that owns generated project configuration. Defaults to pnpm. */
    packageManager?: PackageManagerKind;
    /**
     * Final project path used to discover ancestor workspaces. This differs from
     * `projectRoot` only when scaffolding writes into a temporary staging
     * directory before moving the project into place.
     */
    workspaceProbeDirectory?: string;
    force?: boolean;
    /** Exact UID returned by Vercel Connect; takes precedence over the derived slug. */
    slackConnectorUid?: string;
    slackConnectorSlug?: SlackConnectorSlug;
    /** Credential source rendered into a Slack channel. Defaults to Vercel Connect. */
    slackCredentials?: "vercel-connect" | "environment";
    connectPackageVersion?: string;
    webPackageVersions?: WebPackageVersions;
    /** Authentication integration generated for Web Chat. Omit to keep the fail-closed placeholder. */
    webAuthentication?: WebAuthentication;
    /** When false, Web Chat leaves Vercel Services config unwritten for preview-only scaffolds. */
    configureVercelServices?: boolean;
    onWorkspaceRootMutation?: (mutation: WorkspaceRootMutation) => void | Promise<void>;
    /** Web Chat files and dependencies are already installed by a registry item. */
    skipDependencyMutation?: boolean;
}
export declare function ensureChannel(options: EnsureChannelOptions): Promise<ChannelMutationResult>;
export declare function listAuthoredChannels(agentRoot: string): Promise<string[]>;
