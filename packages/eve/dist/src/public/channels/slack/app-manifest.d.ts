import type { JsonObject } from "#shared/json.js";
interface SlackAppManifestBuildDefinition {
    readonly build: (channelName: string) => JsonObject;
}
export declare function defineSlackAppManifest(input: {
    readonly botName?: string;
    /** Adds the scopes, events, and feature flag Slack code channels need. */
    readonly codeChannels?: boolean;
    /** Adds the `users:read` scope `messageContext.users` needs for names. */
    readonly users?: boolean;
    /** Adds the `users:read.email` scope `messageContext.users.email` needs. */
    readonly userEmails?: boolean;
}): SlackAppManifestBuildDefinition;
export {};
