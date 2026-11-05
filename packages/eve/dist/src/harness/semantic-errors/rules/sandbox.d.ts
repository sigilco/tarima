import { type SemanticErrorRule } from "../rule.js";
/**
 * Error class names come from eve's own Docker sandbox backend —
 * `DockerUnavailableError` / `DockerDaemonUnavailableError` in
 * `execution/sandbox/bindings/docker-cli.ts` — each of which assigns
 * `this.name` explicitly. Those classes already author actionable
 * remediation messages at the failure site — where the missing binary or
 * unreachable daemon is actually known — so these rules contribute the
 * stable catalog identity and pass the message through. Matching is by
 * name string rather than `instanceof` because the harness must not
 * import from `execution/` and the classes survive structured clone as
 * plain shapes.
 */
export declare const SANDBOX_RULES: readonly SemanticErrorRule[];
