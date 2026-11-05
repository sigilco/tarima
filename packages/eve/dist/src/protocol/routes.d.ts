/**
 * Stable framework-owned route prefix reserved for eve's runtime transport
 * surfaces.
 */
export declare const EVE_ROUTE_PREFIX = "/eve/v1";
/** Reservation pattern for the production cron bridge's unguessable token. */
export declare const EVE_PRODUCTION_CRON_ROUTE_PATTERN = "/eve/v1/cron/:token";
/**
 * Stable framework-owned health route.
 */
export declare const EVE_HEALTH_ROUTE_PATH = "/eve/v1/health";
/**
 * Stable framework-owned route exposing the JSON inspection payload for
 * the current agent. The eve channel registers and authenticates this route
 * with the same `auth` input as its session routes, then serves operator
 * principals (`service`, `runtime`, or `local-dev`) unless the auth result
 * sets `allowAgentInfo`.
 */
export declare const EVE_INFO_ROUTE_PATH = "/eve/v1/info";
/** Error code the info route returns with `403` to a caller it does not serve. */
export declare const AGENT_INFO_FORBIDDEN_CODE = "info_forbidden";
/** Why the info route refused a caller and how to grant access; shared by server and clients. */
export declare const AGENT_INFO_FORBIDDEN_MESSAGE = "Agent info is served only to operator credentials (principalType \"service\", \"runtime\", or \"local-dev\"). Authenticate as a service principal, for example with Vercel OIDC, or return allowAgentInfo: true from the eve channel's auth for this caller.";
/** Stable route for creating ID-addressed sessions. */
export declare const EVE_SESSION_ROUTE_PATH = "/eve/v1/session";
/** Stable route pattern for preparing or delivering input to one exact session ID. */
export declare const EVE_SESSION_ROUTE_PATTERN = "/eve/v1/session/:sessionId";
/** Stable route pattern for cancelling one exact session ID. */
export declare const EVE_SESSION_CANCEL_ROUTE_PATTERN = "/eve/v1/session/:sessionId/cancel";
/** Stable route pattern for compacting one exact session ID. */
export declare const EVE_SESSION_COMPACT_ROUTE_PATTERN = "/eve/v1/session/:sessionId/compact";
/** Stable route pattern for clearing one exact session ID. */
export declare const EVE_SESSION_CLEAR_ROUTE_PATTERN = "/eve/v1/session/:sessionId/clear";
/** Stable route pattern for ending one exact session ID. */
export declare const EVE_SESSION_END_ROUTE_PATTERN = "/eve/v1/session/:sessionId/end";
/**
 * Legacy alias of `/end`. Still called by remote-agent parent cleanup and older clients;
 * keep until parents switch to `/end`.
 */
export declare const EVE_SESSION_RESET_ROUTE_PATTERN = "/eve/v1/session/:sessionId/reset";
/** Stable route pattern for eval tool-stub verification. */
export declare const EVE_SESSION_STUBS_ROUTE_PATTERN = "/eve/v1/session/:sessionId/stubs";
/** Stable event-stream route pattern for one exact session ID. */
export declare const EVE_SESSION_STREAM_ROUTE_PATTERN = "/eve/v1/session/:sessionId/stream";
/** Reads a recorded descendant path through its root's authorized reader. */
export declare const EVE_DESCENDANT_STREAM_ROUTE_PATTERN = "/eve/v1/session/:sessionId/descendants/stream";
export declare function createEveDescendantStreamRoutePath(sessionId: string): string;
/**
 * Parent-origin proxy route for one remotely executed child session stream.
 */
export declare const EVE_SUBAGENT_STREAM_ROUTE_PATTERN = "/eve/v1/session/:parentSessionId/subagents/:callId/:childSessionId/stream";
/**
 * Framework-owned route pattern for dispatching one authored schedule
 * exactly once from the dev server.
 *
 * Only registered when Nitro is running in dev mode — production builds
 * never mount this route. Smoke tests and human developers use it to
 * trigger a schedule out-of-band (without a cron firing) and recover the
 * resulting `{ scheduleId, sessionIds }` payload as JSON so they can
 * subscribe to {@link EVE_SESSION_STREAM_ROUTE_PATTERN} for each session.
 *
 * `:scheduleId` is the authored schedule's filesystem-derived name (e.g.
 * `agent/schedules/heartbeat.ts` -> `"heartbeat"`).
 */
export declare const EVE_DEV_DISPATCH_SCHEDULE_ROUTE_PATTERN = "/eve/v1/dev/schedules/:scheduleId";
/**
 * Dev-only route exposing the current runtime artifact revision.
 *
 * Local development clients use this to decide when an HMR rebuild has
 * published new runtime artifacts, so their next normal prompt can start a
 * fresh server-side session while in-flight sessions keep their original
 * snapshot.
 */
export declare const EVE_DEV_RUNTIME_ARTIFACTS_ROUTE_PATH = "/eve/v1/dev/runtime-artifacts";
/**
 * Dev-only route that flushes queued runtime artifact rebuilds before
 * returning the current revision.
 */
export declare const EVE_DEV_RUNTIME_ARTIFACTS_REBUILD_ROUTE_PATH = "/eve/v1/dev/runtime-artifacts/rebuild";
/** Dev-only route that acquires an idempotent authored-source suspension lease. */
export declare const EVE_DEV_RUNTIME_ARTIFACTS_SUSPEND_ROUTE_PATH = "/eve/v1/dev/runtime-artifacts/suspend";
/** Dev-only route that idempotently releases one authored-source suspension lease. */
export declare const EVE_DEV_RUNTIME_ARTIFACTS_RESUME_ROUTE_PATH = "/eve/v1/dev/runtime-artifacts/resume";
/**
 * Builds the dev-only schedule dispatch URL for one named authored
 * schedule. The path encodes the schedule id so reserved characters in
 * authored filenames round-trip safely.
 */
export declare function createEveDevDispatchSchedulePath(scheduleId: string): string;
/**
 * Stable framework-owned route pattern for receiving inbound IdP redirects
 * during in-turn interactive connection authorization.
 *
 * `:name` is the connection name, `:attemptId` identifies the exact challenge,
 * and `:token` is the workflow hook token minted by the workflow body so the
 * route handler can resume the suspended turn via `resumeHook(token, payload)`.
 *
 * The route is unauthenticated by design: an OAuth IdP follows this URL
 * via a 3xx redirect from the user's browser with no eve credentials
 * attached. The token is the unguessable capability that authorizes the
 * resume; anyone who has it can deliver the callback payload, which is
 * exactly what the IdP needs to do.
 */
export declare const EVE_CONNECTION_CALLBACK_ROUTE_PATTERN = "/eve/v1/connections/:name/callback/:attemptId/:token";
/**
 * Stable framework-owned route pattern for terminal session callbacks.
 *
 * The `:token` segment is an unguessable workflow hook capability. The route
 * is unauthenticated by design and resumes the matching parked runtime action.
 */
export declare const EVE_CALLBACK_ROUTE_PATTERN = "/eve/v1/callback/:token";
/** Builds the ID-addressed preparation and input route for one session. */
export declare function createEveSessionRoutePath(sessionId: string): string;
/** Builds the ID-addressed cancel route for one session. */
export declare function createEveSessionCancelRoutePath(sessionId: string): string;
/** Builds the parent-origin stream path for one remote child session. */
export declare function createEveSubagentStreamRoutePath(input: {
    readonly callId: string;
    readonly childSessionId: string;
    readonly parentSessionId: string;
}): string;
/** Builds the ID-addressed compact route for one session. */
export declare function createEveSessionCompactRoutePath(sessionId: string): string;
/** Builds the ID-addressed clear route for one session. */
export declare function createEveSessionClearRoutePath(sessionId: string): string;
/** Builds the ID-addressed end route for one session. */
export declare function createEveSessionEndRoutePath(sessionId: string): string;
/** Compatibility path used when ending a remote child on an older deployment. */
export declare function createEveSessionResetRoutePath(sessionId: string): string;
/** Builds the ID-addressed event-stream route for one session. */
export declare function createEveSessionStreamRoutePath(sessionId: string): string;
/**
 * Creates the stable framework-owned connection callback route path for
 * one (`name`, `attemptId`, `token`) tuple.
 *
 * The workflow body builds this path against {@link EVE_ROUTE_PREFIX} when
 * minting the redirect URL it hands to the IdP via `startAuthorization`.
 * The runtime's framework callback route handler matches the same path
 * pattern and forwards the projected request payload into
 * `resumeHook(token, payload)`.
 */
export declare function createEveConnectionCallbackRoutePath(name: string, attemptId: string, token: string): string;
/**
 * Creates the stable framework-owned terminal callback route path.
 */
export declare function createEveCallbackRoutePath(token: string): string;
/** Builds the tool-stub verification route for one session. */
export declare function createEveSessionStubsRoutePath(sessionId: string): string;
