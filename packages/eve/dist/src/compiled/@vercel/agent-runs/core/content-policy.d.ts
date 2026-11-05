/**
 * Which span attributes carry conversation content, and in which direction.
 *
 * Two vocabularies land on the same spans: the ones the library sets on its own
 * `agent.*` spans, and the ones the AI SDK's OpenTelemetry integration sets on
 * the model-call spans beneath them. A destination that declined content has to
 * be rid of both, so both are listed here rather than in the module that writes
 * each.
 *
 * Listed by name rather than by prefix because the prefixes are shared with
 * metadata that must survive: `ai.response.finish_reason` and
 * `gen_ai.tool.name` say what happened, not what was said. The cost is that a
 * new content attribute in a dependency is not covered until it is added here.
 */
/** What one destination is willing to receive. */
export interface ResolvedContentOptions {
    readonly recordInputs: boolean;
    readonly recordOutputs: boolean;
}
/**
 * Re-applies the capture-policy attributes that a size-based content strip
 * must not rewrite. Dropping content to fit a checkpoint budget is not the
 * destination declining it, so `agent.trace.content.input` and
 * `agent.trace.content.output` keep the record's real decision; otherwise a
 * restored turn would report "omitted" although capture was on.
 */
export declare function preservingCapturePolicy(attributes: Readonly<Record<string, unknown>>, original: Readonly<Record<string, unknown>>): Record<string, unknown>;
/**
 * The attributes with the declined content removed, or `undefined` when there
 * was none to remove.
 *
 * The `undefined` return is what lets the caller forward the original span
 * untouched in the common case, so a destination that declined a direction the
 * span never carried costs one pass over its keys and no allocation.
 */
export declare function withoutDeclinedContent(attributes: Readonly<Record<string, unknown>>, content: ResolvedContentOptions): Record<string, unknown> | undefined;
