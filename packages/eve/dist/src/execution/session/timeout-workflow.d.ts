export interface SessionTimeoutWorkflowInput {
    readonly deadline: Date;
    /** Owner run that armed the timer. */
    readonly ownerRunId: string;
    readonly token: string;
}
/** Sleeps until the session deadline, then signals its current owner. */
export declare function sessionTimeoutWorkflow(input: SessionTimeoutWorkflowInput): Promise<void>;
