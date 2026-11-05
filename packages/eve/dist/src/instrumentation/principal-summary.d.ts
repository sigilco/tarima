import type { SessionAuthContext } from "#channel/types.js";
import type { ContextReader } from "#context/key.js";
import { type InstrumentationPrincipalSummary } from "#instrumentation/lifecycle.js";
import { type InstrumentationContentContext } from "#shared/instrumentation-content.js";
import type { InstrumentationDecision } from "#shared/instrumentation-decision.js";
export declare function summarizeInstrumentationPrincipal(principal: SessionAuthContext | null | undefined, content: InstrumentationContentContext): InstrumentationPrincipalSummary | undefined;
/** A principal as instrumentation records it: a known type, plus its id when given and bounded. */
export declare function instrumentationPrincipal(principalType: string, principalId: string | undefined): InstrumentationPrincipalSummary;
export declare function applyPrincipalTraceDecision(principal: InstrumentationPrincipalSummary | undefined, decision: InstrumentationDecision | undefined): InstrumentationPrincipalSummary | undefined;
export declare function readInstrumentationPrincipals(context: ContextReader, content: InstrumentationContentContext, decision?: InstrumentationDecision): {
    readonly currentPrincipal?: InstrumentationPrincipalSummary;
    readonly initiatorPrincipal?: InstrumentationPrincipalSummary;
};
