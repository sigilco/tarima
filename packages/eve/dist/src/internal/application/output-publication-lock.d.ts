import { type OutputPublicationJournal } from "#internal/application/output-publication-journal.js";
interface RecoveryLease {
    complete(): Promise<void>;
    release(): Promise<void>;
}
export declare function resolveOutputPublicationLockPath(appRoot: string): string;
/**
 * Keeps a held lock's (or lease's) journal mtime fresh while its owner works.
 * Liveness cannot rest on `process.kill(pid, 0)` alone — journals survive
 * reboots, so a recycled pid (or an unrelated process answering `EPERM`)
 * would make a dead owner look alive forever. Returns a stop function.
 */
export declare function startPublicationJournalHeartbeat(journalDirectoryPath: string): () => void;
export declare function acquireOutputPublicationLock(lockPath: string, journal: OutputPublicationJournal, onContention: () => Promise<void>): Promise<() => Promise<void>>;
export declare function acquireRecoveryLease(recoveryPath: string, token: string): Promise<RecoveryLease | undefined>;
export {};
