import type { RegistryConfig } from "#compiled/shadcn-registry/index.js";
import type { Asker } from "#setup/ask.js";
import { type WebChatFramework } from "#setup/integrations/web/framework.js";
interface AddRegistryMappingsResult {
    added: string[];
    skippedBuiltIn: string[];
    skippedExisting: string[];
}
/**
 * Picks the framework `eve add channel/web` installs, before it writes any file.
 * An app already in `apps/web` decides; an explicit answer that conflicts fails.
 */
export declare function resolveWebChatFramework(appRoot: string, asker: Asker, answers?: Readonly<Record<string, unknown>>): Promise<WebChatFramework>;
/** Resolves and prepares the root package that owns Web Chat. */
export declare function prepareWebChatProjectRoot(appRoot: string, framework?: WebChatFramework): Promise<string>;
/** Reads registry namespace mappings from package.json. */
export declare function readRegistryConfig(appRoot: string): Promise<RegistryConfig>;
export declare function addWebRegistryTsconfig(source: string, path: string, framework?: WebChatFramework): string;
/** Prepares the TypeScript host configuration shadcn registry items expect. */
export declare function prepareWebRegistryProject(appRoot: string, framework?: WebChatFramework): Promise<void>;
/** Adds explicit registry namespace mappings to package.json. */
export declare function addRegistryMappings(appRoot: string, arguments_: readonly string[]): Promise<AddRegistryMappingsResult>;
export {};
