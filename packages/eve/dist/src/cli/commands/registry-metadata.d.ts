import { z } from "#compiled/zod/index.js";
declare const EveRegistryMetadataSchema: z.ZodObject<{
    requires: z.ZodOptional<z.ZodString>;
    docs: z.ZodOptional<z.ZodString>;
    implementation: z.ZodOptional<z.ZodEnum<{
        "chat-sdk": "chat-sdk";
        native: "native";
    }>>;
    hidden: z.ZodOptional<z.ZodLiteral<true>>;
    install: z.ZodOptional<z.ZodObject<{
        pnpm: z.ZodOptional<z.ZodObject<{
            buildScripts: z.ZodArray<z.ZodObject<{
                packages: z.ZodArray<z.ZodString>;
                optional: z.ZodLiteral<true>;
                recommendedAction: z.ZodLiteral<"ignore-optional">;
                reason: z.ZodString;
            }, z.core.$strip>>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    setup: z.ZodOptional<z.ZodPipe<z.ZodUnion<readonly [z.ZodObject<{
        package: z.ZodString;
        bin: z.ZodString;
        args: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>, z.ZodArray<z.ZodObject<{
        package: z.ZodString;
        bin: z.ZodString;
        args: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>]>, z.ZodTransform<{
        package: string;
        bin: string;
        args: string[];
    }[], {
        package: string;
        bin: string;
        args: string[];
    }[] | {
        package: string;
        bin: string;
        args: string[];
    }>>>;
}, z.core.$strip>;
export type RegistrySearchMetadata = Pick<z.infer<typeof EveRegistryMetadataSchema>, "docs" | "hidden" | "implementation">;
/** Parses eve-owned metadata from a registry item manifest. */
export declare function eveMetadataFromRegistryItem(item: unknown): {
    requires?: string | undefined;
    docs?: string | undefined;
    implementation?: "chat-sdk" | "native" | undefined;
    hidden?: true | undefined;
    install?: {
        pnpm?: {
            buildScripts: {
                packages: string[];
                optional: true;
                recommendedAction: "ignore-optional";
                reason: string;
            }[];
        } | undefined;
    } | undefined;
    setup?: {
        package: string;
        bin: string;
        args: string[];
    }[] | undefined;
} | undefined;
/** Extracts search metadata from the eve-owned official registry catalog. */
export declare function parseOfficialRegistrySearchMetadata(input: unknown): ReadonlyMap<string, RegistrySearchMetadata>;
/** Parses the fields used by the human-readable registry item view. */
export declare function parseRegistryPresentationManifest(input: unknown): {
    meta?: {
        eve?: {
            requires?: string | undefined;
            docs?: string | undefined;
            implementation?: "chat-sdk" | "native" | undefined;
            hidden?: true | undefined;
            install?: {
                pnpm?: {
                    buildScripts: {
                        packages: string[];
                        optional: true;
                        recommendedAction: "ignore-optional";
                        reason: string;
                    }[];
                } | undefined;
            } | undefined;
            setup?: {
                package: string;
                bin: string;
                args: string[];
            }[] | undefined;
        } | undefined;
    } | undefined;
    title?: string | undefined;
    description?: string | undefined;
    dependencies?: string[] | undefined;
    files?: {
        target: string;
    }[] | undefined;
} | undefined;
export {};
