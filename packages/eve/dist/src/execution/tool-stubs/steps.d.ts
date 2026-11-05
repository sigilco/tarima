import { type StubCall, type StubResult, type StubScope } from "#tool-stubs/types.js";
export declare function publishStubResultStep(input: {
    readonly callId: string;
    readonly result: StubResult;
    readonly matchedRuleId?: string;
}): Promise<void>;
export declare function publishStubFailureStep(error: string): Promise<void>;
/**
 * Ordinary tools call this inside their existing step.
 * Workflow tools use this function as a separate step.
 */
export declare function callToolStubStep(scope: StubScope, call: StubCall): Promise<StubResult>;
export declare function reportStubFailureStep(scope: StubScope, callId: string, error: string): Promise<void>;
export declare function readStubFailure(sessionId: string): Promise<string | undefined>;
/** Use the session's inbox so failures reach it after a newer deployment takes over. */
export declare function failStubSessionStep(sessionId: string): Promise<void>;
/** Read completed matches without waiting for the still-running session to finish. */
export declare function readMatchedStubRules(sessionId: string): Promise<readonly string[]>;
