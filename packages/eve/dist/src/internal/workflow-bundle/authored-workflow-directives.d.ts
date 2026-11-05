export interface AuthoredWorkflowDirectiveSource {
    readonly hasDirectives: boolean;
    readonly hasWorkflowDirective: boolean;
    readonly source: string;
}
/**
 * The directive transform understands one shape: a top-level `async function`
 * whose first statement is the directive. A marked `defineWorkflowTool` entry
 * point (`execute` or `task`) is hoisted into that shape here; every other
 * placement is a build error, because an ignored directive would run side
 * effects inline in a replayed body.
 */
export declare function prepareAuthoredWorkflowDirectives(input: {
    readonly filePath: string;
    readonly source: string;
}): Promise<AuthoredWorkflowDirectiveSource>;
