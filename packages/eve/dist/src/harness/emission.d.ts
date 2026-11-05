import type { ModelMessage, TextStreamPart, ToolSet } from "ai";
type ToolResponsePart = Extract<ModelMessage, {
    role: "tool";
}>["content"][number];
type InlineToolResultPart = Extract<ToolResponsePart, {
    type: "tool-result";
}>;
import type { CallRow } from "#protocol/session-projection/tables.js";
import type { TurnPosition } from "#harness/session-machine/view.js";
import type { HarnessEmitFn, HarnessToolLookup } from "#harness/types.js";
/** The calls of one step's `fullStream` whose input was invalid, and their results. */
interface EmittedStreamContent {
    readonly invalidInputToolCallIds: ReadonlySet<string>;
    readonly trailingInlineToolResultParts: readonly InlineToolResultPart[];
}
interface StreamActionEmissionOptions {
    readonly excludedActionToolNames: ReadonlySet<string>;
    /**
     * The turn holds while its tasks work and its caller reads only the final reply, so a text step
     * can't end it: its text narrates, and only the reply after the tasks report is the turn's.
     */
    readonly held?: boolean;
    /** A child or schedule's caller reads only the final reply, including at an explicit task wait. */
    readonly finalReplyOnly?: boolean;
    /** The session's call with this id, as its view holds it now. */
    readonly sessionCall: (callId: string) => CallRow | undefined;
    readonly tools: HarnessToolLookup;
    /** A deliberate turn cancel or steering interrupt, not a provider failure/retry. */
    readonly interruptSignal?: AbortSignal;
}
/**
 * Consumes the AI SDK `fullStream` and emits real-time text and reasoning
 * events.
 *
 * Emits local tool events in source order. Provider calls that arrive in one
 * stream batch into one request event before their first result. A result
 * without a streamed call resumes a call from an earlier step.
 */
export declare function emitStreamContent(emitFn: HarnessEmitFn, state: TurnPosition, fullStream: AsyncIterable<TextStreamPart<ToolSet>>, options?: StreamActionEmissionOptions): Promise<EmittedStreamContent>;
export {};
