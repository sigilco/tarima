import { type WorkflowDirective } from "#internal/workflow-bundle/workflow-directive-ast.js";
import type { WorkflowManifest } from "./workflow-builders.js";
type WorkflowDirectiveMode = "workflow" | "step" | "client" | "metadata" | false;
/** Reads the syntax tree, so a directive quoted in a string or comment never counts. */
export declare function findWorkflowDirectiveFunctions(filename: string, source: string): Promise<readonly {
    readonly directive: WorkflowDirective;
    readonly name: string;
}[]>;
export declare function transformWorkflowDirectives(input: {
    /** Authored modules retain their body but drop the eve-definer default export. */
    authored?: boolean;
    /** Route context-bearing calls through an authorization twin for modules that define tools. */
    authorizeSteps?: boolean;
    filename: string;
    mode: WorkflowDirectiveMode;
    moduleSpecifier: string | undefined;
    source: string;
    /**
     * Package-qualified module specifier without the `@<pkg.version>`
     * stamp. Used to mint workflow ids for functions named in
     * {@link transformWorkflowDirectives.input.stableWorkflowNames} so
     * the bundled id matches the runtime reference on every deployment.
     */
    stableModuleSpecifier?: string | undefined;
    /**
     * Workflow function names whose bundled id should be emitted without
     * the package version stamp. See `STABLE_WORKFLOW_NAMES` in
     * `stable-workflow-names.ts` for the canonical set eve itself uses.
     */
    stableWorkflowNames?: ReadonlySet<string>;
}): Promise<{
    code: string;
    workflowManifest: WorkflowManifest;
}>;
export declare function stripJavaScriptExtension(path: string): string;
export declare function createWorkflowId(idBase: string, functionName: string): string;
export {};
