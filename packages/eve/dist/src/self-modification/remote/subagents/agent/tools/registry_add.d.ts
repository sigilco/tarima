import { type ToolContext } from "eve/tools";
import { type ResolvedDeployedSelfModificationConfig } from "../../../config.js";
type ProductionRegistryAddResult = {
    readonly address: string;
    readonly status: "completed";
    readonly completedItems: readonly string[];
    readonly changedPaths: readonly string[];
    readonly deploymentRequired: boolean;
} | {
    readonly address: string;
    readonly status: "input-required";
    readonly installed: boolean;
    readonly question: unknown;
} | {
    readonly address: string;
    readonly status: "external-action-required";
    readonly installed: boolean;
    readonly message: string;
    readonly url: string;
    readonly userCode?: string;
} | {
    readonly address: string;
    readonly status: "failed" | "cancelled";
    readonly message: string;
};
export declare function productionRegistryAddTool(deployed: ResolvedDeployedSelfModificationConfig): import("eve/tools").ToolDefinition<Record<string, unknown>, ProductionRegistryAddResult> & {
    execute(input: Record<string, unknown>, ctx: ToolContext): Promise<ProductionRegistryAddResult>;
};
declare const _default: import("eve/tools").DynamicSentinel<import("eve/tools").DynamicToolResult, import("eve/tools").DynamicContext>;
export default _default;
