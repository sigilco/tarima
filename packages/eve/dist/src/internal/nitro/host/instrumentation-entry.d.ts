import type { NitroModule } from "nitro/types";
interface EntryPluginContext {
    resolve(source: string): Promise<{
        id: string;
    } | null>;
    load(options: {
        id: string;
    }): Promise<{
        exports: readonly string[] | null;
    }>;
}
/**
 * Awaits instrumentation before importing the preset's server dependency
 * graph: the module swaps Nitro's entry for a wrapper the plugin loads.
 */
export declare function createInstrumentationEntry(instrumentationPath: string): {
    readonly inlineDynamicImports: false;
    readonly module: NitroModule;
    readonly plugin: {
        name: string;
        resolveId: {
            filter: {
                id: RegExp;
            };
            handler: (id: string) => string;
        };
        load: {
            filter: {
                id: RegExp;
            };
            handler(this: EntryPluginContext): Promise<string>;
        };
    };
};
export {};
