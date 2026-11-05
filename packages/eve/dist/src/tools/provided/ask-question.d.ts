import { type WorkflowExecuteToolDefinition } from "#public/tools/index.js";
import { type InterruptedOutput } from "#tools/provided/interrupted.js";
export declare const ASK_QUESTION_TOOL_DESCRIPTION: string;
export interface AskQuestionInput {
    options?: {
        description: string;
        label: string;
    }[];
    question: string;
}
export type AskQuestionOutput = {
    answer: string;
    status: "answered";
} | InterruptedOutput | {
    status: "unavailable";
};
export declare const ASK_QUESTION_INPUT_SCHEMA: import("#tools/schema.js").ToolSchema<AskQuestionInput, AskQuestionInput>;
/**
 * Defines the opt-in `ask_question` tool.
 *
 * Export it from `agent/tools/ask_question.ts`:
 *
 * ```ts
 * import { askQuestion } from "eve/tools/ask_question";
 *
 * export default askQuestion;
 * ```
 *
 * Each call runs as a durable workflow that asks through `ctx.ask()`, so the
 * turn waits for the answer without holding an application runtime open. A new
 * message that does not answer the question withdraws it.
 */
export declare const askQuestion: WorkflowExecuteToolDefinition<AskQuestionInput, AskQuestionOutput>;
