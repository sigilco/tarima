import type { ContextAccessor } from "#context/key.js";
import type { HarnessSessionBase } from "#harness/types.js";
/** Re-stamps a session after a channel handler selects a new current continuation address. */
export declare function reconcileSessionContinuationToken<S extends HarnessSessionBase>(ctx: ContextAccessor, session: S): S;
