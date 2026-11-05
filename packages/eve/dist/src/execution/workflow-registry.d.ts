declare global {
    var __private_workflows: Map<string, unknown> | undefined;
}
export declare const WORKFLOW_REGISTRY_GLOBAL = "__private_workflows";
export declare function readRegisteredWorkflow(workflowId: string): unknown;
