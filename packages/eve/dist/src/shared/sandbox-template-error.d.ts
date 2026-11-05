type SandboxTemplateNotProvisionedInput = 
/** The build recorded no prepared artifact for this agent node. */
{
    readonly nodeId: string;
    readonly providerName: string;
}
/**
 * The provider cannot use the recorded template. Callers that know why pass
 * `reason`; the default message names no cause, because callers raise this for
 * several different ones.
 */
 | {
    readonly providerName: string;
    readonly reason?: string;
    readonly templateKey: string;
};
export declare class SandboxTemplateNotProvisionedError extends Error {
    readonly providerName: string;
    /** The provider's template identifier, or the agent node id when the build recorded no artifact. */
    readonly templateKey: string;
    constructor(input: SandboxTemplateNotProvisionedInput);
    static is(error: unknown): error is SandboxTemplateNotProvisionedError;
}
export {};
