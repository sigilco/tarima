import type { CreateSessionOptions, SendTurnInput, SendTurnOptions } from "#client/types.js";
import type { Client } from "#client/client.js";
import { AssertionCollector } from "#evals/assertions/collector.js";
import { EvalSessionDriver, type EvalSessionStartedEvent } from "#evals/session.js";
import type { EveEvalSessionResult } from "#evals/types.js";
export declare class EvalSessionManager {
    #private;
    constructor(input: {
        readonly client: Client;
        readonly collector?: AssertionCollector;
        readonly onSessionStart?: (event: EvalSessionStartedEvent) => void;
        readonly signal?: AbortSignal;
    });
    session(options?: CreateSessionOptions): Promise<EvalSessionDriver>;
    /** A recorded stub failure always fails the eval, even if the agent recovers. */
    verifyStubs(): Promise<void>;
    send(message: SendTurnInput["message"], options?: SendTurnOptions): Promise<import("#evals/types.js").EveEvalTurn>;
    attach(sessionId: string, options?: {
        readonly startIndex?: number;
    }): EvalSessionDriver;
    snapshots(): readonly EveEvalSessionResult[];
    lastTurnSession(): EvalSessionDriver | undefined;
    hasActivity(): boolean;
}
