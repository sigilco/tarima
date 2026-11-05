/**
 * Historical dispatch name. Drivers from the former driver/turn execution
 * model start this workflow for each turn. It imports the session once —
 * persisting the conversation, claiming the current-generation inbox, and
 * interrupting pending work — then runs the current owner program. The old
 * driver stays parked as the stream anchor and hears the final result.
 */
export declare function turnWorkflow(rawInput: unknown): Promise<void>;
