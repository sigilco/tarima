import type { VercelProjectReference } from "#setup/project-resolution.js";
import { deriveSlackConnectorSlug } from "#setup/scaffold/index.js";
import { writeTextFile } from "#setup/scaffold/files.js";
import { type SetupApplyContext, type SetupPrepareContext } from "../types.js";
import { configureDiscordInteractionsEndpoint, enableDiscordMessageContentIntent, registerDiscordCommand, resolveDiscordApplication } from "./api.js";
import { provisionDiscordConnector } from "./connect.js";
import { readTextFile } from "./daemon.js";
export interface DiscordSetupDeps {
    configureEndpoint: typeof configureDiscordInteractionsEndpoint;
    deriveConnectorSlug: typeof deriveSlackConnectorSlug;
    enableMessageContent: typeof enableDiscordMessageContentIntent;
    provisionConnector: typeof provisionDiscordConnector;
    readTextFile: typeof readTextFile;
    registerCommand: typeof registerDiscordCommand;
    resolveApplication: typeof resolveDiscordApplication;
    writeTextFile: typeof writeTextFile;
}
interface DiscordSetupPlan {
    botToken: string;
    /** The slash command to register; absent when the agent answers messages instead. */
    command?: {
        readonly name: string;
        readonly description: string;
    };
    /** How to register the Gateway relay; absent for slash commands only. */
    gateway?: DiscordGatewayPlan;
    project: VercelProjectReference;
    slug: string;
}
/** The project's Vercel config, checked before anything is written. */
type DiscordGatewayPlan = 
/** `vercel.json` with the daemon added, or `undefined` when it's already there. */
{
    readonly vercelJson: string | undefined;
}
/** The project configures Vercel in `vercel.ts`, which setup doesn't edit. */
 | {
    readonly vercelTs: {
        readonly registered: boolean;
    };
};
export declare function prepareDiscordSetup(context: SetupPrepareContext, deps?: DiscordSetupDeps): Promise<DiscordSetupPlan>;
export declare function applyDiscordSetup(plan: DiscordSetupPlan, context: SetupApplyContext, deps?: DiscordSetupDeps): Promise<{
    deploymentRequired: true;
    facts: {
        label: string;
        value: string;
        kind?: "url";
    }[];
}>;
export declare const DISCORD_SETUP: import("../types.js").SetupIntegration;
export {};
