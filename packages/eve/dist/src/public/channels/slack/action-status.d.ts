/** The first call's label, plus `+N more` when the model made several calls in one step. */
export declare function withMoreCalls(label: string, count: number): string;
/**
 * `Waiting on researcher...` for one named task, otherwise a count such as
 * `Waiting on 3 tasks...`. The agent's own copy is never named, since its
 * name, `agent`, says nothing.
 */
export declare function waitingOnTasks(names: readonly string[]): string;
/**
 * `Reviewing researcher's results...` when every settled task called the same
 * named agent, otherwise `Reviewing results...`. `null` stands for a task
 * that isn't a named agent call.
 */
export declare function reviewingResults(names: readonly (string | null)[]): string;
