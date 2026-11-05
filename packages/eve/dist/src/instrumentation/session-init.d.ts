import type { ContextContainer } from "#context/container.js";
import { type InstrumentationDecision } from "#shared/instrumentation-decision.js";
export declare function initializeSessionInstrumentation(input: {
    readonly agentName: string;
    readonly ctx: ContextContainer;
}): InstrumentationDecision;
