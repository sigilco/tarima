export type WorkflowDirective = "use step" | "use workflow";
export declare function mayContainWorkflowDirective(source: string): boolean;
export interface DirectiveStatementNode {
    readonly directive?: unknown;
    readonly expression?: unknown;
    readonly type?: unknown;
}
export declare function readWorkflowDirective(statement: DirectiveStatementNode | undefined): WorkflowDirective | undefined;
