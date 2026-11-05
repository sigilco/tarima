import type { SessionAuthContext } from "#context/keys.js";
import type { ResolvedSelfModificationConfig } from "./config.js";
/** Local self-modification runs only inside the development runtime. */
export declare function isLocalSelfModificationEnabled(config: ResolvedSelfModificationConfig): boolean;
/**
 * Whether the caller is the developer running `eve dev`: the `localDev()`
 * principal, or the Vercel user whose development token the dev TUI sends for
 * a linked project. Other authenticated callers, such as chat users reaching
 * the server through a tunnel, must not edit the developer's authored source.
 */
export declare function isLocalDeveloper(principal: SessionAuthContext | null): boolean;
/** Deployed self-modification is offered only outside the development runtime. */
export declare function isDeployedRuntime(): boolean;
