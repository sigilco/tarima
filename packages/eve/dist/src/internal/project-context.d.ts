import { type ProjectSource } from "#discover/project-source.js";
export interface AgentWorkspaceMember {
    readonly appRoot: string;
    readonly name: string;
}
export interface AgentWorkspace {
    readonly members: readonly AgentWorkspaceMember[];
    readonly root: string;
}
export type EveProjectContext = {
    readonly workspace: AgentWorkspace;
    readonly environmentRoot: string;
    readonly kind: "workspace";
} | {
    readonly workspace: AgentWorkspace;
    readonly environmentRoot: string;
    readonly kind: "workspace-member";
    readonly member: AgentWorkspaceMember;
} | {
    readonly appRoot: string;
    readonly environmentRoot: string;
    readonly kind: "standalone";
};
/** Try to resolve the owning eve package and classify the input path within it. */
export declare function findEveProjectContext(startPath: string, options?: {
    readonly source?: ProjectSource;
}): Promise<EveProjectContext | undefined>;
/** Resolve the owning eve project, throwing when the path has no eve package owner. */
export declare function resolveEveProjectContext(startPath: string, options?: {
    readonly source?: ProjectSource;
}): Promise<EveProjectContext>;
