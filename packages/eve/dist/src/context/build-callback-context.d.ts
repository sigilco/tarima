import type { SessionContext } from "#context/session-context.js";
import type { RuntimeSandboxSession, SandboxSession } from "#shared/sandbox-session.js";
import type { ContextReader } from "#context/key.js";
/**
 * Builds a {@link SessionContext} from the active ALS scope.
 *
 * Must be called inside a harness step (active `contextStorage.run`).
 * Throws when called outside an ALS scope.
 */
export declare function buildCallbackContext(): SessionContext;
/**
 * `ctx.getSandbox()` over a context's sandbox access: the session's sandbox, started on first use.
 */
export declare function sandboxOf(ctx: Pick<ContextReader, "get">): SessionContext["getSandbox"];
export declare function withRuntimeSandboxLifecycle<Session extends SandboxSession>(sandbox: Session, deleteSandbox: RuntimeSandboxSession["delete"], stop: () => Promise<void>): Session & Pick<RuntimeSandboxSession, "delete" | "stop">;
