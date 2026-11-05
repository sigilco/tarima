import type { Attributes } from "#compiled/@vercel/agent-runs/index.js";
export declare function createGatewayTraceContextHeaders(): Record<string, string> | undefined;
/** Converts Gateway response metadata to cost data. */
export declare function gatewayCostAttributes(input: {
    cost?: number;
    gatewayCost?: number;
    inputCost?: number;
    outputCost?: number;
    generationId?: string;
}): Attributes;
export declare function readGatewayCostData(providerMetadata: Readonly<Record<string, unknown>> | undefined): {
    cost: number | undefined;
    gatewayCost: number | undefined;
    inputCost: number | undefined;
    outputCost: number | undefined;
    generationId: string | undefined;
} | undefined;
/**
 * Converts Gateway session affinity metadata to span attributes, so a step can
 * be matched to its session in the Gateway logs Sessions view.
 */
export declare function gatewayRoutingAttributes(providerMetadata: Readonly<Record<string, unknown>> | undefined): Attributes | undefined;
