import type { TaskEntry } from "./task-activity.js";
import type { ConversationState } from "#client/conversation-state.js";
import type { EveInteractionPart, EveToolPart, EveMessage, EveMessagePart } from "#client/message-types.js";
import type { Block, ToolStatus } from "./blocks.js";
import { type ToolPresentationContext } from "./tool-presentation.js";
import type { SignInChallenge } from "#protocol/session-events/families/interaction.js";
import type { SessionView, CallRow, TaskRow } from "#protocol/session-projection/tables.js";
export type ToolState = {
    readonly status: ToolStatus;
    readonly output?: unknown;
    readonly errorText?: string;
};
/**
 * A task whose start line is written, named once and never renamed. Calls that reach the task
 * while it works join this record rather than reading as tasks of their own.
 */
export interface TaskRecord {
    /** The call that started this stretch of the task. */
    readonly callId: string;
    readonly taskId: string;
    /** Every call this record answers, the starting call first. */
    readonly callIds: string[];
    readonly kind: "agent" | "tool";
    readonly name: string;
    readonly toolName: string;
    readonly input: unknown;
    readonly label: string | undefined;
    readonly purpose?: string;
    readonly startedAtMs: number;
    settledAtMs?: number;
    ended: boolean;
}
export interface AgentActivity {
    tools: Block[];
    rows: Block[];
    children?: TaskEntry[];
    omittedTasks?: number;
    omittedAttention?: boolean;
    step?: string;
    pending: boolean;
}
export declare function taskNeedsApproval(conversation: ConversationState, task: TaskRow): boolean;
export declare function startLine(record: TaskRecord): Block;
/** A later call that reached a working task: a message to it, not a new delegation. */
export declare function followUpLine(record: TaskRecord, part: EveToolPart, label: string | undefined): Block;
export declare function nestedTaskRecord(callId: string, part: EveToolPart, task: TaskRow, block: Block): TaskRecord;
/** The call's row, in the transcript's vocabulary. */
export declare function toolState(part: EveToolPart, view: SessionView): ToolState;
export declare function isActive(status: ToolStatus): boolean;
export declare function toolBlock(part: EveToolPart, state: ToolState, context: ToolPresentationContext | undefined): Omit<Block, "kind">;
/** A task's end line: how long it took and what it did, or why it failed, or that it stopped. */
export declare function endLine(record: TaskRecord, call: Pick<CallRow, "status" | "outcome" | "output" | "error">, childTools: readonly Block[] | undefined, 
/** The theme's `·`, which separates the line's facts. */
separator: string): Block;
export declare function labelContext(label: string | undefined): ToolPresentationContext | undefined;
/** The first line of an agent call's message: what the agent was asked to do. */
export declare function agentTaskSummary(input: unknown): string;
export declare function firstLine(text: string): string | undefined;
export type SubagentStep = {
    readonly key: string;
    /** Where the step ends among its messages' parts, to order it among the agent's tool calls. */
    readonly order: number;
    readonly reasoning: string;
    readonly message: string;
    readonly finalized: boolean;
};
/** Pairs each child reply with the reasoning that preceded it. */
export declare function subagentSteps(messages: readonly EveMessage[]): SubagentStep[];
/** A tool call, including one whose input is still streaming and so has no kind yet. */
export declare function isToolCallRow(part: EveMessagePart): part is EveToolPart;
/** Every call that started or reached a task, by call ID. */
export declare function taskCallsById(conversation: ConversationState): Map<string, {
    task: TaskRow;
    call: CallRow;
}>;
/** Tools a step runs in parallel settle together, so a finished one waits for its siblings. */
export declare function activeToolSteps(states: ReadonlyMap<EveToolPart, ToolState>): Set<number | undefined>;
export declare function userText(message: EveMessage): string;
export declare function authorizationTerminalMessage(state: string): string | undefined;
export declare function formatAuthorization(part: EveInteractionPart, challenge: SignInChallenge, terminalMessage: string | undefined): {
    body: string;
    link?: string;
};
/** Reads the shared write-file result's `existed` flag, whatever the tool. */
export declare function writeExistedFlag(output: unknown): boolean | undefined;
