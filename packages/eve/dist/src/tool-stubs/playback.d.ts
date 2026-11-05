import type { StubCall, StubResult, ToolStub } from "#tool-stubs/types.js";
/**
 * Selects stub outcomes and advances their sequences.
 * The surrounding workflow orders calls and restores progress on replay.
 */
export declare class StubPlayback {
    private readonly rules;
    private readonly results;
    private readonly positions;
    constructor(rules: readonly ToolStub[]);
    get matchedRuleCount(): number;
    call(call: StubCall): StubResult;
    private record;
    fail(callId: string, error: string): StubResult;
}
