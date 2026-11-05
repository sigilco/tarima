/** Development env files, from highest to lowest precedence. */
export declare const DEVELOPMENT_ENV_FILE_NAMES: readonly [".env.development.local", ".env.local", ".env.development", ".env"];
/** Merged values of the development env files in `environmentRoot`, by precedence. */
export declare function readDevelopmentEnvironmentValues(environmentRoot: string): Map<string, string>;
