import type { SpanProcessor } from "#compiled/@vercel/otel/index.js";
/**
 * The local spool, as a span processor.
 *
 * Session liveness and retention live in here rather than in the runtime that
 * installs it, so nothing an author puts in the same `spanProcessors` list can
 * see them — and eve's accept filter never reaches an author's exporters.
 */
export interface LocalTracesProcessor extends SpanProcessor {
    /**
     * Settles pending writes and releases this conversation's active traces.
     */
    releaseConversation(conversationId: string): Promise<boolean>;
}
/**
 * Writes the OTLP/JSON spool under `.eve/traces/v1`.
 *
 * `EVE_TRACES=off` removes the writer but keeps the processor: eve still has
 * to observe spans to track which session owns which trace.
 *
 * Internal because of `releaseConversation`, which eve's runtime drives off session
 * lifecycle. The authored surface is `localTraces()`, which wraps this in an
 * `OtelIntegration`.
 */
export declare function createLocalTracesProcessor(input?: {
    readonly appRoot?: string;
}): LocalTracesProcessor;
