import type { SandboxSession } from "eve/sandbox";
type ComputerUseSandbox = Pick<SandboxSession, "resolvePath" | "run" | "writeTextFile">;
/** Include this in the consumer sandbox revalidation key so cached templates rebuild when computer use changes. */
export declare const COMPUTER_USE_REVALIDATION_KEY = "computer-use:0.12.5:2026-09-17.1";
/** Install the desktop packages and embedded driver required by computer use. */
export declare function installComputerUse(sandbox: ComputerUseSandbox): Promise<void>;
/** Start the managed display and driver for one consumer sandbox session. */
export declare function startComputerUse(sandbox: Pick<SandboxSession, "resolvePath" | "run">): Promise<void>;
/**
 * Restart the desktop when a resumed sandbox lost its processes.
 *
 * Sandbox resume does not rerun consumer startup, so the display and driver
 * started there are gone after a stop. The check is one cheap command when
 * everything is already live.
 */
export declare function ensureComputerUse(sandbox: Pick<SandboxSession, "resolvePath" | "run">, abortSignal?: AbortSignal): Promise<void>;
export {};
