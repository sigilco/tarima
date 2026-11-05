import { type OwnerRun } from "#execution/session-inbox/runnable-owner.js";
import { resumeHook, type Hook } from "#internal/workflow/runtime.js";
/**
 * The session's owner was built by another eve version, so this build cannot
 * execute it and ingress refused the command before committing it. Internal:
 * carries the owner run, which never reaches a client.
 */
export declare class StrandedSessionOwnerError extends Error {
    /** The owner's hook, when ingress looked it up; its metadata names the session. */
    readonly hook: Hook | undefined;
    readonly ownerRun: OwnerRun;
    constructor(ownerRun: OwnerRun, hook?: Hook);
    get ownerRunId(): string;
    /** eve version that built the owner, when it recorded one. */
    get eveVersion(): string | undefined;
}
/**
 * The single ingress path into a hook: refuses a session inbox whose owner
 * cannot execute before anything is committed. Vercel can reuse a validated
 * inbox handle: Workflow requires its guarded, deduplicated write endpoint.
 * Only a definite refusal falls back to resolving the current token owner.
 */
export declare function resumeRunnableHook(token: string, payload: unknown, inbox?: string): Promise<Awaited<ReturnType<typeof resumeHook>>>;
/**
 * Throws {@link StrandedSessionOwnerError} when the run holding a physical
 * session inbox token cannot execute. An unheld token passes: resuming it
 * reports the absence. Where the World replays each run on its own
 * deployment, every owner can execute, so nothing is looked up.
 */
export declare function assertRunnableSessionInbox(token: string): Promise<void>;
/** {@link assertRunnableSessionInbox} for a holder the caller already looked up. */
export declare function assertRunnableSessionOwner(holder: {
    readonly runId: string;
    readonly hook?: Hook;
}): Promise<void>;
/**
 * The run holding a session hook token, or `undefined` when none does. The
 * `eve dev` World refuses to expose the hooks of a run it will not execute
 * (a dormant or ineligible generation) and names only the run, so `hook` is
 * then absent. This is the only place that refusal is interpreted.
 */
export declare function findSessionHookHolder(token: string): Promise<{
    readonly runId: string;
    readonly hook?: Hook;
} | undefined>;
/**
 * Looks up a session hook. A run the `eve dev` World refuses to expose is
 * stranded only when another eve version built it; otherwise a restart with
 * `--resume` may run it, so the refusal propagates and nothing is ended.
 */
export declare function lookupSessionOwnerHook(token: string): Promise<Hook>;
