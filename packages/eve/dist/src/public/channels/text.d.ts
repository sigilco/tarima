/** Caps `value` at `maxLength` characters, ending a cut value with `...`. */
export declare function truncate(value: string, maxLength: number): string;
/** `values` in consecutive groups of `size`. */
export declare function chunk<T>(values: readonly T[], size: number): T[][];
