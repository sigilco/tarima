/**
 * Content-independent module identity derived from the module path alone, so
 * ids minted at build time stay comparable across rebuilds that do not move
 * the file.
 */
export declare function stableModuleId(filename: string): string;
