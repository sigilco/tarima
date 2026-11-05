import { z } from "#compiled/zod/index.js";
export declare const catalogModelProviderSchema: z.ZodObject<{
    provider: z.ZodString;
    providerModelId: z.ZodString;
    contextWindowTokens: z.ZodOptional<z.ZodNumber>;
}, z.core.$loose>;
export declare const catalogModelSchema: z.ZodObject<{
    slug: z.ZodString;
    providers: z.ZodArray<z.ZodObject<{
        provider: z.ZodString;
        providerModelId: z.ZodString;
        contextWindowTokens: z.ZodOptional<z.ZodNumber>;
    }, z.core.$loose>>;
}, z.core.$loose>;
export declare const modelCatalogResponseSchema: z.ZodObject<{
    models: z.ZodArray<z.ZodObject<{
        slug: z.ZodString;
        providers: z.ZodArray<z.ZodObject<{
            provider: z.ZodString;
            providerModelId: z.ZodString;
            contextWindowTokens: z.ZodOptional<z.ZodNumber>;
        }, z.core.$loose>>;
    }, z.core.$loose>>;
    providerAliases: z.ZodRecord<z.ZodString, z.ZodString>;
}, z.core.$loose>;
export type CatalogModelProvider = z.infer<typeof catalogModelProviderSchema>;
export type CatalogModel = z.infer<typeof catalogModelSchema>;
/** The parts of the AI Gateway model catalog that eve's lookups read. */
export interface ModelCatalog {
    readonly models: readonly CatalogModel[];
    readonly providerAliases: Readonly<Record<string, string>>;
}
/** A catalog match: the canonical Gateway slug and the context window eve compacts against. */
export interface ModelCatalogEntry {
    readonly contextWindowTokens: number;
    readonly slug: string;
}
/**
 * The model metadata one build bakes into its compiled artifacts. Runtime model selections
 * resolve context windows from this snapshot and never call AI Gateway themselves.
 */
export declare const modelMetadataSchema: z.ZodObject<{
    fetchedAt: z.ZodNullable<z.ZodString>;
    kind: z.ZodLiteral<"eve-model-metadata">;
    models: z.ZodArray<z.ZodObject<{
        slug: z.ZodString;
        providers: z.ZodArray<z.ZodObject<{
            contextWindowTokens: z.ZodNumber;
            provider: z.ZodString;
            providerModelId: z.ZodString;
        }, z.core.$strict>>;
    }, z.core.$strict>>;
    providerAliases: z.ZodRecord<z.ZodString, z.ZodString>;
    version: z.ZodLiteral<1>;
}, z.core.$strict>;
export type ModelMetadata = z.infer<typeof modelMetadataSchema>;
/**
 * Projects a catalog onto the snapshot a build ships: only providers with a usable context
 * window, and only the fields eve's lookups read.
 */
export declare function createModelMetadata(input: {
    readonly catalog: ModelCatalog;
    readonly fetchedAt: string;
} | null): ModelMetadata;
export declare function normalizeCatalogModelId(modelId: string): string;
export declare function findCatalogModelBySlug(models: readonly CatalogModel[], slug: string): CatalogModel | undefined;
/** Looks up an AI Gateway model id, such as `anthropic/claude-sonnet-5`. */
export declare function lookupCatalogModelBySlug(catalog: ModelCatalog, slug: string): ModelCatalogEntry | null;
/** Looks up an AI SDK provider model, such as `anthropic.messages` and `claude-sonnet-5`. */
export declare function lookupCatalogModelByProviderModelId(catalog: ModelCatalog, provider: string, providerModelId: string): ModelCatalogEntry | null;
