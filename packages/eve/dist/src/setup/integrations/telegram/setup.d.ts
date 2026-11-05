import type { VercelProjectReference } from "#setup/project-resolution.js";
import { pathExists } from "#setup/scaffold/files.js";
import { fetchTelegramBotUsername } from "./management.js";
import { type SetupPrepareContext } from "../types.js";
export interface TelegramSetupDeps {
    fetchBotUsername: typeof fetchTelegramBotUsername;
    pathExists: typeof pathExists;
    readEnvFile: (path: string) => Promise<string | undefined>;
}
type TelegramSetupPlan = {
    credentials: "connect";
    botToken: string;
    botUsername: string;
    connectorSlug: string;
    project: VercelProjectReference;
} | {
    credentials: "portable";
    botToken: string;
    botUsername: string;
    /** Overwrite a different `TELEGRAM_BOT_TOKEN` already in `.env.local`. */
    replaceBotToken: boolean;
};
export declare function prepareTelegramSetup(context: SetupPrepareContext, deps?: TelegramSetupDeps): Promise<TelegramSetupPlan>;
export declare const TELEGRAM_SETUP: import("../types.js").SetupIntegration;
export {};
