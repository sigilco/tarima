/**
 * Replaces the connector UID literal in a scaffolded Slack channel definition.
 */
export declare function updateSlackChannelConnectorUid(slackChannelPath: string, connectorUid: string): Promise<{
    patched: boolean;
}>;
/**
 * What an existing `agent/channels/slack.ts` already decides. `connect` names
 * one connector UID literal; `environment` reads the default Slack environment
 * variables; `custom` is hand-written credential wiring eve does not parse.
 */
export type SlackChannelFileState = {
    kind: "absent";
} | {
    kind: "connect";
    connectorUid: string;
} | {
    kind: "environment";
} | {
    kind: "custom";
};
/** Reads the Slack channel definition without changing it. */
export declare function readSlackChannelFile(slackChannelPath: string): Promise<SlackChannelFileState>;
