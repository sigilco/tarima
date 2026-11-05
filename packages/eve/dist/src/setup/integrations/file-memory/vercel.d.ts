import { z } from "#compiled/zod/index.js";
import { type ChannelSetupLog } from "#setup/cli/index.js";
import type { VercelProjectReference } from "#setup/project-resolution.js";
import { type RunVercelOptions } from "#setup/primitives/run-vercel.js";
export declare const FILE_MEMORY_BLOB_PREFIX = "EVE_MEMORY_BLOB";
export declare const FILE_MEMORY_BLOB_ENVIRONMENTS: readonly ["production", "preview", "development"];
declare const ProjectSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    resourceConfig: z.ZodOptional<z.ZodObject<{
        functionDefaultRegions: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
    defaultResourceConfig: z.ZodOptional<z.ZodObject<{
        functionDefaultRegions: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
}, z.core.$loose>;
declare const StoreReferenceSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    projects: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
    }, z.core.$loose>>>;
    region: z.ZodOptional<z.ZodString>;
}, z.core.$loose>;
declare const StoreSchema: z.ZodObject<{
    access: z.ZodEnum<{
        private: "private";
        public: "public";
    }>;
    id: z.ZodString;
    name: z.ZodString;
    region: z.ZodString;
    type: z.ZodOptional<z.ZodString>;
}, z.core.$loose>;
declare const StoreConnectionSchema: z.ZodObject<{
    envVarEnvironments: z.ZodDefault<z.ZodArray<z.ZodString>>;
    envVarPrefix: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    id: z.ZodOptional<z.ZodString>;
    projectId: z.ZodString;
}, z.core.$loose>;
export type VercelProjectConfiguration = z.infer<typeof ProjectSchema>;
export type BlobStoreReference = z.infer<typeof StoreReferenceSchema>;
export type BlobStore = z.infer<typeof StoreSchema>;
export type BlobStoreConnection = z.infer<typeof StoreConnectionSchema>;
export interface FileMemoryVercelClient {
    createStore(input: {
        name: string;
        region: string;
    }): Promise<BlobStore>;
    connectStore(input: {
        environments: readonly string[];
        prefix: string;
        projectId: string;
        storeId: string;
    }): Promise<void>;
    getConnections(storeId: string): Promise<readonly BlobStoreConnection[]>;
    getProject(): Promise<VercelProjectConfiguration>;
    getStore(storeId: string): Promise<BlobStore>;
    listStores(): Promise<readonly BlobStoreReference[]>;
    pullEnvironment(): Promise<void>;
}
export type FileMemoryBlobAction = "create" | "repair" | "reuse";
export interface FileMemoryBlobPlan {
    readonly action: FileMemoryBlobAction;
    readonly project: VercelProjectReference;
    readonly projectName: string;
    readonly region: string;
    readonly storeId?: string;
    readonly storeName: string;
    readonly regionWarning?: string;
}
interface FileMemoryBlobResult {
    readonly action: FileMemoryBlobAction;
    readonly store: BlobStore;
}
interface FileMemoryVercelClientInput {
    readonly appRoot: string;
    readonly project: VercelProjectReference;
    readonly signal?: AbortSignal;
    readonly onOutput?: RunVercelOptions["onOutput"];
}
export declare function createFileMemoryVercelClient(input: FileMemoryVercelClientInput): FileMemoryVercelClient;
export declare function resolveFileMemoryRegion(input: {
    readonly localRegions?: readonly string[];
    readonly project: Pick<VercelProjectConfiguration, "defaultResourceConfig" | "resourceConfig">;
}): string;
export declare function fileMemoryStoreName(projectName: string, projectId: string): string;
export declare function prepareFileMemoryBlob(input: {
    readonly appRoot: string;
    readonly project: VercelProjectReference;
    readonly client?: FileMemoryVercelClient;
    readonly localRegions?: () => Promise<readonly string[] | undefined>;
    readonly signal?: AbortSignal;
}): Promise<FileMemoryBlobPlan>;
export declare function applyFileMemoryBlob(input: {
    readonly client?: FileMemoryVercelClient;
    readonly log: ChannelSetupLog;
    readonly plan: FileMemoryBlobPlan;
    readonly appRoot: string;
    readonly signal?: AbortSignal;
}): Promise<FileMemoryBlobResult>;
export {};
