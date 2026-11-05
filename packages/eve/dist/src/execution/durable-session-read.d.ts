import type { DurableSession, DurableSessionState } from "#execution/durable-session-store.js";
/** Explicit checkpoint contract shared by deployment handoffs. */
export declare const DURABLE_SESSION_VERSION = 2;
/** Reads only the embedded checkpoint; no stream or migration fallback exists. */
export declare function readDurableSession(state: DurableSessionState): DurableSession;
