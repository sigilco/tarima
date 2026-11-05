import { type SetupApplyContext, type SetupPrepareContext } from "../types.js";
import { applyFileMemoryBlob, type FileMemoryBlobPlan, prepareFileMemoryBlob } from "./vercel.js";
export interface FileMemorySetupDeps {
    readonly applyBlob: typeof applyFileMemoryBlob;
    readonly prepareBlob: typeof prepareFileMemoryBlob;
}
export declare function prepareFileMemorySetup(context: SetupPrepareContext, deps?: FileMemorySetupDeps): Promise<FileMemoryBlobPlan>;
export declare function applyFileMemorySetup(plan: FileMemoryBlobPlan, context: SetupApplyContext, deps?: FileMemorySetupDeps): Promise<{
    deploymentRequired: true;
    facts: {
        label: string;
        value: string;
    }[];
}>;
export declare const FILE_MEMORY_SETUP: import("../types.js").SetupIntegration;
