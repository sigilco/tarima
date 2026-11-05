/**
 * Firewall network policy applied to a live sandbox session.
 *
 * Use it to restrict egress (`"deny-all"`, an allow-list) or to broker
 * credentials onto outgoing requests. A per-domain `transform` injects
 * headers at the firewall so secrets never enter the sandbox process:
 *
 * ```ts
 * import { environment } from "../sandbox";
 *
 * const sandbox = await ctx.getSandbox(environment);
 * await sandbox.setNetworkPolicy({
 *   allow: {
 *     "github.com": [{ transform: [{ headers: { authorization: "Basic ..." } }] }],
 *     "*": [],
 *   },
 * });
 * ```
 *
 * A provider rejects any part of a policy it cannot enforce instead of
 * weakening it. The Docker provider honors only `"allow-all"` and
 * `"deny-all"`.
 */
export type SandboxNetworkPolicy = "allow-all" | "deny-all" | {
    /** Allowed domains, or a map from domain to the rules applied to its requests. */
    readonly allow?: readonly string[] | Readonly<Record<string, readonly SandboxNetworkRule[]>>;
    readonly subnets?: {
        readonly allow?: readonly string[];
        readonly deny?: readonly string[];
    };
};
/** Exactly one of `transform` (inject headers) or `forwardURL` (proxy the request). */
export type SandboxNetworkRule = {
    readonly match?: SandboxNetworkMatch;
} & ({
    readonly transform: readonly {
        readonly headers?: Readonly<Record<string, string>>;
    }[];
} | {
    readonly forwardURL: string;
});
/** Which requests a {@link SandboxNetworkRule} applies to. */
export interface SandboxNetworkMatch {
    readonly headers?: readonly {
        readonly key?: SandboxNetworkMatcher;
        readonly value?: SandboxNetworkMatcher;
    }[];
    readonly method?: readonly string[];
    readonly path?: SandboxNetworkMatcher;
    readonly queryString?: readonly {
        readonly key?: SandboxNetworkMatcher;
        readonly value?: SandboxNetworkMatcher;
    }[];
}
/** Sets exactly one of `exact`, `startsWith`, or `regex`. */
export type SandboxNetworkMatcher = {
    readonly exact: string;
} | {
    readonly startsWith: string;
} | {
    readonly regex: string;
};
/** Initial network configuration shared by network-capable sandbox providers. */
export interface SandboxNetworkOptions {
    readonly networkPolicy?: SandboxNetworkPolicy;
}
export declare function isSandboxNetworkPolicy(value: unknown): value is SandboxNetworkPolicy;
