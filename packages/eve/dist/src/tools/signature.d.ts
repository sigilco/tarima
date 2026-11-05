/**
 * Renders a tool's input and output JSON Schemas as a compact TypeScript
 * signature, e.g.
 * `list_issues(input: { teamId: string; first?: number /* maximum: 50 *\/ }): Promise<unknown>`.
 *
 * Constraints the model must respect (`minimum`, `maximum`, `pattern`, …) stay
 * as comments. Rendering is deterministic, so the same schemas always produce
 * the same text.
 */
interface SignatureInput {
    readonly name: string;
    readonly inputSchema?: Record<string, unknown>;
    readonly outputSchema?: Record<string, unknown>;
}
export declare function renderToolSignature(input: SignatureInput): string;
export {};
