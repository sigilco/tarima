/** Name of the Vercel Daemon that holds the Discord Gateway connection. */
export declare const DISCORD_DAEMON_NAME = "discord-gateway";
/** Directory of the relay, relative to the project root. */
export declare const DISCORD_DAEMON_ROOT = "daemon";
/** The relay's files, by path relative to {@link DISCORD_DAEMON_ROOT}. */
export declare function discordDaemonFiles(connectorUid: string, options?: {
    readonly messageContent: boolean;
}): Readonly<Record<string, string>>;
/** The `daemons` entry to add by hand to a project configured through `vercel.ts`. */
export declare function discordDaemonEntry(): string;
/**
 * `vercel.json` with the relay's daemon added, given its current contents or
 * `undefined` when there is none. Returns `undefined` when a daemon of the same
 * name already exists, so the file is left as it is.
 */
export declare function withDiscordDaemon(vercelJson: string | undefined): string | undefined;
/** Reads a text file, or `undefined` when there is none. */
export declare function readTextFile(path: string): Promise<string | undefined>;
