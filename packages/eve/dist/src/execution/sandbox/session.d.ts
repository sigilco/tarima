import type { SandboxConnection } from "#sandbox/provider.js";
import type { SandboxSession } from "#shared/sandbox-session.js";
/**
 * Tells agent-aware CLIs (such as `vercel`) that an automated agent runs
 * the command, so they skip interactive prompts. Providers apply it beneath
 * environment-level and per-call env so authors can override it.
 */
export declare const SANDBOX_AGENT_ENV: Readonly<Record<string, string>>;
/**
 * Builds the {@link SandboxSession} eve hands out from a provider's
 * connection: every path and working directory resolves from the
 * connection's workspace root, `run` collects `spawn`, the read and write
 * variants share the connection's byte primitives, and the connection's
 * extensions merge on top.
 */
export declare function createConnectionSession<Extensions extends object>(connection: SandboxConnection<Extensions>): SandboxSession & Extensions;
