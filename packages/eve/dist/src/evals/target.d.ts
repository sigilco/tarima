import { Client } from "#client/client.js";
import { EvalSessionManager } from "#evals/session-manager.js";
import type { EveEvalTargetCapabilities, EveEvalTargetHandle } from "#evals/types.js";
export declare function resolveEvalTargetHandle(input: {
    readonly client: Client;
    readonly expectedAgentName?: string;
    readonly kind: "local" | "remote";
    readonly url: string;
}): Promise<EveEvalTargetHandle>;
/** The root agent's static tool names, and whether it has a dynamic tool resolver. */
export interface TargetTools {
    readonly dynamic: boolean;
    readonly static: readonly string[];
}
/** The tools of a target resolved from `/eve/v1/info`; undefined for a hand-built handle. */
export declare function targetTools(target: EveEvalTargetHandle): TargetTools | undefined;
export declare function createEvalTargetHandle(input: {
    readonly capabilities: EveEvalTargetCapabilities;
    readonly client: Client;
    readonly kind: "local" | "remote";
    readonly url: string;
}): EveEvalTargetHandle;
export declare function scopeEvalTargetHandle(target: EveEvalTargetHandle, input: {
    readonly sessions?: EvalSessionManager;
}): EveEvalTargetHandle;
