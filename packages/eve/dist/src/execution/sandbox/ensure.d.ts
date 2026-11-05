import { type RuntimeCompiledArtifactsSource } from "#runtime/compiled-artifacts-source.js";
import { type RuntimeSandboxRegistry } from "#runtime/sandbox/registry.js";
import { type SandboxAccess, type SandboxSessionEndReason, type SandboxState } from "#sandbox/state.js";
interface EnsureSandboxAccessInput {
    readonly compiledArtifactsSource: RuntimeCompiledArtifactsSource;
    readonly nodeId: string;
    /** `false` when the sandbox outlives this access: it may neither delete nor end it. */
    readonly ownsSandbox?: boolean;
    readonly registry: RuntimeSandboxRegistry;
    readonly sessionId: string;
    readonly state: SandboxState | null;
    /**
     * How long the server-shutdown registry, which holds one connection per
     * session, keeps this access's connection. `"session"`, the default for a
     * session's own steps, keeps a connection without `close()` after release,
     * so shutdown still stops the session's sandbox. `"call"` drops it at
     * release, for a keyed tool call, whose sandbox no session ends. `"none"`
     * never registers it, for a workflow step that borrows a session's sandbox
     * outside its turns and must not replace or drop the session's own.
     */
    readonly shutdownTracking?: "call" | "none" | "session";
}
/** The access `ensureSandboxAccess` builds, with what the opener may do beyond the sandbox API. */
export interface EnsuredSandboxAccess extends SandboxAccess {
    /**
     * Permanently releases what the provider keeps under this access's key
     * when the owning session ends, even when its last checkpoint recorded no
     * sandbox. Waits for this access's open still in flight first.
     */
    end(reason: SandboxSessionEndReason): Promise<void>;
    /**
     * Lets go of the connection this access opened, if any, when the step that
     * opened it ends: closes it without stopping or deleting the sandbox.
     * Waits for an open still in flight, so a caller that finished early never
     * leaves that connection behind.
     */
    release(): Promise<void>;
    /**
     * Resumes the sandbox the session recorded, in the background, so a turn
     * that needs it waits only for the rest. Never starts one: does nothing
     * when nothing is recorded, and leaves a gone sandbox for `get()`.
     */
    resumeRecorded(): void;
    /** Waits for the work `prepare()` and `resumeRecorded()` queued; never throws. */
    settle(): Promise<void>;
}
export declare function ensureSandboxAccess(input: EnsureSandboxAccessInput): Promise<EnsuredSandboxAccess>;
export {};
