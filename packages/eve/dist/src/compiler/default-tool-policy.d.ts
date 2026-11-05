import type { CompiledAgentDefinition } from "#compiler/manifest.js";
import type { FinalizedNodeSourceState, PhaseOneNodeSourceState } from "#compiler/node-source-state.js";
export declare function applyAgentToolPolicy(phaseOne: PhaseOneNodeSourceState, config: CompiledAgentDefinition): void;
/**
 * A tool file can disable what eve offers under its name with no file beneath it: a subagent's
 * tool, a memory slot's tools, or a schedule collection's.
 */
export declare function canDisableToolWithoutSelectedSource(state: FinalizedNodeSourceState, toolName: string): boolean;
export declare function applyDefaultToolPolicy(phaseOne: PhaseOneNodeSourceState, config: CompiledAgentDefinition): void;
