import type { SlackChannelConfig, SlackAnswerResult, SlackAnswerSubmission, SlackSessionTarget } from "#public/channels/slack/slackChannel.js";
import type { SlackTransportOptions } from "#public/channels/slack/transport.js";
export declare function authorizeAnswer(input: {
    readonly deps: {
        readonly api: SlackTransportOptions | undefined;
        readonly config: SlackChannelConfig;
        readonly onAnswers: NonNullable<SlackChannelConfig["onAnswers"]>;
    };
    readonly installationTeamId: string | null | undefined;
    readonly submission: SlackAnswerSubmission;
    readonly target: SlackSessionTarget;
    readonly teamId: string | null | undefined;
}): Promise<SlackAnswerResult>;
