import type { ChannelSetupLog } from "#setup/cli/index.js";
import type { VercelProjectReference } from "#setup/project-resolution.js";
import { runVercel, runVercelCaptureStdout } from "#setup/primitives/run-vercel.js";
interface TelegramConnectorRef {
    id: string;
    uid: string;
}
interface ProvisionTelegramConnectorDeps {
    runVercel: typeof runVercel;
    runVercelCaptureStdout: typeof runVercelCaptureStdout;
}
/** Parses Vercel Connect JSON for a created Telegram connector. */
export declare function parseCreatedTelegramConnector(stdout: string): TelegramConnectorRef | undefined;
/**
 * Stores the bot token in a Telegram connector and routes its triggers to eve.
 * Connect registers the bot's webhook and verifies Telegram's secret token.
 */
export declare function provisionTelegramConnector(input: {
    botToken: string;
    log: ChannelSetupLog;
    project: VercelProjectReference;
    projectRoot: string;
    slug: string;
    signal?: AbortSignal;
    deps?: ProvisionTelegramConnectorDeps;
}): Promise<TelegramConnectorRef>;
export {};
