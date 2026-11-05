export declare function installRegistryItemTransaction(input: {
    readonly appRoot: string;
    readonly item: string;
    readonly registryItem: unknown;
    readonly nonInteractive: boolean | undefined;
    readonly logger: {
        log(message: string): void;
    };
    readonly install: () => Promise<void>;
}): Promise<void>;
