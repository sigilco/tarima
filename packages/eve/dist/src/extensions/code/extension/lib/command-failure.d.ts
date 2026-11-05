type CommandOutput = {
    readonly stderr: string;
    readonly stdout: string;
};
/** Preserve useful output from failed sandbox commands without flooding build logs. */
export declare function commandFailureDetail(result: CommandOutput): string;
export {};
