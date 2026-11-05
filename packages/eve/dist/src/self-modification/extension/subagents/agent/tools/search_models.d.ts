import { type GatewayCatalogModel } from "#shared/gateway-model-catalog.js";
export declare function searchGatewayModels(models: readonly GatewayCatalogModel[], query: string): {
    id: string;
    name: string;
    provider: string;
}[];
declare const _default: import("eve/tools").ToolDefinition<Record<string, unknown>, {
    models: {
        id: string;
        name: string;
        provider: string;
    }[];
}> & {
    execute(input: Record<string, unknown>, ctx: import("eve/tools").ToolContext): Promise<{
        models: {
            id: string;
            name: string;
            provider: string;
        }[];
    }>;
};
export default _default;
