/**
 * Server-side session access for code running inside an eve deployment,
 * such as hooks, tools, schedules, and channel routes.
 */
import type { SessionReader } from "#shared/session.js";
/**
 * Reads session streams in process, without calling the deployment's own
 * HTTP stream route.
 *
 * Available only in code running inside the eve server, where the session
 * store is configured. It reads any session ID without channel auth, so check
 * that the caller may read a session before passing an ID from a request.
 */
export declare const sessions: {
    attach(sessionId: string): SessionReader;
};
