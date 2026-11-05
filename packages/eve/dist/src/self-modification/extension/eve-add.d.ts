import { spawn as nodeSpawn } from "node:child_process";
/** Minimal spawn surface, injectable so tests need no real child process. */
export type SpawnLike = typeof nodeSpawn;
export type EveAddOutcome = {
    readonly kind: "installed";
}
/** The child ended in a state that needs a terminal (a setup question). */
 | {
    readonly kind: "blocked";
    readonly message: string;
} | {
    readonly kind: "failed";
    readonly message: string;
    readonly changed?: readonly string[];
};
export interface HeadlessEvent {
    readonly version?: number;
    readonly type: string;
    readonly item?: string;
    readonly completedItems?: readonly string[];
    readonly deploymentRequired?: boolean;
    readonly installed?: boolean;
    readonly message?: string;
    readonly question?: unknown;
    readonly url?: string;
    readonly userCode?: string;
    readonly failureCode?: string;
    readonly rolledBack?: boolean;
    readonly changed?: readonly string[];
}
/**
 * Resolves the `eve` executable the way eve already resolves setup binaries:
 * from the application's own dependency graph and the package's declared bin,
 * never a `PATH` lookup. A `PATH` hit could be any version, or not eve at all.
 */
export declare function resolveEveExecutable(appRoot: string): Promise<string>;
/**
 * Reads the one terminal event `eve add --non-interactive` prints.
 *
 * The registry SDK writes its own progress to the same streams, so this scans
 * for the JSON line rather than assuming the output is only NDJSON.
 */
export declare function readTerminalHeadlessEvent(output: string): HeadlessEvent | undefined;
/**
 * Runs `eve add <address> --non-interactive --skip-setup` in `appRoot`.
 *
 * The argv shape is fixed here rather than composed by a caller: the
 * subcommand, the interaction mode, and the setup opt-out are the constraints
 * that make this safe to expose, so none of them is a parameter.
 *
 * `--skip-setup` is redundant given the split rule, which reads the cached
 * catalog index while the manifest is fetched fresh at install. If the two ever
 * disagree, this flag is what keeps a setup flow from starting in a process
 * with no way to answer it.
 */
export declare function runEveAdd(input: {
    readonly address: string;
    readonly appRoot: string;
    readonly signal?: AbortSignal | undefined;
    readonly spawn?: SpawnLike | undefined;
}): Promise<EveAddOutcome>;
