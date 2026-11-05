/** Must run before any plugin that externalizes or resolves package imports. */
export declare function createPseudoPackagePlugin(): {
    name: string;
    resolveId: {
        filter: {
            id: RegExp[];
        };
        handler: (source: string) => {
            id: string;
        };
    };
    load: {
        filter: {
            id: RegExp;
        };
        handler: () => {
            code: string;
            moduleType: "js";
        };
    };
};
