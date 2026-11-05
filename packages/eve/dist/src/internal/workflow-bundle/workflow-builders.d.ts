export type WorkflowManifest = {
    steps?: {
        [relativeFileName: string]: {
            [functionName: string]: {
                stepId: string;
            };
        };
    };
    workflows?: {
        [relativeFileName: string]: {
            [functionName: string]: {
                workflowId: string;
            };
        };
    };
    classes?: {
        [relativeFileName: string]: {
            [className: string]: {
                classId: string;
            };
        };
    };
};
export declare function applyWorkflowTransform(filename: string, source: string, mode: "workflow" | "step" | "client" | "metadata" | false, absolutePath?: string, projectRoot?: string, stableWorkflowNames?: ReadonlySet<string>): Promise<{
    code: string;
    workflowManifest: WorkflowManifest;
}>;
export declare function isAuthoredApplicationModule(absolutePath: string, appRoot: string): boolean;
export declare function findWorkflowPatterns(filename: string, source: string): Promise<{
    hasSerde: boolean;
    hasUseStep: boolean;
    hasUseWorkflow: boolean;
}>;
export declare function getImportPath(filePath: string, projectRoot: string): {
    importPath: string;
    isPackage: boolean;
};
