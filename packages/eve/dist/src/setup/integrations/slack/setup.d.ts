import { deriveSlackConnectorSlug, ensureChannel, type SlackConnectorSlug } from "#setup/scaffold/index.js";
import { readSlackChannelFile } from "#setup/scaffold/update/update-slack-channel.js";
import { inspectSlackbotConnectors, provisionSlackbot, reconcileSlackUid, type SlackbotConnectorInspection, type SlackConnectorSelection } from "#setup/slackbot.js";
import { type SetupApplyContext, type SetupPrepareContext } from "../types.js";
export interface SlackSetupDeps {
    deriveSlackConnectorSlug: typeof deriveSlackConnectorSlug;
    ensureChannel: typeof ensureChannel;
    inspectConnectors: typeof inspectSlackbotConnectors;
    provisionSlackbot: typeof provisionSlackbot;
    reconcileSlackUid: typeof reconcileSlackUid;
    readSlackChannelFile: typeof readSlackChannelFile;
    missingSlackEnvironment: (environmentRoot: string) => Promise<string[]>;
}
type SlackSetupPlan = {
    credentials: "environment";
    slug: SlackConnectorSlug;
}
/** The channel file already exists and isn't Connect-backed; setup leaves it alone. */
 | {
    credentials: "existing-file";
    file: "environment";
    missing: readonly string[];
} | {
    credentials: "existing-file";
    file: "custom";
} | {
    credentials: "vercel-connect";
    slug: SlackConnectorSlug;
    inspection: SlackbotConnectorInspection;
    connector: SlackConnectorSelection;
    /** UID the existing channel file names; patched when another connector is chosen. */
    channelConnectorUid: string | undefined;
};
/**
 * Reads what is already in place before asking anything, so a re-run only
 * asks the questions an earlier attempt left open. A channel file that names
 * a connector settles the credential and connector questions.
 */
export declare function prepareSlackSetup(context: SetupPrepareContext, deps?: SlackSetupDeps): Promise<SlackSetupPlan>;
export declare function applySlackSetup(plan: SlackSetupPlan, context: SetupApplyContext, deps?: SlackSetupDeps): Promise<{
    facts: never[];
} | {
    facts: {
        label: string;
        value: string;
        kind: "url";
    }[];
    deploymentRequired: true;
}>;
export declare const SLACK_SETUP: import("../types.js").SetupIntegration;
export {};
