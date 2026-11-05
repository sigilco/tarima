import { type ConversationState } from "#client/conversation-state.js";
import type { Block } from "./blocks.js";
import type { AgentTUIConversationView } from "./conversation-view.js";
import { type TaskEntry } from "./task-activity.js";
import type { SubagentDisplayMode, TerminalPartDisplayMode } from "./types.js";
export interface TranscriptOptions {
    readonly tools: TerminalPartDisplayMode;
    readonly reasoning: TerminalPartDisplayMode;
    readonly subagents: SubagentDisplayMode;
    readonly connectionAuth: TerminalPartDisplayMode;
    /** Names of the agent's local subagents, whose tools read as delegations. */
    readonly subagentNames?: readonly string[];
    /** Where full failure detail is recorded, shown instead of the raw dump. */
    readonly diagnosticsPath?: string;
    /** Separates a task end line's facts; the theme's `·`. */
    readonly dot?: string;
}
/**
 * Projects one session's conversation into transcript blocks. Each block's
 * `live` flag says whether its part can still change; the renderer commits a
 * settled prefix to scrollback. Built blocks are reused while their inputs are
 * unchanged, so file-diff bases observe each tool call once, in order.
 *
 * A task writes one line when it starts, at its call, and one when it ends, where the transcript
 * had reached by then; what it does in between is {@link ConversationTranscript.tasks}, which the
 * renderer shows in the task panel above the prompt.
 */
export declare class ConversationTranscript {
    #private;
    reset(): void;
    /** The tasks between their start and end lines as of the last projection, in start order. */
    get tasks(): readonly TaskEntry[];
    /** How input requests name the task that asked: as its task lines do. */
    taskLabel(conversation: ConversationState, taskId: string): string | undefined;
    /** End lines for the tasks still working when their session ends; they read as stopped. */
    stopWorking(options: TranscriptOptions): Block[];
    project(view: AgentTUIConversationView, options: TranscriptOptions): Block[];
}
/**
 * Running tools and the live turn's model activity, for the turn bar. A session parked on a
 * sign-in names its connections, and a turn parked on its tasks names them.
 */
export declare function turnActivity(view: AgentTUIConversationView, tasks: readonly TaskEntry[]): string;
