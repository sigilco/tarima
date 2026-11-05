export declare function attachClientContext<T extends object>(target: T, context: readonly string[] | undefined): T;
export declare function readClientContext(target: object | undefined): readonly string[] | undefined;
