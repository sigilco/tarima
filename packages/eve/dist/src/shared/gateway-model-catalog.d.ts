import { z } from "#compiled/zod/index.js";
declare const gatewayCatalogModelSchema: z.ZodPipe<z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodString;
    owned_by: z.ZodString;
    released: z.ZodCatch<z.ZodOptional<z.ZodNumber>>;
    tags: z.ZodCatch<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    reasoning_options: z.ZodCatch<z.ZodOptional<z.ZodArray<z.ZodUnknown>>>;
    pricing: z.ZodCatch<z.ZodOptional<z.ZodObject<{
        service_tiers: z.ZodCatch<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    }, z.core.$strip>>>;
}, z.core.$strip>, z.ZodTransform<{
    id: string;
    name: string;
    type: string;
    owned_by: string;
    released?: number | undefined;
    tags?: string[] | undefined;
    pricing?: {
        service_tiers?: Record<string, unknown> | undefined;
    } | undefined;
    reasoningEfforts: string[];
}, {
    id: string;
    name: string;
    type: string;
    owned_by: string;
    released?: number | undefined;
    tags?: string[] | undefined;
    reasoning_options?: unknown[] | undefined;
    pricing?: {
        service_tiers?: Record<string, unknown> | undefined;
    } | undefined;
}>>;
/** One model entry from the AI Gateway catalog response. */
export type GatewayCatalogModel = z.infer<typeof gatewayCatalogModelSchema>;
/**
 * Validates a Gateway catalog response. A malformed payload throws, but a
 * malformed entry is skipped so one experimental entry shape cannot discard
 * the rest of the catalog.
 */
export declare function parseGatewayModelCatalog(input: unknown): GatewayCatalogModel[];
export {};
