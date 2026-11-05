import { type LanguageModel } from "ai";
/**
 * Serves `model` so every call it starts gets an id no call in `taken` holds.
 *
 * Calls are keyed by the provider's tool call id, from the session's tables to the prompt's
 * tool results. Some providers number calls per response, so a later turn can repeat an id
 * the session already introduced; that call is renamed, with every part that refers to it, as
 * the stream arrives, so the model, the tables and readers all see the same new id. `taken`
 * holds the ids the session still holds: the calls in its view and the prompt's tool calls.
 * A call that left both, by retention and then a clear or compaction, can see its id again; the
 * session's own view no longer has it, and a reader of the whole stream keeps the earlier call.
 */
export declare function withUniqueCallIds(model: LanguageModel, taken: Iterable<string>): LanguageModel;
