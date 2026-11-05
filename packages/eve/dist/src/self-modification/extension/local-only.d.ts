import { type ResolvedSelfModificationConfig } from "../config.js";
/** Returns a definition only when self-modification is running locally. */
export declare function resolveLocalOnly<T>(config: ResolvedSelfModificationConfig, definition: T): T | null;
/** Creates a dynamic definition that is present only during local development. */
export declare function defineLocalOnlyDynamic<T>(definition: T): import("#dynamic/definition.js").DynamicSentinel<T | null, import("#dynamic/definition.js").DynamicContext>;
