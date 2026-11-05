/** `resumeHook` as a step, so the runtime API stays out of the owner. */
export declare function resumeHookStep(token: string, payload: unknown, options?: {
    readonly ifPresent?: boolean;
}): Promise<void>;
