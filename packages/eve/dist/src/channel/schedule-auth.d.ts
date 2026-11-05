import type { SessionAuthContext } from "#channel/types.js";
/**
 * Framework-owned principal used when a schedule runs on behalf of the agent.
 */
export declare const SCHEDULE_APP_AUTH: SessionAuthContext;
/**
 * Returns true when `auth` is the default app principal that schedules pass
 * as `appAuth`. It identifies that principal, not how a turn started: a
 * schedule handler may send with a user's auth instead, and any code can
 * reuse `appAuth`.
 *
 * @example
 * ```ts
 * import { isScheduleAuth } from "eve/schedules";
 *
 * if (isScheduleAuth(ctx.session.auth.current)) {
 *   // Work the agent does on its own behalf.
 * }
 * ```
 */
export declare function isScheduleAuth(auth: SessionAuthContext | null | undefined): boolean;
