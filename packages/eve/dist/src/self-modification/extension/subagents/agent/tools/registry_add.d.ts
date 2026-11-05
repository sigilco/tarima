import { type LocalDevCapability } from "eve/local-dev";
import type { ResolvedSelfModificationConfig } from "../../../../config.js";
import { type SpawnLike } from "../../../eve-add.js";
import { type CatalogEntry } from "./search_registry.js";
interface RegistryAddDependencies {
    readonly getCapability?: () => LocalDevCapability | undefined;
    readonly spawn?: SpawnLike;
}
/** What local registry installation reports back. Mirrors {@link localOutputSchema}. */
export interface LocalRegistryAddResult {
    readonly address: string;
    /** `failed` carries an explicit mutation outcome instead of implying nothing changed. */
    readonly status: "installed" | "needs-terminal" | "failed";
    readonly message: string;
    readonly title?: string;
    readonly envVars?: readonly string[];
    readonly reason?: string;
    readonly nextCommand?: string;
    readonly changed?: readonly string[];
}
/**
 * Names the item's declared environment variables that are not set.
 *
 * Naming a required variable is not a secret, and an installed item can still
 * be non-functional through unset variables, so this is the difference between
 * reporting outstanding work and reporting bare success. Values are never read.
 */
export declare function unsetEnvVars(entry: CatalogEntry, environment?: Readonly<Record<string, string | undefined>>): readonly string[];
/**
 * Builds the handoff a `needs-terminal` item carries.
 *
 * The interactive TUI consumes `status` and `address` to open the existing
 * address-specific setup flow itself, so its model-facing result deliberately
 * carries no command for the model to repeat. Headless `eve dev` has no TUI to
 * dispatch into, so the shell command is the only honest answer there.
 */
export declare function handoffMessage(input: {
    readonly address: string;
    readonly interactiveClient: boolean;
    readonly reason: string;
    readonly title: string;
}): {
    readonly message: string;
    readonly nextCommand?: string;
};
/** Exported for tests; the tool's `execute` delegates here. */
export declare function addLocalRegistryItem(address: string, options?: RegistryAddDependencies & {
    readonly signal?: AbortSignal;
}): Promise<LocalRegistryAddResult>;
export declare function resolveRegistryAddTool(config: ResolvedSelfModificationConfig): (import("eve/tools").ToolDefinition<Record<string, unknown>, LocalRegistryAddResult> & {
    execute(input: Record<string, unknown>, ctx: import("eve/tools").ToolContext): Promise<LocalRegistryAddResult>;
}) | null;
declare const _default: import("eve/tools").DynamicSentinel<(import("eve/tools").ToolDefinition<Record<string, unknown>, LocalRegistryAddResult> & {
    execute(input: Record<string, unknown>, ctx: import("eve/tools").ToolContext): Promise<LocalRegistryAddResult>;
}) | null, import("eve/tools").DynamicContext>;
export default _default;
