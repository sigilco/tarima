import type { ToolQuestion, ToolAnswer, WorkflowToolContext } from "#public/tools/index.js";
import type { AskQuestionInput, AskQuestionOutput } from "#tools/provided/ask-question.js";
/** Asks the session's user one question, and withdraws it when a new message arrives. */
export declare function executeAskQuestionTool(input: AskQuestionInput, ctx: WorkflowToolContext): Promise<AskQuestionOutput>;
/**
 * Free text is always allowed, so the model never needs an "Other" option.
 * Labels double as option ids so a late answer still reads as the label.
 */
export declare function toAskQuestionRequest(input: AskQuestionInput): ToolQuestion;
export declare function toAskQuestionOutput(answer: ToolAnswer): AskQuestionOutput;
