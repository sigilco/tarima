import { type CheckedBundle } from "#internal/nitro/host/external-dependency-output-check.js";
import type { ExternalsPolicy } from "#internal/nitro/host/externals-policy.js";
/**
 * Applies the externals policy's module substitutions to the hosted graph and
 * checks configured externals against the written output:
 *
 * - development-only sandbox preparation, the optional engine installer only
 *   it uses, and eve's own Rolldown import become stubs in production;
 * - local sandbox providers (Docker, just-bash) become stubs when the hosted
 *   build cannot reach them, so default selection never retains local engines;
 * - optional engines the app did not configure stay plain, untraced externals,
 *   so a resolvable but unrequested install adds nothing to the output and the
 *   lazy runtime import fails at first use with an install error;
 * - configured externals are checked against the written output;
 * - Nitro's storage and database runtimes are rejected, so no import can make
 *   Nitro install their drivers.
 */
export declare function createHostedGraphPlugin(input: {
    readonly appRoot: string;
    readonly externals: ExternalsPolicy;
}): HostedGraphPlugin;
interface HostedGraphPlugin {
    readonly name: string;
    resolveId: {
        readonly order: "pre";
        readonly filter: {
            readonly id: RegExp[];
        };
        handler(source: string, importer?: string): string | {
            external: true;
            id: string;
        } | null;
    };
    load?: {
        readonly filter: {
            readonly id: RegExp[];
        };
        handler(id: string): string | null;
    };
    writeBundle?(outputOptions: {
        readonly dir: string;
    }, bundle: CheckedBundle): Promise<void>;
}
export {};
