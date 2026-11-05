import type { SandboxAccess } from "#sandbox/state.js";
import type { FrameworkContextProvider } from "#context/provider.js";
import type { SessionPrewarmer } from "#context/prewarm.js";
/**
 * Starts a prewarmed session's sandbox, and resumes a sandbox the session
 * already recorded when a turn begins. A turn never starts a sandbox: every
 * agent has one, and most turns may not need it.
 */
export declare const sandboxPrewarmer: SessionPrewarmer;
export declare const sandboxProvider: FrameworkContextProvider<SandboxAccess>;
