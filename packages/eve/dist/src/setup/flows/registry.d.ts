import type { RegistryCatalogItem } from "#cli/commands/registry.js";
import type { Prompter } from "#setup/prompter.js";
import { type RegistrySessionResult } from "./registry-session.js";
type Item = RegistryCatalogItem;
export interface RegistryFlowDeps {
    browseRegistryCatalog: (typeof import("#cli/commands/registry.js"))["browseRegistryCatalog"];
    installRegistryItem: (typeof import("#cli/commands/registry.js"))["installRegistryItem"];
    detectDeployment: (typeof import("#setup/project-resolution.js"))["detectDeployment"];
    runDeployFlow: (typeof import("./deploy.js"))["runDeployFlow"];
}
export declare class RegistryFlowFailedError extends Error {
    readonly completed: RegistrySessionResult;
    constructor(error: unknown, completed: RegistrySessionResult);
}
/** Searches the catalog and installs one selected item with its required setup. */
export declare function runRegistryFlow(input: {
    /** Project root for registry configuration, Vercel state, and deployment. */
    appRoot: string;
    /** Selected agent project where registry payloads and setup are applied. */
    installRoot?: string;
    prompter: Prompter;
    signal?: AbortSignal;
    /** Registry item supplied by `/add <item>`, installed directly. */
    initialAddress?: string;
    /** Rerun the item's setup only; its source is already installed. */
    skipInstall?: boolean;
    onScreen?: (input: {
        screen: "registry_install";
        registrySelectedCount?: number;
    }) => void;
    onItemStart?: (item: Item, index: number, total: number) => void;
    /** Gives each installation its own cancellation boundary without ending the batch. */
    runItem?<T>(task: (signal?: AbortSignal) => Promise<T>): Promise<T>;
    deps?: Partial<RegistryFlowDeps>;
}): Promise<{
    kind: "done";
    result: RegistrySessionResult;
} | {
    kind: "cancelled";
}>;
export {};
