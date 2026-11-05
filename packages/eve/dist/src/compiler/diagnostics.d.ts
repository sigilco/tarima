import { z } from "#compiled/zod/index.js";
import type { DiscoverDiagnostic, DiscoverDiagnosticsSummary } from "#discover/diagnostics.js";
import type { AgentSourceDescriptor } from "#compiler/source-graph.js";
export declare const compilerDiagnosticSchema: z.ZodObject<{
    code: z.ZodString;
    message: z.ZodString;
    severity: z.ZodEnum<{
        error: "error";
        warning: "warning";
    }>;
    sources: z.ZodReadonly<z.ZodArray<z.ZodObject<{
        logicalPath: z.ZodOptional<z.ZodString>;
        nodeId: z.ZodString;
        sourceId: z.ZodOptional<z.ZodString>;
        sourcePath: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>>;
}, z.core.$strict>;
export type CompilerDiagnostic = z.infer<typeof compilerDiagnosticSchema>;
export declare function projectDiscoverDiagnostic(diagnostic: DiscoverDiagnostic, nodeId: string): CompilerDiagnostic;
export declare function createChannelRouteShadowedDiagnostic(input: {
    readonly loser: AgentSourceDescriptor;
    readonly method: string;
    readonly nodeId: string;
    readonly urlPath: string;
    readonly winner: AgentSourceDescriptor;
}): CompilerDiagnostic;
export declare function summarizeCompilerDiagnostics(diagnostics: readonly CompilerDiagnostic[]): DiscoverDiagnosticsSummary;
