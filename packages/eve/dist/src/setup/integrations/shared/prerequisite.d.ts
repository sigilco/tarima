export type SetupPrerequisite = {
    kind: "command";
    code: string;
    message: string;
    command: string;
} | {
    kind: "environment";
    code: string;
    message: string;
    variable: string;
    sensitive: true;
};
/** A setup blocker whose prerequisite must be satisfied by the caller. */
export declare class SetupPrerequisiteRequired extends Error {
    readonly prerequisite: SetupPrerequisite;
    constructor(prerequisite: SetupPrerequisite);
}
/**
 * The structured prerequisite behind a setup error, if any. Shared Vercel
 * provisioning steps throw {@link HumanActionRequiredError} (for example
 * `vercel login`); setup callers report it as a command prerequisite so the
 * action survives process and protocol boundaries instead of being flattened
 * into an unactionable message.
 */
export declare function setupPrerequisiteOf(error: unknown): SetupPrerequisite | undefined;
