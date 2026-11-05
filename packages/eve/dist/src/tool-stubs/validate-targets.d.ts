import type { ResolvedAgentGraphBundle } from "#runtime/graph.js";
import type { ToolStub } from "#tool-stubs/types.js";
export declare class InvalidToolStubTargetError extends Error {
}
/** Check compiled tools without running dynamic resolvers or contacting connections. */
export declare function validateToolStubTargets(rules: readonly ToolStub[], graph: ResolvedAgentGraphBundle): void;
