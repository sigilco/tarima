/** Environment flag set for processes that belong to an `eve dev` session. */
export declare const EVE_DEV_ENV_FLAG = "EVE_DEV";
/**
 * Internal handoff from `eve eval` to the development server it starts; not a
 * user-facing setting.
 */
export declare const EVE_DEV_STATE_DIR_ENV = "EVE_DEV_STATE_DIR";
/**
 * Resolves where a development server keeps the state only one server per app
 * root may own: the active runtime generation and its snapshots, the local
 * Workflow World data, and the record a second `eve dev` attaches through.
 * Defaults to `<appRoot>/.eve`. `eve eval` points it at a per-run directory so
 * its server can run beside an `eve dev` session without touching it.
 */
export declare function resolveDevelopmentStateDirectory(appRoot: string): string;
type ConversationEnvironment = "development" | "preview" | "production";
/** Reports whether this process belongs to an `eve dev` session. */
export declare function isEveDevEnvironment(): boolean;
/**
 * Reports whether this process is a local development server: `eve dev`
 * (`EVE_DEV=1`) or `vercel dev` (`VERCEL=1` with `VERCEL_ENV=development`).
 * This is a property of the deployment, never of an inbound request.
 */
export declare function isLocalDevelopmentServer(): boolean;
/** Resolves the deployment environment used by setup hooks and trace policies. */
export declare function resolveInstrumentationEnvironment(): ConversationEnvironment;
/** Environment flag set for a server `eve eval` started to run against. */
export declare const EVE_EVALUATION_ENV_FLAG = "EVE_EVALUATION";
/** Stable identifier for the local eval run this server was started to serve. */
export declare const EVE_EVALUATION_RUN_ID_ENV = "EVE_EVALUATION_RUN_ID";
export declare function resolveEveEvaluationRunId(): string | undefined;
export {};
