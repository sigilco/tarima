/**
 * Catalog calls in the harness. Once a step's calls enter the harness, every
 * seam reads an `eve__tool` or `eve__skill` call as the call to the entry it
 * names. Model history keeps the model's own calls.
 */
import type { ModelMessage, TextStreamPart, ToolSet } from "ai";
import type { HarnessStepResult } from "#harness/step-hooks.js";
import type { CallResolver, ResolvedCall, ToolCallLike } from "#harness/types.js";
import type { ToolExecuteOptions } from "#tools/definition.js";
/**
 * The name each tool call has in model history, by call id. A result written
 * to history carries its call's name there, which is the catalog tool for a
 * call made through one.
 */
export declare function historyCallNames(messages: readonly ModelMessage[]): ReadonlyMap<string, string>;
/**
 * Runs a resolved catalog call. eve resolves every call before it runs one, so this runs only
 * for a catalog tool's own `execute`, which no resolved call reaches.
 */
export declare function runEntryCall(resolved: ResolvedCall<ToolCallLike>, options: ToolExecuteOptions): unknown;
/**
 * The step as the harness reads it: catalog calls become calls to their entries. The response
 * messages, which become history, keep the model's own calls.
 */
export declare function toEntryStep<T extends ModelMessage>(step: HarnessStepResult, responseMessages: readonly T[], resolve: CallResolver): readonly [HarnessStepResult, T[]];
/**
 * The stream as the harness reads it, as {@link toEntryStep} reads the step.
 * A catalog call's input stream is dropped: its entry is known only once the
 * input is complete.
 */
export declare function toEntryStream(stream: AsyncIterable<TextStreamPart<ToolSet>>, resolve: CallResolver): AsyncIterable<TextStreamPart<ToolSet>>;
